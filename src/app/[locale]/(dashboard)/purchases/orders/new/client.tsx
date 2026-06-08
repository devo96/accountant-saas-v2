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
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";

type Vendor = { id: string; name: string };

export default function NewPurchaseOrderClient({ vendors: initialVendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const t = useTranslations("purchaseOrders");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [form, setForm] = useState({
    vendorId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    subtotal: "0",
    discountAmount: "0",
    taxAmount: "0",
    total: "0",
    notes: "",
  });

  const vendorOpts = vendors.map((v) => ({ value: v.id, label: v.name }));

  const handleVendorCreated = (entity: { id: string; name: string }) => {
    setVendors([...vendors, { id: entity.id, name: entity.name }]);
    setForm((f) => ({ ...f, vendorId: entity.id }));
  };

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedDate: form.expectedDate || null,
          subtotal: Number(form.subtotal),
          discountAmount: Number(form.discountAmount),
          taxAmount: Number(form.taxAmount),
          total: Number(form.total),
        }),
      });
      if (res.ok) {
        router.push("/purchases/orders");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || t("errorOccurred"));
      }
    } finally { setSubmitting(false); }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
      )}
      <PageHeader
        title={t("newOrder")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.vendorId}>{submitting ? t("saving") : t("save")}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("dialogTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select label={t("vendor")} options={vendorOpts} placeholder={t("vendor")} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
            </div>
            <QuickCreateDialog type="vendor" onCreated={handleVendorCreated} />
          </div>
          <Input label={t("orderDate")} type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
          <Input label={t("expectedDate")} type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
          <Input label={t("subtotal")} type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} />
          <Input label={t("discount")} type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
          <Input label={t("taxAmount")} type="number" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
          <Input label={t("total")} type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
          <div className="col-span-3"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
