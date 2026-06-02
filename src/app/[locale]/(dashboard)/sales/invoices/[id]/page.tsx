import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalesInvoiceViewClient } from "./client";

export default async function SalesInvoiceViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.salesInvoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: true,
      lines: true,
      currency: true,
      createdBy: { select: { name: true } },
    },
  });
  if (!raw) redirect("/sales/invoices");

  const [customers, items, taxCodes] = await Promise.all([
    prisma.customer.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.taxCode.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  const invoice = {
    ...raw,
    subtotal: Number(raw.subtotal),
    discountAmount: Number(raw.discountAmount),
    taxAmount: Number(raw.taxAmount),
    total: Number(raw.total),
    paidAmount: Number(raw.paidAmount),
    lines: raw.lines.map((l) => ({
      ...l,
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
      discountPercent: Number(l.discountPercent),
      taxRate: Number(l.taxRate),
    })),
  };

  return (
    <SalesInvoiceViewClient
      invoice={invoice}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      items={items.map((i) => ({ id: i.id, name: i.name, sellingPrice: Number(i.sellingPrice), type: i.type }))}
      taxCodes={taxCodes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
    />
  );
}
