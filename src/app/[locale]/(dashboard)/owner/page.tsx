import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { OwnerDashboardClient } from "./client";

type Props = { params: Promise<{ locale: string }> };

function getMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function fillMonths(data: { month: string; total: number }[], allMonths: string[]): number[] {
  const map = new Map(data.map((d) => [d.month, Number(d.total)]));
  return allMonths.map((m) => map.get(m) ?? 0);
}

export default async function OwnerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") redirect("/dashboard");

  const orgId = session.user.organizationId;
  const allMonths = getMonths();
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    org,
    users,
    totalInvoices,
    totalPurchases,
    totalExpenses,
    invoiceCount,
    purchaseCount,
    quoteCount,
    customerCount,
    vendorCount,
    itemCount,
    employeeCount,
    journalCount,
    payRunCount,
    activeUsers,
    recentLogs,
    monthlySalesRaw,
    monthlyExpensesRaw,
    monthlyPurchasesRaw,
    topCustomersAR,
    topVendorsAP,
    topCustomersRevenueRaw,
    overdueInvoices,
    userLastActivityRaw,
    cashInflow,
    unpaidInvoiceCount,
  ] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.user.findMany({ where: { organizationId: orgId }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } }),
    prisma.salesInvoice.aggregate({ where: { organizationId: orgId, status: "PAID" }, _sum: { total: true } }),
    prisma.purchaseInvoice.aggregate({ where: { organizationId: orgId, status: "PAID" }, _sum: { total: true } }),
    prisma.expense.aggregate({ where: { organizationId: orgId }, _sum: { amount: true } }),
    prisma.salesInvoice.count({ where: { organizationId: orgId } }),
    prisma.purchaseInvoice.count({ where: { organizationId: orgId } }),
    prisma.salesQuote.count({ where: { organizationId: orgId } }),
    prisma.customer.count({ where: { organizationId: orgId } }),
    prisma.vendor.count({ where: { organizationId: orgId } }),
    prisma.item.count({ where: { organizationId: orgId } }),
    prisma.employee.count({ where: { organizationId: orgId } }),
    prisma.journalEntry.count({ where: { organizationId: orgId } }),
    prisma.payrollRun.count({ where: { organizationId: orgId } }),
    prisma.user.count({ where: { organizationId: orgId, active: true } }),
    prisma.auditLog.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT strftime('%Y-%m', i."invoiceDate") as month, COALESCE(SUM(CAST(i."total" AS REAL)), 0) as total
      FROM "SalesInvoice" i WHERE i."organizationId" = ${orgId} AND i."status" IN ('PAID','PARTIALLY_PAID') AND i."invoiceDate" >= ${twelveMonthsAgo}
      GROUP BY strftime('%Y-%m', i."invoiceDate") ORDER BY month ASC
    `,
    prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT strftime('%Y-%m', e."date") as month, COALESCE(SUM(CAST(e."amount" AS REAL)), 0) as total
      FROM "Expense" e WHERE e."organizationId" = ${orgId} AND e."date" >= ${twelveMonthsAgo}
      GROUP BY strftime('%Y-%m', e."date") ORDER BY month ASC
    `,
    prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT strftime('%Y-%m', i."invoiceDate") as month, COALESCE(SUM(CAST(i."total" AS REAL)), 0) as total
      FROM "PurchaseInvoice" i WHERE i."organizationId" = ${orgId} AND i."status" IN ('PAID','PARTIALLY_PAID') AND i."invoiceDate" >= ${twelveMonthsAgo}
      GROUP BY strftime('%Y-%m', i."invoiceDate") ORDER BY month ASC
    `,
    prisma.customer.findMany({ where: { organizationId: orgId, balance: { gt: 0 } }, orderBy: { balance: "desc" }, take: 5, select: { id: true, name: true, balance: true, email: true } }),
    prisma.vendor.findMany({ where: { organizationId: orgId, balance: { gt: 0 } }, orderBy: { balance: "desc" }, take: 5, select: { id: true, name: true, balance: true, email: true } }),
    prisma.$queryRaw<Array<{ customerId: string; name: string; total: number }>>`
      SELECT i."customerId", c."name", COALESCE(SUM(CAST(i."total" AS REAL)), 0) as total
      FROM "SalesInvoice" i JOIN "Customer" c ON c."id" = i."customerId"
      WHERE i."organizationId" = ${orgId} AND i."status" IN ('PAID','PARTIALLY_PAID')
      GROUP BY i."customerId" ORDER BY total DESC LIMIT 5
    `,
    prisma.salesInvoice.findMany({
      where: { organizationId: orgId, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, number: true, total: true, paidAmount: true, dueDate: true, status: true, customer: { select: { name: true } } }
    }),
    prisma.$queryRaw<Array<{ id: string; name: string; email: string; active: boolean; actionCount: number; lastActivity: Date | null }>>`
      SELECT u."id", u."name", u."email", u."active", COUNT(l."id") as actionCount, MAX(l."createdAt") as lastActivity
      FROM "User" u LEFT JOIN "AuditLog" l ON l."userId" = u."id"
      WHERE u."organizationId" = ${orgId}
      GROUP BY u."id" ORDER BY lastActivity DESC
    `,
    prisma.paymentReceipt.aggregate({ where: { organizationId: orgId }, _sum: { amount: true } }),
    prisma.salesInvoice.count({ where: { organizationId: orgId, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] } } }),
  ]);

  const revenue = Number(totalInvoices._sum.total ?? 0);
  const purchases = Number(totalPurchases._sum.total ?? 0);
  const expenses = Number(totalExpenses._sum.amount ?? 0);
  const totalCosts = purchases + expenses;
  const profit = revenue - totalCosts;

  const rolesDist = { OWNER: 0, ADMIN: 0, ACCOUNTANT: 0, VIEWER: 0 } as Record<string, number>;
  for (const u of users) { rolesDist[u.role] = (rolesDist[u.role] ?? 0) + 1; }

  const monthlyRevenue = fillMonths(monthlySalesRaw, allMonths);
  const monthlyExpenses = fillMonths(monthlyExpensesRaw, allMonths);
  const monthlyPurchases = fillMonths(monthlyPurchasesRaw, allMonths);
  const monthlyTrends = allMonths.map((month, i) => ({
    month,
    revenue: monthlyRevenue[i],
    expenses: monthlyExpenses[i],
    purchases: monthlyPurchases[i],
  }));

  const topCustomersRevenue = topCustomersRevenueRaw.map((c) => ({ customerId: c.customerId, name: c.name, total: Number(c.total) }));

  const userActivity = userLastActivityRaw.map((u) => ({
    id: u.id, name: u.name, email: u.email, active: u.active,
    actionCount: Number(u.actionCount), lastActivity: u.lastActivity,
  }));

  const stats = {
    revenue, purchases, expenses, profit, totalCosts,
    invoiceCount, purchaseCount, quoteCount, customerCount, vendorCount,
    itemCount, employeeCount, journalCount, payRunCount,
    totalUsers: users.length, activeUsers, rolesDist, orgName: org?.name ?? "",
  };

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="Owner Dashboard" description={`${org?.name ?? "Organization"} — Full system overview`} />
        <OwnerDashboardClient
          stats={stats}
          recentLogs={recentLogs}
          users={users}
          session={session}
          monthlyTrends={monthlyTrends}
          topCustomersAR={topCustomersAR.map((c) => ({ id: c.id, name: c.name, balance: Number(c.balance), email: c.email }))}
          topVendorsAP={topVendorsAP.map((v) => ({ id: v.id, name: v.name, balance: Number(v.balance), email: v.email }))}
          topCustomersRevenue={topCustomersRevenue}
          overdueInvoices={overdueInvoices.map((inv) => ({
            id: inv.id, number: inv.number, total: Number(inv.total),
            paidAmount: Number(inv.paidAmount), dueDate: inv.dueDate,
            status: inv.status, customerName: inv.customer.name,
          }))}
          userActivity={userActivity}
          cashInflow={Number(cashInflow._sum.amount ?? 0)}
          unpaidInvoiceCount={unpaidInvoiceCount}
        />
      </div>
    </FadeIn>
  );
}
