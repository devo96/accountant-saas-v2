import { prisma } from "@/lib/prisma";
import type { TxOrPrisma } from "./types";

export async function syncJournalEntryBalances(journalEntryId: string, reverse = false, tx?: TxOrPrisma): Promise<void> {
  const client = tx ?? prisma;
  const lines = await client.journalEntryLine.findMany({
    where: { journalEntryId },
    include: { account: true },
  });

  for (const line of lines) {
    const { account, debit, credit } = line;
    const delta = account.nature === "DEBIT"
      ? Number(debit) - Number(credit)
      : Number(credit) - Number(debit);
    const multiplier = reverse ? -1 : 1;

    await client.account.update({
      where: { id: account.id },
      data: { balance: { increment: delta * multiplier } },
    });
  }
}
