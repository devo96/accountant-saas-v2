"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { TrendingUp, Calendar, Percent, Activity, BarChart3 } from "lucide-react"; import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"; import { formatCurrency } from "@/lib/utils";
type ChartData = { month: string; revenue: number };
export function OwnerOverviewClient({ totalOrgs, totalUsers, mrr, arr, churnRate, liveOps, activeOrgs, trialingOrgs, expiredOrgs, cancelledOrgs, orgsThisMonth, newUsersThisMonth, unassignedOrgs, chartData }: {
  totalOrgs: number; totalUsers: number; mrr: number; arr: number; churnRate: string; liveOps: { journals: number; invoices: number };
  activeOrgs: number; trialingOrgs: number; expiredOrgs: number; cancelledOrgs: number; orgsThisMonth: number; newUsersThisMonth: number; unassignedOrgs: number; chartData: ChartData[];
}) {
  const t = useTranslations("ownerPanel");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-50"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-gray-500">{t("mrr")}</p><p className="text-lg font-bold">{formatCurrency(mrr)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-primary-50"><Calendar className="h-5 w-5 text-primary-600" /></div><div><p className="text-xs text-gray-500">{t("arr")}</p><p className="text-lg font-bold">{formatCurrency(arr)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-red-50"><Percent className="h-5 w-5 text-red-500" /></div><div><p className="text-xs text-gray-500">{t("churnRate")}</p><p className="text-lg font-bold">{churnRate}%</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-purple-50"><Activity className="h-5 w-5 text-purple-500" /></div><div><p className="text-xs text-gray-500">{t("liveOps")}</p><p className="text-lg font-bold">{liveOps.journals + liveOps.invoices}</p></div></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("active")}</span><span className="text-sm font-bold text-green-600">{activeOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("trialing")}</span><span className="text-sm font-bold text-primary-600">{trialingOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("expired")}</span><span className="text-sm font-bold text-red-600">{expiredOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("cancelled")}</span><span className="text-sm font-bold text-gray-600">{cancelledOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("newOrgsMonth")}</span><span className="text-sm font-bold">{orgsThisMonth}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("newUsersMonth")}</span><span className="text-sm font-bold">{newUsersThisMonth}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("totalOrgs")}</span><span className="text-sm font-bold">{totalOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">{t("unassigned")}</span><span className="text-sm font-bold text-amber-600">{unassignedOrgs}</span></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 mb-1">{t("totalUsers")}</p><p className="text-lg font-bold">{totalUsers}</p></div></CardContent></Card>
        <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 mb-1">{t("liveOpsDetail")}</p><p className="text-sm font-bold">{liveOps.invoices} {t("invoicesCount")} / {liveOps.journals} {t("journalsCount")}</p></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm"><BarChart3 className="h-4 w-4 inline-block mr-1" />{t("monthlyRevenue")}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
