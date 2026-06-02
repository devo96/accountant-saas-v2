"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import { Users, Building2, FileText, DollarSign, TrendingUp, TrendingDown, Wallet, Package, BookOpen, Settings, ShieldCheck, UserPlus, Activity, Download, ArrowUpRight, ArrowDownRight, AlertTriangle, Clock, CheckCircle, UserCheck } from "lucide-react";

type OwnerStats = {
  revenue: number; purchases: number; expenses: number; profit: number; totalCosts: number;
  invoiceCount: number; purchaseCount: number; quoteCount: number;
  customerCount: number; vendorCount: number; itemCount: number; employeeCount: number;
  journalCount: number; payRunCount: number;
  totalUsers: number; activeUsers: number;
  rolesDist: Record<string, number>;
  orgName: string;
};

type RecentLog = { id: string; action: string; entity: string; createdAt: Date; userId?: string };
type MonthlyTrend = { month: string; revenue: number; expenses: number; purchases: number };
type CustomerBalance = { id: string; name: string; balance: number; email: string | null };
type VendorBalance = { id: string; name: string; balance: number; email: string | null };
type TopCustomerRevenue = { customerId: string; name: string; total: number };
type OverdueInvoice = { id: string; number: number; total: number; paidAmount: number; dueDate: Date | null; status: string; customerName: string };
type UserActivityItem = { id: string; name: string; email: string; active: boolean; actionCount: number; lastActivity: Date | null };

