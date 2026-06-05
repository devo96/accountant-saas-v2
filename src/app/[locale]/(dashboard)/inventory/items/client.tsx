"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";

type Item = { id: string; name: string; sku: string | null; barcode: string | null; type: string; unit: string; sellingPrice: number; costPrice: number; currentStock: number; minStock: number; description: string | null };
type Props = { items: Item[] };

export function ItemsClient({ items }: Props) {
  const t = useTranslations("items");
  const router = useRouter();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", type: "PRODUCT", sellingPrice: "", costPrice: "", unit: "piece", minStock: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const isEdit = !!editing;
    const url = isEdit ? `/api/items/${editing!.id}` : "/api/items";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice) }),
      });
      if (res.ok) { setShowAdd(false); setEditing(null); router.refresh(); toast({ title: t(isEdit ? "updateSuccess" : "save"), type: "success" }); }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${deleting.id}`, { method: "DELETE" });
      if (res.ok) { setDeleting(null); router.refresh(); toast({ title: t("save"), message: deleting.name, type: "success" }); }
    } finally {
      setLoading(false);
    }
  }

  function openEdit(item: Item) {
    setEditing(item);
    setForm({ name: item.name, sku: item.sku ?? "", barcode: item.barcode ?? "", type: item.type, sellingPrice: String(item.sellingPrice), costPrice: String(item.costPrice), unit: item.unit, minStock: String(item.minStock), description: item.description ?? "" });
    setShowAdd(true);
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("items", { count: items.length })}
        actions={
          <Button onClick={() => { setEditing(null); setForm({ name: "", sku: "", barcode: "", type: "PRODUCT", sellingPrice: "", costPrice: "", unit: "piece", minStock: "", description: "" }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("addItem")}</Button>
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
          { key: "actions", label: "", render: (i) => (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" title={t("edit")} onClick={() => openEdit(i as Item)}><Pencil className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" title={t("deleteItem")} onClick={() => setDeleting(i as Item)} className="text-red-500"><Trash2 className="h-3 w-3" /></Button>
            </div>
          )},
        ]}
        data={items as unknown as Record<string, unknown>[]}
        onRowClick={(i) => router.push(`/inventory/items/${(i as Item).id}`)}
        exportable exportFilename="items"
      />

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? t("editItem") : t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("sku")} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label={t("barcode")} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <Select label={t("type")} options={[{ value: "PRODUCT", label: t("product") }, { value: "SERVICE", label: t("service") }]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label={t("unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="piece" />
          <Input label={t("sellPrice")} type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          <Input label={t("costPrice")} type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          <Input label={t("minStock")} type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditing(null); }}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>

      {deleting && (
        <Dialog open onClose={() => setDeleting(null)} title={t("deleteItem")}>
          <p className="text-sm text-gray-600 mb-4">{t("confirmDelete")}<br/><strong>{deleting.name}</strong></p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>{loading ? t("deleting") : t("deleteItem")}</Button>
          </div>
        </Dialog>
      )}
    </div>
    </FadeIn>
  );
}
