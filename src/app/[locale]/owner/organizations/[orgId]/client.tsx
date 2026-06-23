"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Badge } from "@/components/ui/badge"; import { Button } from "@/components/ui/button"; import { Tabs } from "@/components/ui/tabs"; import { Dialog } from "@/components/ui/dialog"; import { Select } from "@/components/ui/select"; import { Textarea } from "@/components/ui/textarea"; import { Input } from "@/components/ui/input"; import { useToast } from "@/components/ui/toast"; import { AlertTriangle, Building2, CreditCard, TicketCheck, ShieldCheck, Eye, Calendar, DollarSign, Package, Users as UsersIcon, FileText, PackageOpen, Crown, Play, LogIn, ArrowRight, X, Send, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Wifi, WifiOff, RefreshCw } from "lucide-react"; import { useState, useEffect, useCallback } from "react"; import Link from "next/link";

type OrgProfile = { id: string; name: string; email: string | null; phone: string | null; address: string | null; logo: string | null; commercialReg: string | null; taxNumber: string | null; createdAt: string; };
type PlanInfo = { id: string; name: string; tier: string; status: string; startsAt: string; endsAt: string | null; trialEndsAt: string | null; autoRenew: boolean; overrides: any; } | null;
type StatsInfo = { totalInvoices: number; totalItems: number; totalEmployees: number; totalUsers: number; totalSales: number; };
type PaymentInfo = { id: string; amount: number; currency: string; type: string; status: string; paymentMethod: string | null; reason: string | null; createdAt: string; subscriptionStart: string | null; subscriptionEnd: string | null; };
type TicketInfo = { id: string; subject: string; message: string; priority: string; status: string; createdBy: string; createdAt: string; };
type AuditInfo = { id: string; action: string; entity: string; entityId: string | null; oldValue: any; newValue: any; createdAt: string; };
type ProfileData = { org: OrgProfile; plan: PlanInfo; stats: StatsInfo; recentErrors: { id: string; action: string; createdAt: string; entity: string }[]; payments: PaymentInfo[]; tickets: TicketInfo[]; auditLogs: AuditInfo[]; zatcaConnected: boolean; integrations: { name: string; status: string; lastSync: string | null }[]; };

