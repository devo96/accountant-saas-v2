import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BankReconciliationClient } from "./client";

export default async function BankReconciliationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const orgId = session.user.organizationId;

  const [reconciliations, bankAccounts] = await Promise.all([
    prisma.bankReconciliation.findMany({
      where: { organizationId: orgId },
      include: { bankAccount: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bankAccount.findMany({
      where: { organizationId: orgId, active: true },
    }),
  ]);

  const data = reconciliations.map((r) => ({
    ...r,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    openingBalance: Number(r.openingBalance),
    closingBalance: Number(r.closingBalance),
    difference: Number(r.difference),
    bankAccount: {
      ...r.bankAccount,
      openingBalance: Number(r.bankAccount.openingBalance),
      currentBalance: Number(r.bankAccount.currentBalance),
    },
  }));

  return <BankReconciliationClient data={data} bankAccounts={bankAccounts.map((b) => ({ ...b, openingBalance: Number(b.openingBalance), currentBalance: Number(b.currentBalance) }))} />;
}
