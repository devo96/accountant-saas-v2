"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package,
  ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft, Filter, Download,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";

type RecentInvoice = { id: string; number: string; customerName: string; total: number; status: string };
type RecentPayment = { id: string; number: string; amount: number; method: string };
type MonthlyData = { month: string; revenue: number; expenses: number };

interface DashboardClientProps {
  locale: string;
  revenue: number;
  purchases: number;
  expenses: number;
  totalCosts: number;
  profit: number;
  profitMargin: string;
  customers: number;
  vendors: number;
  recentInvoices: RecentInvoice[];
  recentPayments: RecentPayment[];
  monthlyData: MonthlyData[];
}

const barColors = ["#1D97E0", "#49CC6F", "#FD9A00", "#576487", "#0070F2", "#14293C"];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardClient({
  locale,
  revenue, totalCosts, profit, profitMargin, customers, vendors,
  recentInvoices, recentPayments, monthlyData,
}: DashboardClientProps) {
  const isRtl = locale === "ar";
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const fromDate = `${year - 1}-${month}-${day}`;
  const toDate = `${year}-${month}-${day}`;

  const months = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { month: "short" }).format(new Date(2024, i, 1))
  );
  const monthIndex = today.getMonth();

  const t = useTranslations("common");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  const stats = [
    {
      label: t("revenue"),
      value: revenue,
      currency: true,
      icon: TrendingUp,
      color: "#1D97E0",
      bg: "rgba(29,151,224,0.08)",
      change: "+12%",
      positive: true,
    },
    {
      label: t("expenses"),
      value: totalCosts,
      currency: true,
      icon: TrendingDown,
      color: "#FD9A00",
      bg: "rgba(253,154,0,0.08)",
      change: "+8%",
      positive: false,
    },
    {
      label: t("netProfit"),
      value: profit,
      currency: true,
      icon: DollarSign,
      color: "#49CC6F",
      bg: "rgba(73,204,111,0.08)",
      change: profit >= 0 ? `+${profitMargin}%` : `${profitMargin}%`,
      positive: profit >= 0,
    },
    {
      label: t("customers"),
      value: customers,
      icon: Users,
      color: "#576487",
      bg: "rgba(87,100,135,0.08)",
      change: `${vendors} ${t("vendors")}`,
      positive: true,
    },
  ];


  const gridColor = isDark ? "#2d2d3a" : "#e5e7eb";
  const textColor = isDark ? "#9ca3af" : "#6b7280";

  const chartMonths = months;
  const chartData = chartMonths.map((m, i) => ({
    month: m.length > 5 ? m.substring(0, 3) : m,
    revenue: monthlyData[i]?.revenue ?? 0,
    expenses: monthlyData[i]?.expenses ?? 0,
  }));

  return (
    <motion.div
      dir={isRtl ? "rtl" : "ltr"}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Breadcrumb */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="hover:text-[#1D97E0] cursor-pointer transition-colors">
          {t("home")}
        </span>
        <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {t("dashboard")}
        </span>
      </motion.div>

      {/* Header Row */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("dashboard")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{fromDate} - {toDate}</span>
            <span className="sm:hidden">{months[monthIndex]} {year}</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1D97E0] text-white rounded-lg hover:bg-[#1a87c9] transition-colors">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t("export")}</span>
          </button>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">{t("from")}</label>
          <input
            type="date"
            defaultValue={fromDate}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1D97E0]/20 focus:border-[#1D97E0]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">{t("to")}</label>
          <input
            type="date"
            defaultValue={toDate}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1D97E0]/20 focus:border-[#1D97E0]"
          />
        </div>
        <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
          <Filter className="h-3.5 w-3.5" />
          {t("filter")}
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.currency ? formatCurrency(stat.value) : stat.value.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                </p>
                <p className={cn(
                  "text-xs flex items-center gap-1",
                  stat.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                )}>
                  {stat.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change}
                </p>
              </div>
              <div
                className="rounded-lg p-2.5 flex-shrink-0"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart className="h-4 w-4 text-[#1D97E0]" />
              {t("vsExpenses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: textColor, fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: isDark ? "#252045" : "#f9fafb" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#1a1530" : "#fff",
                      border: `1px solid ${isDark ? "#2f2950" : "#e5e7eb"}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "13px",
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4, color: isDark ? "#e8e6f5" : "#111827" }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 8 }}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span style={{ color: textColor, fontSize: 13 }}>{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    name={t("revenue")}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expenses"
                    name={t("expenses")}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    animationBegin={200}
                  >
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={barColors[(i + 2) % barColors.length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Tables */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#1D97E0]" />
              {t("recentInvoices")}
            </CardTitle>
            <span className="text-xs text-gray-400 dark:text-gray-500">{recentInvoices.length}</span>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{t("noData")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#1D97E0]/10 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-3.5 w-3.5 text-[#1D97E0]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          INV-{inv.number}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {inv.customerName || (isRtl ? "غير محدد" : "Unnamed")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(inv.total)}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : inv.status === "OVERDUE"
                            ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      )}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-[#49CC6F]" />
              {t("recentPayments")}
            </CardTitle>
            <span className="text-xs text-gray-400 dark:text-gray-500">{recentPayments.length}</span>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{t("noData")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {recentPayments.map((pmt) => (
                  <div key={pmt.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#49CC6F]/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-3.5 w-3.5 text-[#49CC6F]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          PMT-{pmt.number}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {pmt.method}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                      {formatCurrency(pmt.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
