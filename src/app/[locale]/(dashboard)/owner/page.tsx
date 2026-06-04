import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { OwnerDashboardClient } from "./client";

export default async function OwnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [
    totalOrgs, totalUsers, plans, orgPlans,
    orgs, usersByOrg, activePlans, invoicesByMonth,
    orgsThisMonth, newUsersThisMonth,
    todayJournals, todayInvoices,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.organizationPlan.groupBy({ by: ["status"], _count: true }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organizationPlan: { include: { plan: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.user.groupBy({ by: ["organizationId"], _count: true }),
    prisma.organizationPlan.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    }),
    prisma.salesInvoice.findMany({
      select: { total: true, invoiceDate: true },
    }),
    prisma.organization.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.journalEntry.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.salesInvoice.count({ where: { createdAt: { gte: todayStart } } }),
  ]);

  const mrr = activePlans.reduce((sum, op) => sum + Number(op.plan.monthlyPrice), 0);
  const arr = mrr * 12;

  const activeOrgs = orgPlans.find((o) => o.status === "ACTIVE")?._count ?? 0;
  const trialingOrgs = orgPlans.find((o) => o.status === "TRIALING")?._count ?? 0;
  const expiredOrgs = orgPlans.find((o) => o.status === "EXPIRED")?._count ?? 0;
  const cancelledOrgs = orgPlans.find((o) => o.status === "CANCELLED")?._count ?? 0;
  const totalPlanned = activeOrgs + trialingOrgs + expiredOrgs + cancelledOrgs;
  const churnRate = totalPlanned > 0 ? ((expiredOrgs + cancelledOrgs) / totalPlanned * 100).toFixed(1) : "0.0";

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyRevenue: Record<string, number> = {};
  for (const m of months) monthlyRevenue[m] = 0;
  for (const inv of invoicesByMonth) {
    const m = months[new Date(inv.invoiceDate).getMonth()];
    monthlyRevenue[m] += Number(inv.total ?? 0);
  }
  const chartData = months.map((month) => ({ month, revenue: monthlyRevenue[month] }));

  const userCountMap = new Map(usersByOrg.map((u) => [u.organizationId, u._count]));
  const orgsWithDetails = orgs.map((org) => ({
    id: org.id, name: org.name, email: org.email ?? "", createdAt: org.createdAt,
    userCount: userCountMap.get(org.id) ?? 0,
    plan: org.organizationPlan
      ? { id: org.organizationPlan.plan.id, name: org.organizationPlan.plan.name, tier: org.organizationPlan.plan.tier, status: org.organizationPlan.status }
      : null,
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="SaaS Admin" description="Manage all organizations, plans, and users" />
        <OwnerDashboardClient
          totalOrgs={totalOrgs}
          totalUsers={totalUsers}
          totalRevenue={totalRevenue}
          mrr={mrr}
          arr={arr}
          churnRate={churnRate}
          liveOps={{ journals: todayJournals, invoices: todayInvoices }}
          plans={plans.map((p) => ({ id: p.id, name: p.name, tier: p.tier, monthlyPrice: Number(p.monthlyPrice), maxUsers: p.maxUsers, maxInvoices: p.maxInvoices, active: p.active }))}
          activeOrgs={Number(activeOrgs)}
          trialingOrgs={Number(trialingOrgs)}
          expiredOrgs={Number(expiredOrgs)}
          cancelledOrgs={Number(cancelledOrgs)}
          orgs={orgsWithDetails}
          chartData={chartData}
          orgsThisMonth={orgsThisMonth}
          newUsersThisMonth={newUsersThisMonth}
        />
      </div>
    </FadeIn>
  );
}
