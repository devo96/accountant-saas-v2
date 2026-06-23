import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSalesInvoices, createSalesInvoice } from "@/domains/sales";
import { postSalesInvoice } from "@/domains/accounting/posting";
import { checkPlanLimit } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { validate } from "@/lib/validate";
import { SalesInvoiceSchema } from "@/validations";

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

  const parsed = validate(SalesInvoiceSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const limit = await checkPlanLimit(session.user.organizationId, "invoices");
  if (limit.limited) return limit.error;

  const [org, customer] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.user.organizationId } }),
    prisma.customer.findUnique({ where: { id: d.customerId } }),
  ]);

  const invoice = await createSalesInvoice({
    organizationId: session.user.organizationId,
    createdById: session.user.id,
    status: d.status === "DRAFT" ? "DRAFT" : "CONFIRMED",
    customerId: d.customerId,
    customerName: customer?.name,
    sellerName: org?.name,
    sellerVatNumber: org?.taxNumber ?? undefined,
    invoiceDate: d.invoiceDate,
    dueDate: d.dueDate,
    referenceNumber: d.referenceNumber ?? null,
    description: d.description ?? null,
    paymentTermId: d.paymentTermId ?? null,
    branchId: d.branchId ?? null,
    projectId: d.projectId ?? null,
    subtotal: d.subtotal,
    discountAmount: d.discountAmount ?? 0,
    taxAmount: d.taxAmount,
    total: d.total,
    notes: d.notes || null,
    lines: d.lines,
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "SalesInvoice",
    entityId: invoice.id,
    newValue: { number: invoice.number, total: invoice.total },
  });

  // Auto-post a confirmed invoice to the general ledger.
  let postingError: string | null = null;
  if (invoice.status === "CONFIRMED") {
    try {
      await postSalesInvoice(session.user.organizationId, session.user.id, invoice.id);
    } catch (e) {
      postingError = (e as Error).message;
      logger.error({ invoiceId: invoice.id, err: postingError }, "Sales invoice auto-post failed");
    }
  }

  return NextResponse.json({ ...invoice, postingError });
}
