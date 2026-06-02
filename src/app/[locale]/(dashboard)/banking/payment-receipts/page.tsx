import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentReceiptsClient } from "./client";

export default async function PaymentReceiptsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawReceipts = await prisma.paymentReceipt.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      salesInvoice: { select: { number: true } },
      purchaseInvoice: { select: { number: true } },
    },
  });
  const receipts = rawReceipts.map((r) => ({ ...r, amount: Number(r.amount) }));
  const salesInvoices = await prisma.salesInvoice.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, number: true },
    orderBy: { number: "desc" },
  });
  const purchaseInvoices = await prisma.purchaseInvoice.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, number: true },
    orderBy: { number: "desc" },
  });

  return <PaymentReceiptsClient receipts={receipts} salesInvoices={salesInvoices} purchaseInvoices={purchaseInvoices} />;
}
