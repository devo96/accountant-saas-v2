import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StockMovementViewClient } from "./client";

export default async function StockMovementViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.stockMovement.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      item: { select: { name: true, sku: true } },
      warehouse: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/inventory/stock-movements");

  const movement = {
    ...raw,
    unitCost: Number(raw.unitCost),
    totalCost: Number(raw.totalCost),
  };

  return <StockMovementViewClient movement={movement as unknown as typeof movement} />;
}
