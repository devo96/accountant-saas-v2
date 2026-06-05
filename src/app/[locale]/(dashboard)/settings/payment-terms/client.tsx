"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Term = { id: string; name: string; dueDays: number; discountDays: number; discountPercent: number; active: boolean };
type Props = { terms: Term[] };

export function PaymentTermsClient({ terms }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", dueDays: 30, discountDays: 0, discountPercent: 0, active: true });
  const t = useTranslations("paymentTerms");
  const [loading, setLoading] = useState(false);

  function startEdit(t: Term) {
    setForm({ name: t.name, dueDays: t.dueDays, discountDays: t.discountDays, discountPercent: Number(t.discountPercent), active: t.active });
    setEditingId(t.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/settings/payment-terms/${editingId}` : "/api/settings/payment-terms";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/payment-terms/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description", { count: terms.length })}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", dueDays: 30, discountDays: 0, discountPercent: 0, active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("add")}</Button>} />
        <DataTable searchable columns={[
          { key: "name", label: t("name") },
          { key: "dueDays", label: t("dueDays") },
          { key: "discountDays", label: t("discountDays") },
          { key: "discountPercent", label: t("discountPercent"), render: (c) => `${Number((c as Term).discountPercent)}%` },
          { key: "active", label: t("status"), render: (c) => <Badge variant={(c as Term).active ? "success" : "danger"}>{(c as Term).active ? t("active") : t("inactive")}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Term; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={terms as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("edit") : t("add")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label={t("dueDays")} type="number" value={form.dueDays} onChange={(e) => setForm({ ...form, dueDays: Number(e.target.value) })} required />
            <Input label={t("discountDays")} type="number" value={form.discountDays} onChange={(e) => setForm({ ...form, discountDays: Number(e.target.value) })} />
            <Input label={t("discountPercent")} type="number" step={0.01} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> {t("active")}</label>
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
