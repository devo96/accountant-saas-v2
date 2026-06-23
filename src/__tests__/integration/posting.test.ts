import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import path from "path";

// Verifies the auto-posting path: a confirmed sales invoice must produce a
// balanced journal entry and move the AR / Sales / VAT account balances.

let prisma: any;
let createSalesInvoice: any;
let createPurchaseInvoice: any;
let postSalesInvoice: any;
let postPurchaseInvoice: any;
let postExpense: any;

const orgId = "post-org-id";
const userId = "post-user-id";
const custId = "post-cust-id";
const vendId = "post-vend-id";

beforeAll(async () => {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), "prisma/test.sqlite")}`;
  ({ prisma } = await import("@/lib/prisma"));
  ({ createSalesInvoice } = await import("@/domains/sales/invoice"));
  ({ createPurchaseInvoice } = await import("@/domains/purchases/invoice"));
  ({ postSalesInvoice, postPurchaseInvoice, postExpense } = await import("@/domains/accounting/posting"));
  // Ensure the test fixture DB has the new columns (idempotent).
  for (const sql of [
    'ALTER TABLE "SalesInvoice" ADD COLUMN "journalEntryId" TEXT',
    'ALTER TABLE "PurchaseInvoice" ADD COLUMN "journalEntryId" TEXT',
    'ALTER TABLE "Expense" ADD COLUMN "journalEntryId" TEXT',
  ]) {
    try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.expenseLine.deleteMany();
  await prisma.expense.deleteMany({ where: { organizationId: orgId } });
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.salesInvoiceLine.deleteMany();
  await prisma.salesInvoice.deleteMany({ where: { organizationId: orgId } });
  await prisma.purchaseInvoiceLine.deleteMany();
  await prisma.purchaseInvoice.deleteMany({ where: { organizationId: orgId } });
  await prisma.account.deleteMany({ where: { organizationId: orgId } });
  await prisma.customer.deleteMany({ where: { organizationId: orgId } });
  await prisma.vendor.deleteMany({ where: { organizationId: orgId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });

  await prisma.organization.create({ data: { id: orgId, name: "Post Org" } });
  await prisma.user.create({ data: { id: userId, email: "post@test.com", name: "P", organizationId: orgId } });
  await prisma.customer.create({ data: { id: custId, name: "Cust", organizationId: orgId } });
  await prisma.vendor.create({ data: { id: vendId, name: "Vend", organizationId: orgId } });
  const accounts: [string, string, string, string][] = [
    ["1.1.1", "Cash", "ASSET", "DEBIT"],
    ["1.1.2", "Accounts Receivable", "ASSET", "DEBIT"],
    ["1.1.3", "Inventory", "ASSET", "DEBIT"],
    ["2.1.1", "Accounts Payable", "LIABILITY", "CREDIT"],
    ["2.1.2", "VAT Payable", "LIABILITY", "CREDIT"],
    ["4.1", "Sales Revenue", "INCOME", "CREDIT"],
    ["5.2", "Operating Expenses", "EXPENSE", "DEBIT"],
  ];
  for (const [code, name, type, nature] of accounts) {
    await prisma.account.create({ data: { code, name, type, nature, organizationId: orgId } });
  }
});

async function makeInvoice() {
  return createSalesInvoice({
    organizationId: orgId,
    createdById: userId,
    status: "CONFIRMED",
    customerId: custId,
    invoiceDate: new Date("2026-03-01").toISOString(),
    subtotal: 1000,
    taxAmount: 150,
    total: 1150,
    lines: [{ description: "Item", quantity: 1, unitPrice: 1000, taxRate: 15, lineTotal: 1000 }],
  });
}

describe("Sales invoice auto-posting", () => {
  it("creates a balanced JE and moves AR / Sales / VAT balances", async () => {
    const inv = await makeInvoice();
    const entry = await postSalesInvoice(orgId, userId, inv.id);
    expect(entry).toBeTruthy();

    const lines = await prisma.journalEntryLine.findMany({ where: { journalEntryId: entry.id } });
    const dr = lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
    const cr = lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
    expect(dr).toBeCloseTo(1150, 2);
    expect(cr).toBeCloseTo(1150, 2);

    const ar = await prisma.account.findFirst({ where: { organizationId: orgId, code: "1.1.2" } });
    const sales = await prisma.account.findFirst({ where: { organizationId: orgId, code: "4.1" } });
    const vat = await prisma.account.findFirst({ where: { organizationId: orgId, code: "2.1.2" } });
    expect(Number(ar.balance)).toBeCloseTo(1150, 2);
    expect(Number(sales.balance)).toBeCloseTo(1000, 2);
    expect(Number(vat.balance)).toBeCloseTo(150, 2);

    const reload = await prisma.salesInvoice.findUnique({ where: { id: inv.id } });
    expect(reload.journalEntryId).toBe(entry.id);
  });

  it("is idempotent (no duplicate journal entry)", async () => {
    const inv = await makeInvoice();
    await postSalesInvoice(orgId, userId, inv.id);
    const again = await postSalesInvoice(orgId, userId, inv.id);
    expect(again).toBeNull();
    const count = await prisma.journalEntry.count();
    expect(count).toBe(1);
  });

  it("does not post a draft invoice", async () => {
    const inv = await createSalesInvoice({
      organizationId: orgId, createdById: userId, status: "DRAFT", customerId: custId,
      invoiceDate: new Date("2026-03-02").toISOString(), subtotal: 500, taxAmount: 75, total: 575,
      lines: [{ description: "Item", quantity: 1, unitPrice: 500, taxRate: 15, lineTotal: 500 }],
    });
    const entry = await postSalesInvoice(orgId, userId, inv.id);
    expect(entry).toBeNull();
    expect(await prisma.journalEntry.count()).toBe(0);
  });
});

describe("Purchase invoice auto-posting", () => {
  it("creates a balanced JE: Dr Inventory + VAT / Cr AP", async () => {
    const inv = await createPurchaseInvoice({
      organizationId: orgId, createdById: userId, status: "CONFIRMED", vendorId: vendId,
      invoiceDate: new Date("2026-03-05").toISOString(), subtotal: 2000, taxAmount: 300, total: 2300,
      lines: [{ description: "Goods", quantity: 1, unitPrice: 2000, taxRate: 15, lineTotal: 2000 }],
    });
    const entry = await postPurchaseInvoice(orgId, userId, inv.id);
    expect(entry).toBeTruthy();

    const inventory = await prisma.account.findFirst({ where: { organizationId: orgId, code: "1.1.3" } });
    const ap = await prisma.account.findFirst({ where: { organizationId: orgId, code: "2.1.1" } });
    expect(Number(inventory.balance)).toBeCloseTo(2000, 2);
    expect(Number(ap.balance)).toBeCloseTo(2300, 2);

    const lines = await prisma.journalEntryLine.findMany({ where: { journalEntryId: entry.id } });
    const dr = lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
    const cr = lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
    expect(dr).toBeCloseTo(cr, 2);
  });
});

describe("Expense auto-posting", () => {
  it("creates a balanced JE: Dr expense + VAT / Cr Cash", async () => {
    const opEx = await prisma.account.findFirst({ where: { organizationId: orgId, code: "5.2" } });
    const expense = await prisma.expense.create({
      data: {
        number: 1, date: new Date("2026-03-06"), description: "Marketing", amount: 1000, taxAmount: 150,
        paymentMethod: "CASH", organizationId: orgId, createdById: userId,
        lines: { create: { accountId: opEx.id, amount: 1000 } },
      },
    });
    const entry = await postExpense(orgId, userId, expense.id);
    expect(entry).toBeTruthy();

    const cash = await prisma.account.findFirst({ where: { organizationId: orgId, code: "1.1.1" } });
    const opExAfter = await prisma.account.findFirst({ where: { organizationId: orgId, code: "5.2" } });
    expect(Number(opExAfter.balance)).toBeCloseTo(1000, 2);
    expect(Number(cash.balance)).toBeCloseTo(-1150, 2); // cash is DEBIT-nature, credit reduces it

    const lines = await prisma.journalEntryLine.findMany({ where: { journalEntryId: entry.id } });
    const dr = lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
    const cr = lines.reduce((s: number, l: any) => s + Number(l.credit), 0);
    expect(dr).toBeCloseTo(1150, 2);
    expect(cr).toBeCloseTo(1150, 2);
  });
});
