"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Dimension = { id: string; name: string; accountsCount: number };

export function CostCentersClient({ dimensions }: { dimensions: Dimension[] }) {
  const router = useRouter();
  const td = useTranslations("accountingDimensions");
  const s = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) { setShowAdd(false); setName(""); router.refresh(); }
      else { const data = await res.json().catch(() => ({})); setError(data.error || s("errorOccurred")); }
    } catch { setError(s("errorOccurred")); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm(td("deleteConfirm"))) return;
    setError("");
    try {
      const res = await fetch(`/api/cost-centers/${id}`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || s("errorOccurred")); }
      else router.refresh();
    } catch { setError(s("errorOccurred")); }
  }

  return (
    <FadeIn>
      <PageHeader
        title={td("pageTitle")}
        description={td("pageDescription", { count: dimensions.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 ms-1" /> {td("newDimension")}
          </Button>
        }
      />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{td("name")}</TableHead>
              <TableHead>{td("accountsCount")}</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dimensions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <FolderTree className="h-8 w-8 text-gray-400" />
                    <span>{td("noResults")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              dimensions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{d.accountsCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setName(""); setError(""); }} title={td("dialogTitle")}>
        <div className="space-y-4">
          <Input label={td("name")} value={name} onChange={(e) => setName(e.target.value)} required placeholder={td("namePlaceholder")} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowAdd(false); setName(""); setError(""); }}>{td("cancel")}</Button>
            <Button onClick={handleCreate} disabled={submitting || !name.trim()}>
              {submitting ? td("saving") : td("save")}
            </Button>
          </div>
        </div>
      </Dialog>
    </FadeIn>
  );
}
