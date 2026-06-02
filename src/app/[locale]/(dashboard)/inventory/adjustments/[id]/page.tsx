import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdjustmentViewClient } from "./client";

export default async function AdjustmentViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.inventoryAdjustment.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      item: { select: { name: true, sku: true } },
      warehouse: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/inventory/adjustments");

  const adjustment = {
    ...raw,
  };

  return <AdjustmentViewClient adjustment={adjustment as unknown as typeof adjustment} />;
}
