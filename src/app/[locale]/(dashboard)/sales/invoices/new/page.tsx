import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewInvoiceClient } from "./client";

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const [customers, items, taxCodes] = await Promise.all([
    prisma.customer.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.taxCode.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <NewInvoiceClient
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      items={items.map((i) => ({ id: i.id, name: i.name, sellingPrice: Number(i.sellingPrice), type: i.type }))}
      taxCodes={taxCodes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
    />
  );
}
