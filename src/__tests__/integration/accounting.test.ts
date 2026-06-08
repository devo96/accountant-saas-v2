import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const testDbPath = path.resolve(process.cwd(), "prisma/test.sqlite");
const url = `file:${testDbPath}`;

function createTestPrisma() {
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

beforeAll(() => {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), "prisma/test.sqlite")}`;
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const orgId = "test-org-id";
const userId = "test-user-id";

async function cleanDb() {
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.account.deleteMany({ where: { organizationId: orgId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
}

beforeEach(async () => {
  await cleanDb();
  await prisma.organization.create({
    data: { id: orgId, name: "Test Organization" },
  });
  await prisma.user.create({
    data: { id: userId, email: "test@test.com", name: "Test User", organizationId: orgId },
  });
});

async function seedAccounts() {
  return {
    cash: await prisma.account.create({
      data: { code: "1001", name: "Cash", type: "ASSET", nature: "DEBIT", organizationId: orgId },
    }),
    revenue: await prisma.account.create({
      data: { code: "4001", name: "Revenue", type: "INCOME", nature: "CREDIT", organizationId: orgId },
    }),
    ar: await prisma.account.create({
      data: { code: "1002", name: "Accounts Receivable", type: "ASSET", nature: "DEBIT", organizationId: orgId },
    }),
  };
}

describe("Journal Entry → GL Auto-Posting", () => {
  it("updates DEBIT account balance when posted", async () => {
    const accounts = await seedAccounts();
    const entry = await prisma.journalEntry.create({
      data: {
        number: 1,
        date: new Date(),
        description: "Test entry",
        organizationId: orgId,
        createdById: userId,
        status: "POSTED",
        lines: {
          create: [
            { accountId: accounts.cash.id, debit: 1000, credit: 0 },
            { accountId: accounts.revenue.id, debit: 0, credit: 1000 },
          ],
        },
      },
      include: { lines: true },
    });

    const { syncJournalEntryBalances } = await import("@/domains/accounting/gl");
    await syncJournalEntryBalances(entry.id);

    const cash = await prisma.account.findUnique({ where: { id: accounts.cash.id } });
    const revenue = await prisma.account.findUnique({ where: { id: accounts.revenue.id } });

    expect(Number(cash!.balance)).toBe(1000);
    expect(Number(revenue!.balance)).toBe(1000);
  });

  it("reverses balances when reverse=true", async () => {
    const accounts = await seedAccounts();
    const entry = await prisma.journalEntry.create({
      data: {
        number: 2,
        date: new Date(),
        description: "Reverse test",
        organizationId: orgId,
        createdById: userId,
        status: "POSTED",
        lines: {
          create: [
            { accountId: accounts.cash.id, debit: 500, credit: 0 },
            { accountId: accounts.revenue.id, debit: 0, credit: 500 },
          ],
        },
      },
      include: { lines: true },
    });

    const { syncJournalEntryBalances } = await import("@/domains/accounting/gl");
    await syncJournalEntryBalances(entry.id);

    const cashAfter = await prisma.account.findUnique({ where: { id: accounts.cash.id } });
    expect(Number(cashAfter!.balance)).toBe(500);

    await syncJournalEntryBalances(entry.id, true);

    const cashReversed = await prisma.account.findUnique({ where: { id: accounts.cash.id } });
    expect(Number(cashReversed!.balance)).toBe(0);
  });

  it("handles mixed debit/credit on same account type", async () => {
    const accounts = await seedAccounts();
    const entry = await prisma.journalEntry.create({
      data: {
        number: 3,
        date: new Date(),
        description: "Mixed test",
        organizationId: orgId,
        createdById: userId,
        status: "POSTED",
        lines: {
          create: [
            { accountId: accounts.cash.id, debit: 200, credit: 50 },
            { accountId: accounts.ar.id, debit: 0, credit: 150 },
          ],
        },
      },
      include: { lines: true },
    });

    const { syncJournalEntryBalances } = await import("@/domains/accounting/gl");
    await syncJournalEntryBalances(entry.id);

    const cash = await prisma.account.findUnique({ where: { id: accounts.cash.id } });
    const ar = await prisma.account.findUnique({ where: { id: accounts.ar.id } });

    expect(Number(cash!.balance)).toBe(150);
    expect(Number(ar!.balance)).toBe(-150);
  });
});

describe("Journal Entry Domain Service", () => {
  it("createJournalEntry creates POSTED entry and syncs balances", async () => {
    const accounts = await seedAccounts();
    const { createJournalEntry } = await import("@/domains/accounting/journal");

    const entry = await createJournalEntry(orgId, userId, {
      date: new Date().toISOString(),
      description: "Domain service test",
      lines: [
        { accountId: accounts.cash.id, debit: 2000, credit: 0 },
        { accountId: accounts.revenue.id, debit: 0, credit: 2000 },
      ],
      status: "POSTED",
    });

    expect(entry.status).toBe("POSTED");
    expect(entry.number).toBeGreaterThan(0);

    const cash = await prisma.account.findUnique({ where: { id: accounts.cash.id } });
    const revenue = await prisma.account.findUnique({ where: { id: accounts.revenue.id } });
    expect(Number(cash!.balance)).toBe(2000);
    expect(Number(revenue!.balance)).toBe(2000);
  });

  it("createJournalEntry creates DRAFT entry without syncing balances", async () => {
    const accounts = await seedAccounts();
    const { createJournalEntry } = await import("@/domains/accounting/journal");

    const entry = await createJournalEntry(orgId, userId, {
      date: new Date().toISOString(),
      description: "Draft test",
      lines: [
        { accountId: accounts.cash.id, debit: 3000, credit: 0 },
        { accountId: accounts.revenue.id, debit: 0, credit: 3000 },
      ],
      status: "DRAFT",
    });

    expect(entry.status).toBe("DRAFT");

    const cash = await prisma.account.findUnique({ where: { id: accounts.cash.id } });
    expect(Number(cash!.balance)).toBe(0);
  });
});

describe("General Ledger Query", () => {
  it("getGeneralLedger returns lines for posted entries", async () => {
    const accounts = await seedAccounts();
    await prisma.journalEntry.create({
      data: {
        number: 10,
        date: new Date("2026-01-15"),
        description: "GL test",
        organizationId: orgId,
        createdById: userId,
        status: "POSTED",
        lines: {
          create: [
            { accountId: accounts.cash.id, debit: 500, credit: 0 },
            { accountId: accounts.revenue.id, debit: 0, credit: 500 },
          ],
        },
      },
    });

    const { getGeneralLedger } = await import("@/domains/accounting/ledger");
    const lines = await getGeneralLedger(orgId);

    expect(lines.length).toBe(2);
    expect(lines.every((l) => l.journalEntry.organizationId === orgId)).toBe(true);
  });

  it("getGeneralLedger filters by account", async () => {
    const accounts = await seedAccounts();
    await prisma.journalEntry.create({
      data: {
        number: 11,
        date: new Date("2026-02-01"),
        description: "Filter test",
        organizationId: orgId,
        createdById: userId,
        status: "POSTED",
        lines: {
          create: [
            { accountId: accounts.cash.id, debit: 100, credit: 0 },
            { accountId: accounts.revenue.id, debit: 0, credit: 100 },
          ],
        },
      },
    });

    const { getGeneralLedger } = await import("@/domains/accounting/ledger");
    const lines = await getGeneralLedger(orgId, accounts.cash.id);

    expect(lines.length).toBe(1);
    expect(lines[0].accountId).toBe(accounts.cash.id);
  });
});
