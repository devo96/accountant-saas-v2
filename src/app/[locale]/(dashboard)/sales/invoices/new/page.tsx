import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewInvoiceClient } from "./client";

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const orgId = session.user.organizationId;

  const [customers, items, taxCodes, paymentTerms, branches] = await Promise.all([
    prisma.customer.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.taxCode.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.paymentTerm.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.branch.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <NewInvoiceClient
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      items={items.map((i) => ({ id: i.id, name: i.name, sellingPrice: Number(i.sellingPrice), type: i.type }))}
      taxCodes={taxCodes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
      paymentTerms={paymentTerms.map((p) => ({ id: p.id, name: p.name, dueDays: p.dueDays }))}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
    />
  );
}
