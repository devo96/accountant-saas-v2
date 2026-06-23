import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { PurchaseReturnSchema } from "@/validations";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.purchaseReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      vendor: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...item,
    returnDate: item.returnDate.toISOString(),
    subtotal: Number(item.subtotal),
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

  const parsed = validatePartial(PurchaseReturnSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.purchaseReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.purchaseReturn.update({
    where: { id },
    data: {
      ...(d.returnDate !== undefined && { returnDate: new Date(d.returnDate) }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.originalInvoiceId !== undefined && { originalInvoiceId: d.originalInvoiceId }),
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "PurchaseReturn",
    entityId: updated.id,
    oldValue: { status: existing.status },
    newValue: { status: updated.status },
  });

  return NextResponse.json({
    ...updated,
    returnDate: updated.returnDate.toISOString(),
    subtotal: Number(updated.subtotal),
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

  const existing = await prisma.purchaseReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.purchaseReturn.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "PurchaseReturn",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
