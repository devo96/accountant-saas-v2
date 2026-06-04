import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSalesInvoice } from "@/domains/sales/invoice";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const quote = await prisma.salesQuote.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { customer: { select: { name: true, taxNumber: true } }, lines: true },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.status !== "ACCEPTED") return NextResponse.json({ error: "Quote must be ACCEPTED to convert" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });

  const invoice = await createSalesInvoice({
    organizationId: session.user.organizationId,
    createdById: session.user.id,
    status: "CONFIRMED",
    customerId: quote.customerId,
    customerName: quote.customer.name,
    customerVatNumber: quote.customer.taxNumber ?? undefined,
    sellerName: org?.name,
    sellerVatNumber: org?.taxNumber ?? undefined,
    invoiceDate: new Date().toISOString(),
    dueDate: null,
    subtotal: Number(quote.subtotal),
    discountAmount: Number(quote.discountAmount),
    taxAmount: Number(quote.taxAmount),
    total: Number(quote.total),
    notes: quote.notes,
    lines: quote.lines.map((l) => ({
      itemId: l.itemId ?? undefined,
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      discountPercent: Number(l.discountPercent),
      taxCodeId: l.taxCodeId ?? undefined,
      taxRate: Number(l.taxRate),
      lineTotal: Number(l.lineTotal),
    })),
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CONVERT",
    entity: "SalesQuote",
    entityId: id,
    newValue: { convertedToInvoiceId: invoice.id },
  });

  return NextResponse.json(invoice);
}
