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

type Term = { id: string; name: string; nameAr: string | null; dueDays: number; discountDays: number; discountPercent: number; active: boolean };
type Props = { terms: Term[] };

export function PaymentTermsClient({ terms }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", dueDays: 30, discountDays: 0, discountPercent: 0, active: true });
  const [loading, setLoading] = useState(false);

  function startEdit(t: Term) {
    setForm({ name: t.name, nameAr: t.nameAr || "", dueDays: t.dueDays, discountDays: t.discountDays, discountPercent: Number(t.discountPercent), active: t.active });
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
        <PageHeader title="Payment Terms" description={`${terms.length} payment terms configured`}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", nameAr: "", dueDays: 30, discountDays: 0, discountPercent: 0, active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> Add Payment Term</Button>} />
        <DataTable searchable columns={[
          { key: "name", label: "Name" },
          { key: "nameAr", label: "Arabic Name", render: (c) => (c as Term).nameAr || "-" },
          { key: "dueDays", label: "Due (days)" },
          { key: "discountDays", label: "Disc. Days" },
          { key: "discountPercent", label: "Disc. %", render: (c) => `${Number((c as Term).discountPercent)}%` },
          { key: "active", label: "Status", render: (c) => <Badge variant={(c as Term).active ? "success" : "danger"}>{(c as Term).active ? "Active" : "Inactive"}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Term; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={terms as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? "Edit Payment Term" : "Add Payment Term"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Arabic Name" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            <Input label="Due Days" type="number" value={form.dueDays} onChange={(e) => setForm({ ...form, dueDays: Number(e.target.value) })} required />
            <Input label="Discount Days" type="number" value={form.discountDays} onChange={(e) => setForm({ ...form, discountDays: Number(e.target.value) })} />
            <Input label="Discount %" type="number" step={0.01} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Payment Term">
          <p className="text-sm text-gray-600 mb-6">Are you sure? This may affect existing invoices.</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
