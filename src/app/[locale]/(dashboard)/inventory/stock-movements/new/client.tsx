"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Item = { id: string; name: string; sku: string | null };
type Warehouse = { id: string; name: string };

export default function NewStockMovementClient({ items, warehouses }: { items: Item[]; warehouses: Warehouse[] }) {
  const router = useRouter();
  const t = useTranslations("stockMovements");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    itemId: "",
    warehouseId: "",
    type: "ADJUSTMENT_IN",
    quantity: "1",
    unitCost: "",
    totalCost: "",
    reference: "",
    description: "",
  });

  const itemOpts = items.map((i) => ({ value: i.id, label: `${i.sku ?? ""} ${i.name}`.trim() }));
  const warehouseOpts = warehouses.map((w) => ({ value: w.id, label: w.name }));
  const typeOpts = [
    { value: "PURCHASE_RECEIPT", label: t("typePURCHASE_RECEIPT") },
    { value: "SALES_DELIVERY", label: t("typeSALES_DELIVERY") },
    { value: "ADJUSTMENT_IN", label: t("typeADJUSTMENT_IN") },
    { value: "ADJUSTMENT_OUT", label: t("typeADJUSTMENT_OUT") },
    { value: "TRANSFER", label: t("typeTRANSFER") },
  ];

  async function handleSubmit() {
    setSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitCost: Number(form.unitCost), totalCost: Number(form.totalCost) }),
      });
      if (res.ok) router.push("/inventory/stock-movements");
      else { const data = await res.json().catch(() => ({})); setErrorMessage(data?.message || "Failed to save"); }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally { setSubmitting(false); }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("newMovement")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.itemId || !form.warehouseId}>{submitting ? t("saving") : t("save")}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("dialogTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Select label={t("item")} options={itemOpts} placeholder={t("item")} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} />
          <Select label={t("warehouse")} options={warehouseOpts} placeholder={t("warehouse")} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} />
          <Select label={t("type")} options={typeOpts} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label={t("quantity")} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label={t("unitCost")} type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
          <Input label={t("totalCost")} type="number" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} />
          <Input label={t("reference")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <div className="col-span-3"><Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {errorMessage && <div className="col-span-3"><p className="text-sm text-red-500">{errorMessage}</p></div>}
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
