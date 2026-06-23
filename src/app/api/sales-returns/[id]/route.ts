import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { SalesReturnSchema } from "@/validations";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.salesReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: { select: { name: true } },
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

  const parsed = validatePartial(SalesReturnSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.salesReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.salesReturn.update({
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
    entity: "SalesReturn",
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

  const existing = await prisma.salesReturn.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.salesReturn.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "SalesReturn",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
