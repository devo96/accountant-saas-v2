"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { Tabs, type Tab } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type SalesInvoice = {
  id: string;
  number: number;
  invoiceDate: string;
  status: string;
  total: number;
};

type Customer = {
  id: string;
  name: string;
  nameAr: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  taxNumber: string | null;
  creditLimit: number;
  balance: number;
  active: boolean;
  salesInvoices?: SalesInvoice[];
};

type Props = { customer: Customer };

export function CustomerDetailClient({ customer }: Props) {
  const router = useRouter();
  const t = useTranslations("customers");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    nameAr: customer.nameAr ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    mobile: customer.mobile ?? "",
    address: customer.address ?? "",
    taxNumber: customer.taxNumber ?? "",
    creditLimit: String(customer.creditLimit),
  });
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEdit(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const statusLabel: Record<string, string> = { DRAFT: "Draft", CONFIRMED: "Confirmed", PAID: "Paid", PARTIALLY_PAID: "Partially Paid", CANCELLED: "Cancelled" };
  const statusVariant: Record<string, string> = { DRAFT: "outline", CONFIRMED: "default", PAID: "success", PARTIALLY_PAID: "warning", CANCELLED: "destructive" };

  const [tab, setTab] = useState("info");
  const tabs: Tab[] = [
    { key: "info", label: t("customerInfo") },
    { key: "invoices", label: t("invoices") },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/sales/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("customerInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === "info" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("name")}</dt>
              <dd className="font-medium">{customer.name}</dd>
            </div>
            {customer.nameAr && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">{t("nameAr")}</dt>
                <dd className="font-medium">{customer.nameAr}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("email")}</dt>
              <dd className="font-medium">{customer.email ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("phone")}</dt>
              <dd className="font-medium">{customer.phone ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("mobile")}</dt>
              <dd className="font-medium">{customer.mobile ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("address")}</dt>
              <dd className="font-medium">{customer.address ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("taxNumber")}</dt>
              <dd className="font-medium">{customer.taxNumber ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("creditLimit")}</dt>
              <dd className="font-medium">﷼ {customer.creditLimit.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("balance")}</dt>
              <dd className="font-medium">﷼ {customer.balance.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      )}

      {tab === "invoices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("invoices")}</h3>
          {customer.salesInvoices && customer.salesInvoices.length > 0 ? (
            <div className="space-y-2">
              {customer.salesInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border border-gray-100 dark:border-gray-700"
                  onClick={() => router.push(`/sales/invoices/${inv.id}`)}
                >
                  <div>
                    <div className="font-medium text-sm">INV-{String(inv.number).padStart(5, "0")}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(inv.invoiceDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">﷼ {Number(inv.total).toLocaleString()}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                      inv.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                      inv.status === "PAID" ? "bg-blue-100 text-blue-700" :
                      inv.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                      inv.status === "PARTIALLY_PAID" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {statusLabel[inv.status] ?? inv.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No invoices yet</p>
          )}
        </div>
      )}

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editCustomer")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("nameAr")} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t("mobile")} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input label={t("address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label={t("taxNumber")} value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
          <Input label={t("creditLimit")} type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
