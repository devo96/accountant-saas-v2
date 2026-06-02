import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DashboardCharts } from "./client";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
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

  const latestMonth = months[new Date().getMonth()];
  const prevMonthIdx = new Date().getMonth() - 1;
  const prevMonth = prevMonthIdx >= 0 ? months[prevMonthIdx] : months[11];
  const revChange = monthlyRevenue[prevMonth] > 0 ? ((monthlyRevenue[latestMonth] - monthlyRevenue[prevMonth]) / monthlyRevenue[prevMonth] * 100).toFixed(0) : "+0";

  const stats = [
    { title: t("revenue"), value: `﷼ ${revenue.toLocaleString()}`, icon: TrendingUp, color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800", change: `${revChange}%` },
    { title: t("expenses"), value: `﷼ ${totalCosts.toLocaleString()}`, icon: TrendingDown, color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800", change: "+5%" },
    { title: t("netProfit"), value: `﷼ ${profit.toLocaleString()}`, icon: DollarSign, color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800", change: profit >= 0 ? "+8%" : "-" },
    { title: t("activeCustomers"), value: `${customers.toLocaleString()}`, icon: Wallet, color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800", change: t("vendorsText", { count: vendors }) },
  ];

  return (
    <FadeIn>
      <div className="space-y-4">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-xl font-bold mt-0.5 dark:text-gray-400">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-400">{stat.change}</p>
                </div>
                <div className={`p-2 rounded-md ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts monthlyData={monthlyData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("recentInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-gray-500 text-xs dark:text-gray-400">{t("noInvoices")}</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium">INV-{String(inv.number).padStart(5, "0")}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{inv.customer?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">﷼ {Number(inv.total).toLocaleString()}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("recentPayments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-gray-500 text-xs dark:text-gray-400">{t("noPayments")}</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((pmt) => (
                  <div key={pmt.id} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium">PMT-{String(pmt.number).padStart(5, "0")}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{pmt.method}</p>
                    </div>
                    <span className="text-sm font-medium">﷼ {Number(pmt.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </FadeIn>
  );
}
