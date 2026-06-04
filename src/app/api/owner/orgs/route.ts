import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organizationPlan: { include: { plan: true } },
      _count: { select: { users: true } },
    },
  });

  const usersByOrg = await prisma.user.groupBy({ by: ["organizationId"], _count: true });
  const userCountMap = new Map(usersByOrg.map((u) => [u.organizationId, u._count]));

  const result = orgs.map((org) => ({
    id: org.id, name: org.name, email: org.email ?? "", createdAt: org.createdAt,
    userCount: userCountMap.get(org.id) ?? 0,
    plan: org.organizationPlan
      ? { id: org.organizationPlan.plan.id, name: org.organizationPlan.plan.name, tier: org.organizationPlan.plan.tier, status: org.organizationPlan.status }
      : null,
  }));

  return NextResponse.json(result);
}
