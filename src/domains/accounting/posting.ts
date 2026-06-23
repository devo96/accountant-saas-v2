import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createJournalEntry } from "./journal";

/**
 * Auto-posting: turns business documents (sales/purchase invoices, expenses)
 * into balanced double-entry journal entries so the GL, reports and budgets
 * actually move. All postings are idempotent — re-calling is a no-op once the
 * document already has a linked journal entry.
 */

// Standard chart-of-accounts codes seeded per organization (see prisma/seed.ts).
const CODES = {
  cash: "1.1.1",
  ar: "1.1.2",
  inventory: "1.1.3",
  ap: "2.1.1",
  vat: "2.1.2",
  sales: "4.1",
  cogs: "5.1",
  expenses: "5.2",
} as const;

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

/** Resolve an account by its standard code, falling back to the first active account of a type. */
async function resolveAccount(organizationId: string, code: string, fallbackType: AccountType) {
  const byCode = await prisma.account.findFirst({ where: { organizationId, code } });
  if (byCode) return byCode;
  const byType = await prisma.account.findFirst({
    where: { organizationId, type: fallbackType, active: true },
    orderBy: { code: "asc" },
  });
  if (!byType) {
    throw new Error(`No account found for code ${code} / type ${fallbackType} in org ${organizationId}`);
  }
  return byType;
}

const POSTABLE = new Set(["CONFIRMED", "PAID", "PARTIALLY_PAID"]);

/**
 * Post a sales invoice:  Dr Accounts Receivable / Cr Sales Revenue / Cr VAT Payable.
 * Revenue = total − VAT (guarantees the entry balances regardless of discount handling).
 */
export async function postSalesInvoice(organizationId: string, userId: string, invoiceId: string) {
  const invoice = await prisma.salesInvoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { customer: { select: { name: true } } },
  });
  if (!invoice) throw new Error("Sales invoice not found");
  if (invoice.journalEntryId) return null; // already posted
  if (!POSTABLE.has(invoice.status)) return null; // only post confirmed invoices

  const total = Number(invoice.total);
  const vat = Number(invoice.taxAmount);
  const revenue = Math.round((total - vat) * 100) / 100;
  if (total <= 0) return null;

  const [ar, sales, vatAcc] = await Promise.all([
    resolveAccount(organizationId, CODES.ar, "ASSET"),
    resolveAccount(organizationId, CODES.sales, "INCOME"),
    resolveAccount(organizationId, CODES.vat, "LIABILITY"),
  ]);

  const lines = [
    { accountId: ar.id, description: `فاتورة مبيعات #${invoice.number}`, debit: total, credit: 0 },
    { accountId: sales.id, description: `إيراد مبيعات #${invoice.number}`, debit: 0, credit: revenue },
  ];
  if (vat > 0) {
    lines.push({ accountId: vatAcc.id, description: `ضريبة القيمة المضافة #${invoice.number}`, debit: 0, credit: vat });
  }

  const entry = await createJournalEntry(organizationId, userId, {
    date: invoice.invoiceDate.toISOString(),
    description: `Sales Invoice #${invoice.number} - ${invoice.customer?.name ?? ""}`.trim(),
    descriptionAr: `فاتورة مبيعات #${invoice.number} - ${invoice.customer?.name ?? ""}`.trim(),
    reference: `SALES_INVOICE:${invoice.id}`,
    projectId: invoice.projectId ?? undefined,
    lines,
  });

  await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { journalEntryId: entry.id } });
  logger.info({ invoiceId: invoice.id, entryId: entry.id }, "Sales invoice posted to GL");
  return entry;
}

/**
 * Post a purchase invoice:  Dr Inventory / Dr VAT (input) / Cr Accounts Payable.
 * Net = total − VAT.
 */
