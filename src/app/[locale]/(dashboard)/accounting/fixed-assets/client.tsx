"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, RefreshCw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";

type Asset = {
  id: string; code: string; name: string;
  category: string; purchaseDate: Date; purchaseCost: number;
  usefulLifeYears: number; salvageValue: number;
  depreciationMethod: string; bookValue: number;
  accumulatedDepreciation: number; status: string; notes: string | null;
};

type Props = { assets: Asset[] };

const statusVariant: Record<string, "outline" | "success" | "warning" | "danger"> = {
  ACTIVE: "success", FULLY_DEPRECIATED: "danger", DISPOSED: "warning",
};

export function FixedAssetsClient({ assets: initial }: Props) {
  const t = useTranslations("fixedAssets");
  const router = useRouter();
  const [assets, setAssets] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = { code: "", name: "", category: "Equipment", purchaseDate: "", purchaseCost: "", usefulLifeYears: "5", salvageValue: "0", depreciationMethod: "STRAIGHT_LINE", notes: "" };
  const [form, setForm] = useState(emptyForm);

  async function createAsset() {
    if (!form.code || !form.name || !form.purchaseDate || !form.purchaseCost || !form.usefulLifeYears) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/fixed-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setAssets([created, ...assets]);
        setShowAdd(false);
        setForm(emptyForm);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create asset");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function runDepreciation(assetId: string) {
    setError("");
    try {
      const res = await fetch("/api/fixed-assets/depreciate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAssets(assets.map((a) => (a.id === assetId ? updated : a)));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to run depreciation");
      }
    } catch {
      setError("Network error");
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("assets", { count: assets.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 me-1" />{t("addAsset")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "code", label: t("code") },
          { key: "name", label: t("name") },
          { key: "category", label: t("category") },
          { key: "purchaseDate", label: t("purchaseDate"), render: (a) => formatDate(new Date((a as unknown as Asset).purchaseDate)) },
          { key: "purchaseCost", label: t("cost"), render: (a) => formatCurrency((a as unknown as Asset).purchaseCost) },
          { key: "bookValue", label: t("bookValue"), render: (a) => formatCurrency((a as unknown as Asset).bookValue) },
          { key: "status", label: t("status"), render: (a) => <Badge variant={statusVariant[(a as unknown as Asset).status] ?? "outline"}>{(a as unknown as Asset).status}</Badge> },
          { key: "actions", label: "", render: (a) => {
            const asset = a as unknown as Asset;
            return (
              <div className="flex gap-1">
                {asset.status === "ACTIVE" && <Button variant="ghost" size="sm" onClick={() => runDepreciation(asset.id)} title={t("depreciate")}><RefreshCw className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="sm" onClick={() => router.push(`/accounting/fixed-assets/${asset.id}`)}><Pencil className="h-4 w-4" /></Button>
              </div>
            );
          }},
        ]}
        data={assets as unknown as Record<string, unknown>[]}
        exportable exportFilename="fixed-assets"
      />

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setError(""); }} title={t("addAsset")}>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label={t("category")} options={[
            { value: "Equipment", label: "معدات" },
            { value: "Furniture", label: "أثاث" },
            { value: "Vehicles", label: "مركبات" },
            { value: "Buildings", label: "مباني" },
            { value: "Computers", label: "أجهزة كمبيوتر" },
            { value: "Other", label: "أخرى" },
          ]} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label={t("purchaseDate")} type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
          <Input label={t("cost")} type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} required />
          <Input label={t("usefulLife")} type="number" value={form.usefulLifeYears} onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })} required />
          <Input label={t("salvageValue")} type="number" value={form.salvageValue} onChange={(e) => setForm({ ...form, salvageValue: e.target.value })} />
          <div className="col-span-2"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setShowAdd(false)}>{t("cancel")}</Button>
          <Button onClick={createAsset} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </Dialog>
    </div>
    </FadeIn>
  );
}
