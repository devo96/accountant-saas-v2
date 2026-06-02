import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.recurringInvoiceTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.recurringInvoiceTemplate.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      customerId: body.customerId ?? undefined,
      frequency: body.frequency ?? undefined,
      interval: body.interval ?? undefined,
      nextRunDate: body.nextRunDate ? new Date(body.nextRunDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : body.endDate === null ? null : undefined,
      invoiceDay: body.invoiceDay ?? undefined,
      dueDateDays: body.dueDateDays ?? undefined,
      lines: body.lines ?? undefined,
      subtotal: body.subtotal ?? undefined,
      discountAmount: body.discountAmount ?? undefined,
      taxAmount: body.taxAmount ?? undefined,
      total: body.total ?? undefined,
      notes: body.notes ?? undefined,
      active: body.active ?? undefined,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "RecurringInvoiceTemplate",
    entityId: id,
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.recurringInvoiceTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringInvoiceTemplate.delete({ where: { id } });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "RecurringInvoiceTemplate",
    entityId: id,
    oldValue: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
