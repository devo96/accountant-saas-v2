import { prisma } from "@/lib/prisma";

export async function getOrganization(orgId: string) {
  return prisma.organization.findUnique({ where: { id: orgId } });
}

export async function updateOrganization(orgId: string, data: { name?: string; email?: string; phone?: string; address?: string; logo?: string; taxNumber?: string; commercialReg?: string; fiscalYearStart?: number }) {
  return prisma.organization.update({
    where: { id: orgId },
    data,
  });
}

export async function getUsers(orgId: string) {
  return prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { name: "asc" },
  });
}

export async function getCurrencies(orgId: string) {
  const raw = await prisma.currency.findMany({
    where: { organizationId: orgId },
    orderBy: { code: "asc" },
  });
  return raw.map((c) => ({ ...c, exchangeRate: Number(c.exchangeRate) }));
}
