"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Task = { id: string; projectId: string | null; project: { id: string; name: string } | null; title: string; description: string | null; assigneeId: string | null; assignee: { id: string; name: string } | null; dueDate: Date | null; priority: string; status: string; estimatedHours: number; actualHours: number };
type Props = { tasks: Task[] };

const priorityColor: Record<string, string> = { LOW: "text-gray-400", MEDIUM: "text-blue-500", HIGH: "text-amber-500", URGENT: "text-red-500" };
const statusVariant: Record<string, "info" | "success" | "warning" | "danger" | "outline"> = { TODO: "info", IN_PROGRESS: "warning", DONE: "success", CANCELLED: "danger" };

export function TasksClient({ tasks }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ projectId: "", title: "", description: "", assigneeId: "", dueDate: "", priority: "MEDIUM", status: "TODO", estimatedHours: 0, actualHours: 0 });
  const t = useTranslations("tasks");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const overdueCount = tasks.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date()).length;

  function startEdit(t: Task) {
    setForm({ projectId: t.projectId || "", title: t.title, description: t.description || "", assigneeId: t.assigneeId || "", dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "", priority: t.priority, status: t.status, estimatedHours: t.estimatedHours, actualHours: t.actualHours });
    setEditingId(t.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/tasks/${editingId}` : "/api/tasks";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); } else { const data = await res.json().catch(() => ({})); setErrorMessage(data.error || t("errorOccurred")); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); } else { const data = await res.json().catch(() => ({})); setErrorMessage(data.error || t("errorOccurred")); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("count", { count: tasks.length })}
          actions={<Button onClick={() => { setEditingId(null); setForm({ projectId: "", title: "", description: "", assigneeId: "", dueDate: "", priority: "MEDIUM", status: "TODO", estimatedHours: 0, actualHours: 0 }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("add")}</Button>} />
        {errorMessage && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2"><ListTodo className="h-4 w-4" /> {t("todo")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{todoCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("inProgress")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{inProgressCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">{t("completed")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{doneCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-500">{t("overdue")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{overdueCount}</p></CardContent></Card>
        </div>
        <DataTable searchable columns={[
          { key: "title", label: t("titleColumn") },
          { key: "project", label: t("projectColumn"), render: (c) => (c as Task).project?.name || "-" },
          { key: "assignee", label: t("assigneeColumn"), render: (c) => (c as Task).assignee?.name || "-" },
          { key: "priority", label: t("priorityColumn"), render: (c) => <span className={`font-medium ${priorityColor[(c as Task).priority] || ""}`}>{(c as Task).priority}</span> },
          { key: "status", label: t("statusColumn"), render: (c) => <Badge variant={statusVariant[(c as Task).status] || "outline"}>{(c as Task).status.replace(/_/g, " ")}</Badge> },
          { key: "actions", label: "", render: (c) => { const cur = c as Task; return (<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>); }},
        ]} data={tasks as unknown as Record<string, unknown>[]} />

        <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("edit") : t("add")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("titleColumn")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label={t("projectId")} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
            <Input label={t("assigneeId")} value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} />
            <Input label={t("dueDate")} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <div><label className="block text-sm font-medium mb-1">{t("priority")}</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="LOW">{t("priorityLow")}</option><option value="MEDIUM">{t("priorityMedium")}</option><option value="HIGH">{t("priorityHigh")}</option><option value="URGENT">{t("priorityUrgent")}</option></select></div>
            <div><label className="block text-sm font-medium mb-1">{t("statusColumn")}</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="TODO">{t("todo")}</option><option value="IN_PROGRESS">{t("inProgress")}</option><option value="DONE">{t("completed")}</option><option value="CANCELLED">{t("cancelled")}</option></select></div>
            <div className="grid grid-cols-2 gap-4"><Input label={t("estimatedHours")} type="number" step={0.5} value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} /><Input label={t("actualHours")} type="number" step={0.5} value={form.actualHours} onChange={(e) => setForm({ ...form, actualHours: Number(e.target.value) })} /></div>
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
