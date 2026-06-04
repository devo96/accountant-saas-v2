"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Package, Building2, Users, Crown, Play, Clock } from "lucide-react";
import { useState, useCallback } from "react";
import { OrgPlanForm } from "../_forms";

type OrgPlan = { id: string; name: string; tier: string; status: string; startsAt?: string; endsAt?: string | null; trialEndsAt?: string | null } | null;
type OrganizationInfo = {
  id: string; name: string; email: string; createdAt: Date;
  userCount: number; plan: OrgPlan;
};
type PlanInfo = {
  id: string; name: string; tier: string; monthlyPrice: number; yearlyPrice: number;
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

function daysRemaining(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-gray-400">—</span>;
  if (days < 0) return <span className="text-red-600 font-medium">Overdue by {Math.abs(days)}d</span>;
  if (days <= 7) return <span className="text-red-600 font-medium">{days}d left</span>;
  if (days <= 30) return <span className="text-amber-600 font-medium">{days}d left</span>;
  return <span className="text-green-600 font-medium">{days}d left</span>;
}

function ActivateForm({ org, plans, onClose, onSave }: { org: OrganizationInfo; plans: PlanInfo[]; onClose: () => void; onSave: () => void }) {
  const [planId, setPlanId] = useState(org.plan?.id ?? plans[0]?.id ?? "");
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("BANK_TRANSFER");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function handleActivate() {
    setSaving(true);
    const r = await fetch(`/api/owner/orgs/${org.id}/activate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, days: Number(days), reason, receiptUrl: receiptUrl || null, notes: notes || null }),
    });
    setSaving(false);
    if (!r.ok) { toast({ title: "Error", message: "Failed to activate", type: "error" }); return; }
    toast({ title: "Success", message: `Activated for ${days} days`, type: "success" });
    onClose(); onSave();
  }

  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">Plan</label>
      <Select options={plans.map(p => ({ value: p.id, label: `${p.name} (﷼${p.monthlyPrice}/mo)` }))} value={planId} onChange={e => setPlanId(e.target.value)} />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><label className="block text-sm font-medium mb-1">Days</label><Input type="number" min={1} value={days} onChange={e => setDays(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">Reason</label>
        <Select options={[{ value: "BANK_TRANSFER", label: "Bank Transfer" }, { value: "CASH", label: "Cash" }, { value: "COMPENSATION", label: "Compensation" }]} value={reason} onChange={e => setReason(e.target.value)} />
      </div>
    </div>
    {reason !== "COMPENSATION" && (
      <div><label className="block text-sm font-medium mb-1">Receipt URL (optional)</label><Input value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://..." /></div>
    )}
    <div><label className="block text-sm font-medium mb-1">Notes</label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." /></div>
    <div className="flex gap-2 pt-2"><Button onClick={handleActivate} disabled={saving} className="flex-1">{saving ? "Activating..." : "Activate"}</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
  </div>);
}

export function OrganizationsClient({ orgs: initialOrgs, plans }: { orgs: OrganizationInfo[]; plans: PlanInfo[] }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [orgPlanDialog, setOrgPlanDialog] = useState<OrganizationInfo | null>(null);
  const [activateDialog, setActivateDialog] = useState<OrganizationInfo | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(async () => { const r = await fetch("/api/owner/orgs"); if (r.ok) setOrgs(await r.json()); }, []);

  return (
    <div>
      <Card>
        <CardHeader><CardTitle className="text-sm"><Building2 className="h-4 w-4 inline-block mr-1" />Organizations ({orgs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Name</th><th className="p-3 font-medium text-gray-500">Plan</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Trial</th><th className="p-3 font-medium text-gray-500">Expires</th><th className="p-3 font-medium text-gray-500"><Users className="h-3 w-3 inline-block" /></th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
              <tbody>{orgs.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-gray-400">No organizations found</td></tr> : orgs.map((org) => {
                const st = org.plan ? statusIcon[org.plan.status] ?? statusIcon.ACTIVE : null;
                const tc = org.plan ? tierColors[org.plan.tier] ?? tierColors.FREE : "text-gray-400";
                const trialDays = org.plan?.trialEndsAt ? daysRemaining(org.plan.trialEndsAt) : null;
                const endDays = org.plan?.endsAt ? daysRemaining(org.plan.endsAt) : null;
                return (<tr key={org.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{org.name}<br /><span className="text-gray-400">{org.email}</span></td>
                  <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{org.plan?.name ?? "—"}</span></td>
                  <td className="p-3">{st ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>{st.icon}{org.plan!.status}</span> : <span className="text-gray-400">—</span>}</td>
                  <td className="p-3"><DaysBadge days={trialDays} /></td>
                  <td className="p-3"><DaysBadge days={endDays} /></td>
                  <td className="p-3">{org.userCount}</td>
                  <td className="p-3 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setOrgPlanDialog(org)} title="Change Plan"><Package className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setActivateDialog(org)} title="Activate / Extend"><Play className="h-3 w-3 text-green-600" /></Button>
                  </td>
                </tr>);
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

      {activateDialog && (
        <Dialog open onClose={() => setActivateDialog(null)} title={`Activate Subscription — ${activateDialog.name}`}>
          <ActivateForm org={activateDialog} plans={plans} onClose={() => setActivateDialog(null)} onSave={refresh} />
        </Dialog>
      )}
    </div>
  );
}
