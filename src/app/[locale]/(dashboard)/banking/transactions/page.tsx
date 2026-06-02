import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BankTransactionsClient } from "./client";

export default async function BankTransactionsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;

  const [transactions, bankAccounts] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: { organizationId: orgId },
      include: { bankAccount: true },
      orderBy: { date: "desc" },
    }),
    prisma.bankAccount.findMany({
      where: { organizationId: orgId, active: true },
    }),
  ]);

  const data = transactions.map((t) => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    debit: Number(t.debit),
    credit: Number(t.credit),
    bankAccount: {
      ...t.bankAccount,
      openingBalance: Number(t.bankAccount.openingBalance),
      currentBalance: Number(t.bankAccount.currentBalance),
    },
  }));

  return <BankTransactionsClient data={data} bankAccounts={bankAccounts.map((b) => ({ ...b, openingBalance: Number(b.openingBalance), currentBalance: Number(b.currentBalance) }))} />;
}