const statusStyles: Record<string, string> = { ACTIVE: "bg-green-100 text-green-700", TRIALING: "bg-primary-100 text-primary-700", EXPIRED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-500", PAUSED: "bg-amber-100 text-amber-700" };
const priorityStyles: Record<string, string> = { URGENT: "bg-red-100 text-red-700", HIGH: "bg-orange-100 text-orange-700", NORMAL: "bg-primary-100 text-primary-700", LOW: "bg-gray-100 text-gray-500" };
const ticketStatusStyles: Record<string, string> = { OPEN: "bg-primary-100 text-primary-700", IN_PROGRESS: "bg-amber-100 text-amber-700", RESOLVED: "bg-green-100 text-green-700", CLOSED: "bg-gray-100 text-gray-500" };
const eventStyles: Record<string, string> = { SUCCESS: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-700", PENDING: "bg-amber-100 text-amber-700" };

function formatDate(d: string, locale: string) { return new Date(d).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function formatCurrency(n: number) { return n.toLocaleString("ar-SA", { style: "currency", currency: "SAR" }); }

function ErrorBanner({ errors, t, locale }: { errors: ProfileData["recentErrors"]; t: (k: string, p?: any) => string; locale: string }) {
  if (errors.length === 0) return null;
  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">{t("errorBannerTitle")}</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t("errorCode")}: {errors[0].action} — {t("errorTime")}: {formatDate(errors[0].createdAt, locale)}</p>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100">{t("viewErrorDetails")}</Button>
    </div>
  );
}

function Tab1Overview({ data, t, locale, onStatusChange }: { data: ProfileData; t: (k: string, p?: any) => string; locale: string; onStatusChange: () => void }) {
  const { org, plan, stats } = data;
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState(plan?.status ?? "ACTIVE");
  const [changing, setChanging] = useState(false);
  const { toast } = useToast();

  async function handleStatusChange() {
    setChanging(true);
    const r = await fetch(`/api/owner/orgs/${org.id}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setChanging(false);
    if (!r.ok) { toast({ title: t("errorTitle"), message: t("statusChangeFailed"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: t("statusChanged"), type: "success" });
    setStatusDialog(false);
    onStatusChange();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />{t("generalInfo")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500 block text-xs">{t("clientId")}</span><span className="font-medium">{org.id.slice(0, 8)}...</span></div>
              <div><span className="text-gray-500 block text-xs">{t("commercialReg")}</span><span className="font-medium">{org.commercialReg || "—"}</span></div>
              <div><span className="text-gray-500 block text-xs">{t("unifiedNumber")}</span><span className="font-medium">{org.taxNumber || "—"}</span></div>
              <div><span className="text-gray-500 block text-xs">{t("contactPerson")}</span><span className="font-medium">{org.name}</span></div>
              <div><span className="text-gray-500 block text-xs">{t("phone")}</span><span className="font-medium" dir="ltr">{org.phone || "—"}</span></div>
              <div><span className="text-gray-500 block text-xs">{t("email")}</span><span className="font-medium">{org.email || "—"}</span></div>
              <div className="col-span-2"><span className="text-gray-500 block text-xs">{t("address") ?? "Address"}</span><span className="font-medium">{org.address || "—"}</span></div>
              <div><span className="text-gray-500 block text-xs">{t("registrationDate")}</span><span className="font-medium">{formatDate(org.createdAt, locale)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" />{t("subscriptionStatus")}</CardTitle>
            {plan && <Button size="sm" variant="ghost" onClick={() => { setNewStatus(plan.status); setStatusDialog(true); }}><RefreshCw className="h-3 w-3" /></Button>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-gray-500 block text-xs">{t("currentPlan")}</span><span className="font-medium">{plan?.name ?? "—"}</span></div>
            {plan && <div><span className="text-gray-500 block text-xs">{t("subscriptionBadge")}</span><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${statusStyles[plan.status] ?? ""}`}>{t(`status${plan.status}`)}</span></div>}
            <div><span className="text-gray-500 block text-xs">{t("expiryDate")}</span><span className="font-medium">{plan?.endsAt ? formatDate(plan.endsAt, locale) : "—"}</span></div>
            {plan?.trialEndsAt && <div><span className="text-gray-500 block text-xs">{t("orgTrial")}</span><span className="font-medium">{formatDate(plan.trialEndsAt, locale)}</span></div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><FileText className="h-6 w-6 text-primary-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.totalInvoices}</p><p className="text-xs text-gray-500">{t("totalInvoices")}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><PackageOpen className="h-6 w-6 text-purple-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.totalItems}</p><p className="text-xs text-gray-500">{t("totalProducts")}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><UsersIcon className="h-6 w-6 text-green-600 mx-auto mb-1" /><p className="text-2xl font-bold">{stats.totalEmployees + stats.totalUsers}</p><p className="text-xs text-gray-500">{t("totalEmployees")}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="h-6 w-6 text-amber-600 mx-auto mb-1" /><p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p><p className="text-xs text-gray-500">{t("totalSales")}</p></CardContent></Card>
      </div>

      {statusDialog && (
        <Dialog open onClose={() => setStatusDialog(false)} title={t("changeStatus")}>
          <div className="space-y-3">
            <Select options={["ACTIVE", "TRIALING", "EXPIRED", "CANCELLED", "PAUSED"].map((s) => ({ value: s, label: t(`status${s}`) }))} value={newStatus} onChange={(e) => setNewStatus(e.target.value)} />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleStatusChange} disabled={changing} className="flex-1">{changing ? t("changingStatus") : t("formSave")}</Button>
              <Button variant="outline" onClick={() => setStatusDialog(false)}>{t("formCancel")}</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function PaymentBadge({ status, t }: { status: string; t: (k: string, p?: any) => string }) {
  if (status === "SUCCESS") return <Badge variant="success">{t("paymentSuccess")}</Badge>;
  if (status === "FAILED") return <Badge variant="danger">{t("paymentFailed")}</Badge>;
  return <Badge variant="warning">{t("paymentPending")}</Badge>;
}

function getEventLabel(action: string, entity: string, t: (k: string, p?: any) => string) {
  const a = action.toUpperCase();
  if (a.includes("LOGIN")) return t("loginAttempt");
  if (a.includes("UPDATE") || a.includes("CHANGE") || a.includes("EDIT")) return t("settingsChange");
  if (a.includes("UPGRADE") || a.includes("PLAN")) return t("packageUpgrade");
  if (a.includes("PAYMENT") && a.includes("SUCCESS")) return t("paymentSuccess");
  if (a.includes("PAYMENT") && a.includes("FAIL")) return t("paymentFailed");
  return `${action} — ${entity}`;
}

function Tab2Activity({ data, t, locale }: { data: ProfileData; t: (k: string, p?: any) => string; locale: string }) {
  const events = [
    ...data.payments.map((p) => ({ id: p.id, type: "payment", date: p.createdAt, status: p.status, payment: p })),
    ...data.auditLogs.map((l) => ({ id: l.id, type: "audit", date: l.createdAt, status: "INFO", audit: l })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 100);

  if (events.length === 0) return <div className="text-center py-12 text-gray-400">{t("noAuditLogs")}</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />{t("tabActivityTitle")}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("eventType")}</th><th className="p-3 font-medium text-gray-500">{t("eventDateTime")}</th><th className="p-3 font-medium text-gray-500">{t("eventStatus")}</th><th className="p-3 font-medium text-gray-500">{t("eventDetails")}</th></tr></thead>
            <tbody>
              {events.map((ev) => {
                const isPayment = ev.type === "payment";
                const p = isPayment ? (ev as any).payment as PaymentInfo : null;
                const audit = !isPayment ? (ev as any).audit as AuditInfo : null;
                return (
                  <tr key={ev.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      {isPayment ? <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-green-600" />{t("paymentSuccess")}</span> : <span>{getEventLabel(audit!.action, audit!.entity, t)}</span>}
                    </td>
                    <td className="p-3 text-gray-500" dir="ltr">{formatDate(ev.date, "en")}</td>
                    <td className="p-3">{isPayment ? <PaymentBadge status={p!.status} t={t} /> : <Badge variant="info">{audit!.action}</Badge>}</td>
                    <td className="p-3 text-gray-600 max-w-[200px] truncate">
                      {isPayment ? (
                        <span>
                          {formatCurrency(p!.amount)}
                          {p!.paymentMethod ? ` ${t("paymentVia")} ${p!.paymentMethod}` : ""}
                          {p!.status === "FAILED" && p!.reason ? ` — ${p!.reason}` : ""}
                        </span>
                      ) : (
                        <span>{audit!.entity} {audit!.entityId ? `#${audit!.entityId.slice(0, 6)}` : ""}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Tab3Tickets({ data, t, locale, orgId }: { data: ProfileData; t: (k: string, p?: any) => string; locale: string; orgId: string }) {
  const [selectedTicket, setSelectedTicket] = useState<TicketInfo | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState(data.tickets);
  const { toast } = useToast();

  async function handleSendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    const r = await fetch(`/api/owner/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${selectedTicket.message}\n\n--- ${t("ticketReply")} (${formatDate(new Date().toISOString(), locale)}) ---\n${replyText}`, status: "IN_PROGRESS" }),
    });
    setSending(false);
    if (!r.ok) { toast({ title: t("errorTitle"), message: t("replyFailed"), type: "error" }); return; }
    toast({ title: t("successTitle"), message: t("replySent"), type: "success" });
    const updated = await r.json();
    setTickets((prev) => prev.map((ti) => (ti.id === updated.id ? { ...ti, message: updated.message, status: updated.status } : ti)));
    setSelectedTicket((prev) => prev ? { ...prev, message: updated.message, status: updated.status } : null);
    setReplyText("");
  }

  return (
    <div>
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TicketCheck className="h-4 w-4" />{t("tabTicketsTitle")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("ticketId")}</th><th className="p-3 font-medium text-gray-500">{t("ticketSubject")}</th><th className="p-3 font-medium text-gray-500">{t("ticketPriority")}</th><th className="p-3 font-medium text-gray-500">{t("ticketStatus")}</th><th className="p-3 font-medium text-gray-500">{t("ticketDate")}</th><th className="p-3"></th></tr></thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">{t("noTickets")}</td></tr>
                ) : tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-[10px]">#{ticket.id.slice(0, 6)}</td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{ticket.subject}</td>
                    <td className="p-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityStyles[ticket.priority] ?? ""}`}>{t(ticket.priority === "NORMAL" ? "medium" : ticket.priority.toLowerCase())}</span></td>
                    <td className="p-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ticketStatusStyles[ticket.status] ?? ""}`}>{t(ticket.status === "IN_PROGRESS" ? "inProgress" : ticket.status.toLowerCase())}</span></td>
                    <td className="p-3 text-gray-500">{formatDate(ticket.createdAt, locale)}</td>
                    <td className="p-3"><Button size="sm" variant="ghost" onClick={() => setSelectedTicket(ticket)}><Eye className="h-3 w-3" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedTicket && (
        <Dialog open onClose={() => { setSelectedTicket(null); setReplyText(""); }} title={`${t("ticketDetails")} #${selectedTicket.id.slice(0, 6)}`} className="max-w-2xl">
          <div className="space-y-4 text-sm">
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityStyles[selectedTicket.priority] ?? ""}`}>{t(selectedTicket.priority === "NORMAL" ? "medium" : selectedTicket.priority.toLowerCase())}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ticketStatusStyles[selectedTicket.status] ?? ""}`}>{t(selectedTicket.status === "IN_PROGRESS" ? "inProgress" : selectedTicket.status.toLowerCase())}</span>
              <span className="text-gray-400 text-[10px]">{formatDate(selectedTicket.createdAt, locale)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</div>
            <div className="border-t pt-3 space-y-2">
              <label className="block text-xs font-medium text-gray-500">{t("replyMessage")}</label>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={t("replyPlaceholder")} rows={3} />
              <div className="flex justify-end">
                <Button onClick={handleSendReply} disabled={sending || !replyText.trim()} size="sm"><Send className="h-3 w-3 ml-1" />{sending ? t("changingStatus") : t("sendReply")}</Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Tab4Compliance({ data, t, locale }: { data: ProfileData; t: (k: string, p?: any) => string; locale: string }) {
  const { zatcaConnected, integrations } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{t("zatkaStatus")}</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3">
          {zatcaConnected ? <Wifi className="h-8 w-8 text-green-600" /> : <WifiOff className="h-8 w-8 text-red-600" />}
          <div>
            <p className="font-medium">{zatcaConnected ? t("connected") : t("disconnected")}</p>
            <p className="text-xs text-gray-500">{t("lastSync")}: {zatcaConnected ? formatDate(new Date().toISOString(), locale) : "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ExternalLink className="h-4 w-4" />{t("externalIntegrations")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("integrationName")}</th><th className="p-3 font-medium text-gray-500">{t("syncStatus")}</th><th className="p-3 font-medium text-gray-500">{t("lastSyncTime")}</th></tr></thead>
              <tbody>
                {integrations.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-gray-400">{t("noIntegrations")}</td></tr>
                ) : integrations.map((int, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{int.name}</td>
                    <td className="p-3">{int.status === "connected" ? <Badge variant="success">{t("connected")}</Badge> : <Badge variant="danger">{t("disconnected")}</Badge>}</td>
                    <td className="p-3 text-gray-500">{int.lastSync ? formatDate(int.lastSync, locale) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrgProfileClient({ orgId, orgName }: { orgId: string; orgName: string }) {
  const t = useTranslations("ownerPanel");
  const locale = typeof window !== "undefined" ? (document.documentElement.dir === "rtl" ? "ar" : "en") : "ar";
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/owner/orgs/${orgId}/profile`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const tabs = [
    { key: "overview", label: t("tabOverview"), icon: <Building2 className="h-4 w-4" /> },
    { key: "activity", label: t("tabActivity"), icon: <Clock className="h-4 w-4" /> },
    { key: "tickets", label: t("tabTickets"), icon: <TicketCheck className="h-4 w-4" /> },
    { key: "compliance", label: t("tabCompliance"), icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/owner/organizations" className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" />{t("backToOrgs")}</Link>
            <h1 className="text-lg font-bold mt-1">{orgName}</h1>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>{t("errorTitle")}</p>
        <Link href="/owner/organizations" className="text-primary-600 hover:underline text-sm">{t("backToOrgs")}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/owner/organizations" className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" />{t("backToOrgs")}</Link>
          <h1 className="text-lg font-bold mt-1">{orgName}</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchProfile}><RefreshCw className="h-3 w-3 ml-1" />{t("or")}</Button>
        </div>
      </div>

      <ErrorBanner errors={data.recentErrors} t={t} locale={locale} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && <Tab1Overview data={data} t={t} locale={locale} onStatusChange={fetchProfile} />}
      {activeTab === "activity" && <Tab2Activity data={data} t={t} locale={locale} />}
      {activeTab === "tickets" && <Tab3Tickets data={data} t={t} locale={locale} orgId={orgId} />}
      {activeTab === "compliance" && <Tab4Compliance data={data} t={t} locale={locale} />}
    </div>
  );
}
