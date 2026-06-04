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

type Deduction = { id: string; employeeId: string; employee: { id: string; name: string }; amount: number; date: Date; type: string; description: string | null; recurring: boolean };
type Props = { deductions: Deduction[] };

export function DeductionsClient({ deductions }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: "", amount: 0, date: new Date().toISOString().split("T")[0], type: "OTHER", description: "", recurring: false });
  const [loading, setLoading] = useState(false);

  const byType = deductions.reduce<Record<string, number>>((acc, d) => { acc[d.type] = (acc[d.type] || 0) + d.amount; return acc; }, {});
  const totalAmount = deductions.reduce((s, d) => s + d.amount, 0);

  function startEdit(d: Deduction) {
    setForm({ employeeId: d.employeeId, amount: d.amount, date: new Date(d.date).toISOString().split("T")[0], type: d.type, description: d.description || "", recurring: d.recurring });
    setEditingId(d.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/payroll/deductions/${editingId}` : "/api/payroll/deductions";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/deductions/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title="Deductions" description="Employee payroll deductions"
          actions={<Button onClick={() => { setEditingId(null); setForm({ employeeId: "", amount: 0, date: new Date().toISOString().split("T")[0], type: "OTHER", description: "", recurring: false }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> Add Deduction</Button>} />
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(byType).map(([type, amt]) => (
            <Card key={type}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{type}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{amt.toFixed(2)}</p></CardContent></Card>
          ))}
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{totalAmount.toFixed(2)}</p></CardContent></Card>
        </div>
        <DataTable searchable columns={[
          { key: "employee", label: "Employee", render: (c) => (c as Deduction).employee?.name },
          { key: "type", label: "Type", render: (c) => <Badge variant="outline">{(c as Deduction).type}</Badge> },
          { key: "amount", label: "Amount", render: (c) => `﷼${(c as Deduction).amount.toFixed(2)}` },
          { key: "recurring", label: "Recurring", render: (c) => (c as Deduction).recurring ? "Yes" : "No" },
          { key: "actions", label: "", render: (c) => { const cur = c as Deduction; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={deductions as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? "Edit Deduction" : "Add Deduction"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
            <Input label="Amount" type="number" step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <div><label className="block text-sm font-medium mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="GOSI">GOSI</option><option value="LOAN">Loan</option><option value="PENALTY">Penalty</option><option value="OTHER">Other</option></select></div>
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} /> Recurring</label>
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Deduction">
          <p className="text-sm text-gray-600 mb-6">Are you sure?</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
