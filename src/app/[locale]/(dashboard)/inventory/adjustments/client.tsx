"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Item = { id: string; name: string; sku: string | null };
type Warehouse = { id: string; name: string };

type Adjustment = {
  id: string;
  createdAt: string;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  reference: string | null;
  item: Item;
  warehouse: Warehouse;
};

type Props = {
  data: Adjustment[];
  items: Item[];
  warehouses: Warehouse[];
};

export function InventoryAdjustmentsClient({ data, items, warehouses }: Props) {
  const router = useRouter();
  const t = useTranslations("inventoryAdjustments");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: "",
    warehouseId: "",
    quantityBefore: "0",
    quantityAfter: "0",
    reason: "",
    reference: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data?.message || "Failed to save");
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "createdAt",
      label: t("date"),
      render: (a: Adjustment) => new Date(a.createdAt).toLocaleDateString(),
    },
    {
      key: "item",
      label: t("item"),
      render: (a: Adjustment) => `${a.item.name}${a.item.sku ? ` (${a.item.sku})` : ""}`,
    },
    {
      key: "warehouse",
      label: t("warehouse"),
      render: (a: Adjustment) => a.warehouse.name,
    },
    {
      key: "type",
      label: t("type"),
      render: (a: Adjustment) => {
        const diff = a.quantityAfter - a.quantityBefore;
        return diff >= 0 ? (
          <Badge variant="success">{t("add")}</Badge>
        ) : (
          <Badge variant="danger">{t("remove")}</Badge>
        );
      },
    },
    {
      key: "quantityBefore",
      label: t("qtyBefore"),
      render: (a: Adjustment) => a.quantityBefore,
    },
    {
      key: "quantityAfter",
      label: t("qtyAfter"),
      render: (a: Adjustment) => a.quantityAfter,
    },
    {
      key: "difference",
      label: t("difference"),
      render: (a: Adjustment) => {
        const diff = a.quantityAfter - a.quantityBefore;
        return (
          <span className={diff >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {diff >= 0 ? `+${diff}` : diff}
          </span>
        );
      },
    },
    { key: "reason", label: t("reason") },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 ms-2" /> {t("newAdjustment")}
          </Button>
        }
      />

      <DataTable columns={columns} data={data} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(a) => router.push(`/inventory/adjustments/${(a as Adjustment).id}`)} exportable exportFilename="inventory-adjustments" />

      <Dialog open={open} onClose={() => setOpen(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t("item")}
            options={items.map((i) => ({ value: i.id, label: `${i.name}${i.sku ? ` (${i.sku})` : ""}` }))}
            placeholder={t("selectItem")}
            value={form.itemId}
            onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            required
          />
          <Select
            label={t("warehouse")}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            placeholder={t("selectWarehouse")}
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            required
          />
          <Input
            label={t("currentQty")}
            type="number"
            value={form.quantityBefore}
            onChange={(e) => setForm({ ...form, quantityBefore: e.target.value })}
            required
          />
          <Input
            label={t("newQty")}
            type="number"
            value={form.quantityAfter}
            onChange={(e) => setForm({ ...form, quantityAfter: e.target.value })}
            required
          />
          <Input
            label={t("reason")}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <Input
            label={t("reference")}
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
          {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
