import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FixedAssetsClient } from "./client";

export default async function FixedAssetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const assets = await prisma.fixedAsset.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return <FixedAssetsClient assets={assets.map((a) => ({ ...a, purchaseCost: Number(a.purchaseCost), salvageValue: Number(a.salvageValue), bookValue: Number(a.bookValue), accumulatedDepreciation: Number(a.accumulatedDepreciation) }))} />;
}
