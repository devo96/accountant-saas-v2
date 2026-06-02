import { prisma } from "@/lib/prisma";

export async function getBankAccounts(orgId: string) {
  const raw = await prisma.bankAccount.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });
  return raw.map((a) => ({ ...a, openingBalance: Number(a.openingBalance), currentBalance: Number(a.currentBalance) }));
}

export async function getBankTransactions(orgId: string, filters?: { bankAccountId?: string; fromDate?: Date; toDate?: Date }) {
  const where: Record<string, unknown> = { organizationId: orgId };
  if (filters?.bankAccountId) where.bankAccountId = filters.bankAccountId;
  if (filters?.fromDate || filters?.toDate) {
    where.date = {} as Record<string, Date>;
    if (filters?.fromDate) (where.date as Record<string, Date>).gte = filters.fromDate;
    if (filters?.toDate) (where.date as Record<string, Date>).lte = filters.toDate;
  }
  const raw = await prisma.bankTransaction.findMany({
    where: where as never,
    include: { bankAccount: true },
    orderBy: { date: "desc" },
  });
  return raw.map((t) => ({ ...t, debit: Number(t.debit), credit: Number(t.credit) }));
}

export async function createBankTransaction(orgId: string, data: { bankAccountId: string; date: Date; description: string; reference?: string; debit?: number; credit?: number }) {
  const tx = await prisma.bankTransaction.create({
    data: {
      bankAccountId: data.bankAccountId,
      date: data.date,
      description: data.description,
      reference: data.reference,
      debit: data.debit ?? 0,
      credit: data.credit ?? 0,
      organizationId: orgId,
    },
  });
  const ba = await prisma.bankAccount.update({
    where: { id: data.bankAccountId },
    data: { currentBalance: { increment: (data.debit ?? 0) - (data.credit ?? 0) } },
  });
  return { transaction: { ...tx, debit: Number(tx.debit), credit: Number(tx.credit) }, balance: Number(ba.currentBalance) };
}

export async function getReconciliations(orgId: string) {
  const raw = await prisma.bankReconciliation.findMany({
    where: { organizationId: orgId },
    include: { bankAccount: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return raw.map((r) => ({ ...r, openingBalance: Number(r.openingBalance), closingBalance: Number(r.closingBalance), difference: Number(r.difference) }));
}
