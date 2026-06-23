"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Receipt, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/transitions";

type RecentInvoice = { id: string; number: number; invoiceDate: Date; customerName: string; total: number; status: string };
type RecentExpense = { id: string; number: number; date: Date; description: string; total: number };
type MonthlyData = { month: string; revenue: number; expenses: number };

interface ReportsDashboardProps {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: string;
  revenueThisMonth: number;
  expensesThisMonth: number;
  customersCount: number;
  vendorsCount: number;
  recentInvoices: RecentInvoice[];
  recentExpenses: RecentExpense[];
  monthlyData: MonthlyData[];
}

const reportLinks = [
  { key: "balanceSheet", href: "/reports/balance-sheet" },
  { key: "incomeStatement", href: "/reports/income-statement" },
  { key: "cashFlow", href: "/reports/cash-flow" },
  { key: "trialBalance", href: "/reports/trial-balance" },
  { key: "arAging", href: "/reports/ar-aging" },
  { key: "apAging", href: "/reports/ap-aging" },
  { key: "salesReport", href: "/reports/sales-report" },
  { key: "purchaseReport", href: "/reports/purchase-report" },
  { key: "expenseReport", href: "/reports/expense-report" },
  { key: "taxReport", href: "/reports/tax-report" },
  { key: "vatReturn", href: "/reports/vat-return" },
  { key: "inventoryReport", href: "/reports/inventory-report" },
  { key: "journalEntries", href: "/reports/journal-entries" },
  { key: "accountStatement", href: "/reports/account-statement" },
];

export function ReportsDashboard({
  totalIncome, totalExpenses, netProfit, profitMargin, revenueThisMonth, expensesThisMonth, customersCount, vendorsCount, recentInvoices, recentExpenses, monthlyData,
}: ReportsDashboardProps) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#2d2d3a" : "#e5e7eb";
  const textColor = isDark ? "#9ca3af" : "#6b7280";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  const kpiCards = [
    {
      label: t("salesReport"),
      value: revenueThisMonth,
      secondValue: totalIncome,
      sublabel: tc("total"),
      icon: TrendingUp,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.08)",
      change: "+12%",
      positive: true,
    },
    {
      label: t("expenses"),
      value: expensesThisMonth,
      secondValue: totalExpenses,
      sublabel: tc("total"),
      icon: TrendingDown,
      color: "#FD9A00",
      bg: "rgba(253,154,0,0.08)",
      change: "+8%",
      positive: false,
    },
    {
      label: t("netIncome"),
      value: netProfit,
      secondValue: parseFloat(profitMargin),
      sublabel: tc("margin"),
      icon: DollarSign,
      color: "#49CC6F",
      bg: "rgba(73,204,111,0.08)",
      change: `+${profitMargin}%`,
      positive: netProfit >= 0,
    },
    {
      label: tc("customers"),
      value: customersCount,
      secondValue: vendorsCount,
      sublabel: tc("vendors"),
      icon: Receipt,
      color: "#576487",
      bg: "rgba(87,100,135,0.08)",
      change: "",
      positive: true,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <FadeIn>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight">{tc("reports")}</h1>
          <p className="mt-1 text-muted-foreground">{t("asOf", { date: new Date().toLocaleDateString() })}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="rounded-full p-2" style={{ backgroundColor: kpi.bg }}>
                    <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{typeof kpi.value === "number" ? formatCurrency(kpi.value) : kpi.value}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{kpi.sublabel}: {typeof kpi.secondValue === "number" ? formatCurrency(kpi.secondValue) : kpi.secondValue}{kpi.change ? ` (${kpi.change})` : ""}</span>
                    {kpi.change ? (
                      kpi.positive
                        ? <ArrowUpRight className="h-3 w-3 text-green-500" />
                        : <ArrowDownRight className="h-3 w-3 text-red-500" />
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">{t("incomeStatement")}</CardTitle>
                <p className="text-xs text-muted-foreground">{t("forPeriod", { date: new Date().toLocaleDateString() })}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("income")}</span>
                    <span className="font-mono text-sm font-medium text-green-600 dark:text-green-500">{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("expenses")}</span>
                    <span className="font-mono text-sm font-medium text-red-600 dark:text-red-500">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{netProfit >= 0 ? t("netIncome") : t("netLoss")}</span>
                      <span className={`font-mono text-sm font-bold ${netProfit >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        {formatCurrency(Math.abs(netProfit))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t("totalExpenses")}: {formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
                <Link href="/reports/income-statement">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4 ms-1" /> {t("incomeStatement")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{tc("reports")} - 12 {tc("months")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: textColor }} />
                      <YAxis tick={{ fontSize: 11, fill: textColor }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name={t("income")} fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="expenses" name={t("expenses")} fill="#FD9A00" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t("salesReport")}</CardTitle>
                  <Link href="/reports/sales-report">
                    <Button variant="ghost" size="sm">{tc("viewAll")}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{inv.customerName}</p>
                        <p className="text-xs text-muted-foreground">#{String(inv.number).padStart(5, "0")} · {inv.invoiceDate.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium">{formatCurrency(inv.total)}</p>
                        <span className={`text-xs ${inv.status === "PAID" ? "text-green-600" : "text-yellow-600"}`}>{inv.status}</span>
                      </div>
                    </div>
                  ))}
                  {recentInvoices.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tc("noData")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{t("expenseReport")}</CardTitle>
                  <Link href="/reports/expense-report">
                    <Button variant="ghost" size="sm">{tc("viewAll")}</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentExpenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">#{String(exp.number).padStart(5, "0")} · {exp.date.toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm font-mono font-medium text-red-600">{formatCurrency(exp.total)}</p>
                    </div>
                  ))}
                  {recentExpenses.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tc("noData")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">{tc("reports")}</CardTitle>
              <p className="text-xs text-muted-foreground">{tc("allReports")}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {reportLinks.map((link) => (
                  <Link key={link.key} href={link.href}>
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{t(link.key as any)}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </FadeIn>
  );
}
