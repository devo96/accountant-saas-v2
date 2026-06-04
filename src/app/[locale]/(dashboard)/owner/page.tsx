import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { OwnerOverviewClient } from "./client";

export default async function OwnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [totalOrgs, totalUsers, orgPlans, invoices, orgs, usersByOrg, todayJournals, todayInvoices] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.organizationPlan.groupBy({ by: ["status"], _count: true }),
    prisma.salesInvoice.findMany({ select: { total: true, invoiceDate: true } }),
    prisma.organization.findMany({ orderBy: { createdAt: "desc" }, include: { organizationPlan: { include: { plan: true } }, _count: { select: { users: true } } } }),
    prisma.user.groupBy({ by: ["organizationId"], _count: true }),
    prisma.journalEntry.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.salesInvoice.count({ where: { createdAt: { gte: todayStart } } }),
  ]);

  const activePlans = await prisma.organizationPlan.findMany({ where: { status: "ACTIVE" }, include: { plan: true } });
  const mrr = activePlans.reduce((sum, op) => sum + Number(op.plan.monthlyPrice), 0);
  const arr = mrr * 12;

  const activeOrgCount = orgPlans.find((o) => o.status === "ACTIVE")?._count ?? 0;
  const trialingOrgCount = orgPlans.find((o) => o.status === "TRIALING")?._count ?? 0;
  const expiredOrgCount = orgPlans.find((o) => o.status === "EXPIRED")?._count ?? 0;
  const cancelledOrgCount = orgPlans.find((o) => o.status === "CANCELLED")?._count ?? 0;
  const totalPlanned = activeOrgCount + trialingOrgCount + expiredOrgCount + cancelledOrgCount;
  const churnRate = totalPlanned > 0 ? ((expiredOrgCount + cancelledOrgCount) / totalPlanned * 100).toFixed(1) : "0.0";

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyRevenue: Record<string, number> = {};
  for (const m of months) monthlyRevenue[m] = 0;
  for (const inv of invoices) { const m = months[new Date(inv.invoiceDate).getMonth()]; monthlyRevenue[m] += Number(inv.total ?? 0); }
  const chartData = months.map((month) => ({ month, revenue: monthlyRevenue[month] }));

  const orgsThisMonth = await prisma.organization.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });
  const newUsersThisMonth = await prisma.user.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } });

  const userCountMap = new Map(usersByOrg.map((u) => [u.organizationId, u._count]));
  const unassignedOrgs = orgs.filter((o) => !o.organizationPlan).length;

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="SaaS Admin" description="Manage all organizations, plans, and users" />
        <OwnerOverviewClient
          totalOrgs={totalOrgs}
          totalUsers={totalUsers}
          mrr={mrr}
          arr={arr}
          churnRate={churnRate}
          liveOps={{ journals: todayJournals, invoices: todayInvoices }}
          activeOrgs={Number(activeOrgCount)}
          trialingOrgs={Number(trialingOrgCount)}
          expiredOrgs={Number(expiredOrgCount)}
          cancelledOrgs={Number(cancelledOrgCount)}
          orgsThisMonth={orgsThisMonth}
          newUsersThisMonth={newUsersThisMonth}
          unassignedOrgs={unassignedOrgs}
          chartData={chartData}
        />
      </div>
    </FadeIn>
  );
}
