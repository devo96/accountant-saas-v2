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

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  taxNumber: string | null;
  creditLimit: number;
  balance: number;
};

type Props = { customers: Customer[] };

export function CustomersClient({ customers }: Props) {
  const router = useRouter();
  const t = useTranslations("customers");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", mobile: "", address: "", taxNumber: "", creditLimit: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
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
        description={t("customers", { count: customers.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addCustomer")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("name") },
          { key: "email", label: t("email"), render: (c) => (c as Customer).email ?? "-" },
          { key: "phone", label: t("phone"), render: (c) => (c as Customer).phone ?? "-" },
          { key: "balance", label: t("balance"), render: (c) => `﷼ ${Number((c as Customer).balance).toLocaleString()}` },
        ]}
        data={customers as unknown as Record<string, unknown>[]}
        onRowClick={(c) => router.push(`/sales/customers/${(c as Customer).id}`)}
        exportable exportFilename="customers"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t("mobile")} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input label={t("address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label={t("taxNumber")} value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
          <Input label={t("creditLimit")} type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
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
