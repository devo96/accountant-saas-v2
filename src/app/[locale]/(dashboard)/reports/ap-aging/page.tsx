import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APAgingClient } from "../client";

export default async function APAgingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const raw = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      purchaseInvoices: {
        where: { status: { in: ["CONFIRMED", "PAID", "PARTIALLY_PAID"] } },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const vendors = raw.map((v) => {
    const buckets = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0 };
    for (const inv of v.purchaseInvoices) {
      const outstanding = Number(inv.total) - Number(inv.paidAmount);
      if (outstanding <= 0) continue;
      const daysSinceInvoice = Math.floor((now.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceInvoice <= 30) buckets.current += outstanding;
      else if (daysSinceInvoice <= 60) buckets.days1_30 += outstanding;
      else if (daysSinceInvoice <= 90) buckets.days31_60 += outstanding;
      else if (daysSinceInvoice <= 120) buckets.days61_90 += outstanding;
      else buckets.days90Plus += outstanding;
    }
    const total = buckets.current + buckets.days1_30 + buckets.days31_60 + buckets.days61_90 + buckets.days90Plus;
    return { id: v.id, name: v.name, total, ...buckets };
  });

  return <APAgingClient vendors={vendors} />;
}
