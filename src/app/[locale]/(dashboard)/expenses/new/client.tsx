"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Account = { id: string; code: string; name: string };
type Vendor = { id: string; name: string };

export default function NewExpenseClient({ accounts, vendors }: { accounts: Account[]; vendors: Vendor[] }) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    vendorId: "",
    paymentMethod: "CASH",
    notes: "",
    category: "",
  });
  const [lines, setLines] = useState([{ accountId: "", amount: "" }]);

  function addLine() { setLines([...lines, { accountId: "", amount: "" }]); }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, field: string, value: string) {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    setLines(updated);
  }

  const paymentMethods = [
    { value: "CASH", label: t("cash") },
    { value: "BANK_TRANSFER", label: t("bankTransfer") },
    { value: "CHECK", label: t("check") },
    { value: "CREDIT_CARD", label: t("creditCard") },
    { value: "OTHER", label: t("other") },
  ];
  const accountOpts = accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }));
  const vendorOpts = vendors.map((v) => ({ value: v.id, label: v.name }));

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          lines: lines.filter((l) => l.accountId).map((l) => ({ accountId: l.accountId, amount: Number(l.amount) })),
        }),
      });
      if (res.ok) {
        router.push("/expenses");
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
        title={t("newExpense")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? t("saving") : t("save")}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("newExpense")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Input label={t("date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label={t("amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label={t("vendor")} options={vendorOpts} placeholder={t("vendor")} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
          <Select label={t("paymentMethod")} options={paymentMethods} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
          <Input label={t("category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="col-span-3"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("expenseLines")}</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 ms-1" /> {t("addLine")}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select options={accountOpts} placeholder={t("selectAccount")} value={line.accountId} onChange={(e) => updateLine(i, "accountId", e.target.value)} />
              </div>
              <Input placeholder={t("amount")} type="number" value={line.amount} onChange={(e) => updateLine(i, "amount", e.target.value)} className="w-32" />
              <Button type="button" variant="ghost" onClick={() => removeLine(i)} className="text-red-500 mt-1"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
