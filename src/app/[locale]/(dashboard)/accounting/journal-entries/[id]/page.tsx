import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JournalEntryViewClient } from "./client";

export default async function JournalEntryViewPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const { id } = await props.params;

  const raw = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      lines: { include: { account: true } },
      createdBy: { select: { name: true } },
      fiscalYear: { select: { name: true } },
    },
  });
  if (!raw) redirect("/accounting/journal-entries");

  const entry = {
    ...raw,
    lines: raw.lines.map((l) => ({
      ...l,
      debit: Number(l.debit),
      credit: Number(l.credit),
      account: { ...l.account, balance: Number(l.account.balance) },
    })),
  };

  return <JournalEntryViewClient entry={entry as unknown as typeof entry} />;
}
