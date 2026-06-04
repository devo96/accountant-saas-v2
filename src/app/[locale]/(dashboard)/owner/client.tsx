"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useState, useEffect, useCallback } from "react";
import { Building2, Users, Package, Crown, CheckCircle, Clock, XCircle, TrendingUp, BarChart3, Plus, Edit3, Trash2, Send, Search, Activity, Percent, DollarSign, Calendar, Ticket, Shield, CreditCard, Server, HardDrive } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type OrganizationInfo = {
  id: string; name: string; email: string; createdAt: Date;
  userCount: number;
  plan: { id: string; name: string; tier: string; status: string } | null;
};
type PlanInfo = {
  id: string; name: string; tier: string; monthlyPrice: number;
  maxUsers: number; maxInvoices: number; active: boolean;
};
type ChartData = { month: string; revenue: number };
type UserInfo = {
  id: string; name: string; email: string; role: string;
  active: boolean; phone: string | null; createdAt: Date;
  organizationId: string; organization: { name: string };
};
type CouponInfo = { id: string; code: string; discountType: string; discountValue: number; maxUses: number; usedCount: number; minAmount: number; planId: string | null; expiresAt: string | null; active: boolean };
type TicketInfo = { id: string; organizationId: string; subject: string; message: string; status: string; priority: string; createdBy: string; assignedTo: string | null; createdAt: string; organization: { name: string }; user: { name: string; email: string } | null };
type HealthInfo = { status: string; uptime: string; totalOrgs: number; totalUsers: number; activeOrgs: number; totalRevenue: number; auditLast7d: number; auditToday: number; totalDbRecords: number; lastChecked: string };
type AuditEntry = { id: string; organizationId: string; userId: string; action: string; entity: string; entityId: string | null; oldValue: unknown; newValue: unknown; createdAt: string };

