import { prisma } from "@/lib/prisma";

export async function getVendors(organizationId: string) {
  return prisma.vendor.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createVendor(data: {
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  organizationId: string;
}) {
  return prisma.vendor.create({ data });
}
