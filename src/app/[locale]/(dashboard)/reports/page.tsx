import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsDashboard } from "./reports-dashboard";

export default async function ReportsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const orgId = session.user.organizationId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    rawInvoices,
    rawExpenses,
    rawAccounts,
    rawEntries,
    rawBankTxns,
    rawCustomers,
    rawVendors,
  ] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { organizationId: orgId, status: { in: ["CONFIRMED", "PAID"] } },
      include: { customer: { select: { name: true } } },
      orderBy: { invoiceDate: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { organizationId: orgId },
      include: { lines: { include: { account: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.account.findMany({
      where: { organizationId: orgId, active: true },
    }),
    prisma.journalEntry.findMany({
      where: { organizationId: orgId, status: "POSTED" },
      include: { lines: true },
    }),
    prisma.bankTransaction.findMany({
      where: { organizationId: orgId },
      orderBy: { date: "asc" },
    }),
    prisma.customer.count({ where: { organizationId: orgId, active: true } }),
    prisma.vendor.count({ where: { organizationId: orgId, active: true } }),
  ]);

  const invoices = rawInvoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    invoiceDate: inv.invoiceDate,
    customerName: inv.customer?.name ?? "",
    total: Number(inv.total),
    status: inv.status,
  }));

  const expenses = rawExpenses.map((exp) => ({
    id: exp.id,
    number: exp.number,
    date: exp.date,
    description: exp.description ?? "",
    total: Number(exp.amount),
  }));

  const accounts = rawAccounts.map((a) => ({ ...a, balance: Number(a.balance) }));
  const entries = rawEntries.map((e) => ({
    ...e,
    lines: e.lines.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
  }));

  const incomeAccounts = accounts.filter((a) => a.type === "INCOME");
  const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");

  const totalIncome = incomeAccounts.reduce((s, a) => {
    const totalDebit = entries.reduce((sd, e) => sd + e.lines.filter((l) => l.accountId === a.id).reduce((ls, l) => ls + l.debit, 0), 0);
    const totalCredit = entries.reduce((sc, e) => sc + e.lines.filter((l) => l.accountId === a.id).reduce((ls, l) => ls + l.credit, 0), 0);
    return s + (a.nature === "DEBIT" ? a.balance + totalDebit - totalCredit : a.balance + totalCredit - totalDebit);
  }, 0);

  const totalExpenses = expenseAccounts.reduce((s, a) => {
    const totalDebit = entries.reduce((sd, e) => sd + e.lines.filter((l) => l.accountId === a.id).reduce((ls, l) => ls + l.debit, 0), 0);
    const totalCredit = entries.reduce((sc, e) => sc + e.lines.filter((l) => l.accountId === a.id).reduce((ls, l) => ls + l.credit, 0), 0);
    return s + (a.nature === "DEBIT" ? a.balance + totalDebit - totalCredit : a.balance + totalCredit - totalDebit);
  }, 0);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0";

  const revenueThisMonth = rawInvoices
    .filter((inv) => inv.invoiceDate >= startOfMonth)
    .reduce((s, inv) => s + Number(inv.total), 0);

  const expensesThisMonth = rawExpenses
    .filter((exp) => exp.date >= startOfMonth)
    .reduce((s, exp) => s + Number(exp.amount), 0);

  const allInvoices = await prisma.salesInvoice.findMany({
    where: { organizationId: orgId, status: { in: ["CONFIRMED", "PAID"] } },
    orderBy: { invoiceDate: "asc" },
  });

  const allMonthlyExpenses = await prisma.expense.findMany({
    where: { organizationId: orgId },
    orderBy: { date: "asc" },
  });

  const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
  for (const inv of allInvoices) {
    const key = `${inv.invoiceDate.getFullYear()}-${String(inv.invoiceDate.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthlyMap.get(key) ?? { revenue: 0, expenses: 0 };
    cur.revenue += Number(inv.total);
    monthlyMap.set(key, cur);
  }
  for (const exp of allMonthlyExpenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthlyMap.get(key) ?? { revenue: 0, expenses: 0 };
    cur.expenses += Number(exp.amount);
    monthlyMap.set(key, cur);
  }

  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return (
    <ReportsDashboard
      totalIncome={totalIncome}
      totalExpenses={totalExpenses}
      netProfit={netProfit}
      profitMargin={profitMargin}
      revenueThisMonth={revenueThisMonth}
      expensesThisMonth={expensesThisMonth}
      customersCount={rawCustomers}
      vendorsCount={rawVendors}
      recentInvoices={invoices}
      recentExpenses={expenses}
      monthlyData={monthlyData.map(([month, d]) => ({ month, revenue: d.revenue, expenses: d.expenses }))}
    />
  );
}
