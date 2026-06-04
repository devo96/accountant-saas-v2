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

type Category = { id: string; name: string; nameAr: string | null; type: string; description: string | null; active: boolean; createdAt: Date };
type Props = { categories: Category[] };

export function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const t = useTranslations("nav");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", type: "PRODUCT", description: "", active: true });
  const [loading, setLoading] = useState(false);

  function startEdit(c: Category) {
    setForm({ name: c.name, nameAr: c.nameAr || "", type: c.type, description: c.description || "", active: c.active });
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
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/categories/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("categories")} description={`${categories.length} categories configured`}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", nameAr: "", type: "PRODUCT", description: "", active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> Add Category</Button>} />
        <DataTable searchable columns={[
          { key: "name", label: "Name" },
          { key: "nameAr", label: "Arabic Name", render: (c) => (c as Category).nameAr || "-" },
          { key: "type", label: "Type", render: (c) => <Badge variant="outline" className="capitalize">{(c as Category).type.toLowerCase()}</Badge> },
          { key: "active", label: "Status", render: (c) => <Badge variant={(c as Category).active ? "success" : "danger"}>{(c as Category).active ? "Active" : "Inactive"}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Category; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={categories as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? "Edit Category" : "Add Category"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Arabic Name" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            <div><label className="block text-sm font-medium mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="PRODUCT">Product</option><option value="SERVICE">Service</option><option value="BOTH">Both</option></select></div>
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Category">
          <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this category?</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
