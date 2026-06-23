"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Dialog } from "@/components/ui/dialog"; import { Input } from "@/components/ui/input"; import { Select } from "@/components/ui/select"; import { Textarea } from "@/components/ui/textarea"; import { useToast } from "@/components/ui/toast"; import { Package, Building2, Users, Crown, Play, LogIn, Eye } from "lucide-react"; import { useState, useCallback } from "react"; import Link from "next/link"; import { OrgPlanForm } from "../_forms";
type OrgPlan = { id: string; name: string; tier: string; status: string; startsAt?: string; endsAt?: string | null; trialEndsAt?: string | null } | null;
type OrganizationInfo = { id: string; name: string; email: string; createdAt: Date; userCount: number; plan: OrgPlan; };
type PlanInfo = { id: string; name: string; tier: string; monthlyPrice: number; yearlyPrice: number; maxUsers: number; maxInvoices: number; active: boolean; };
const statusIcon: Record<string, { icon: React.ReactNode; color: string }> = {
  ACTIVE: { icon: <Crown className="h-3 w-3" />, color: "text-green-600 bg-green-50" },
  TRIALING: { icon: <Package className="h-3 w-3" />, color: "text-primary-600 bg-primary-50" },
  EXPIRED: { icon: <Building2 className="h-3 w-3" />, color: "text-red-600 bg-red-50" },
  CANCELLED: { icon: <Building2 className="h-3 w-3" />, color: "text-gray-500 bg-gray-100" },
  PAUSED: { icon: <Package className="h-3 w-3" />, color: "text-amber-600 bg-amber-50" },
};
const tierColors: Record<string, string> = { FREE: "text-gray-500 bg-gray-100", STARTER: "text-primary-600 bg-primary-50", PROFESSIONAL: "text-purple-600 bg-purple-50", ENTERPRISE: "text-amber-600 bg-amber-50" };
function daysRemaining(dateStr: string | null | undefined): number | null { if (!dateStr) return null; const diff = new Date(dateStr).getTime() - Date.now(); return Math.ceil(diff / 86400000); }
function DaysBadge({ days, t }: { days: number | null; t: (key: string, params?: any) => string }) {
  if (days === null) return <span className="text-gray-400">{t("noPlan")}</span>;
  if (days < 0) return <span className="text-red-600 font-medium">{t("overdueBy", { days: Math.abs(days) })}</span>;
  if (days <= 7) return <span className="text-red-600 font-medium">{t("daysLeft", { days })}</span>;
  if (days <= 30) return <span className="text-amber-600 font-medium">{t("daysLeft", { days })}</span>;
  return <span className="text-green-600 font-medium">{t("daysLeft", { days })}</span>;
}
function ActivateForm({ org, plans, onClose, onSave }: { org: OrganizationInfo; plans: PlanInfo[]; onClose: () => void; onSave: () => void }) {
  const t = useTranslations("ownerPanel");
  const [planId, setPlanId] = useState(org.plan?.id ?? plans[0]?.id ?? "");
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("BANK_TRANSFER");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  async function handleActivate() {
    setSaving(true);
    const r = await fetch(`/api/owner/orgs/${org.id}/activate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, days: Number(days), reason, receiptUrl: receiptUrl || null, notes: notes || null }) });
    setSaving(false);
    if (!r.ok) { toast({ title: t("errorTitle"), message: t("failedActivate"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: t("activatedDays", { days }), type: "success" });
    onClose(); onSave();
  }
  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">{t("formPlan")}</label>
      <Select options={plans.map(p => ({ value: p.id, label: `${p.name} (﷼${p.monthlyPrice}/${t("perMonth")})` }))} value={planId} onChange={e => setPlanId(e.target.value)} />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><label className="block text-sm font-medium mb-1">{t("formDays")}</label><Input type="number" min={1} value={days} onChange={e => setDays(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">{t("formReason")}</label>
        <Select options={[{ value: "BANK_TRANSFER", label: t("reasonBankTransfer") }, { value: "CASH", label: t("reasonCash") }, { value: "COMPENSATION", label: t("reasonCompensation") }]} value={reason} onChange={e => setReason(e.target.value)} />
      </div>
    </div>
    {reason !== "COMPENSATION" && (<div><label className="block text-sm font-medium mb-1">{t("formReceiptUrl")}</label><Input value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder={t("receiptPlaceholder")} /></div>)}
    <div><label className="block text-sm font-medium mb-1">{t("formNotes")}</label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("notesPlaceholder")} /></div>
    <div className="flex gap-2 pt-2"><Button onClick={handleActivate} disabled={saving} className="flex-1">{saving ? t("formActivating") : t("formActivate")}</Button><Button variant="outline" onClick={onClose}>{t("formCancel")}</Button></div>
  </div>);
}
export function OrganizationsClient({ orgs: initialOrgs, plans }: { orgs: OrganizationInfo[]; plans: PlanInfo[] }) {
  const t = useTranslations("ownerPanel");
  const [orgs, setOrgs] = useState(initialOrgs);
  const [orgPlanDialog, setOrgPlanDialog] = useState<OrganizationInfo | null>(null);
  const [activateDialog, setActivateDialog] = useState<OrganizationInfo | null>(null);
  const refresh = useCallback(async () => { const r = await fetch("/api/owner/orgs"); if (r.ok) setOrgs(await r.json()); }, []);
  return (
    <div>
      <Card>
        <CardHeader><CardTitle className="text-sm"><Building2 className="h-4 w-4 inline-block mr-1" />{t("orgsTableTitle", { count: orgs.length })}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("orgName")}</th><th className="p-3 font-medium text-gray-500">{t("orgPlan")}</th><th className="p-3 font-medium text-gray-500">{t("orgStatus")}</th><th className="p-3 font-medium text-gray-500">{t("orgTrial")}</th><th className="p-3 font-medium text-gray-500">{t("orgExpires")}</th><th className="p-3 font-medium text-gray-500"><Users className="h-3 w-3 inline-block" /></th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
              <tbody>{orgs.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-gray-400">{t("noOrgs")}</td></tr> : orgs.map((org) => {
                const st = org.plan ? statusIcon[org.plan.status] ?? statusIcon.ACTIVE : null;
                const tc = org.plan ? tierColors[org.plan.tier] ?? tierColors.FREE : "text-gray-400";
                const trialDays = org.plan?.trialEndsAt ? daysRemaining(org.plan.trialEndsAt) : null;
                const endDays = org.plan?.endsAt ? daysRemaining(org.plan.endsAt) : null;
                return (<tr key={org.id} className="border-b hover:bg-gray-50">
                   <td className="p-3 font-medium"><Link href={`/owner/organizations/${org.id}`} className="text-primary-600 hover:underline">{org.name}</Link><br /><span className="text-gray-400">{org.email}</span></td>
                  <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{org.plan?.name ?? t("noPlan")}</span></td>
                  <td className="p-3">{st ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>{st.icon}{t(`status${org.plan!.status}`)}</span> : <span className="text-gray-400">{t("noPlan")}</span>}</td>
                  <td className="p-3"><DaysBadge days={trialDays} t={t} /></td>
                  <td className="p-3"><DaysBadge days={endDays} t={t} /></td>
                  <td className="p-3">{org.userCount}</td>
                   <td className="p-3 flex gap-1">
                     <Link href={`/owner/organizations/${org.id}`}><Button size="sm" variant="ghost" title="Profile"><Eye className="h-3 w-3 text-gray-600" /></Button></Link>
                     <Button size="sm" variant="ghost" onClick={() => setOrgPlanDialog(org)} title={t("changePlan")}><Package className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setActivateDialog(org)} title={t("activateExtend")}><Play className="h-3 w-3 text-green-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      const r = await fetch(`/api/owner/impersonate/${org.id}`, { method: "POST" });
                      if (r.ok) { const d = await r.json(); window.location.href = d.redirectTo; }
                      else { alert(t("impersonateFailed")); }
                    }} title={t("impersonate")}><LogIn className="h-3 w-3 text-primary-600" /></Button>
                  </td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {orgPlanDialog && (
        <Dialog open onClose={() => setOrgPlanDialog(null)} title={t("managePlan", { name: orgPlanDialog.name })}>
          <OrgPlanForm org={orgPlanDialog} plans={plans} onClose={() => setOrgPlanDialog(null)} onSave={refresh} />
        </Dialog>
      )}
      {activateDialog && (
        <Dialog open onClose={() => setActivateDialog(null)} title={t("activateSub", { name: activateDialog.name })}>
          <ActivateForm org={activateDialog} plans={plans} onClose={() => setActivateDialog(null)} onSave={refresh} />
        </Dialog>
      )}
    </div>
  );
}
