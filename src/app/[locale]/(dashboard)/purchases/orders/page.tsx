import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PurchaseOrdersClient } from "./client";

export default async function PurchaseOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawOrders = await prisma.purchaseOrder.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { name: true, nameAr: true } } },
  });
  const orders = rawOrders.map((o) => ({ ...o, subtotal: Number(o.subtotal), discountAmount: Number(o.discountAmount), taxAmount: Number(o.taxAmount), total: Number(o.total) }));
  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, nameAr: true },
    orderBy: { name: "asc" },
  });

  return <PurchaseOrdersClient orders={orders} vendors={vendors} />;
}
