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

type Unit = { id: string; name: string; nameAr: string | null; symbol: string; precision: number; active: boolean; createdAt: Date };
type Props = { units: Unit[] };

export function UnitsClient({ units }: Props) {
  const router = useRouter();
  const t = useTranslations("nav");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", symbol: "", precision: 0, active: true });
  const [loading, setLoading] = useState(false);

  function startEdit(u: Unit) {
    setForm({ name: u.name, nameAr: u.nameAr || "", symbol: u.symbol, precision: u.precision, active: u.active });
    setEditingId(u.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/inventory/units/${editingId}` : "/api/inventory/units";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/units/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("units")} description={`${units.length} units configured`}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", nameAr: "", symbol: "", precision: 0, active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> Add Unit</Button>} />
        <DataTable searchable columns={[
          { key: "name", label: "Name" },
          { key: "nameAr", label: "Arabic Name", render: (c) => (c as Unit).nameAr || "-" },
          { key: "symbol", label: "Symbol" },
          { key: "precision", label: "Precision" },
          { key: "active", label: "Status", render: (c) => <Badge variant={(c as Unit).active ? "success" : "danger"}>{(c as Unit).active ? "Active" : "Inactive"}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Unit; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={units as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? "Edit Unit" : "Add Unit"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Arabic Name" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            <Input label="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
            <Input label="Precision" type="number" value={form.precision} onChange={(e) => setForm({ ...form, precision: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Unit">
          <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this unit?</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
