"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2, FolderKanban, BriefcaseBusiness } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Project = { id: string; name: string; description: string | null; startDate: Date | null; endDate: Date | null; status: string; budget: number; customerId: string | null; customer: { id: string; name: string } | null; managerId: string | null; manager: { id: string; name: string } | null; progress: number };
type Props = { projects: Project[] };

const statusVariant: Record<string, "info" | "success" | "warning" | "danger" | "outline"> = { PLANNING: "info", ACTIVE: "success", ON_HOLD: "warning", COMPLETED: "outline", CANCELLED: "danger" };

export function ProjectsClient({ projects }: Props) {
  const router = useRouter();
  const t = useTranslations("projects");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "", status: "PLANNING", budget: 0, customerId: "", managerId: "", progress: 0 });
  const [loading, setLoading] = useState(false);

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  function startEdit(p: Project) {
    setForm({ name: p.name, description: p.description || "", startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "", endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "", status: p.status, budget: p.budget, customerId: p.customerId || "", managerId: p.managerId || "", progress: p.progress });
    setEditingId(p.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/projects/${editingId}` : "/api/projects";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("count", { count: projects.length })}
          actions={<Button onClick={() => { setEditingId(null); setForm({ name: "", description: "", startDate: "", endDate: "", status: "PLANNING", budget: 0, customerId: "", managerId: "", progress: 0 }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("addProject")}</Button>} />
        <div className="grid grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><FolderKanban className="h-4 w-4" /> {t("totalProjects")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{projects.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" /> {t("active")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{activeCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("completed")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{completedCount}</p></CardContent></Card>
        </div>
        <DataTable searchable columns={[
          { key: "name", label: t("name") },
          { key: "customer", label: t("customer"), render: (c) => (c as Project).customer?.name || "-" },
          { key: "manager", label: t("manager"), render: (c) => (c as Project).manager?.name || "-" },
          { key: "status", label: t("status"), render: (c) => <Badge variant={statusVariant[(c as Project).status] || "outline"} className="capitalize">{(c as Project).status.toLowerCase().replace(/_/g, " ")}</Badge> },
          { key: "budget", label: t("budget"), render: (c) => `﷼${(c as Project).budget.toFixed(2)}` },
          { key: "progress", label: t("progress"), render: (c) => `${(c as Project).progress}%` },
          { key: "actions", label: "", render: (c) => { const cur = c as Project; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={projects as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("editProject") : t("addProject")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4"><Input label={t("startDate")} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /><Input label={t("endDate")} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">{t("status")}</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="PLANNING">Planning</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On Hold</option><option value="COMPLETED">{t("completed")}</option><option value="CANCELLED">Cancelled</option></select></div>
            <Input label={t("budget")} type="number" step={0.01} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            <Input label={t("progress")} type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>{t("cancel")}</Button><Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button></div>
          </form>
        </Dialog>

        <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title={t("deleteProject")}>
          <p className="text-sm text-gray-600 mb-6">{t("confirmDelete")}</p>
          <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeletingId(null)}>{t("cancel")}</Button><Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? t("deleting") : t("deleteProject")}</Button></div>
        </Dialog>
      </div>
    </FadeIn>
  );
}
