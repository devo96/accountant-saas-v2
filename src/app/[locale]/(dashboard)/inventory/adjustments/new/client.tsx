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

export default function NewAdjustmentClient({ items, warehouses }: { items: Item[]; warehouses: Warehouse[] }) {
  const router = useRouter();
  const t = useTranslations("inventoryAdjustments");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    itemId: "",
    warehouseId: "",
    quantityBefore: "0",
    quantityAfter: "0",
    reason: "",
    reference: "",
  });

  const itemOpts = items.map((i) => ({ value: i.id, label: `${i.name}${i.sku ? ` (${i.sku})` : ""}` }));
  const warehouseOpts = warehouses.map((w) => ({ value: w.id, label: w.name }));

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/inventory/adjustments");
    } finally { setSubmitting(false); }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("newAdjustment")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.itemId || !form.warehouseId || !form.reason}>{submitting ? t("saving") : t("save")}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("dialogTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Select label={t("item")} options={itemOpts} placeholder={t("item")} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} />
          <Select label={t("warehouse")} options={warehouseOpts} placeholder={t("warehouse")} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} />
          <Input label={t("quantityAfter")} type="number" value={form.quantityAfter} onChange={(e) => setForm({ ...form, quantityAfter: e.target.value })} />
          <Input label={t("reason")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Input label={t("reference")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