export async function postPurchaseInvoice(organizationId: string, userId: string, invoiceId: string) {
  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: { vendor: { select: { name: true } } },
  });
  if (!invoice) throw new Error("Purchase invoice not found");
  if (invoice.journalEntryId) return null;
  if (!POSTABLE.has(invoice.status)) return null;

  const total = Number(invoice.total);
  const vat = Number(invoice.taxAmount);
  const net = Math.round((total - vat) * 100) / 100;
  if (total <= 0) return null;

  const [inventory, vatAcc, ap] = await Promise.all([
    resolveAccount(organizationId, CODES.inventory, "ASSET"),
    resolveAccount(organizationId, CODES.vat, "LIABILITY"),
    resolveAccount(organizationId, CODES.ap, "LIABILITY"),
  ]);

  const lines = [
    { accountId: inventory.id, description: `مشتريات #${invoice.number}`, debit: net, credit: 0 },
  ];
  if (vat > 0) {
    lines.push({ accountId: vatAcc.id, description: `ضريبة مدخلات #${invoice.number}`, debit: vat, credit: 0 });
  }
  lines.push({ accountId: ap.id, description: `مورد - فاتورة #${invoice.number}`, debit: 0, credit: total });

  const entry = await createJournalEntry(organizationId, userId, {
    date: invoice.invoiceDate.toISOString(),
    description: `Purchase Invoice #${invoice.number} - ${invoice.vendor?.name ?? ""}`.trim(),
    descriptionAr: `فاتورة مشتريات #${invoice.number} - ${invoice.vendor?.name ?? ""}`.trim(),
    reference: `PURCHASE_INVOICE:${invoice.id}`,
    projectId: invoice.projectId ?? undefined,
    lines,
  });

  await prisma.purchaseInvoice.update({ where: { id: invoice.id }, data: { journalEntryId: entry.id } });
  logger.info({ invoiceId: invoice.id, entryId: entry.id }, "Purchase invoice posted to GL");
  return entry;
}

/**
 * Post an expense:  Dr expense account(s) / Dr VAT / Cr Cash.
 * Each expense line debits its chosen account; the credit goes to cash.
 */
export async function postExpense(organizationId: string, userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, organizationId },
    include: { lines: true },
  });
  if (!expense) throw new Error("Expense not found");
  if (expense.journalEntryId) return null;

  const vat = Number(expense.taxAmount);
  const lineItems = expense.lines.length
    ? expense.lines.map((l) => ({ accountId: l.accountId, amount: Number(l.amount) }))
    : [];
  const net = lineItems.reduce((s, l) => s + l.amount, 0) || Number(expense.amount);
  const totalOut = Math.round((net + vat) * 100) / 100;
  if (totalOut <= 0) return null;

  const [vatAcc, cash] = await Promise.all([
    resolveAccount(organizationId, CODES.vat, "LIABILITY"),
    resolveAccount(organizationId, CODES.cash, "ASSET"),
  ]);

  const lines = lineItems.length
    ? lineItems.map((l) => ({ accountId: l.accountId, description: `مصروف #${expense.number}`, debit: l.amount, credit: 0 }))
    : [{ accountId: (await resolveAccount(organizationId, CODES.expenses, "EXPENSE")).id, description: `مصروف #${expense.number}`, debit: net, credit: 0 }];
  if (vat > 0) {
    lines.push({ accountId: vatAcc.id, description: `ضريبة مدخلات #${expense.number}`, debit: vat, credit: 0 });
  }
  lines.push({ accountId: cash.id, description: `سداد مصروف #${expense.number}`, debit: 0, credit: totalOut });

  const entry = await createJournalEntry(organizationId, userId, {
    date: expense.date.toISOString(),
    description: `Expense #${expense.number} - ${expense.description}`.trim(),
    descriptionAr: `مصروف #${expense.number} - ${expense.description}`.trim(),
    reference: `EXPENSE:${expense.id}`,
    lines,
  });

  await prisma.expense.update({ where: { id: expense.id }, data: { journalEntryId: entry.id } });
  logger.info({ expenseId: expense.id, entryId: entry.id }, "Expense posted to GL");
  return entry;
}
