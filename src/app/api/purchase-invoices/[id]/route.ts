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
  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { vendor: true, lines: true, createdBy: { select: { name: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    lines: invoice.lines.map((l) => ({
      ...l,
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
      discountPercent: Number(l.discountPercent),
      taxRate: Number(l.taxRate),
    })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.purchaseInvoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.purchaseInvoiceLine.deleteMany({ where: { invoiceId: id } });

    return tx.purchaseInvoice.update({
      where: { id },
      data: {
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        vendorId: body.vendorId ?? undefined,
        subtotal: body.subtotal ?? undefined,
        discountAmount: body.discountAmount ?? 0,
        taxAmount: body.taxAmount ?? undefined,
        total: body.total ?? undefined,
        notes: body.notes ?? null,
        status: body.status ?? undefined,
        lines: {
          create: (body.lines ?? []).map((l: { itemId?: string; description: string; quantity: number; unitPrice: number; discountPercent?: number; taxCodeId?: string; taxRate?: number; lineTotal: number }) => ({
            itemId: l.itemId || null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent ?? 0,
            taxCodeId: l.taxCodeId || null,
            taxRate: l.taxRate ?? 0,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: { vendor: true, lines: true },
    });
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "PurchaseInvoice",
    entityId: invoice.id,
    oldValue: { number: existing.number, status: existing.status, total: Number(existing.total) },
    newValue: { number: invoice.number, status: invoice.status, total: Number(invoice.total) },
  });

  return NextResponse.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    lines: invoice.lines.map((l) => ({
      ...l,
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
    })),
  });
}
