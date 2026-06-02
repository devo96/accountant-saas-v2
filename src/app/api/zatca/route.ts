import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { submitInvoice, generateInvoiceHash } from "@/lib/zatca";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId, type } = await req.json();
  if (!invoiceId || !type) {
    return NextResponse.json({ error: "invoiceId and type required" }, { status: 400 });
  }

  if (type !== "sales" && type !== "purchase") {
    return NextResponse.json({ error: "type must be 'sales' or 'purchase'" }, { status: 400 });
  }

  const modelName = type === "sales" ? "SalesInvoice" : "PurchaseInvoice";

  let invoice: { id: string; zatcaStatus: string; xmlInvoice: string | null; zatcaUuid: string | null; invoiceDate: Date } | null = null;

  if (type === "sales") {
    invoice = await prisma.salesInvoice.findFirst({
      where: { id: invoiceId, organizationId: session.user.organizationId },
      select: { id: true, zatcaStatus: true, xmlInvoice: true, zatcaUuid: true, invoiceDate: true },
    });
  } else {
    invoice = await prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, organizationId: session.user.organizationId },
      select: { id: true, zatcaStatus: true, xmlInvoice: true, zatcaUuid: true, invoiceDate: true },
    });
  }

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!invoice.xmlInvoice || !invoice.zatcaUuid) {
    return NextResponse.json({ error: "Invoice missing ZATCA data (xmlInvoice or zatcaUuid)" }, { status: 400 });
  }

  const settings = await prisma.organizationSetting.findMany({
    where: { organizationId: session.user.organizationId, key: { in: ["zatca_environment", "zatca_csid_id", "zatca_csid_secret", "zatca_certificate", "zatca_private_key", "zatca_public_key"] } },
  });

  const settingMap: Record<string, string> = {};
  for (const s of settings) settingMap[s.key] = s.value;

  if (!settingMap.zatca_csid_id || !settingMap.zatca_csid_secret) {
    return NextResponse.json({ error: "ZATCA credentials not configured. Go to Settings > ZATCA." }, { status: 400 });
  }

  const creds = {
    environment: (settingMap.zatca_environment as "sandbox" | "production") || "sandbox",
    csidId: settingMap.zatca_csid_id,
    csidSecret: settingMap.zatca_csid_secret,
    certificate: settingMap.zatca_certificate || "",
    privateKey: settingMap.zatca_private_key || "",
    publicKey: settingMap.zatca_public_key || "",
  };

  const invoiceHash = generateInvoiceHash(invoice.xmlInvoice);

  const result = await submitInvoice(creds, invoice.xmlInvoice, invoiceHash, invoice.zatcaUuid, "reporting");

  if (type === "sales") {
    await prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: { zatcaStatus: result.status, submissionUuid: result.submissionUuid ?? null },
    });
  } else {
    await prisma.purchaseInvoice.update({
      where: { id: invoiceId },
      data: { zatcaStatus: result.status, submissionUuid: result.submissionUuid ?? null },
    });
  }

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: result.status === "ACCEPTED" ? "SUBMIT_ZATCA" : "ZATCA_REJECTED",
    entity: modelName,
    entityId: invoiceId,
    newValue: { zatcaStatus: result.status, submissionUuid: result.submissionUuid },
    oldValue: { zatcaStatus: invoice.zatcaStatus },
  });

  return NextResponse.json({
    success: result.status === "ACCEPTED",
    zatcaStatus: result.status,
    submissionUuid: result.submissionUuid,
    rejectionReason: result.rejectionReason,
  });
}
