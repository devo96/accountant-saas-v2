import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { OrganizationsClient } from "./client";

export default async function OwnerOrganizationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const [orgs, plans] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { organizationPlan: { include: { plan: true } }, _count: { select: { users: true } } },
    }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const orgsWithDetails = orgs.map((org) => ({
    id: org.id, name: org.name, email: org.email ?? "", createdAt: org.createdAt,
    userCount: org._count.users,
    plan: org.organizationPlan ? { id: org.organizationPlan.plan.id, name: org.organizationPlan.plan.name, tier: org.organizationPlan.plan.tier, status: org.organizationPlan.status } : null,
  }));

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="Organizations" description="Manage all organizations and their plans" />
        <OrganizationsClient
          orgs={orgsWithDetails}
          plans={plans.map((p) => ({ id: p.id, name: p.name, tier: p.tier, monthlyPrice: Number(p.monthlyPrice), maxUsers: p.maxUsers, maxInvoices: p.maxInvoices, active: p.active }))}
        />
      </div>
    </FadeIn>
  );
}
