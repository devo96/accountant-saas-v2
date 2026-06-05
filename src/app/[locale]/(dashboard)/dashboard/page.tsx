import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./client";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");


  const orgId = session.user.organizationId;

  const [totalInvoices, totalPurchases, totalExpenses, customers, vendors, recentInvoices, recentPayments, allInvoices, allExpenses] =
    await Promise.all([
      prisma.salesInvoice.aggregate({ where: { organizationId: orgId, status: "PAID" }, _sum: { total: true } }),
      prisma.purchaseInvoice.aggregate({ where: { organizationId: orgId, status: "PAID" }, _sum: { total: true } }),
      prisma.expense.aggregate({ where: { organizationId: orgId }, _sum: { amount: true } }),
      prisma.customer.count({ where: { organizationId: orgId } }),
      prisma.vendor.count({ where: { organizationId: orgId } }),
      prisma.salesInvoice.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
      prisma.paymentReceipt.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.salesInvoice.findMany({
        where: { organizationId: orgId, status: "PAID" },
        select: { total: true, invoiceDate: true },
        orderBy: { invoiceDate: "asc" },
      }),
      prisma.expense.findMany({
        where: { organizationId: orgId },
        select: { amount: true, date: true },
        orderBy: { date: "asc" },
      }),
    ]);

  const revenue = Number(totalInvoices._sum.total ?? 0);
  const purchases = Number(totalPurchases._sum.total ?? 0);
  const expenses = Number(totalExpenses._sum.amount ?? 0);
  const totalCosts = purchases + expenses;
  const profit = revenue - totalCosts;
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue: Record<string, number> = {};
  const monthlyExpenses: Record<string, number> = {};
  for (const m of months) { monthlyRevenue[m] = 0; monthlyExpenses[m] = 0; }
  for (const inv of allInvoices) {
    const m = months[new Date(inv.invoiceDate).getMonth()];
    monthlyRevenue[m] = (monthlyRevenue[m] ?? 0) + Number(inv.total);
  }
  for (const exp of allExpenses) {
    const m = months[new Date(exp.date).getMonth()];
    monthlyExpenses[m] = (monthlyExpenses[m] ?? 0) + Number(exp.amount);
  }
  const monthlyData = months.map((month) => ({ month, revenue: monthlyRevenue[month], expenses: monthlyExpenses[month] }));

  const recentInvoicesData = recentInvoices.map((inv) => ({
    id: inv.id,
    number: String(inv.number).padStart(5, "0"),
    customerName: inv.customer?.name ?? "",
    total: Number(inv.total),
    status: inv.status,
  }));

  const recentPaymentsData = recentPayments.map((pmt) => ({
    id: pmt.id,
    number: String(pmt.number).padStart(5, "0"),
    amount: Number(pmt.amount),
    method: pmt.method,
  }));

  return (
    <DashboardClient
      locale={locale}
      revenue={revenue}
      purchases={purchases}
      expenses={expenses}
      totalCosts={totalCosts}
      profit={profit}
      profitMargin={profitMargin}
      customers={customers}
      vendors={vendors}
      recentInvoices={recentInvoicesData}
      recentPayments={recentPaymentsData}
      monthlyData={monthlyData}
    />
  );
}
