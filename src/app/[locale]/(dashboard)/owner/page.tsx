import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { OwnerDashboardClient } from "./client";

type Props = { params: Promise<{ locale: string }> };

export default async function OwnerDashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const [
    totalOrgs,
    totalUsers,
    totalInvoices,
    plans,
    orgPlans,
    orgs,
    usersByOrg,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.salesInvoice.aggregate({ _sum: { total: true } }),
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
  ]);

  const activeOrgs = orgPlans.find((o) => o.status === "ACTIVE")?._count ?? 0;
  const trialingOrgs = orgPlans.find((o) => o.status === "TRIALING")?._count ?? 0;
  const expiredOrgs = orgPlans.find((o) => o.status === "EXPIRED")?._count ?? 0;
  const totalRevenue = Number(totalInvoices._sum.total ?? 0);

  const userCountMap = new Map(usersByOrg.map((u) => [u.organizationId, u._count]));

  const orgsWithDetails = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    email: org.email ?? "",
    createdAt: org.createdAt,
    userCount: userCountMap.get(org.id) ?? 0,
    plan: org.organizationPlan
      ? { id: org.organizationPlan.plan.id, name: org.organizationPlan.plan.name, tier: org.organizationPlan.plan.tier, status: org.organizationPlan.status }
      : null,
  }));

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="SaaS Admin" description="Manage all organizations, plans, and users" />
        <OwnerDashboardClient
          totalOrgs={totalOrgs}
          totalUsers={totalUsers}
          totalRevenue={totalRevenue}
          plans={plans.map((p) => ({ id: p.id, name: p.name, tier: p.tier, monthlyPrice: Number(p.monthlyPrice), maxUsers: p.maxUsers, maxInvoices: p.maxInvoices, active: p.active }))}
          activeOrgs={Number(activeOrgs)}
          trialingOrgs={Number(trialingOrgs)}
          expiredOrgs={Number(expiredOrgs)}
          orgs={orgsWithDetails}
        />
      </div>
    </FadeIn>
  );
}
