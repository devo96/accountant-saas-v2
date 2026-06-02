import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventoryAdjustmentsClient } from "./client";

export default async function InventoryAdjustmentsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;

  const [adjustments, items, warehouses] = await Promise.all([
    prisma.inventoryAdjustment.findMany({
      where: { organizationId: orgId },
      include: { item: true, warehouse: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.item.findMany({
      where: { organizationId: orgId, active: true },
    }),
    prisma.warehouse.findMany({
      where: { organizationId: orgId, active: true },
    }),
  ]);

  const data = adjustments.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    item: {
      ...a.item,
      costPrice: Number(a.item.costPrice),
      sellingPrice: Number(a.item.sellingPrice),
    },
  }));

  return <InventoryAdjustmentsClient data={data} items={items.map((i) => ({ ...i, costPrice: Number(i.costPrice), sellingPrice: Number(i.sellingPrice) }))} warehouses={warehouses} />;
}
