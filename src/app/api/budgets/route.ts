import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fiscalYearId = searchParams.get("fiscalYearId");
  if (!fiscalYearId) return NextResponse.json({ error: "fiscalYearId required" }, { status: 400 });

  const fy = await prisma.fiscalYear.findFirst({
    where: { id: fiscalYearId, organizationId: session.user.organizationId },
  });
  if (!fy) return NextResponse.json({ error: "Fiscal year not found" }, { status: 404 });

  const fyStart = new Date(fy.startDate);
  const fyEnd = new Date(fy.endDate);

  const [budgets, incomeAccounts, expenseAccounts] = await Promise.all([
    prisma.budget.findMany({
      where: { organizationId: session.user.organizationId, fiscalYearId },
    }),
    prisma.account.findMany({
      where: { organizationId: session.user.organizationId, type: "INCOME" },
      orderBy: { code: "asc" },
    }),
    prisma.account.findMany({
      where: { organizationId: session.user.organizationId, type: "EXPENSE" },
      orderBy: { code: "asc" },
    }),
  ]);

  const budgetMap: Record<string, Record<number, number>> = {};
  for (const b of budgets) {
    if (!budgetMap[b.accountId]) budgetMap[b.accountId] = {};
    budgetMap[b.accountId][b.month] = Number(b.amount);
  }

  const journalLines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        organizationId: session.user.organizationId,
        status: "POSTED",
        date: { gte: fyStart, lte: fyEnd },
      },
      accountId: { in: [...incomeAccounts.map((a) => a.id), ...expenseAccounts.map((a) => a.id)] },
    },
    select: {
      accountId: true,
      debit: true,
      credit: true,
      journalEntry: { select: { date: true } },
    },
  });

  const actualMap: Record<string, Record<number, number>> = {};
  for (const line of journalLines) {
    const month = new Date(line.journalEntry.date).getMonth();
    if (!actualMap[line.accountId]) actualMap[line.accountId] = {};
    actualMap[line.accountId][month] = (actualMap[line.accountId][month] ?? 0) + Number(line.debit) - Number(line.credit);
  }

  function buildItems(accounts: typeof incomeAccounts) {
    return accounts.map((a) => {
      const months: { month: number; budget: number; actual: number }[] = [];
      for (let m = 1; m <= 12; m++) {
        months.push({
          month: m,
          budget: budgetMap[a.id]?.[m] ?? 0,
          actual: actualMap[a.id]?.[m - 1] ?? 0,
        });
      }
      return {
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        accountNameAr: a.name,
        months,
      };
    });
  }

  return NextResponse.json({
    incomeAccounts: buildItems(incomeAccounts),
    expenseAccounts: buildItems(expenseAccounts),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fiscalYearId, budgets: budgetData } = await req.json();
  if (!fiscalYearId || !budgetData) return NextResponse.json({ error: "fiscalYearId and budgets required" }, { status: 400 });

  const fy = await prisma.fiscalYear.findFirst({
    where: { id: fiscalYearId, organizationId: session.user.organizationId },
  });
  if (!fy) return NextResponse.json({ error: "Fiscal year not found" }, { status: 404 });
  if (fy.isClosed) {
    return NextResponse.json({ error: "Cannot modify budgets for a closed fiscal year" }, { status: 403 });
  }

  for (const b of budgetData) {
    if (b.amount > 0) {
      await prisma.budget.upsert({
        where: { organizationId_accountId_fiscalYearId_month: { organizationId: session.user.organizationId, accountId: b.accountId, fiscalYearId, month: b.month } },
        update: { amount: b.amount },
        create: { organizationId: session.user.organizationId, accountId: b.accountId, fiscalYearId, month: b.month, amount: b.amount },
      });
    } else {
      await prisma.budget.deleteMany({
        where: { organizationId: session.user.organizationId, accountId: b.accountId, fiscalYearId, month: b.month },
      });
    }
  }

  return NextResponse.json({ success: true });
}