const tierColors: Record<string, string> = {
  FREE: "text-gray-500 bg-gray-100",
  STARTER: "text-blue-600 bg-blue-50",
  PROFESSIONAL: "text-purple-600 bg-purple-50",
  ENTERPRISE: "text-amber-600 bg-amber-50",
};
const statusIcon: Record<string, { icon: React.ReactNode; color: string }> = {
  ACTIVE: { icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600 bg-green-50" },
  TRIALING: { icon: <Clock className="h-3 w-3" />, color: "text-blue-600 bg-blue-50" },
  EXPIRED: { icon: <XCircle className="h-3 w-3" />, color: "text-red-600 bg-red-50" },
  CANCELLED: { icon: <XCircle className="h-3 w-3" />, color: "text-gray-500 bg-gray-100" },
  PAUSED: { icon: <Clock className="h-3 w-3" />, color: "text-amber-600 bg-amber-50" },
};

function PlanForm({ plan, onClose, onSave }: { plan?: PlanInfo | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(plan?.name ?? "");
  const [tier, setTier] = useState(plan?.tier ?? "FREE");
  const [monthlyPrice, setMonthlyPrice] = useState(String(plan?.monthlyPrice ?? ""));
  const [maxUsers, setMaxUsers] = useState(String(plan?.maxUsers ?? ""));
  const [maxInvoices, setMaxInvoices] = useState(String(plan?.maxInvoices ?? ""));
  const { toast } = useToast();

  useEffect(() => {
    if (plan) {
      setName(plan.name); setTier(plan.tier);
      setMonthlyPrice(String(plan.monthlyPrice)); setMaxUsers(String(plan.maxUsers)); setMaxInvoices(String(plan.maxInvoices));
    }
  }, [plan]);

  async function handleSave() {
    const url = plan ? `/api/owner/plans/${plan.id}` : "/api/owner/plans";
    const method = plan ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tier, monthlyPrice: Number(monthlyPrice), maxUsers: Number(maxUsers), maxInvoices: Number(maxInvoices) }),
    });
    if (!res.ok) { toast({ title: "Error", message: "Failed to save plan", type: "error" }); return; }
    toast({ title: "Success", message: `Plan ${plan ? "updated" : "created"}`, type: "success" });
    onClose(); onSave();
  }

  return (
    <div className="space-y-3">
      <div><label className="block text-sm font-medium mb-1">Name</label><Input value={name} onChange={e => setName(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">Tier</label>
        <Select options={[
          { value: "FREE", label: "Free" }, { value: "STARTER", label: "Starter" },
          { value: "PROFESSIONAL", label: "Professional" }, { value: "ENTERPRISE", label: "Enterprise" },
        ]} value={tier} onChange={e => setTier(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="block text-sm font-medium mb-1">Price (SAR)</label><Input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} /></div>
        <div><label className="block text-sm font-medium mb-1">Max Users</label><Input type="number" value={maxUsers} onChange={e => setMaxUsers(e.target.value)} /></div>
        <div><label className="block text-sm font-medium mb-1">Max Invoices</label><Input type="number" value={maxInvoices} onChange={e => setMaxInvoices(e.target.value)} /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} className="flex-1">{plan ? "Update" : "Create"}</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function OrgPlanForm({ org, plans, onClose, onSave }: { org: OrganizationInfo; plans: PlanInfo[]; onClose: () => void; onSave: () => void }) {
  const [planId, setPlanId] = useState(org.plan?.id ?? "");
  const [status, setStatus] = useState(org.plan?.status ?? "ACTIVE");
  const { toast } = useToast();

  useEffect(() => { if (org.plan) { setPlanId(org.plan.id); setStatus(org.plan.status); } }, [org]);

  async function handleSave() {
    const res = await fetch(`/api/owner/orgs/${org.id}/plan`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, status }),
    });
    if (!res.ok) { toast({ title: "Error", message: "Failed to update plan", type: "error" }); return; }
    toast({ title: "Success", message: "Organization plan updated", type: "success" });
    onClose(); onSave();
  }

  return (
    <div className="space-y-3">
      <div><label className="block text-sm font-medium mb-1">Plan</label>
        <Select options={[
          { value: "", label: "No plan" },
          ...plans.map(p => ({ value: p.id, label: `${p.name} (﷼${p.monthlyPrice}/mo)` })),
        ]} value={planId} onChange={e => setPlanId(e.target.value)} />
      </div>
      <div><label className="block text-sm font-medium mb-1">Status</label>
        <Select options={[
          { value: "ACTIVE", label: "Active" }, { value: "TRIALING", label: "Trialing" },
          { value: "EXPIRED", label: "Expired" }, { value: "CANCELLED", label: "Cancelled" },
          { value: "PAUSED", label: "Paused" },
        ]} value={status} onChange={e => setStatus(e.target.value)} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} className="flex-1">Save</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function NotificationForm({ onClose }: { onClose: () => void }) {
  const [orgList, setOrgList] = useState<{ id: string; name: string }[]>([]);
  const [orgId, setOrgId] = useState("*");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/owner/orgs");
      if (res.ok) {
        const orgs: OrganizationInfo[] = await res.json();
        setOrgList(orgs.map(o => ({ id: o.id, name: o.name })));
      }
    })();
  }, []);

  async function handleSend() {
    const res = await fetch("/api/owner/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, title, message, type: "INFO" }),
    });
    if (!res.ok) { toast({ title: "Error", message: "Failed to send", type: "error" }); return; }
    toast({ title: "Success", message: "Notification sent", type: "success" });
    onClose(); setTitle(""); setMessage("");
  }

  return (
    <div className="space-y-3">
      <div><label className="block text-sm font-medium mb-1">Send to</label>
        <Select options={[
          { value: "*", label: "All Organizations" },
          ...orgList.map(o => ({ value: o.id, label: o.name })),
        ]} value={orgId} onChange={e => setOrgId(e.target.value)} />
      </div>
      <div><label className="block text-sm font-medium mb-1">Title</label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">Message</label><Textarea value={message} onChange={e => setMessage(e.target.value)} /></div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSend} className="flex-1">Send</Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function CouponForm({ coupon, onClose, onSave }: { coupon: CouponInfo | null; onClose: () => void; onSave: () => void }) {
  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountType, setDiscountType] = useState(coupon?.discountType ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(coupon?.discountValue ?? 10);
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ?? 0);
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : "");
  const [active, setActive] = useState(coupon?.active ?? true);
  const { toast } = useToast();

  async function handleSave() {
    const body = { code, discountType, discountValue, maxUses: maxUses || null, expiresAt: expiresAt || null, active };
    const r = coupon
      ? await fetch(`/api/owner/coupons/${coupon.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/owner/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { toast({ title: "Error", message: "Failed to save coupon", type: "error" }); return; }
    toast({ title: "Success", message: coupon ? "Coupon updated" : "Coupon created", type: "success" });
    onSave();
  }

  return (
    <div className="space-y-3">
      <div><label className="block text-sm font-medium mb-1">Code</label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
      <div><label className="block text-sm font-medium mb-1">Discount Type</label>
        <Select options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED", label: "Fixed Amount" }]} value={discountType} onChange={e => setDiscountType(e.target.value)} />
      </div>
      <div><label className="block text-sm font-medium mb-1">Value</label><Input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} /></div>
      <div><label className="block text-sm font-medium mb-1">Max Uses (0 = unlimited)</label><Input type="number" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} /></div>
      <div><label className="block text-sm font-medium mb-1">Expires At</label><Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" /><label className="text-sm">Active</label></div>
      <div className="flex gap-2 pt-2"><Button onClick={handleSave} className="flex-1">Save</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
    </div>
  );
}

function NewTicketForm({ onClose }: { onClose: () => void }) {
  const [organizationId, setOrganizationId] = useState("");
  const [orgList, setOrgList] = useState<{ id: string; name: string }[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/owner/orgs");
      if (res.ok) {
        const orgs: OrganizationInfo[] = await res.json();
        setOrgList(orgs.map(o => ({ id: o.id, name: o.name })));
      }
    })();
  }, []);

  async function handleCreate() {
    const r = await fetch("/api/owner/tickets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, subject, message, priority }),
    });
    if (!r.ok) { toast({ title: "Error", message: "Failed to create ticket", type: "error" }); return; }
    toast({ title: "Success", message: "Ticket created", type: "success" });
    onClose();
  }

  return (
    <div className="space-y-3">
      <div><label className="block text-sm font-medium mb-1">Organization</label>
        <Select options={orgList.map(o => ({ value: o.id, label: o.name }))} value={organizationId} onChange={e => setOrganizationId(e.target.value)} placeholder="Select organization" />
      </div>
      <div><label className="block text-sm font-medium mb-1">Priority</label>
        <Select options={[{ value: "LOW", label: "Low" }, { value: "NORMAL", label: "Normal" }, { value: "HIGH", label: "High" }, { value: "URGENT", label: "Urgent" }]} value={priority} onChange={e => setPriority(e.target.value)} />
      </div>
      <div><label className="block text-sm font-medium mb-1">Subject</label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
      <div><label className="block text-sm font-medium mb-1">Message</label><Textarea value={message} onChange={e => setMessage(e.target.value)} /></div>
      <div className="flex gap-2 pt-2"><Button onClick={handleCreate} className="flex-1">Create</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
    </div>
  );
}

export function OwnerDashboardClient({
  totalOrgs, totalUsers, totalRevenue, mrr, arr, churnRate, liveOps,
  plans: initialPlans, activeOrgs, trialingOrgs, expiredOrgs, cancelledOrgs,
  orgs: initialOrgs, chartData, orgsThisMonth, newUsersThisMonth,
}: {
  totalOrgs: number; totalUsers: number; totalRevenue: number; mrr: number; arr: number;
  churnRate: string; liveOps: { journals: number; invoices: number };
  plans: PlanInfo[]; activeOrgs: number; trialingOrgs: number; expiredOrgs: number; cancelledOrgs: number;
  orgs: OrganizationInfo[]; chartData: ChartData[];
  orgsThisMonth: number; newUsersThisMonth: number;
}) {
  const [tab, setTab] = useState<"overview" | "orgs" | "plans" | "users" | "billing" | "security" | "support">("overview");
  const [plans, setPlans] = useState(initialPlans);
  const [orgs, setOrgs] = useState(initialOrgs);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [planDialog, setPlanDialog] = useState<PlanInfo | null | undefined>(undefined);
  const [orgPlanDialog, setOrgPlanDialog] = useState<OrganizationInfo | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [coupons, setCoupons] = useState<CouponInfo[]>([]);
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [couponDialog, setCouponDialog] = useState<CouponInfo | null | undefined>(undefined);
  const [ticketDialog, setTicketDialog] = useState(false);
  const { toast } = useToast();

  const unassignedOrgs = orgs.filter((o) => !o.plan);

  const refreshPlans = useCallback(async () => { const r = await fetch("/api/owner/plans"); if (r.ok) setPlans(await r.json()); }, []);
  const refreshOrgs = useCallback(async () => { const r = await fetch("/api/owner/orgs"); if (r.ok) setOrgs(await r.json()); }, []);

  async function loadUsers() {
    setUsersLoading(true);
    try { const r = await fetch("/api/owner/users"); if (r.ok) setUsers(await r.json()); }
    finally { setUsersLoading(false); }
  }

  async function toggleUserActive(userId: string, active: boolean) {
    const r = await fetch(`/api/owner/users/${userId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (!r.ok) { toast({ title: "Error", message: "Failed to update user", type: "error" }); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !active } : u));
    toast({ title: "Success", message: `User ${!active ? "activated" : "deactivated"}`, type: "success" });
  }

  async function loadBilling() { const r = await fetch("/api/owner/coupons"); if (r.ok) setCoupons(await r.json()); }
  async function loadTickets() { const r = await fetch("/api/owner/tickets"); if (r.ok) setTickets(await r.json()); }
  async function loadSecurity() {
    const r = await fetch("/api/owner/health"); if (r.ok) setHealth(await r.json());
    const a = await fetch("/api/owner/audit-logs"); if (a.ok) setAuditLogs(await a.json());
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.organization.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-50"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-gray-500">MRR (Monthly)</p><p className="text-lg font-bold">﷼ {mrr.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-blue-50"><Calendar className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-gray-500">ARR (Annual)</p><p className="text-lg font-bold">﷼ {arr.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-red-50"><Percent className="h-5 w-5 text-red-500" /></div><div><p className="text-xs text-gray-500">Churn Rate</p><p className="text-lg font-bold">{churnRate}%</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-purple-50"><Activity className="h-5 w-5 text-purple-500" /></div><div><p className="text-xs text-gray-500">Live Ops (today)</p><p className="text-lg font-bold">{liveOps.journals + liveOps.invoices}</p></div></div></CardContent></Card>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">Active</span><span className="text-sm font-bold text-green-600">{activeOrgs}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">Trialing</span><span className="text-sm font-bold text-blue-600">{trialingOrgs}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">Expired</span><span className="text-sm font-bold text-red-600">{expiredOrgs}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">Cancelled</span><span className="text-sm font-bold text-gray-600">{cancelledOrgs}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">New Orgs (month)</span><span className="text-sm font-bold">{orgsThisMonth}</span></CardContent></Card>
            <Card><CardContent className="p-3 flex items-center justify-between"><span className="text-xs text-gray-500">New Users (month)</span><span className="text-sm font-bold">{newUsersThisMonth}</span></CardContent></Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 mb-1">Total Organizations</p><p className="text-lg font-bold">{totalOrgs}</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 mb-1">Total Users</p><p className="text-lg font-bold">{totalUsers}</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 mb-1">Unassigned</p><p className="text-lg font-bold">{unassignedOrgs.length}</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><div><p className="text-xs text-gray-500 mb-1">Live Operations Today</p><p className="text-sm font-bold">{liveOps.invoices} invoices · {liveOps.journals} journal entries</p></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#1D97E0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex gap-2 border-b pb-2 items-center">
        <Button variant={tab === "overview" ? "default" : "ghost"} size="sm" onClick={() => setTab("overview")}><BarChart3 className="h-4 w-4 mr-1" />Overview</Button>
        <Button variant={tab === "orgs" ? "default" : "ghost"} size="sm" onClick={() => setTab("orgs")}><Building2 className="h-4 w-4 mr-1" />Organizations</Button>
        <Button variant={tab === "plans" ? "default" : "ghost"} size="sm" onClick={() => setTab("plans")}><Package className="h-4 w-4 mr-1" />Plans</Button>
        <Button variant={tab === "users" ? "default" : "ghost"} size="sm" onClick={() => { setTab("users"); loadUsers(); }}><Users className="h-4 w-4 mr-1" />Users</Button>
        <Button variant={tab === "billing" ? "default" : "ghost"} size="sm" onClick={() => { setTab("billing"); loadBilling(); }}><CreditCard className="h-4 w-4 mr-1" />Billing</Button>
        <Button variant={tab === "security" ? "default" : "ghost"} size="sm" onClick={() => { setTab("security"); loadSecurity(); }}><Shield className="h-4 w-4 mr-1" />Security</Button>
        <Button variant={tab === "support" ? "default" : "ghost"} size="sm" onClick={() => { setTab("support"); loadTickets(); }}><Ticket className="h-4 w-4 mr-1" />Support</Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setNotifyOpen(true)}><Send className="h-4 w-4 mr-1" />Notify</Button>
      </div>

      {tab === "orgs" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Organizations ({orgs.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Name</th><th className="p-3 font-medium text-gray-500">Email</th><th className="p-3 font-medium text-gray-500">Users</th><th className="p-3 font-medium text-gray-500">Plan</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Created</th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
                <tbody>{orgs.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-gray-400">No organizations found</td></tr> : orgs.map((org) => {
                  const st = org.plan ? statusIcon[org.plan.status] ?? statusIcon.ACTIVE : null;
                  const tc = org.plan ? tierColors[org.plan.tier] ?? tierColors.FREE : "text-gray-400";
                  return (<tr key={org.id} className="border-b hover:bg-gray-50"><td className="p-3 font-medium">{org.name}</td><td className="p-3 text-gray-500">{org.email}</td><td className="p-3">{org.userCount}</td><td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{org.plan?.name ?? "—"}</span></td><td className="p-3">{st ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>{st.icon}{org.plan!.status}</span> : <span className="text-gray-400">—</span>}</td><td className="p-3 text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={() => setOrgPlanDialog(org)}><Package className="h-3 w-3" /></Button></td></tr>);
                })}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "plans" && (
        <div>
          <div className="flex justify-end mb-3"><Button size="sm" onClick={() => setPlanDialog(null)}><Plus className="h-4 w-4 mr-1" />New Plan</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.length === 0 ? <p className="text-xs text-gray-400 col-span-full text-center py-8">No plans defined</p> : plans.map((plan) => {
              const orgCount = orgs.filter((o) => o.plan?.id === plan.id).length;
              const tc = tierColors[plan.tier] ?? "text-gray-500 bg-gray-100";
              return (<Card key={plan.id} className={plan.active ? "" : "opacity-50"}>
                <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary-500" /><span className="text-sm">{plan.name}</span></CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{plan.tier}</p>
                  <p className="text-lg font-bold">﷼ {plan.monthlyPrice}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between"><span className="text-gray-400">Max Users</span><span>{plan.maxUsers}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Max Invoices</span><span>{plan.maxInvoices}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Organizations</span><span>{orgCount}</span></p>
                  </div>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => setPlanDialog(plan)}><Edit3 className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={async () => {
                      if (!confirm("Delete this plan?")) return;
                      await fetch(`/api/owner/plans/${plan.id}`, { method: "DELETE" });
                      refreshPlans();
                    }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>);
            })}
          </div>
        </div>
      )}

      {tab === "users" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">All Users ({users.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-8 h-8 text-xs" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? <p className="p-6 text-center text-xs text-gray-400">Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Name</th><th className="p-3 font-medium text-gray-500">Email</th><th className="p-3 font-medium text-gray-500">Organization</th><th className="p-3 font-medium text-gray-500">Role</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Actions</th></tr></thead>
                  <tbody>{filteredUsers.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">No users found</td></tr> : filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-gray-500">{u.email}</td>
                      <td className="p-3 text-gray-500">{u.organization.name}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100">{u.role}</span></td>
                      <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${u.active ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>{u.active ? "Active" : "Inactive"}</span></td>
                      <td className="p-3"><Button size="sm" variant="ghost" onClick={() => toggleUserActive(u.id, u.active)}>{u.active ? "Deactivate" : "Activate"}</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "billing" && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setCouponDialog(null)}><Plus className="h-4 w-4 mr-1" />New Coupon</Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Coupons & Discounts ({coupons.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Code</th><th className="p-3 font-medium text-gray-500">Type</th><th className="p-3 font-medium text-gray-500">Value</th><th className="p-3 font-medium text-gray-500">Uses</th><th className="p-3 font-medium text-gray-500">Max</th><th className="p-3 font-medium text-gray-500">Expires</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
                  <tbody>{coupons.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-gray-400">No coupons</td></tr> : coupons.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold">{c.code}</td>
                      <td className="p-3">{c.discountType === "PERCENTAGE" ? "%" : "﷼"}</td>
                      <td className="p-3">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `﷼${c.discountValue}`}</td>
                      <td className="p-3">{c.usedCount}</td>
                      <td className="p-3">{c.maxUses || "∞"}</td>
                      <td className="p-3 text-gray-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.active ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-100"}`}>{c.active ? "Active" : "Inactive"}</span></td>
                      <td className="p-3">
                        <Button size="sm" variant="ghost" onClick={() => setCouponDialog(c)}><Edit3 className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={async () => {
                          if (!confirm("Delete this coupon?")) return;
                          await fetch(`/api/owner/coupons/${c.id}`, { method: "DELETE" }); loadBilling();
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Server className="h-5 w-5 text-green-500" /><div><p className="text-xs text-gray-500">System Status</p><p className="text-lg font-bold text-green-600">{health?.status ?? "—"}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-blue-500" /><div><p className="text-xs text-gray-500">Uptime</p><p className="text-lg font-bold">{health?.uptime ?? "—"}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><HardDrive className="h-5 w-5 text-amber-500" /><div><p className="text-xs text-gray-500">DB Records</p><p className="text-lg font-bold">{health?.totalDbRecords?.toLocaleString() ?? "—"}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-purple-500" /><div><p className="text-xs text-gray-500">Audit (7d)</p><p className="text-lg font-bold">{health?.auditLast7d ?? "—"}</p></div></div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Audit Events ({auditLogs.length})</CardTitle></CardHeader>
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b text-left sticky top-0 bg-white"><th className="p-3 font-medium text-gray-500">Action</th><th className="p-3 font-medium text-gray-500">Entity</th><th className="p-3 font-medium text-gray-500">Time</th></tr></thead>
                <tbody>{auditLogs.length === 0 ? <tr><td colSpan={3} className="p-6 text-center text-gray-400">No audit logs</td></tr> : auditLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50"><td className="p-3">{log.action}</td><td className="p-3 text-gray-500">{log.entity}</td><td className="p-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td></tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "support" && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setTicketDialog(true)}><Plus className="h-4 w-4 mr-1" />New Ticket</Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Support Tickets ({tickets.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Subject</th><th className="p-3 font-medium text-gray-500">Organization</th><th className="p-3 font-medium text-gray-500">Priority</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Created</th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
                  <tbody>{tickets.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">No tickets</td></tr> : tickets.map((t) => {
                    const statusColor: Record<string, string> = { OPEN: "text-blue-600 bg-blue-50", IN_PROGRESS: "text-amber-600 bg-amber-50", RESOLVED: "text-green-600 bg-green-50", CLOSED: "text-gray-400 bg-gray-100" };
                    const priorityIcon: Record<string, string> = { LOW: "text-gray-400", NORMAL: "text-blue-500", HIGH: "text-amber-500", URGENT: "text-red-500" };
                    return (<tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{t.subject}</td>
                      <td className="p-3 text-gray-500">{t.organization.name}</td>
                      <td className="p-3"><span className={`font-medium ${priorityIcon[t.priority] ?? ""}`}>{t.priority}</span></td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[t.status] ?? ""}`}>{t.status}</span></td>
                      <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Select options={[
                          { value: "OPEN", label: "Open" }, { value: "IN_PROGRESS", label: "In Progress" },
                          { value: "RESOLVED", label: "Resolved" }, { value: "CLOSED", label: "Closed" },
                        ]} value={t.status} onChange={async (e) => {
                          await fetch(`/api/owner/tickets/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) });
                          loadTickets();
                        }} />
                      </td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {planDialog !== undefined && (
        <Dialog open onClose={() => setPlanDialog(undefined)} title={planDialog ? "Edit Plan" : "New Plan"}>
          <PlanForm plan={planDialog} onClose={() => setPlanDialog(undefined)} onSave={refreshPlans} />
        </Dialog>
      )}

      {orgPlanDialog && (
        <Dialog open onClose={() => setOrgPlanDialog(null)} title={`Manage Plan — ${orgPlanDialog.name}`}>
          <OrgPlanForm org={orgPlanDialog} plans={plans} onClose={() => setOrgPlanDialog(null)} onSave={refreshOrgs} />
        </Dialog>
      )}

      {notifyOpen && (
        <Dialog open onClose={() => setNotifyOpen(false)} title="Send Notification">
          <NotificationForm onClose={() => setNotifyOpen(false)} />
        </Dialog>
      )}

      {couponDialog !== undefined && (
        <Dialog open onClose={() => setCouponDialog(undefined)} title={couponDialog ? "Edit Coupon" : "New Coupon"}>
          <CouponForm coupon={couponDialog} onClose={() => setCouponDialog(undefined)} onSave={() => { loadBilling(); setCouponDialog(undefined); }} />
        </Dialog>
      )}

      {ticketDialog && (
        <Dialog open onClose={() => setTicketDialog(false)} title="New Support Ticket">
          <NewTicketForm onClose={() => { setTicketDialog(false); loadTickets(); }} />
        </Dialog>
      )}
    </div>
  );
}
