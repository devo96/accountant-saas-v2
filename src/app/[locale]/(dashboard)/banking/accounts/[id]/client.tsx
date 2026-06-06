"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";

type BankAccount = {
  id: string; name: string; accountNumber: string | null;
  iban: string | null; bankName: string; openingBalance: number; currentBalance: number;
};

type Props = { bankAccount: BankAccount };

export function BankAccountDetailClient({ bankAccount }: Props) {
  const router = useRouter();
  const t = useTranslations("bankAccounts");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: bankAccount.name,
    accountNumber: bankAccount.accountNumber ?? "",
    iban: bankAccount.iban ?? "",
    bankName: bankAccount.bankName,
  });
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/bank-accounts/${bankAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEdit(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/banking/accounts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bankAccount.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("accountInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("accountInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("accountName")}</dt>
            <dd className="font-medium">{bankAccount.name}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("bankName")}</dt>
            <dd className="font-medium">{bankAccount.bankName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("accountNumber")}</dt>
            <dd className="font-medium">{bankAccount.accountNumber ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("iban")}</dt>
            <dd className="font-medium">{bankAccount.iban ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("openingBalance")}</dt>
            <dd className="font-medium">{formatCurrency(bankAccount.openingBalance)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("balance")}</dt>
            <dd className="font-medium">{formatCurrency(bankAccount.currentBalance)}</dd>
          </div>
        </dl>
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editAccount")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("accountName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("accountNumber")} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
          <Input label={t("iban")} value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
          <Input label={t("bankName")} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
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
