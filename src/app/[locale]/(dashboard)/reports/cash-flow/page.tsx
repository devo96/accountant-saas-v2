import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CashFlowClient } from "../client";

export default async function CashFlowPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const raw = await prisma.bankTransaction.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "asc" },
  });

  const monthly = new Map<string, { inflows: number; outflows: number }>();
  for (const t of raw) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthly.get(key) ?? { inflows: 0, outflows: 0 };
    existing.inflows += Number(t.debit);
    existing.outflows += Number(t.credit);
    monthly.set(key, existing);
  }

  const data = Array.from(monthly.entries()).map(([month, val]) => ({
    month,
    inflows: val.inflows,
    outflows: val.outflows,
    netCashFlow: val.inflows - val.outflows,
  }));

  return <CashFlowClient data={data} />;
}
