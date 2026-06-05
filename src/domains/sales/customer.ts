import { prisma } from "@/lib/prisma";

export async function getCustomers(organizationId: string) {
  return prisma.customer.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  organizationId: string;
}) {
  return prisma.customer.create({ data });
}
