"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Item = { id: string; name: string; nameAr: string | null; sku: string | null; barcode: string | null; type: string; unit: string; sellingPrice: number; costPrice: number; currentStock: number; minStock: number; description: string | null };
type Props = { items: Item[] };

export function ItemsClient({ items }: Props) {
  const t = useTranslations("items");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", nameAr: "", sku: "", barcode: "", type: "PRODUCT", sellingPrice: "", costPrice: "", unit: "piece", minStock: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("items", { count: items.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newItem")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("name") },
          { key: "sku", label: t("sku"), render: (i) => (i as Item).sku ?? "-" },
          { key: "type", label: t("type") },
          { key: "currentStock", label: t("stock"), render: (i) => Number((i as Item).currentStock).toLocaleString() },
          { key: "sellingPrice", label: t("sellPrice"), render: (i) => `﷼ ${Number((i as Item).sellingPrice).toLocaleString()}` },
          { key: "costPrice", label: t("costPrice"), render: (i) => `﷼ ${Number((i as Item).costPrice).toLocaleString()}` },
        ]}
        data={items as unknown as Record<string, unknown>[]}
        onRowClick={(i) => router.push(`/inventory/items/${(i as Item).id}`)}
        exportable exportFilename="items"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("nameAr")} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t("sku")} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label={t("barcode")} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <Select label={t("type")} options={[{ value: "PRODUCT", label: t("product") }, { value: "SERVICE", label: t("service") }]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label={t("unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="piece" />
          <Input label={t("sellPrice")} type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          <Input label={t("costPrice")} type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          <Input label={t("minStock")} type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
