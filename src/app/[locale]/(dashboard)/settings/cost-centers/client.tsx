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
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) { setShowAdd(false); setName(""); router.refresh(); }
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this cost center?")) return;
    const res = await fetch(`/api/cost-centers/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <FadeIn>
      <PageHeader
        title="Cost Centers"
        description={`${dimensions.length} cost centers`}
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 ms-1" /> Add Cost Center
          </Button>
        }
      />
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

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setName(""); }} title="Add Cost Center">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter cost center name" />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowAdd(false); setName(""); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !name.trim()}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Dialog>
    </FadeIn>
  );
}
