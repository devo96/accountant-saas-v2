import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JournalEntriesReport } from "../client";

export default async function JournalEntriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const raw = await prisma.journalEntry.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      lines: { include: { account: { select: { code: true, name: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  const entries = raw.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    lines: e.lines.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
  }));

  return <JournalEntriesReport entries={entries} />;
}
