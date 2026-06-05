import { prisma } from "@/lib/prisma";

export async function getItems(orgId: string) {
  const raw = await prisma.item.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });
  return raw.map((i) => ({ ...i, costPrice: Number(i.costPrice), sellingPrice: Number(i.sellingPrice) }));
}

export async function getWarehouses(orgId: string) {
  return prisma.warehouse.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });
}

export async function createWarehouse(orgId: string, data: { name: string; address?: string }) {
  return prisma.warehouse.create({
    data: { ...data, organizationId: orgId },
  });
}

export async function getStockMovements(orgId: string) {
  const raw = await prisma.stockMovement.findMany({
    where: { organizationId: orgId },
    include: { item: { select: { name: true } }, warehouse: { select: { name: true } }, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return raw.map((m) => ({ ...m, unitCost: Number(m.unitCost), totalCost: Number(m.totalCost) }));
}

export async function getInventoryAdjustments(orgId: string) {
  return prisma.inventoryAdjustment.findMany({
    where: { organizationId: orgId },
    include: { item: { select: { name: true } }, warehouse: { select: { name: true } }, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
