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
import { useToast } from "@/components/ui/toast";

type Category = { id: string; name: string; type: string; description: string | null; active: boolean; createdAt: Date };
type Props = { categories: Category[] };

export function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("inventoryCategories");
  const tc = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "PRODUCT", description: "", active: true });
  const [loading, setLoading] = useState(false);

  function startEdit(c: Category) {
    setForm({ name: c.name, type: c.type, description: c.description || "", active: c.active });
    setEditingId(c.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/inventory/categories/${editingId}` : "/api/inventory/categories";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); toast({ title: t("save"), type: "success" }); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/categories/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); toast({ title: t("delete"), type: "success" }); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("count", { count: categories.length })}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", type: "PRODUCT", description: "", active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("add")}</Button>} />
        <DataTable searchable columns={[
          { key: "name", label: t("name") },
          { key: "type", label: t("type"), render: (c) => <Badge variant="outline" className="capitalize">{(c as Category).type.toLowerCase()}</Badge> },
          { key: "active", label: tc("status"), render: (c) => <Badge variant={(c as Category).active ? "success" : "danger"}>{(c as Category).active ? tc("active") : tc("inactive")}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Category; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={categories as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("edit") : t("add")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div><label className="block text-sm font-medium mb-1">{t("type")}</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="PRODUCT">{t("product")}</option><option value="SERVICE">{t("service")}</option><option value="BOTH">{t("both")}</option></select></div>
            <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> {tc("active")}</label>
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
