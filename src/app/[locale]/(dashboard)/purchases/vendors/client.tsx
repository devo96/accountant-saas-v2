"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Vendor = { id: string; name: string; email: string | null; phone: string | null; mobile: string | null; address: string | null; crNumber: string | null; street: string | null; city: string | null; district: string | null; region: string | null; country: string | null; postalCode: string | null; taxNumber: string | null; balance: number };
type Props = { vendors: Vendor[] };

export function VendorsClient({ vendors }: Props) {
  const t = useTranslations("vendors");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", mobile: "", address: "", crNumber: "", street: "", city: "", district: "", region: "", country: "", postalCode: "", taxNumber: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        description={t("vendors", { count: vendors.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addVendor")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("name") },
          { key: "email", label: t("email"), render: (v) => (v as Vendor).email ?? "-" },
          { key: "phone", label: t("phone"), render: (v) => (v as Vendor).phone ?? "-" },
          { key: "balance", label: t("balance"), render: (v) => `﷼ ${Number((v as Vendor).balance).toLocaleString()}` },
        ]}
        data={vendors as unknown as Record<string, unknown>[]}
        onRowClick={(v) => router.push(`/purchases/vendors/${(v as Vendor).id}`)}
        exportable exportFilename="vendors"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t("mobile")} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input label={t("address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label={t("crNumber")} value={form.crNumber} onChange={(e) => setForm({ ...form, crNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label={t("street")} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <Input label={t("city")} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label={t("district")} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label={t("region")} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <Input label={t("country")} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label={t("postalCode")} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
          <Input label={t("taxNumber")} value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
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
