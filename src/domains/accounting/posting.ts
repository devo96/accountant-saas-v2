import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createJournalEntry } from "./journal";

/**
 * Auto-posting: turns business documents (sales/purchase invoices, expenses)
 * into balanced double-entry journal entries so the GL, reports and budgets
 * actually move. All postings are idempotent — re-calling is a no-op once the
 * document already has a linked journal entry.
 *
 * For item-based invoices stock movements and COGS/Inventory lines are also
 * created so inventory quantities and balances stay correct.
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

/** Return the first active warehouse for the org (fallback warehouse). */
async function resolveWarehouse(organizationId: string) {
  const wh = await prisma.warehouse.findFirst({
    where: { organizationId, active: true },
    orderBy: { name: "asc" },
  });
  if (!wh) throw new Error(`No active warehouse found for org ${organizationId}`);
  return wh;
}

const POSTABLE = new Set(["CONFIRMED", "PAID", "PARTIALLY_PAID"]);

/**
 * Record a stock movement and update the item's currentStock.
 * Runs inside the caller's transaction when `tx` is provided.
 */
async function recordStockMovement(
  orgId: string,
  userId: string,
  itemId: string,
  warehouseId: string,
  type: "PURCHASE_RECEIPT" | "SALES_DELIVERY",
  quantity: number,
  unitCost: number,
  reference: string,
  description: string,
) {
  const totalCost = Math.round(unitCost * Math.abs(quantity) * 100) / 100;
  const direction = type === "PURCHASE_RECEIPT" ? Math.abs(quantity) : -Math.abs(quantity);

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        itemId, warehouseId, type,
        quantity: direction,
        unitCost, totalCost,
        reference, description,
        organizationId: orgId, createdById: userId,
      },
    }),
    prisma.item.update({
      where: { id: itemId },
      data: { currentStock: { increment: direction } },
    }),
  ]);
  return movement;
}

/**
 * Post a sales invoice:  Dr Accounts Receivable / Cr Sales Revenue / Cr VAT Payable.
 * Revenue = total − VAT (guarantees the entry balances regardless of discount handling).
 * For item-based lines also creates SALES_DELIVERY stock movement and adds
 * Dr COGS / Cr Inventory to the journal entry.
 */
export async function postSalesInvoice(organizationId: string, userId: string, invoiceId: string) {
  const invoice = await prisma.salesInvoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      customer: { select: { name: true } },
      lines: { include: { item: true } },
    },
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

  // For item-based lines: compute total COGS and add inventory/COGS lines
  const itemLines = invoice.lines.filter(l => l.itemId && l.item);
  if (itemLines.length > 0) {
    const [inventory, cogs, wh] = await Promise.all([
      resolveAccount(organizationId, CODES.inventory, "ASSET"),
      resolveAccount(organizationId, CODES.cogs, "EXPENSE"),
      resolveWarehouse(organizationId),
    ]);

    let totalCogs = 0;
    for (const line of itemLines) {
      const costPrice = Number(line.item!.costPrice);
      const lineCost = Math.round(costPrice * line.quantity * 100) / 100;
      if (lineCost <= 0) continue;
      totalCogs += lineCost;
    }
    if (totalCogs > 0) {
      lines.push(
        { accountId: cogs.id, description: `تكلفة البضاعة المباعة #${invoice.number}`, debit: totalCogs, credit: 0 },
        { accountId: inventory.id, description: `مخزون #${invoice.number}`, debit: 0, credit: totalCogs },
      );
    }

    // Record stock movements for item-based lines
    for (const line of itemLines) {
      await recordStockMovement(
        organizationId, userId, line.itemId, wh.id,
        "SALES_DELIVERY", line.quantity,
        Number(line.item!.costPrice),
        `SALES_INVOICE:${invoice.id}`,
        `فاتورة مبيعات #${invoice.number} - ${line.description}`,
      );
    }
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
  logger.info({ invoiceId: invoice.id, entryId: entry.id, items: invoice.lines.filter(l => l.itemId).length }, "Sales invoice posted to GL");
  return entry;
}

/**
 * Post a purchase invoice:  Dr Inventory / Dr VAT (input) / Cr Accounts Payable.
 * Net = total − VAT.
 * For item-based lines also creates PURCHASE_RECEIPT stock movement and
 * updates the item's currentStock and moving-average costPrice.
 */
export async function postPurchaseInvoice(organizationId: string, userId: string, invoiceId: string) {
  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { id: invoiceId, organizationId },
    include: {
      vendor: { select: { name: true } },
      lines: { include: { item: true } },
    },
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

  // Record stock movements and update moving-average costPrice for item lines
  const itemLines = invoice.lines.filter(l => l.itemId && l.item);
  if (itemLines.length > 0) {
    const wh = await resolveWarehouse(organizationId);
    for (const line of itemLines) {
      const qty = line.quantity;
      const unitPrice = Number(line.unitPrice);
      const currentStock = line.item!.currentStock;
      const currentCost = Number(line.item!.costPrice);
      // Weighted average: ((currentStock * currentCost) + (qty * unitPrice)) / (currentStock + qty)
      const newStock = currentStock + qty;
      const newAvgCost = newStock > 0
        ? Math.round(((currentStock * currentCost) + (qty * unitPrice)) / newStock * 100) / 100
        : unitPrice;

      await prisma.$transaction([
        prisma.stockMovement.create({
          data: {
            itemId: line.itemId, warehouseId: wh.id,
            type: "PURCHASE_RECEIPT", quantity: qty,
            unitCost: unitPrice, totalCost: Math.round(unitPrice * qty * 100) / 100,
            reference: `PURCHASE_INVOICE:${invoice.id}`,
            description: `فاتورة مشتريات #${invoice.number} - ${line.description}`,
            organizationId, createdById: userId,
          },
        }),
        prisma.item.update({
          where: { id: line.itemId },
          data: { currentStock: newStock, costPrice: newAvgCost },
        }),
      ]);
    }
  }

  await prisma.purchaseInvoice.update({ where: { id: invoice.id }, data: { journalEntryId: entry.id } });
  logger.info({ invoiceId: invoice.id, entryId: entry.id, items: invoice.lines.filter(l => l.itemId).length }, "Purchase invoice posted to GL");
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