export function OwnerDashboardClient({
  stats, recentLogs, users: _users, session: _session,
  monthlyTrends, topCustomersAR, topVendorsAP, topCustomersRevenue,
  overdueInvoices, userActivity, cashInflow, unpaidInvoiceCount,
}: {
  stats: OwnerStats; recentLogs: RecentLog[]; users: { id: string; name: string; email: string; role: string; active: boolean; createdAt: Date }[]; session: any;
  monthlyTrends: MonthlyTrend[]; topCustomersAR: CustomerBalance[]; topVendorsAP: VendorBalance[];
  topCustomersRevenue: TopCustomerRevenue[]; overdueInvoices: OverdueInvoice[];
  userActivity: UserActivityItem[]; cashInflow: number; unpaidInvoiceCount: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "#2f2950" : "#e5e7eb";
  const textColor = isDark ? "#a8a3c9" : "#6b7280";
  const router = useRouter();
  const [hoveredFin, setHoveredFin] = useState<number | null>(null);

  const financialData = [
    { name: "Revenue", value: stats.revenue, color: "#7259ff" },
    { name: "Purchases", value: stats.purchases, color: "#f59e0b" },
    { name: "Expenses", value: stats.expenses, color: "#ef4444" },
    { name: "Profit", value: stats.profit >= 0 ? stats.profit : 0, color: "#10b981" },
  ];

  const moduleData = [
    { name: "Invoices", value: stats.invoiceCount, color: "#7259ff" },
    { name: "Purchases", value: stats.purchaseCount, color: "#8b5cf6" },
    { name: "Quotes", value: stats.quoteCount, color: "#a78bfa" },
    { name: "Customers", value: stats.customerCount, color: "#f59e0b" },
    { name: "Vendors", value: stats.vendorCount, color: "#f97316" },
    { name: "Items", value: stats.itemCount, color: "#10b981" },
    { name: "Employees", value: stats.employeeCount, color: "#06b6d4" },
    { name: "Journals", value: stats.journalCount, color: "#ec4899" },
  ];

  const roleColors: Record<string, string> = { OWNER: "#7259ff", ADMIN: "#ef4444", ACCOUNTANT: "#f59e0b", VIEWER: "#10b981" };
  const rolePieData = Object.entries(stats.rolesDist).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v, color: roleColors[k] ?? "#6b7280" }));

  const cashOutflow = stats.expenses + stats.purchases;
  const cashNet = cashInflow - cashOutflow;
  const shortMonthLabels = monthlyTrends.map((m) => {
    const parts = m.month.split("-");
    return parts[1] + "/" + parts[0].slice(2);
  });

  const statusIcon: Record<string, React.ReactNode> = {
    CONFIRMED: <Clock className="h-3 w-3 text-amber-400" />,
    PARTIALLY_PAID: <AlertTriangle className="h-3 w-3 text-orange-400" />,
    PAID: <CheckCircle className="h-3 w-3 text-green-400" />,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-primary-50 dark:bg-primary-950"><DollarSign className="h-5 w-5 text-primary-600" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p><p className="text-lg font-bold">﷼ {stats.revenue.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-red-50 dark:bg-red-950"><TrendingDown className="h-5 w-5 text-red-500" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p><p className="text-lg font-bold">﷼ {stats.totalCosts.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-50 dark:bg-green-950"><TrendingUp className="h-5 w-5 text-green-500" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Net Profit</p><p className="text-lg font-bold">﷼ {stats.profit.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950"><Users className="h-5 w-5 text-amber-500" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Users</p><p className="text-lg font-bold">{stats.activeUsers}/{stats.totalUsers}</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Financial Overview</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={financialData} barCategoryGap="25%"><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} /><Tooltip cursor={{ fill: isDark ? "#252045" : "#f9fafb" }} contentStyle={{ backgroundColor: isDark ? "#1a1530" : "#fff", border: `1px solid ${gridColor}`, borderRadius: "8px", fontSize: "12px" }} /><Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={50} animationDuration={1000} onMouseLeave={() => setHoveredFin(null)}>{financialData.map((_, i) => (<Cell key={i} fill={financialData[i].color} opacity={hoveredFin !== null && hoveredFin !== i ? 0.35 : 1} onMouseEnter={() => setHoveredFin(i)} style={{ transition: "opacity 0.25s ease", cursor: "pointer" }} />))}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Monthly Trends (12 months)</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyTrends}><CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} tickFormatter={(v) => { const p = v.split("-"); return p[1] + "/" + p[0].slice(2); }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} /><Tooltip contentStyle={{ backgroundColor: isDark ? "#1a1530" : "#fff", border: `1px solid ${gridColor}`, borderRadius: "8px", fontSize: "12px" }} /><Line type="monotone" dataKey="revenue" stroke="#7259ff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#7259ff" }} name="Revenue" /><Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#ef4444" }} name="Expenses" /><Line type="monotone" dataKey="purchases" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#f59e0b" }} name="Purchases" /></LineChart></ResponsiveContainer></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Modules Volume</CardTitle></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={moduleData} layout="vertical" barCategoryGap="15%"><CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} width={80} /><Tooltip cursor={{ fill: isDark ? "#252045" : "#f9fafb" }} contentStyle={{ backgroundColor: isDark ? "#1a1530" : "#fff", border: `1px solid ${gridColor}`, borderRadius: "8px", fontSize: "12px" }} /><Bar dataKey="value" radius={[0, 10, 10, 0]} maxBarSize={28} animationDuration={1000} animationBegin={200}>{moduleData.map((_, i) => (<Cell key={i} fill={moduleData[i].color} opacity={0.85} />))}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Cash Flow</CardTitle></CardHeader><CardContent><div className="h-48 flex flex-col justify-center gap-3"><div className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-950/50"><div className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-green-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Money In</span></div><span className="text-sm font-bold text-green-600">﷼ {cashInflow.toLocaleString()}</span></div><div className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/50"><div className="flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-red-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Money Out</span></div><span className="text-sm font-bold text-red-600">﷼ {cashOutflow.toLocaleString()}</span></div><div className="flex items-center justify-between p-2 rounded-md bg-primary-50 dark:bg-primary-950/50"><div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Net Flow</span></div><span className={`text-sm font-bold ${cashNet >= 0 ? "text-green-600" : "text-red-600"}`}>﷼ {cashNet.toLocaleString()}</span></div><div className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-950/50"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Unpaid Invoices</span></div><span className="text-sm font-bold text-amber-600">{unpaidInvoiceCount}</span></div></div></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Users by Role</CardTitle></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rolePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" animationDuration={800}>{rolePieData.map((_, i) => (<Cell key={i} fill={rolePieData[i].color} stroke={isDark ? "#1a1530" : "#fff"} strokeWidth={2} />))}</Pie><Tooltip contentStyle={{ backgroundColor: isDark ? "#1a1530" : "#fff", border: `1px solid ${gridColor}`, borderRadius: "8px", fontSize: "12px" }} /><Legend iconType="circle" formatter={(v: string) => <span style={{ color: textColor, fontSize: 12 }}>{v}</span>} /></PieChart></ResponsiveContainer></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">AR Aging — Top Customers</CardTitle></CardHeader><CardContent className="space-y-1">{topCustomersAR.length === 0 ? <p className="text-xs text-gray-400">No outstanding balances</p> : topCustomersAR.map((c) => (<div key={c.id} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700"><div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{c.name}</p><p className="text-[10px] text-gray-400 truncate">{c.email ?? "—"}</p></div><span className="text-xs font-bold text-red-500">﷼ {c.balance.toLocaleString()}</span></div>))}</CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">AP Aging — Top Vendors</CardTitle></CardHeader><CardContent className="space-y-1">{topVendorsAP.length === 0 ? <p className="text-xs text-gray-400">No outstanding balances</p> : topVendorsAP.map((v) => (<div key={v.id} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700"><div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{v.name}</p><p className="text-[10px] text-gray-400 truncate">{v.email ?? "—"}</p></div><span className="text-xs font-bold text-amber-500">﷼ {v.balance.toLocaleString()}</span></div>))}</CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Top Customers by Revenue</CardTitle></CardHeader><CardContent className="space-y-1">{topCustomersRevenue.length === 0 ? <p className="text-xs text-gray-400">No data yet</p> : topCustomersRevenue.map((c, i) => (<div key={c.customerId} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700"><div className="flex items-center gap-2 min-w-0 flex-1"><span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${i === 0 ? "bg-yellow-400 text-black" : i === 1 ? "bg-gray-300 text-gray-600" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>{i + 1}</span><p className="text-xs font-medium truncate">{c.name}</p></div><span className="text-xs font-bold text-primary-600">﷼ {c.total.toLocaleString()}</span></div>))}</CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Overdue Invoices</CardTitle></CardHeader><CardContent className="space-y-1">{overdueInvoices.length === 0 ? <p className="text-xs text-gray-400">No unpaid invoices</p> : overdueInvoices.map((inv) => (<div key={inv.id} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700"><div className="flex items-center gap-2 min-w-0 flex-1">{statusIcon[inv.status] ?? <Clock className="h-3 w-3 text-gray-400" />}<div><p className="text-xs font-medium truncate">#{inv.number} — {inv.customerName}</p><p className="text-[10px] text-gray-400">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "No due date"} · {inv.status}</p></div></div><div className="text-right"><p className="text-xs font-bold">{inv.total.toLocaleString()}</p><p className="text-[10px] text-gray-400">due: ﷼ {(inv.total - inv.paidAmount).toLocaleString()}</p></div></div>))}</CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">User Activity</CardTitle></CardHeader><CardContent><div className="max-h-56 overflow-y-auto space-y-1">{userActivity.length === 0 ? <p className="text-xs text-gray-400">No users</p> : userActivity.map((u) => (<div key={u.id} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700"><div className="flex items-center gap-2 min-w-0 flex-1"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${u.active ? "bg-primary-100 dark:bg-primary-900 text-primary-700" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>{u.name.charAt(0).toUpperCase()}</div><div><p className="text-xs font-medium truncate">{u.name}</p><p className="text-[10px] text-gray-400 truncate">{u.email}</p></div></div><div className="text-right"><p className="text-[10px] font-medium">{u.actionCount} actions</p><p className="text-[10px] text-gray-400">{u.lastActivity ? new Date(u.lastActivity).toLocaleDateString() : "No activity"}</p></div></div>))}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader><CardContent className="space-y-2"><Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => router.push("/settings/users")}><UserPlus className="h-4 w-4" />Manage Users</Button><Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => router.push("/settings/organization")}><Building2 className="h-4 w-4" />Organization Settings</Button><Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => router.push("/settings/audit-logs")}><Activity className="h-4 w-4" />Audit Logs</Button><Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => router.push("/reports/trial-balance")}><FileText className="h-4 w-4" />Trial Balance</Button></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Download Reports</CardTitle></CardHeader><CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => window.open("/reports/income-statement", "_blank")}><Download className="h-4 w-4" />Income Statement</Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => window.open("/reports/balance-sheet", "_blank")}><Download className="h-4 w-4" />Balance Sheet</Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => window.open("/reports/cash-flow", "_blank")}><Download className="h-4 w-4" />Cash Flow Statement</Button>
          <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => window.open("/reports/trial-balance", "_blank")}><Download className="h-4 w-4" />Trial Balance</Button>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader><CardContent><div className="space-y-2 max-h-48 overflow-y-auto">{recentLogs.length === 0 ? <p className="text-xs text-gray-400">No recent activity</p> : recentLogs.map((log) => (<div key={log.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 dark:border-gray-700"><Activity className="h-3 w-3 text-gray-400 flex-shrink-0" /><div className="min-w-0"><p className="text-xs font-medium truncate">{log.action} <span className="text-gray-400">— {log.entity}</span></p><p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</p></div></div>))}</div></CardContent></Card>
      </div>
    </div>
  );
}
