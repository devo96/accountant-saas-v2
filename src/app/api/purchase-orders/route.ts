import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validate } from "@/lib/validate";
import { PurchaseOrderSchema } from "@/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.purchaseOrder.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { name: true } } },
  });

  return NextResponse.json(orders.map((o) => ({ ...o, subtotal: Number(o.subtotal), discountAmount: Number(o.discountAmount), taxAmount: Number(o.taxAmount), total: Number(o.total) })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = validate(PurchaseOrderSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const last = await prisma.purchaseOrder.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const order = await prisma.purchaseOrder.create({
    data: {
      number: (last?.number ?? 0) + 1,
      orderDate: new Date(d.orderDate),
      expectedDate: d.expectedDate ? new Date(d.expectedDate) : null,
      status: d.status ?? "DRAFT",
      vendorId: d.vendorId,
      subtotal: d.subtotal,
      discountAmount: d.discountAmount ?? 0,
      taxAmount: d.taxAmount,
      total: d.total,
      notes: d.notes || null,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(order);
}
