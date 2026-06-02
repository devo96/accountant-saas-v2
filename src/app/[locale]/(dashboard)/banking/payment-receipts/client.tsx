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
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type PaymentReceipt = {
  id: string;
  number: number;
  date: Date;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  salesInvoice: { number: number } | null;
  purchaseInvoice: { number: number } | null;
};

type Invoice = { id: string; number: number };

type Props = { receipts: PaymentReceipt[]; salesInvoices: Invoice[]; purchaseInvoices: Invoice[] };

const methodColors: Record<string, "outline" | "success" | "warning" | "danger"> = {
  CASH: "success",
  BANK_TRANSFER: "warning",
  CHECK: "outline",
  CREDIT_CARD: "success",
  OTHER: "outline",
};

export function PaymentReceiptsClient({ receipts, salesInvoices, purchaseInvoices }: Props) {
  const t = useTranslations("paymentReceipts");
  const s = useTranslations("common");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], amount: "", method: "CASH", reference: "", notes: "", salesInvoiceId: "", purchaseInvoiceId: "" });

  const methods = [
    { value: "CASH", label: t("cash") },
    { value: "BANK_TRANSFER", label: t("bankTransfer") },
    { value: "CHECK", label: t("check") },
    { value: "CREDIT_CARD", label: t("creditCard") },
    { value: "OTHER", label: t("other") },
  ];
  const siOpts = [{ value: "", label: t("noInvoice") }, ...salesInvoices.map((inv) => ({ value: inv.id, label: `SI-${String(inv.number).padStart(4, "0")}` }))];
  const piOpts = [{ value: "", label: t("noInvoice") }, ...purchaseInvoices.map((inv) => ({ value: inv.id, label: `PI-${String(inv.number).padStart(4, "0")}` }))];
  const methodLabels: Record<string, string> = { CASH: "cash", BANK_TRANSFER: "bankTransfer", CHECK: "check", CREDIT_CARD: "creditCard", OTHER: "other" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/payment-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "number", label: t("receiptNo"), render: (r: PaymentReceipt) => generateNumber("PMT", r.number) },
    { key: "date", label: t("date"), render: (r: PaymentReceipt) => formatDate(new Date(r.date)) },
    { key: "amount", label: t("amount"), render: (r: PaymentReceipt) => formatCurrency(r.amount) },
    { key: "method", label: t("method"), render: (r: PaymentReceipt) => <Badge variant={methodColors[r.method] || "outline"}>{s(methodLabels[r.method] || r.method)}</Badge> },
    { key: "invoice", label: t("invoice"), render: (r: PaymentReceipt) => r.salesInvoice ? `SI-${String(r.salesInvoice.number).padStart(4, "0")}` : r.purchaseInvoice ? `PI-${String(r.purchaseInvoice.number).padStart(4, "0")}` : "-" },
    { key: "reference", label: t("reference"), render: (r: PaymentReceipt) => r.reference ?? "-" },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("receipts", { count: receipts.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addReceipt")}</Button>
        }
      />

      <DataTable columns={columns} data={receipts} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(r) => router.push(`/banking/payment-receipts/${(r as any).id}`)} exportable exportFilename="payment-receipts" />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label={t("amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Select label={t("method")} options={methods} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
          <Input label={t("reference")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Select label={t("salesInvoice")} options={siOpts} value={form.salesInvoiceId} onChange={(e) => setForm({ ...form, salesInvoiceId: e.target.value })} />
          <Select label={t("purchaseInvoice")} options={piOpts} value={form.purchaseInvoiceId} onChange={(e) => setForm({ ...form, purchaseInvoiceId: e.target.value })} />
          <Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
