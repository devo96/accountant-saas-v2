import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JournalEntriesClient } from "./client";

export default async function JournalEntriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const rawEntries = await prisma.journalEntry.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { lines: { include: { account: true } }, createdBy: { select: { name: true } } },
  });
  const entries = rawEntries.map((e) => ({
    ...e,
    lines: e.lines.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit), account: { ...l.account, balance: Number(l.account.balance) } })),
  }));
  const accounts = (await prisma.account.findMany({
    where: { organizationId: session.user.organizationId, isMaster: false },
    select: { id: true, code: true, name: true, nameAr: true },
  }));
  const fiscalYears = await prisma.fiscalYear.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true },
    orderBy: { startDate: "desc" },
  });

  return <JournalEntriesClient entries={entries} accounts={accounts} fiscalYears={fiscalYears} />;
}
