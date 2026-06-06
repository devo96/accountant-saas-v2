"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Advance = { id: string; employeeId: string; employee: { id: string; name: string }; amount: number; date: Date; description: string | null; status: string; repaidAmount: number; installments: number };
type Props = { advances: Advance[] };

export function AdvancesClient({ advances }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: "", amount: 0, date: new Date().toISOString().split("T")[0], description: "", status: "PENDING", repaidAmount: 0, installments: 1 });
  const t = useTranslations("advances");
  const [loading, setLoading] = useState(false);

  const totalAmount = advances.reduce((s, a) => s + a.amount, 0);
  const totalRepaid = advances.reduce((s, a) => s + a.repaidAmount, 0);
  const pendingCount = advances.filter((a) => a.status === "PENDING").length;

  function startEdit(a: Advance) {
    setForm({ employeeId: a.employeeId, amount: a.amount, date: new Date(a.date).toISOString().split("T")[0], description: a.description || "", status: a.status, repaidAmount: a.repaidAmount, installments: a.installments });
    setEditingId(a.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/payroll/advances/${editingId}` : "/api/payroll/advances";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/advances/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")}
          actions={<Button onClick={() => { setEditingId(null); setForm({ employeeId: "", amount: 0, date: new Date().toISOString().split("T")[0], description: "", status: "PENDING", repaidAmount: 0, installments: 1 }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("add")}</Button>} />
        <div className="grid grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("totalAdvances")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("pendingApprovals")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("totalRepaid")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalRepaid)}</p></CardContent></Card>
        </div>
        <DataTable searchable columns={[
          { key: "employee", label: t("employee"), render: (c) => (c as Advance).employee?.name },
          { key: "amount", label: t("amount"), render: (c) => formatCurrency((c as Advance).amount) },
          { key: "status", label: t("status"), render: (c) => <Badge variant={(c as Advance).status === "PAID" ? "success" : (c as Advance).status === "PENDING" ? "warning" : "info"}>{(c as Advance).status}</Badge> },
          { key: "repaidAmount", label: t("repaid"), render: (c) => formatCurrency((c as Advance).repaidAmount) },
          { key: "installments", label: t("installments") },
          { key: "actions", label: "", render: (c) => { const cur = c as Advance; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={advances as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("edit") : t("add")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("employeeId")} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
            <Input label={t("amount")} type="number" step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
            <Input label={t("date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div><label className="block text-sm font-medium mb-1">{t("status")}</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="PENDING">{t("pending")}</option><option value="APPROVED">{t("approved")}</option><option value="PAID">{t("paid")}</option><option value="REJECTED">{t("rejected")}</option></select></div>
            <Input label={t("installments")} type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })} />
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
