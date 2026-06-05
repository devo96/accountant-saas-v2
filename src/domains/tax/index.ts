import { prisma } from "@/lib/prisma";

export async function getTaxCodes(orgId: string) {
  const raw = await prisma.taxCode.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });
  return raw.map((t) => ({ ...t, rate: Number(t.rate) }));
}

export async function createTaxCode(orgId: string, data: { name: string; rate: number; isDefault?: boolean }) {
  if (data.isDefault) {
    await prisma.taxCode.updateMany({
      where: { organizationId: orgId, isDefault: true },
      data: { isDefault: false },
    });
  }
  return prisma.taxCode.create({
    data: { ...data, organizationId: orgId },
  });
}

export async function calculateTax(amount: number, taxCodeId: string) {
  const taxCode = await prisma.taxCode.findUnique({ where: { id: taxCodeId } });
  if (!taxCode) return { taxAmount: 0, rate: 0, total: amount };
  const rate = Number(taxCode.rate);
  const taxAmount = amount * rate / 100;
  return { taxAmount, rate, total: amount + taxAmount };
}
