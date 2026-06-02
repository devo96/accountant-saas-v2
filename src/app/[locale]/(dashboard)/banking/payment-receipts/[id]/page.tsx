import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PaymentReceiptDetailClient } from "./client";

export default async function PaymentReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.paymentReceipt.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      salesInvoice: { select: { number: true } },
      purchaseInvoice: { select: { number: true } },
    },
  });
  if (!raw) notFound();

  const paymentReceipt = {
    ...raw,
    amount: Number(raw.amount),
    date: raw.date.toISOString(),
    createdAt: raw.createdAt.toISOString(),
  } as unknown as {
    id: string; number: number; date: string; amount: number; method: string;
    reference: string | null; notes: string | null;
    salesInvoice: { number: number } | null;
    purchaseInvoice: { number: number } | null;
    organizationId: string; createdById: string; createdAt: string;
  };

  return <PaymentReceiptDetailClient paymentReceipt={paymentReceipt} />;
}
