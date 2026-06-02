import { prisma } from "@/lib/prisma";

export async function getReportData(organizationId: string, reportType: string) {
  switch (reportType) {
    case "trial-balance":
      return getTrialBalance(organizationId);
    case "income-statement":
      return getIncomeStatement(organizationId);
    default:
      return [];
  }
}

async function getTrialBalance(organizationId: string) {
  const accounts = await prisma.account.findMany({
    where: { organizationId, isMaster: false },
  });

  const postedEntries = await prisma.journalEntry.findMany({
    where: { organizationId, status: "POSTED" },
    select: { id: true },
  });

  const entryIds = postedEntries.map((e) => e.id);

  const lines = await prisma.journalEntryLine.findMany({
    where: { journalEntryId: { in: entryIds } },
  });

  return accounts.map((a) => ({
    code: a.code,
    name: a.name,
    debit: lines.filter((l) => l.accountId === a.id).reduce((s, l) => s + Number(l.debit), 0),
    credit: lines.filter((l) => l.accountId === a.id).reduce((s, l) => s + Number(l.credit), 0),
  }));
}

async function getIncomeStatement(organizationId: string) {
  const incomeAccounts = await prisma.account.findMany({
    where: { organizationId, type: "INCOME" },
  });

  const expenseAccounts = await prisma.account.findMany({
    where: { organizationId, type: "EXPENSE" },
  });

  const postedEntries = await prisma.journalEntry.findMany({
    where: { organizationId, status: "POSTED" },
    select: { id: true },
  });

  const entryIds = postedEntries.map((e) => e.id);
  const lines = await prisma.journalEntryLine.findMany({
    where: { journalEntryId: { in: entryIds } },
  });

  return {
    income: incomeAccounts.map((a) => ({
      name: a.name,
      balance: lines
        .filter((l) => l.accountId === a.id)
        .reduce((s, l) => s + Number(l.credit) - Number(l.debit), 0),
    })),
    expenses: expenseAccounts.map((a) => ({
      name: a.name,
      balance: lines
        .filter((l) => l.accountId === a.id)
        .reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0),
    })),
  };
}
