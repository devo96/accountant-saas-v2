"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type InsuranceRec = { id: string; employeeId: string; employee: { id: string; name: string }; period: string; employeeShare: number; employerShare: number; totalContribution: number; salary: number; status: string };
type Props = { records: InsuranceRec[] };

export function SocialInsuranceClient({ records }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: "", period: "", employeeShare: 0, employerShare: 0, salary: 0, status: "PENDING" });
  const t = useTranslations("socialInsurance");
  const [loading, setLoading] = useState(false);

  const totalEmployeeShare = records.reduce((s, r) => s + r.employeeShare, 0);
  const totalEmployerShare = records.reduce((s, r) => s + r.employerShare, 0);
  const totalContributions = records.reduce((s, r) => s + r.totalContribution, 0);

  function startEdit(r: InsuranceRec) {
    setForm({ employeeId: r.employeeId, period: r.period, employeeShare: r.employeeShare, employerShare: r.employerShare, salary: r.salary, status: r.status });
    setEditingId(r.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/payroll/social-insurance/${editingId}` : "/api/payroll/social-insurance";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/social-insurance/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")}
          actions={<Button onClick={() => { setEditingId(null); setForm({ employeeId: "", period: "", employeeShare: 0, employerShare: 0, salary: 0, status: "PENDING" }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("add")}</Button>} />
        <div className="grid grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("employeeShare")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{totalEmployeeShare.toFixed(2)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("employerShare")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{totalEmployerShare.toFixed(2)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("totalContributions")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{totalContributions.toFixed(2)}</p></CardContent></Card>
        </div>
        <DataTable searchable columns={[
          { key: "employee", label: t("employee"), render: (c) => (c as InsuranceRec).employee?.name },
          { key: "period", label: t("period") },
          { key: "salary", label: t("salary"), render: (c) => `﷼${(c as InsuranceRec).salary.toFixed(2)}` },
          { key: "employeeShare", label: t("employeeShare"), render: (c) => `﷼${(c as InsuranceRec).employeeShare.toFixed(2)}` },
          { key: "employerShare", label: t("employerShare"), render: (c) => `﷼${(c as InsuranceRec).employerShare.toFixed(2)}` },
          { key: "status", label: t("status"), render: (c) => <Badge variant={(c as InsuranceRec).status === "PAID" ? "success" : "warning"}>{(c as InsuranceRec).status}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as InsuranceRec; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={records as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("edit") : t("add")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("employeeId")} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
            <Input label={t("periodPlaceholder")} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
            <Input label={t("salary")} type="number" step={0.01} value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} required />
            <Input label={t("employeeShare")} type="number" step={0.01} value={form.employeeShare} onChange={(e) => setForm({ ...form, employeeShare: Number(e.target.value) })} required />
            <Input label={t("employerShare")} type="number" step={0.01} value={form.employerShare} onChange={(e) => setForm({ ...form, employerShare: Number(e.target.value) })} required />
            <div><label className="block text-sm font-medium mb-1">{t("status")}</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="PENDING">{t("pending")}</option><option value="PAID">{t("paid")}</option></select></div>
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>{t("cancel")}</Button><Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title={t("delete")}>
          <p className="text-sm text-gray-600 mb-6">{t("confirmDelete")}</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>{t("cancel")}</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? t("deleting") : t("delete")}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
