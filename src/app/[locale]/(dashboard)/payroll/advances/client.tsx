"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type Advance = { id: string; employeeId: string; employee: { id: string; name: string }; amount: number; date: Date; description: string | null; status: string; repaidAmount: number; installments: number };
type Props = { advances: Advance[] };

export function AdvancesClient({ advances }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: "", amount: 0, date: new Date().toISOString().split("T")[0], description: "", status: "PENDING", repaidAmount: 0, installments: 1 });
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
        <PageHeader title="Advances" description="Employee salary advances"
          actions={<Button onClick={() => { setEditingId(null); setForm({ employeeId: "", amount: 0, date: new Date().toISOString().split("T")[0], description: "", status: "PENDING", repaidAmount: 0, installments: 1 }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> Add Advance</Button>} />
        <div className="grid grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Advances</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{totalAmount.toFixed(2)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Approvals</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Repaid</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">﷼{totalRepaid.toFixed(2)}</p></CardContent></Card>
        </div>
        <DataTable searchable columns={[
          { key: "employee", label: "Employee", render: (c) => (c as Advance).employee?.name },
          { key: "amount", label: "Amount", render: (c) => `﷼${(c as Advance).amount.toFixed(2)}` },
          { key: "status", label: "Status", render: (c) => <Badge variant={(c as Advance).status === "PAID" ? "success" : (c as Advance).status === "PENDING" ? "warning" : "info"}>{(c as Advance).status}</Badge> },
          { key: "repaidAmount", label: "Repaid", render: (c) => `﷼${(c as Advance).repaidAmount.toFixed(2)}` },
          { key: "installments", label: "Installments" },
          { key: "actions", label: "", render: (c) => { const cur = c as Advance; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={advances as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? "Edit Advance" : "Add Advance"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
            <Input label="Amount" type="number" step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div><label className="block text-sm font-medium mb-1">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="PAID">Paid</option><option value="REJECTED">Rejected</option></select></div>
            <Input label="Installments" type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })} />
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Advance">
          <p className="text-sm text-gray-600 mb-6">Are you sure?</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete"}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
