"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Plus, Percent } from "lucide-react";

interface Dimension {
  id: string;
  name: string;
  nameAr: string | null;
  _count: { allocations: number };
}

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
}

interface Allocation {
  id: string;
  accountId: string;
  dimensionId: string;
  percentage: number;
  account: { id: string; code: string; name: string; nameAr: string | null };
}

type Props = {
  dimensions: Dimension[];
  accounts: Account[];
  translations: Record<string, string>;
};

export function AccountingDimensionsClient({ dimensions: initialDimensions, accounts, translations: t }: Props) {
  const router = useRouter();
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [allocDim, setAllocDim] = useState<Dimension | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const [form, setForm] = useState({ name: "", nameAr: "" });
  const [saving, setSaving] = useState(false);

  const [allocForm, setAllocForm] = useState({ accountId: "", percentage: "" });
  const [allocSaving, setAllocSaving] = useState(false);

  const filtered = useMemo(
    () => dimensions.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || (d.nameAr && d.nameAr.includes(search))),
    [dimensions, search]
  );

  async function createDimension() {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/accounting-dimensions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setDimensions([...dimensions, { ...created, _count: { allocations: 0 } }]);
      setForm({ name: "", nameAr: "" });
      setShowAdd(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function openAllocations(dim: Dimension) {
    setAllocDim(dim);
    const res = await fetch(`/api/dimension-allocations?dimensionId=${dim.id}`);
    if (res.ok) setAllocations(await res.json());
  }

  async function addAllocation() {
    if (!allocForm.accountId || !allocForm.percentage || !allocDim) return;
    setAllocSaving(true);
    const res = await fetch("/api/dimension-allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dimensionId: allocDim.id, accountId: allocForm.accountId, percentage: allocForm.percentage }),
    });
    if (res.ok) {
      const created = await res.json();
      setAllocations([...allocations, created]);
      setAllocForm({ accountId: "", percentage: "" });
      setDimensions(dimensions.map((d) => d.id === allocDim.id ? { ...d, _count: { allocations: d._count.allocations + 1 } } : d));
    }
    setAllocSaving(false);
  }

  return (
    <FadeIn>
    <div className="space-y-4">
      <PageHeader
        title={t.title}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 me-1" />{t.newDimension}</Button>
        }
      />

      <DataTable
        searchable
        searchPlaceholder={t.searchPlaceholder}
        columns={[
          { key: "name", label: t.name },
          { key: "nameAr", label: t.nameAr, render: (d) => (d as unknown as Dimension).nameAr ?? "—" },
          { key: "allocations", label: t.accountsCount, render: (d) => <Badge variant="outline">{(d as unknown as Dimension)._count.allocations}</Badge> },
          { key: "actions", label: "", render: (d) => <Button variant="ghost" size="sm" onClick={() => openAllocations(d as unknown as Dimension)}><Percent className="h-4 w-4" /></Button> },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        exportable exportFilename="accounting-dimensions"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t.dialogTitle}>
        <div className="space-y-4">
          <Input label={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t.nameAr} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t.cancel}</Button>
            <Button onClick={createDimension} disabled={saving}>{saving ? t.saving : t.save}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!allocDim} onClose={() => setAllocDim(null)} title={allocDim ? `Allocations: ${allocDim.name}` : ""}>
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={allocForm.accountId}
              onChange={(e) => setAllocForm({ ...allocForm, accountId: e.target.value })}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="%"
              value={allocForm.percentage}
              onChange={(e) => setAllocForm({ ...allocForm, percentage: e.target.value })}
              className="w-24"
            />
            <Button onClick={addAllocation} disabled={allocSaving}>{allocSaving ? t.saving : t.save}</Button>
          </div>
          {allocations.length === 0 ? (
            <p className="text-sm text-gray-500">No allocations yet</p>
          ) : (
            <DataTable
              columns={[
                { key: "code", label: "Code", render: (a) => (a as unknown as Allocation).account.code },
                { key: "name", label: "Account", render: (a) => (a as unknown as Allocation).account.name },
                { key: "percentage", label: "%", render: (a) => `${(a as unknown as Allocation).percentage}%` },
              ]}
              data={allocations as unknown as Record<string, unknown>[]}
              exportable exportFilename="accounting-dimensions"
            />
          )}
        </div>
      </Dialog>
    </div>
    </FadeIn>
  );
}
