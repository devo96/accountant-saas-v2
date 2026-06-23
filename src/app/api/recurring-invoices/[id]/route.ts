import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { RecurringInvoiceSchema } from "@/validations";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.recurringInvoiceTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const parsed = validatePartial(RecurringInvoiceSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const updated = await prisma.recurringInvoiceTemplate.update({
    where: { id },
    data: {
      name: d.name ?? undefined,
      customerId: d.customerId ?? undefined,
      frequency: d.frequency ?? undefined,
      interval: d.interval ?? undefined,
      nextRunDate: d.nextRunDate ? new Date(d.nextRunDate) : undefined,
      endDate: d.endDate ? new Date(d.endDate) : d.endDate === null ? null : undefined,
      invoiceDay: d.invoiceDay ?? undefined,
      dueDateDays: d.dueDateDays ?? undefined,
      lines: d.lines ?? undefined,
      subtotal: d.subtotal ?? undefined,
      discountAmount: d.discountAmount ?? undefined,
      taxAmount: d.taxAmount ?? undefined,
      total: d.total ?? undefined,
      notes: d.notes ?? undefined,
      active: d.active ?? undefined,
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
