import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { generateZatcaUuid, generateInvoiceHash, generateInvoiceXml, generateZatcaQrBase64 } from "@/lib/zatca";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const template = await prisma.recurringInvoiceTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = await prisma.customer.findUnique({ where: { id: template.customerId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });

  const last = await prisma.salesInvoice.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const nextNumber = (last?.number ?? 0) + 1;

  const lines = (template.lines as any[]) ?? [];
  const zatcaUuid = generateZatcaUuid();
  const invoiceDate = new Date();
  const xml = generateInvoiceXml({
    uuid: zatcaUuid,
    number: nextNumber,
    issueDate: invoiceDate.toISOString().split("T")[0],
    sellerName: org?.name ?? "",
    vatNumber: org?.taxNumber ?? "",
    buyerName: customer.name,
    buyerVatNumber: customer.taxNumber ?? undefined,
    lines: lines.map((l: any) => ({
      description: l.description ?? "",
      quantity: l.quantity ?? 1,
      unitPrice: l.unitPrice ?? 0,
      taxRate: l.taxRate ?? 0,
      lineTotal: l.lineTotal ?? 0,
    })),
    totalExcludingVat: Number(template.subtotal) - Number(template.discountAmount),
    totalVat: Number(template.taxAmount),
    totalWithVat: Number(template.total),
  });
  const invoiceHash = generateInvoiceHash(xml);
  const qrBase64 = generateZatcaQrBase64({
    sellerName: org?.name ?? "",
    vatNumber: org?.taxNumber ?? "",
    timestamp: invoiceDate,
    totalWithVat: Number(template.total),
    vatTotal: Number(template.taxAmount),
  });

  const invoice = await prisma.salesInvoice.create({
    data: {
      number: nextNumber,
      invoiceDate,
      dueDate: new Date(Date.now() + (template.dueDateDays ?? 30) * 86400000),
      status: "CONFIRMED",
      customerId: template.customerId,
      subtotal: template.subtotal,
      discountAmount: template.discountAmount,
      taxAmount: template.taxAmount,
      total: template.total,
      paidAmount: 0,
      notes: `Generated from recurring template: ${template.name}`,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
      zatcaUuid,
      zatcaQr: qrBase64,
      invoiceHash,
      xmlInvoice: xml,
    },
  });

  const nextRun = new Date(template.nextRunDate);
  switch (template.frequency) {
    case "DAILY": nextRun.setDate(nextRun.getDate() + template.interval); break;
    case "WEEKLY": nextRun.setDate(nextRun.getDate() + 7 * template.interval); break;
    case "MONTHLY": nextRun.setMonth(nextRun.getMonth() + template.interval); break;
    case "QUARTERLY": nextRun.setMonth(nextRun.getMonth() + 3 * template.interval); break;
    case "YEARLY": nextRun.setFullYear(nextRun.getFullYear() + template.interval); break;
  }

  const reachedEnd = template.endDate && nextRun > template.endDate;

  await prisma.recurringInvoiceTemplate.update({
    where: { id },
    data: {
      lastRunDate: new Date(),
      nextRunDate: nextRun,
      active: reachedEnd ? false : true,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "GENERATE_RECURRING",
    entity: "SalesInvoice",
    entityId: invoice.id,
    newValue: { templateName: template.name, invoiceNumber: invoice.number },
  });

  return NextResponse.json({ invoice, nextRunDate: nextRun, active: !reachedEnd });
}
