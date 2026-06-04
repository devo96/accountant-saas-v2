import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { PlansClient } from "./client";

export default async function OwnerPlansPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  const orgPlanCounts = await prisma.organizationPlan.groupBy({ by: ["planId"], _count: true });
  const countMap = new Map(orgPlanCounts.map((o) => [o.planId, o._count]));

  const plansWithCount = plans.map((p) => ({
    id: p.id, name: p.name, tier: p.tier, monthlyPrice: Number(p.monthlyPrice), maxUsers: p.maxUsers, maxInvoices: p.maxInvoices, active: p.active, orgCount: countMap.get(p.id) ?? 0,
  }));

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="Plans" description="Manage subscription plans and pricing" />
        <PlansClient plans={plansWithCount} />
      </div>
    </FadeIn>
  );
}
