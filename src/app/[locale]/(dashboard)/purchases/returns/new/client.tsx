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

type Vendor = { id: string; name: string };

export default function NewPurchaseReturnClient({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const t = useTranslations("purchaseReturns");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    returnDate: new Date().toISOString().split("T")[0],
    notes: "",
    invoiceId: "",
    total: "0",
  });

  const vendorOpts = vendors.map((v) => ({ value: v.id, label: v.name }));

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, total: Number(form.total) }),
      });
      if (res.ok) router.push("/purchases/returns");
    } finally { setSubmitting(false); }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("newReturn")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.vendorId}>{submitting ? t("saving") : t("save")}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("newReturn")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Select label={t("vendor")} options={vendorOpts} placeholder={t("vendor")} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
          <Input label={t("date")} type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} />
          <Input label={t("total")} type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
          <Input label="Original Invoice ID" value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })} />
          <div className="col-span-3"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
