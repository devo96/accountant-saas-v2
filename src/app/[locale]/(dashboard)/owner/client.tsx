"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Building2, Users, DollarSign, Package, Crown, CheckCircle, Clock, XCircle, PauseCircle, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

type OrganizationInfo = {
  id: string; name: string; email: string; createdAt: Date;
  userCount: number;
  plan: { id: string; name: string; tier: string; status: string } | null;
};

type PlanInfo = {
  id: string; name: string; tier: string; monthlyPrice: number;
  maxUsers: number; maxInvoices: number; active: boolean;
};

export function OwnerDashboardClient({
  totalOrgs, totalUsers, totalRevenue, plans, activeOrgs, trialingOrgs, expiredOrgs, orgs,
}: {
  totalOrgs: number; totalUsers: number; totalRevenue: number;
  plans: PlanInfo[]; activeOrgs: number; trialingOrgs: number; expiredOrgs: number;
  orgs: OrganizationInfo[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"orgs" | "plans">("orgs");

  const tierColors: Record<string, string> = {
    FREE: "text-gray-500 bg-gray-100 dark:bg-gray-800",
    STARTER: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    PROFESSIONAL: "text-purple-600 bg-purple-50 dark:bg-purple-950",
    ENTERPRISE: "text-amber-600 bg-amber-50 dark:bg-amber-950",
  };
  const statusIcon: Record<string, { icon: React.ReactNode; color: string }> = {
    ACTIVE: { icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600 bg-green-50 dark:bg-green-950" },
    TRIALING: { icon: <Clock className="h-3 w-3" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    EXPIRED: { icon: <XCircle className="h-3 w-3" />, color: "text-red-600 bg-red-50 dark:bg-red-950" },
    CANCELLED: { icon: <XCircle className="h-3 w-3" />, color: "text-gray-500 bg-gray-100 dark:bg-gray-800" },
    PAUSED: { icon: <PauseCircle className="h-3 w-3" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  };

  const orgsWithPlan = orgs.filter((o) => o.plan);
  const unassignedOrgs = orgs.filter((o) => !o.plan);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-primary-50 dark:bg-primary-950"><Building2 className="h-5 w-5 text-primary-600" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Total Organizations</p><p className="text-lg font-bold">{totalOrgs}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950"><Users className="h-5 w-5 text-blue-500" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p><p className="text-lg font-bold">{totalUsers}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-50 dark:bg-green-950"><DollarSign className="h-5 w-5 text-green-500" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p><p className="text-lg font-bold">﷼ {totalRevenue.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950"><Package className="h-5 w-5 text-amber-500" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Plans</p><p className="text-lg font-bold">{plans.length}</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500 dark:text-gray-400">Active</span><span className="text-sm font-bold text-green-600">{activeOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500 dark:text-gray-400">Trialing</span><span className="text-sm font-bold text-blue-600">{trialingOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500 dark:text-gray-400">Expired</span><span className="text-sm font-bold text-red-600">{expiredOrgs}</span></CardContent></Card>
        <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500 dark:text-gray-400">Unassigned</span><span className="text-sm font-bold text-gray-600">{unassignedOrgs.length}</span></CardContent></Card>
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        <Button variant={tab === "orgs" ? "default" : "ghost"} size="sm" onClick={() => setTab("orgs")}><Building2 className="h-4 w-4 mr-1" />Organizations</Button>
        <Button variant={tab === "plans" ? "default" : "ghost"} size="sm" onClick={() => setTab("plans")}><Package className="h-4 w-4 mr-1" />Plans</Button>
        <Button variant="ghost" size="sm" onClick={() => router.push("/settings/users")}><Users className="h-4 w-4 mr-1" />All Users</Button>
      </div>

      {tab === "orgs" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Organizations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b dark:border-gray-700 text-left"><th className="p-3 font-medium text-gray-500">Name</th><th className="p-3 font-medium text-gray-500">Email</th><th className="p-3 font-medium text-gray-500">Users</th><th className="p-3 font-medium text-gray-500">Plan</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Created</th></tr></thead>
                <tbody>{orgs.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">No organizations found</td></tr> : orgs.map((org) => {
                  const st = org.plan ? statusIcon[org.plan.status] ?? statusIcon.ACTIVE : null;
                  const tc = org.plan ? tierColors[org.plan.tier] ?? tierColors.FREE : "text-gray-400";
                  return (<tr key={org.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"><td className="p-3 font-medium">{org.name}</td><td className="p-3 text-gray-500">{org.email}</td><td className="p-3">{org.userCount}</td><td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{org.plan?.name ?? "—"}</span></td><td className="p-3">{st ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>{st.icon}{org.plan!.status}</span> : <span className="text-gray-400">—</span>}</td><td className="p-3 text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</td></tr>);
                })}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {plans.length === 0 ? <p className="text-xs text-gray-400 col-span-full text-center py-8">No plans defined</p> : plans.map((plan) => {
            const orgCount = orgs.filter((o) => o.plan?.id === plan.id).length;
            const tc = tierColors[plan.tier] ?? "text-gray-500 bg-gray-100";
            return (<Card key={plan.id} className={plan.active ? "" : "opacity-50"}><CardHeader><CardTitle className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary-500" /><span className="text-sm">{plan.name}</span></CardTitle></CardHeader><CardContent className="space-y-2"><p className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{plan.tier}</p><p className="text-lg font-bold">﷼ {plan.monthlyPrice}<span className="text-xs font-normal text-gray-400">/mo</span></p><div className="space-y-1 text-xs"><p className="flex justify-between"><span className="text-gray-400">Max Users</span><span>{plan.maxUsers}</span></p><p className="flex justify-between"><span className="text-gray-400">Max Invoices</span><span>{plan.maxInvoices}</span></p><p className="flex justify-between"><span className="text-gray-400">Organizations</span><span>{orgCount}</span></p></div></CardContent></Card>);
          })}
        </div>
      )}
    </div>
  );
}
