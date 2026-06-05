"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";

type ExpenseLine = { id: string; amount: number; account: { code: string; name: string }; taxCode: { name: string; rate: number } | null };
type Expense = {
  id: string; date: string; amount: number; description: string; paymentMethod: string;
  category: string | null; notes: string | null; receipt: string | null;
  lines: ExpenseLine[];
  vendor: { name: string } | null;
  createdBy: { name: string } | null;
};

type Props = { expense: Expense };

const paymentMethodLabels: Record<string, string> = { CASH: "cash", BANK_TRANSFER: "bankTransfer", CHECK: "check", CREDIT_CARD: "creditCard", OTHER: "other" };

export function ExpenseViewClient({ expense: initial }: Props) {
  const t = useTranslations("expenses");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: initial.category ?? "", description: initial.description, amount: String(initial.amount), paymentMethod: initial.paymentMethod, notes: initial.notes ?? "" });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.ok) { setEditing(false); router.refresh(); }
    } finally { setSaving(false); }
  }

  const paymentMethods = [
    { value: "CASH", label: t("cash") },
    { value: "BANK_TRANSFER", label: t("bankTransfer") },
    { value: "CHECK", label: t("check") },
    { value: "CREDIT_CARD", label: t("creditCard") },
    { value: "OTHER", label: t("other") },
  ];

  if (editing) {
    return (
      <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/expenses")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("editExpense")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input label={t("amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Select label={t("paymentMethod")} options={paymentMethods} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
          <div className="col-span-2"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setEditing(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/expenses")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("expenseInfo")}</h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {initial.createdBy?.name ?? "-"}</p>
        </div>
        <Button onClick={() => setEditing(true)}><Edit2 className="h-4 w-4 ms-1" /> {t("edit")}</Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("date")}</span><span>{new Date(initial.date).toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("description")}</span><span>{initial.description}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("category")}</span><span>{initial.category ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("amount")}</span><span className="font-bold">﷼ {initial.amount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("paymentMethod")}</span><span>{t(paymentMethodLabels[initial.paymentMethod] || initial.paymentMethod)}</span></div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("vendor")}</span><span>{initial.vendor?.name ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("notes")}</span><span>{initial.notes ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("receipt")}</span><span>{initial.receipt ? <a href={initial.receipt} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a> : "-"}</span></div>
        </div>
      </div>

      {initial.lines.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("account")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initial.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="text-sm">{line.account.code} - {line.account.name}</TableCell>
                  <TableCell className="text-right font-mono">﷼ {line.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
    </FadeIn>
  );
}
