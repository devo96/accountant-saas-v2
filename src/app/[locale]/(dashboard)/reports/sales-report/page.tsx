import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalesReportClient } from "../client";

export default async function SalesReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const raw = await prisma.salesInvoice.findMany({
    where: { organizationId: session.user.organizationId, status: { in: ["CONFIRMED", "PAID"] } },
    include: { customer: true },
    orderBy: { invoiceDate: "desc" },
  });

  const invoices = raw.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    discountAmount: Number(inv.discountAmount),
    taxAmount: Number(inv.taxAmount),
    total: Number(inv.total),
    paidAmount: Number(inv.paidAmount),
  }));

  return <SalesReportClient invoices={invoices} />;
}
