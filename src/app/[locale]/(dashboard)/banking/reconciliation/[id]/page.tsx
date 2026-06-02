import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { BankReconciliationDetailClient } from "./client";

export default async function BankReconciliationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const { id } = await params;

  const raw = await prisma.bankReconciliation.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { bankAccount: true },
  });
  if (!raw) notFound();

  const bankReconciliation = {
    ...raw,
    startDate: raw.startDate.toISOString(),
    endDate: raw.endDate.toISOString(),
    openingBalance: Number(raw.openingBalance),
    closingBalance: Number(raw.closingBalance),
    difference: Number(raw.difference),
    createdAt: raw.createdAt.toISOString(),
    bankAccount: {
      ...raw.bankAccount,
      openingBalance: Number(raw.bankAccount.openingBalance),
      currentBalance: Number(raw.bankAccount.currentBalance),
    },
  } as unknown as {
    id: string; bankAccountId: string; startDate: string; endDate: string;
    openingBalance: number; closingBalance: number; difference: number;
    status: string; organizationId: string; createdById: string; createdAt: string;
    bankAccount: { id: string; name: string; bankName: string; openingBalance: number; currentBalance: number; };
  };

  return <BankReconciliationDetailClient bankReconciliation={bankReconciliation} />;
}
