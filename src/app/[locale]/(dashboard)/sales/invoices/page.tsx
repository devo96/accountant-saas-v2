import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvoicesClient } from "./client";

export default async function SalesInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const raw = await prisma.salesInvoice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, lines: true },
  });
  const invoices = raw.map((i) => ({ ...i, subtotal: Number(i.subtotal), discountAmount: Number(i.discountAmount), taxAmount: Number(i.taxAmount), total: Number(i.total), paidAmount: Number(i.paidAmount), lines: i.lines.map((l) => ({ ...l, unitPrice: Number(l.unitPrice), lineTotal: Number(l.lineTotal) })) }));
  const customers = await prisma.customer.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true },
  });

  return <InvoicesClient invoices={invoices} customers={customers} />;
}
