import { prisma } from "@/lib/prisma";

export async function getGeneralLedger(
  organizationId: string,
  accountId?: string,
  fromDate?: Date,
  toDate?: Date
) {
  const where: Record<string, unknown> = {
    journalEntry: { organizationId },
  };

  if (accountId) where.accountId = accountId;

  if (fromDate || toDate) {
    where.journalEntry = {
      ...(where.journalEntry as object),
      date: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
      },
    };
  }

  const lines = await prisma.journalEntryLine.findMany({
    where: where as any,
    include: {
      account: true,
      journalEntry: true,
    },
    orderBy: [{ journalEntry: { date: "asc" } }, { journalEntry: { number: "asc" } }],
  });

  return lines;
}
