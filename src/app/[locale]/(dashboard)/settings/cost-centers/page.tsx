import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CostCentersClient } from "./client";

export default async function CostCentersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const dimensions = await prisma.accountingDimension.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { allocations: true } } },
  });

  const data = dimensions.map((d) => ({
    id: d.id,
    name: d.name,
    accountsCount: d._count.allocations,
  }));

  return <CostCentersClient dimensions={data} />;
}
