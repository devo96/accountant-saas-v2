import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      vendor: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...item,
    orderDate: item.orderDate.toISOString(),
    expectedDate: item.expectedDate?.toISOString() ?? null,
    subtotal: Number(item.subtotal),
    discountAmount: Number(item.discountAmount),
    taxAmount: Number(item.taxAmount),
    total: Number(item.total),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(body.orderDate !== undefined && { orderDate: new Date(body.orderDate) }),
      ...(body.expectedDate !== undefined && { expectedDate: new Date(body.expectedDate) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "PurchaseOrder",
    entityId: updated.id,
    oldValue: { status: existing.status },
    newValue: { status: updated.status },
  });

  return NextResponse.json({
    ...updated,
    orderDate: updated.orderDate.toISOString(),
    expectedDate: updated.expectedDate?.toISOString() ?? null,
    subtotal: Number(updated.subtotal),
    discountAmount: Number(updated.discountAmount),
    taxAmount: Number(updated.taxAmount),
    total: Number(updated.total),
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "PurchaseOrder",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
