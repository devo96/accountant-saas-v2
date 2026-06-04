import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSalesInvoices, createSalesInvoice } from "@/domains/sales";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = await getSalesInvoices(session.user.organizationId);
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const [org, customer] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.user.organizationId } }),
    prisma.customer.findUnique({ where: { id: body.customerId } }),
  ]);

  const invoice = await createSalesInvoice({
    organizationId: session.user.organizationId,
    createdById: session.user.id,
    status: body.status === "DRAFT" ? "DRAFT" : "CONFIRMED",
    customerId: body.customerId,
    customerName: customer?.name,
    sellerName: org?.name,
    sellerVatNumber: org?.taxNumber ?? undefined,
    invoiceDate: body.invoiceDate,
    dueDate: body.dueDate,
    referenceNumber: body.referenceNumber ?? null,
    description: body.description ?? null,
    paymentTermId: body.paymentTermId ?? null,
    branchId: body.branchId ?? null,
    subtotal: body.subtotal,
    discountAmount: body.discountAmount ?? 0,
    taxAmount: body.taxAmount,
    total: body.total,
    notes: body.notes || null,
    lines: body.lines,
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "SalesInvoice",
    entityId: invoice.id,
    newValue: { number: invoice.number, total: invoice.total },
  });

  return NextResponse.json(invoice);
}
