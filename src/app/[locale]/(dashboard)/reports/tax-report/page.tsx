import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TaxReportClient } from "../client";

export default async function TaxReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  const orgId = session.user.organizationId;

  const [rawSalesLines, rawPurchaseLines, rawExpenseLines] = await Promise.all([
    prisma.salesInvoiceLine.findMany({
      where: { invoice: { organizationId: orgId, status: { in: ["CONFIRMED", "PAID"] } }, taxCodeId: { not: null } },
      include: { taxCode: true },
    }),
    prisma.purchaseInvoiceLine.findMany({
      where: { invoice: { organizationId: orgId, status: { in: ["CONFIRMED", "PAID"] } }, taxCodeId: { not: null } },
      include: { taxCode: true },
    }),
    prisma.expenseLine.findMany({
      where: { expense: { organizationId: orgId }, taxCodeId: { not: null } },
      include: { taxCode: true },
    }),
  ]);

  const taxEntries: { taxCodeId: string; taxCodeName: string; rate: number; taxableAmount: number; taxAmount: number }[] = [];

  for (const l of rawSalesLines) {
    const rate = Number(l.taxRate);
    const taxable = Number(l.lineTotal);
    taxEntries.push({ taxCodeId: l.taxCodeId!, taxCodeName: l.taxCode?.name ?? "", rate, taxableAmount: taxable, taxAmount: taxable * rate / 100 });
  }
  for (const l of rawPurchaseLines) {
    const rate = Number(l.taxRate);
    const taxable = Number(l.lineTotal);
    taxEntries.push({ taxCodeId: l.taxCodeId!, taxCodeName: l.taxCode?.name ?? "", rate, taxableAmount: taxable, taxAmount: taxable * rate / 100 });
  }
  for (const l of rawExpenseLines) {
    taxEntries.push({ taxCodeId: l.taxCodeId!, taxCodeName: l.taxCode?.name ?? "", rate: Number(l.taxRate), taxableAmount: Number(l.amount), taxAmount: Number(l.taxAmount) });
  }

  const grouped = new Map<string, { taxCodeName: string; rate: number; taxableAmount: number; taxAmount: number }>();
  for (const e of taxEntries) {
    const key = e.taxCodeId;
    const existing = grouped.get(key);
    if (existing) {
      existing.taxableAmount += e.taxableAmount;
      existing.taxAmount += e.taxAmount;
    } else {
      grouped.set(key, { taxCodeName: e.taxCodeName, rate: e.rate, taxableAmount: e.taxableAmount, taxAmount: e.taxAmount });
    }
  }

  const data = Array.from(grouped.entries()).map(([id, val]) => ({ taxCodeId: id, ...val }));

  return <TaxReportClient data={data} />;
}
