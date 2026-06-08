"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type StockMovement = {
  id: string;
  item: { name: string; sku: string | null };
  warehouse: { name: string };
  type: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string | null;
  description: string | null;
  createdAt: Date;
};

type Item = { id: string; name: string; sku: string | null };
type Warehouse = { id: string; name: string };

type Props = { movements: StockMovement[]; items: Item[]; warehouses: Warehouse[] };

const typeColors: Record<string, "success" | "danger" | "warning" | "outline"> = {
  PURCHASE_RECEIPT: "success",
  SALES_DELIVERY: "danger",
  ADJUSTMENT_IN: "warning",
  ADJUSTMENT_OUT: "danger",
  TRANSFER: "outline",
};

export function StockMovementsClient({ movements, items, warehouses }: Props) {
  const t = useTranslations("stockMovements");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ itemId: "", warehouseId: "", type: "ADJUSTMENT_IN", quantity: "1", unitCost: "", totalCost: "", reference: "", description: "" });
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitCost: Number(form.unitCost), totalCost: Number(form.totalCost) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
      else { const data = await res.json().catch(() => ({})); setErrorMessage(data?.message || "Failed to save"); }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const itemOpts = items.map((i) => ({ value: i.id, label: `${i.sku ?? ""} ${i.name}`.trim() }));
  const warehouseOpts = warehouses.map((w) => ({ value: w.id, label: w.name }));
  const typeOpts = [
    { value: "PURCHASE_RECEIPT", label: t("typePURCHASE_RECEIPT") },
    { value: "SALES_DELIVERY", label: t("typeSALES_DELIVERY") },
    { value: "ADJUSTMENT_IN", label: t("typeADJUSTMENT_IN") },
    { value: "ADJUSTMENT_OUT", label: t("typeADJUSTMENT_OUT") },
    { value: "TRANSFER", label: t("typeTRANSFER") },
  ];

  const columns = [
    { key: "date", label: t("date"), render: (m: StockMovement) => formatDate(new Date(m.createdAt)) },
    { key: "item", label: t("item"), render: (m: StockMovement) => `${m.item.name} (${m.item.sku ?? "-"})` },
    { key: "warehouse", label: t("warehouse"), render: (m: StockMovement) => m.warehouse.name },
    { key: "type", label: t("type"), render: (m: StockMovement) => <Badge variant={typeColors[m.type] || "outline"}>{t("type" + m.type)}</Badge> },
    { key: "quantity", label: t("quantity") },
    { key: "unitCost", label: t("unitCost"), render: (m: StockMovement) => formatCurrency(m.unitCost) },
    { key: "totalCost", label: t("totalCost"), render: (m: StockMovement) => formatCurrency(m.totalCost) },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("movements", { count: movements.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addMovement")}</Button>
        }
      />

      <DataTable columns={columns} data={movements} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(m) => router.push(`/inventory/stock-movements/${(m as StockMovement).id}`)} exportable exportFilename="stock-movements" />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t("item")} options={itemOpts} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} required />
          <Select label={t("warehouse")} options={warehouseOpts} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required />
          <Select label={t("type")} options={typeOpts} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t("quantity")} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label={t("unitCost")} type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
            <Input label={t("totalCost")} type="number" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} />
          </div>
          <Input label={t("reference")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
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
