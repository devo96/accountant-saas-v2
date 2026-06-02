"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type ExpenseLine = { id: string; amount: number; account: { code: string; name: string; nameAr: string | null } };
type Expense = {
  id: string;
  date: Date;
  amount: number;
  description: string;
  lines: ExpenseLine[];
};

type Account = { id: string; code: string; name: string; nameAr: string | null };
type Vendor = { id: string; name: string; nameAr: string | null };

type Props = { expenses: Expense[]; accounts: Account[]; vendors: Vendor[] };

export function ExpensesClient({ expenses, accounts, vendors }: Props) {
  const t = useTranslations("expenses");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], description: "", amount: "", taxAmount: "", accountId: "", vendorId: "", paymentMethod: "CASH", notes: "", category: "", receipt: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const accountOpts = accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.nameAr ?? a.name}` }));
  const vendorOpts = vendors.map((v) => ({ value: v.id, label: v.nameAr ?? v.name }));
  const paymentMethods = [
    { value: "CASH", label: t("cash") },
    { value: "BANK_TRANSFER", label: t("bankTransfer") },
    { value: "CHECK", label: t("check") },
    { value: "CREDIT_CARD", label: t("creditCard") },
    { value: "OTHER", label: t("other") },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("expenses", { count: expenses.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newExpense")}</Button>
        }
      />

      <DataTable
        searchable
        selectable
        bulkActions={[
          {
            label: "Delete Selected",
            variant: "danger",
            onClick: async (ids) => {
              await fetch("/api/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entity: "Expense", ids }),
              });
              router.refresh();
            },
          },
        ]}
        columns={[
          { key: "date", label: t("date"), render: (e) => new Date((e as Expense).date).toLocaleDateString() },
          { key: "description", label: t("description") },
          { key: "account", label: t("account"), render: (e) => { const lines = (e as Expense).lines; return lines?.[0]?.account ? `${lines[0].account.code} - ${lines[0].account.nameAr ?? lines[0].account.name}` : "-"; } },
          { key: "amount", label: t("amount"), render: (e) => `﷼ ${Number((e as Expense).amount).toLocaleString()}` },
        ]}
        data={expenses as unknown as Record<string, unknown>[]}
        onRowClick={(e) => router.push(`/expenses/${(e as Expense).id}`)}
        exportable exportFilename="expenses"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input label={t("amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label={t("taxAmount")} type="number" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
          <Select label={t("vendor")} options={vendorOpts} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
          <Select label={t("paymentMethod")} options={paymentMethods} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
          <Input label={t("category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Input label={t("receipt")} value={form.receipt} onChange={(e) => setForm({ ...form, receipt: e.target.value })} placeholder="URL" />
          <Select label={t("account")} options={accountOpts} value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required />
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
