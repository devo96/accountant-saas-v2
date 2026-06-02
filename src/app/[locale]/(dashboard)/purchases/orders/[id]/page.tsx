import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PurchaseOrderViewClient } from "./client";

export default async function PurchaseOrderViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      vendor: { select: { name: true, nameAr: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/purchases/orders");

  const order = {
    ...raw,
    subtotal: Number(raw.subtotal),
    discountAmount: Number(raw.discountAmount),
    taxAmount: Number(raw.taxAmount),
    total: Number(raw.total),
  };

  return <PurchaseOrderViewClient order={order as unknown as typeof order} />;
}
