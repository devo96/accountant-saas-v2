"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Package, Building2, Users, Crown } from "lucide-react";
import { useState, useCallback } from "react";
import { OrgPlanForm } from "../_forms";

type OrganizationInfo = {
  id: string; name: string; email: string; createdAt: Date;
  userCount: number;
  plan: { id: string; name: string; tier: string; status: string } | null;
};
type PlanInfo = {
  id: string; name: string; tier: string; monthlyPrice: number;
  maxUsers: number; maxInvoices: number; active: boolean;
};

const statusIcon: Record<string, { icon: React.ReactNode; color: string }> = {
  ACTIVE: { icon: <Crown className="h-3 w-3" />, color: "text-green-600 bg-green-50" },
  TRIALING: { icon: <Package className="h-3 w-3" />, color: "text-blue-600 bg-blue-50" },
  EXPIRED: { icon: <Building2 className="h-3 w-3" />, color: "text-red-600 bg-red-50" },
  CANCELLED: { icon: <Building2 className="h-3 w-3" />, color: "text-gray-500 bg-gray-100" },
  PAUSED: { icon: <Package className="h-3 w-3" />, color: "text-amber-600 bg-amber-50" },
};
const tierColors: Record<string, string> = {
  FREE: "text-gray-500 bg-gray-100", STARTER: "text-blue-600 bg-blue-50",
  PROFESSIONAL: "text-purple-600 bg-purple-50", ENTERPRISE: "text-amber-600 bg-amber-50",
};

export function OrganizationsClient({ orgs: initialOrgs, plans }: { orgs: OrganizationInfo[]; plans: PlanInfo[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [orgPlanDialog, setOrgPlanDialog] = useState<OrganizationInfo | null>(null);

  const refresh = useCallback(async () => { const r = await fetch("/api/owner/orgs"); if (r.ok) setOrgs(await r.json()); }, []);

  return (
    <div>
      <Card>
        <CardHeader><CardTitle className="text-sm"><Building2 className="h-4 w-4 inline-block mr-1" />Organizations ({orgs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Name</th><th className="p-3 font-medium text-gray-500">Email</th><th className="p-3 font-medium text-gray-500"><Users className="h-3 w-3 inline-block" /></th><th className="p-3 font-medium text-gray-500">Plan</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Created</th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
              <tbody>{orgs.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-gray-400">No organizations found</td></tr> : orgs.map((org) => {
                const st = org.plan ? statusIcon[org.plan.status] ?? statusIcon.ACTIVE : null;
                const tc = org.plan ? tierColors[org.plan.tier] ?? tierColors.FREE : "text-gray-400";
                return (<tr key={org.id} className="border-b hover:bg-gray-50"><td className="p-3 font-medium">{org.name}</td><td className="p-3 text-gray-500">{org.email}</td><td className="p-3">{org.userCount}</td><td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{org.plan?.name ?? "—"}</span></td><td className="p-3">{st ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>{st.icon}{org.plan!.status}</span> : <span className="text-gray-400">—</span>}</td><td className="p-3 text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={() => setOrgPlanDialog(org)}><Package className="h-3 w-3" /></Button></td></tr>);
              })}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {orgPlanDialog && (
        <Dialog open onClose={() => setOrgPlanDialog(null)} title={`Manage Plan — ${orgPlanDialog.name}`}>
          <OrgPlanForm org={orgPlanDialog} plans={plans} onClose={() => setOrgPlanDialog(null)} onSave={refresh} />
        </Dialog>
      )}
    </div>
  );
}
