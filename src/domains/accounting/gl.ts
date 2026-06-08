import { prisma } from "@/lib/prisma";

export async function syncJournalEntryBalances(journalEntryId: string, reverse = false): Promise<void> {
  const lines = await prisma.journalEntryLine.findMany({
    where: { journalEntryId },
    include: { account: true },
  });

  for (const line of lines) {
    const { account, debit, credit } = line;
    const delta = account.nature === "DEBIT"
      ? Number(debit) - Number(credit)
      : Number(credit) - Number(debit);
    const multiplier = reverse ? -1 : 1;

    await prisma.account.update({
      where: { id: account.id },
      data: { balance: { increment: delta * multiplier } },
    });
  }
}
