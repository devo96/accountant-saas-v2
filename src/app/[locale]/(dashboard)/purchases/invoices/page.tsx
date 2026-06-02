import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PurchaseInvoicesClient } from "./client";

export default async function PurchaseInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const invoices = (await prisma.purchaseInvoice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: true },
  })).map((i) => ({ ...i, subtotal: Number(i.subtotal), discountAmount: Number(i.discountAmount), taxAmount: Number(i.taxAmount), total: Number(i.total), paidAmount: Number(i.paidAmount) }));

  return <PurchaseInvoicesClient invoices={invoices} />;
}
