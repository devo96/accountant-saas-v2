import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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
  const last = await prisma.purchaseOrder.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const order = await prisma.purchaseOrder.create({
    data: {
      number: (last?.number ?? 0) + 1,
      orderDate: new Date(body.orderDate),
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
      status: body.status ?? "DRAFT",
      vendorId: body.vendorId,
      subtotal: Number(body.subtotal) || 0,
      discountAmount: Number(body.discountAmount) || 0,
      taxAmount: Number(body.taxAmount) || 0,
      total: Number(body.total) || 0,
      notes: body.notes || null,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(order);
}
