import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewPurchaseInvoiceClient } from "./client";

export default async function NewPurchaseInvoicePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const orgId = session.user.organizationId;

  const [vendors, items, taxCodes, paymentTerms, branches] = await Promise.all([
    prisma.vendor.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.taxCode.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.paymentTerm.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <NewPurchaseInvoiceClient
      vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
      items={items.map((i) => ({ id: i.id, name: i.name, costPrice: Number(i.costPrice), type: i.type }))}
      taxCodes={taxCodes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
      paymentTerms={paymentTerms.map((p) => ({ id: p.id, name: p.name, dueDays: p.dueDays }))}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
    />
  );
}
