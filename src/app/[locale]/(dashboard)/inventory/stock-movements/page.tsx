import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StockMovementsClient } from "./client";

export default async function StockMovementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawMovements = await prisma.stockMovement.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { name: true, nameAr: true, sku: true } },
      warehouse: { select: { name: true, nameAr: true } },
    },
  });
  const movements = rawMovements.map((m) => ({
    ...m,
    unitCost: Number(m.unitCost),
    totalCost: Number(m.totalCost),
  }));
  const items = await prisma.item.findMany({
    where: { organizationId: session.user.organizationId, active: true },
    select: { id: true, name: true, nameAr: true, sku: true },
    orderBy: { name: "asc" },
  });
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: session.user.organizationId, active: true },
    select: { id: true, name: true, nameAr: true },
    orderBy: { name: "asc" },
  });

  return <StockMovementsClient movements={movements} items={items} warehouses={warehouses} />;
}
