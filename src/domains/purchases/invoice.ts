import { prisma } from "@/lib/prisma";
import { generateZatcaUuid, generateInvoiceHash, generateInvoiceXml, generateZatcaQrBase64 } from "@/lib/zatca";

export async function getPurchaseInvoices(organizationId: string) {
  return prisma.purchaseInvoice.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: true, lines: true },
  });
}

export async function createPurchaseInvoice(data: {
  organizationId: string;
  createdById: string;
  vendorId: string;
  vendorName?: string;
  vendorVatNumber?: string;
  sellerName?: string;
  sellerVatNumber?: string;
  invoiceDate: string;
  dueDate?: string | null;
  subtotal: number;
  discountAmount?: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  notes?: string | null;
  lines: {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxCodeId?: string;
    taxRate?: number;
    lineTotal: number;
  }[];
}) {
  const last = await prisma.purchaseInvoice.findFirst({
    where: { organizationId: data.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const nextNumber = (last?.number ?? 0) + 1;
  const zatcaUuid = generateZatcaUuid();
  const invoiceDate = new Date(data.invoiceDate);

  const xml = generateInvoiceXml({
    uuid: zatcaUuid,
    number: nextNumber,
    issueDate: invoiceDate.toISOString().split("T")[0],
    sellerName: data.sellerName ?? "",
    vatNumber: data.sellerVatNumber ?? "",
    buyerName: data.vendorName ?? "",
    buyerVatNumber: data.vendorVatNumber,
    lines: data.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate ?? 0,
      lineTotal: l.lineTotal,
    })),
    totalExcludingVat: data.subtotal - (data.discountAmount ?? 0),
    totalVat: data.taxAmount,
    totalWithVat: data.total,
  });

  const invoiceHash = generateInvoiceHash(xml);
  const qrBase64 = generateZatcaQrBase64({
    sellerName: data.sellerName ?? "",
    vatNumber: data.sellerVatNumber ?? "",
    timestamp: invoiceDate,
    totalWithVat: data.total,
    vatTotal: data.taxAmount,
  });

  return prisma.purchaseInvoice.create({
    data: {
      number: nextNumber,
      invoiceDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "CONFIRMED",
      vendorId: data.vendorId,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount ?? 0,
      taxAmount: data.taxAmount,
      total: data.total,
      paidAmount: data.paidAmount ?? 0,
      notes: data.notes || null,
      organizationId: data.organizationId,
      createdById: data.createdById,
      zatcaUuid,
      zatcaQr: qrBase64,
      invoiceHash,
      xmlInvoice: xml,
      lines: {
        create: data.lines.map((l) => ({
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
    include: { lines: true, vendor: true },
  });
}
