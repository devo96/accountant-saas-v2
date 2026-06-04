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

type Branch = { id: string; name: string; nameAr: string | null; code: string; address: string | null; phone: string | null; active: boolean };
type Props = { branches: Branch[] };

export function BranchesClient({ branches }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", code: "", address: "", phone: "", active: true });
  const [loading, setLoading] = useState(false);

  function startEdit(b: Branch) {
    setForm({ name: b.name, nameAr: b.nameAr || "", code: b.code, address: b.address || "", phone: b.phone || "", active: b.active });
    setEditingId(b.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/settings/branches/${editingId}` : "/api/settings/branches";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/branches/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title="Branches" description={`${branches.length} branches configured`}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", nameAr: "", code: "", address: "", phone: "", active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> Add Branch</Button>} />
        <DataTable searchable columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "nameAr", label: "Arabic Name", render: (c) => (c as Branch).nameAr || "-" },
          { key: "address", label: "Address", render: (c) => (c as Branch).address || "-" },
          { key: "phone", label: "Phone", render: (c) => (c as Branch).phone || "-" },
          { key: "active", label: "Status", render: (c) => <Badge variant={(c as Branch).active ? "success" : "danger"}>{(c as Branch).active ? "Active" : "Inactive"}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Branch; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={branches as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? "Edit Branch" : "Add Branch"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Arabic Name" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Branch">
          <p className="text-sm text-gray-600 mb-6">Are you sure? This may affect existing invoices.</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
