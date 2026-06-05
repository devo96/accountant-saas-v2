import { prisma } from "@/lib/prisma";
import { AccountType, AccountNature } from "@prisma/client";

export async function getChartOfAccounts(organizationId: string) {
  return prisma.account.findMany({
    where: { organizationId },
    orderBy: { code: "asc" },
    include: { children: true },
  });
}

export async function createAccount(data: {
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  parentId?: string;
  organizationId: string;
  currencyId?: string;
}) {
  return prisma.account.create({ data });
}
