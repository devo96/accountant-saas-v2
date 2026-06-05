"use client"; import { useTranslations } from "next-intl"; import { Button } from "@/components/ui/button"; import { Input } from "@/components/ui/input"; import { Select } from "@/components/ui/select"; import { Textarea } from "@/components/ui/textarea"; import { useToast } from "@/components/ui/toast"; import { useState, useEffect } from "react";
type OrgPlan = { id: string; name: string; tier: string; status: string; startsAt?: string; endsAt?: string | null; trialEndsAt?: string | null } | null;
export type OrganizationInfo = { id: string; name: string; email: string; createdAt: Date; userCount: number; plan: OrgPlan; };
export type PlanInfo = { id: string; name: string; tier: string; monthlyPrice: number; yearlyPrice: number; maxUsers: number; maxInvoices: number; active: boolean; };
type CouponInfo = { id: string; code: string; discountType: string; discountValue: number; maxUses: number; usedCount: number; minAmount: number; planId: string | null; expiresAt: string | null; active: boolean };
const tierOptions = [
  { value: "FREE", labelKey: "tierFREE" }, { value: "STARTER", labelKey: "tierSTARTER" },
  { value: "PROFESSIONAL", labelKey: "tierPROFESSIONAL" }, { value: "ENTERPRISE", labelKey: "tierENTERPRISE" },
];
const statusOptions = [
  { value: "ACTIVE", labelKey: "statusACTIVE" }, { value: "TRIALING", labelKey: "statusTRIALING" },
  { value: "EXPIRED", labelKey: "statusEXPIRED" }, { value: "CANCELLED", labelKey: "statusCANCELLED" },
  { value: "PAUSED", labelKey: "statusPAUSED" },
];
export function PlanForm({ plan, onClose, onSave }: { plan?: PlanInfo | null; onClose: () => void; onSave: () => void }) {
  const t = useTranslations("ownerPanel");
  const [name, setName] = useState(plan?.name ?? "");
  const [tier, setTier] = useState(plan?.tier ?? "FREE");
  const [monthlyPrice, setMonthlyPrice] = useState(String(plan?.monthlyPrice ?? ""));
  const [yearlyPrice, setYearlyPrice] = useState(String(plan?.yearlyPrice ?? ""));
  const [maxUsers, setMaxUsers] = useState(String(plan?.maxUsers ?? ""));
  const [maxInvoices, setMaxInvoices] = useState(String(plan?.maxInvoices ?? ""));
  const { toast } = useToast();
  useEffect(() => { if (plan) { setName(plan.name); setTier(plan.tier); setMonthlyPrice(String(plan.monthlyPrice)); setYearlyPrice(String(plan.yearlyPrice)); setMaxUsers(String(plan.maxUsers)); setMaxInvoices(String(plan.maxInvoices)); } }, [plan]);
  async function handleSave() {
    const url = plan ? `/api/owner/plans/${plan.id}` : "/api/owner/plans";
    const method = plan ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, tier, monthlyPrice: Number(monthlyPrice), yearlyPrice: Number(yearlyPrice), maxUsers: Number(maxUsers), maxInvoices: Number(maxInvoices) }) });
    if (!res.ok) { toast({ title: t("errorTitle"), message: t("failedSavePlan"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: plan ? t("planUpdated") : t("planCreated"), type: "success" });
    onClose(); onSave();
  }
  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">{t("formName")}</label><Input value={name} onChange={e => setName(e.target.value)} /></div>
    <div><label className="block text-sm font-medium mb-1">{t("formTier")}</label>
      <Select options={tierOptions.map(o => ({ value: o.value, label: t(o.labelKey) }))} value={tier} onChange={e => setTier(e.target.value)} />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><label className="block text-sm font-medium mb-1">{t("formMonthly")}</label><Input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">{t("formYearly")}</label><Input type="number" value={yearlyPrice} onChange={e => setYearlyPrice(e.target.value)} /></div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><label className="block text-sm font-medium mb-1">{t("formMaxUsers")}</label><Input type="number" value={maxUsers} onChange={e => setMaxUsers(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">{t("formMaxInvoices")}</label><Input type="number" value={maxInvoices} onChange={e => setMaxInvoices(e.target.value)} /></div>
    </div>
    <div className="flex gap-2 pt-2"><Button onClick={handleSave} className="flex-1">{plan ? t("formUpdate") : t("formCreate")}</Button><Button variant="outline" onClick={onClose}>{t("formCancel")}</Button></div>
  </div>);
}
export function OrgPlanForm({ org, plans, onClose, onSave }: { org: OrganizationInfo; plans: PlanInfo[]; onClose: () => void; onSave: () => void }) {
  const t = useTranslations("ownerPanel");
  const [planId, setPlanId] = useState(org.plan?.id ?? "");
  const [status, setStatus] = useState(org.plan?.status ?? "ACTIVE");
  const { toast } = useToast();
  useEffect(() => { if (org.plan) { setPlanId(org.plan.id); setStatus(org.plan.status); } }, [org]);
  async function handleSave() {
    const res = await fetch(`/api/owner/orgs/${org.id}/plan`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, status }) });
    if (!res.ok) { toast({ title: t("errorTitle"), message: t("failedUpdatePlan"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: t("orgPlanUpdated"), type: "success" });
    onClose(); onSave();
  }
  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">{t("formPlan")}</label>
      <Select options={[{ value: "", label: t("choosePlan") }, ...plans.map(p => ({ value: p.id, label: `${p.name} (﷼${p.monthlyPrice}/${t("perMonth")})` }))]} value={planId} onChange={e => setPlanId(e.target.value)} />
    </div>
    <div><label className="block text-sm font-medium mb-1">{t("formStatus")}</label>
      <Select options={statusOptions.map(o => ({ value: o.value, label: t(o.labelKey) }))} value={status} onChange={e => setStatus(e.target.value)} />
    </div>
    <div className="flex gap-2 pt-2"><Button onClick={handleSave} className="flex-1">{t("formSave")}</Button><Button variant="outline" onClick={onClose}>{t("formCancel")}</Button></div>
  </div>);
}
export function NotificationForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ownerPanel");
  const [orgList, setOrgList] = useState<{ id: string; name: string }[]>([]);
  const [orgId, setOrgId] = useState("*");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  useEffect(() => { (async () => { const res = await fetch("/api/owner/orgs"); if (res.ok) { const orgs: OrganizationInfo[] = await res.json(); setOrgList(orgs.map(o => ({ id: o.id, name: o.name }))); } })(); }, []);
  async function handleSend() {
    const res = await fetch("/api/owner/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: orgId, title, message, type: "INFO" }) });
    if (!res.ok) { toast({ title: t("errorTitle"), message: t("failedSend"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: t("notifSent"), type: "success" });
    onClose(); setTitle(""); setMessage("");
  }
  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">{t("formSendTo")}</label>
      <Select options={[{ value: "*", label: t("allOrgs") }, ...orgList.map(o => ({ value: o.id, label: o.name }))]} value={orgId} onChange={e => setOrgId(e.target.value)} />
    </div>
    <div><label className="block text-sm font-medium mb-1">{t("formTitle")}</label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
    <div><label className="block text-sm font-medium mb-1">{t("formMessage")}</label><Textarea value={message} onChange={e => setMessage(e.target.value)} /></div>
    <div className="flex gap-2 pt-2"><Button onClick={handleSend} className="flex-1">{t("formSend")}</Button><Button variant="outline" onClick={onClose}>{t("formCancel")}</Button></div>
  </div>);
}
export function CouponForm({ coupon, onClose, onSave }: { coupon: CouponInfo | null; onClose: () => void; onSave: () => void }) {
  const t = useTranslations("ownerPanel");
  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountType, setDiscountType] = useState(coupon?.discountType ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(coupon?.discountValue ?? 10);
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ?? 0);
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : "");
  const [active, setActive] = useState(coupon?.active ?? true);
  const { toast } = useToast();
  async function handleSave() {
    const body = { code, discountType, discountValue, maxUses: maxUses || null, expiresAt: expiresAt || null, active };
    const r = coupon ? await fetch(`/api/owner/coupons/${coupon.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) : await fetch("/api/owner/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { toast({ title: t("errorTitle"), message: t("failedSaveCoupon"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: coupon ? t("couponUpdated") : t("couponCreated"), type: "success" });
    onSave();
  }
  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">{t("formCode")}</label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
    <div><label className="block text-sm font-medium mb-1">{t("formDiscountType")}</label>
      <Select options={[{ value: "PERCENTAGE", label: t("discountPERCENTAGE") }, { value: "FIXED", label: t("discountFIXED") }]} value={discountType} onChange={e => setDiscountType(e.target.value)} />
    </div>
    <div><label className="block text-sm font-medium mb-1">{t("formValue")}</label><Input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} /></div>
    <div><label className="block text-sm font-medium mb-1">{t("formMaxUses")}</label><Input type="number" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} /></div>
    <div><label className="block text-sm font-medium mb-1">{t("formExpiresAt")}</label><Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div>
    <div className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" /><label className="text-sm">{t("formActive")}</label></div>
    <div className="flex gap-2 pt-2"><Button onClick={handleSave} className="flex-1">{t("formSave")}</Button><Button variant="outline" onClick={onClose}>{t("formCancel")}</Button></div>
  </div>);
}
export function NewTicketForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ownerPanel");
  const [organizationId, setOrganizationId] = useState("");
  const [orgList, setOrgList] = useState<{ id: string; name: string }[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const { toast } = useToast();
  useEffect(() => { (async () => { const res = await fetch("/api/owner/orgs"); if (res.ok) { const orgs: OrganizationInfo[] = await res.json(); setOrgList(orgs.map(o => ({ id: o.id, name: o.name }))); } })(); }, []);
  async function handleCreate() {
    const r = await fetch("/api/owner/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, subject, message, priority }) });
    if (!r.ok) { toast({ title: t("errorTitle"), message: t("failedCreateTicket"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: t("ticketCreated"), type: "success" });
    onClose();
  }
  return (<div className="space-y-3">
    <div><label className="block text-sm font-medium mb-1">{t("formOrganization")}</label>
      <Select options={orgList.map(o => ({ value: o.id, label: o.name }))} value={organizationId} onChange={e => setOrganizationId(e.target.value)} placeholder={t("selectOrg")} />
    </div>
    <div><label className="block text-sm font-medium mb-1">{t("formPriority")}</label>
      <Select options={[{ value: "LOW", label: t("priorityLow") }, { value: "NORMAL", label: t("priorityNormal") }, { value: "HIGH", label: t("priorityHigh") }, { value: "URGENT", label: t("priorityUrgent") }]} value={priority} onChange={e => setPriority(e.target.value)} />
    </div>
    <div><label className="block text-sm font-medium mb-1">{t("formSubject")}</label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
    <div><label className="block text-sm font-medium mb-1">{t("formMessage")}</label><Textarea value={message} onChange={e => setMessage(e.target.value)} /></div>
    <div className="flex gap-2 pt-2"><Button onClick={handleCreate} className="flex-1">{t("formCreate")}</Button><Button variant="outline" onClick={onClose}>{t("formCancel")}</Button></div>
  </div>);
}
