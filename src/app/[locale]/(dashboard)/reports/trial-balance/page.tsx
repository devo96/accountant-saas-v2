import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "../client";

export default async function TrialBalancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawAccounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { code: "asc" },
  });
  const accounts = rawAccounts.map((a) => ({ ...a, balance: Number(a.balance) }));

  const rawEntries = await prisma.journalEntry.findMany({
    where: { organizationId: session.user.organizationId, status: "POSTED" },
    include: { lines: true },
  });
  const entries = rawEntries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })) }));

  const balances = accounts.map((account) => {
    const totalDebit = entries.reduce((s, e) => s + e.lines.filter((l) => l.accountId === account.id).reduce((ls, l) => ls + l.debit, 0), 0);
    const totalCredit = entries.reduce((s, e) => s + e.lines.filter((l) => l.accountId === account.id).reduce((ls, l) => ls + l.credit, 0), 0);
    const balance = account.nature === "DEBIT" ? account.balance + totalDebit - totalCredit : account.balance + totalCredit - totalDebit;
    return { ...account, calculatedBalance: balance };
  });

  return <ReportsClient accounts={balances} type="trial-balance" />;
}
