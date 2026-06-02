import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewPurchaseInvoiceClient } from "./client";

export default async function NewPurchaseInvoicePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const [vendors, items, taxCodes] = await Promise.all([
    prisma.vendor.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.taxCode.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <NewPurchaseInvoiceClient
      vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
      items={items.map((i) => ({ id: i.id, name: i.name, costPrice: Number(i.costPrice), type: i.type }))}
      taxCodes={taxCodes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
    />
  );
}
