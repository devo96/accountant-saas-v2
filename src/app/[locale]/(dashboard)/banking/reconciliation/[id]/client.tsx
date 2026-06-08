"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type BankReconciliation = {
  id: string; startDate: string; endDate: string;
  openingBalance: number; closingBalance: number; difference: number;
  status: string; bankAccount: { id: string; name: string; bankName: string };
};

type Props = { bankReconciliation: BankReconciliation };

const statusVariant: Record<string, "warning" | "success" | "danger" | "default"> = {
  DRAFT: "warning", PENDING: "warning", COMPLETED: "success", CANCELLED: "danger",
};

export function BankReconciliationDetailClient({ bankReconciliation }: Props) {
  const router = useRouter();
  const t = useTranslations("bankReconciliation");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    startDate: bankReconciliation.startDate.split("T")[0],
    endDate: bankReconciliation.endDate.split("T")[0],
    openingBalance: String(bankReconciliation.openingBalance),
    closingBalance: String(bankReconciliation.closingBalance),
    status: bankReconciliation.status,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/bank-reconciliations/${bankReconciliation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEdit(false); router.refresh(); } else { const data = await res.json().catch(() => ({})); setErrorMessage(data.error || t("errorOccurred")); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/banking/reconciliation")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bankReconciliation.bankAccount.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("reconciliationInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("reconciliationInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("account")}</dt>
            <dd className="font-medium">{bankReconciliation.bankAccount.name} ({bankReconciliation.bankAccount.bankName})</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("startDate")}</dt>
            <dd className="font-medium">{new Date(bankReconciliation.startDate).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("endDate")}</dt>
            <dd className="font-medium">{new Date(bankReconciliation.endDate).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("openingBalance")}</dt>
            <dd className="font-medium">{bankReconciliation.openingBalance.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("closingBalance")}</dt>
            <dd className="font-medium">{bankReconciliation.closingBalance.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("difference")}</dt>
            <dd className="font-medium">
              <span className={bankReconciliation.difference === 0 ? "text-green-600" : "text-red-600 font-medium"}>
                {bankReconciliation.difference.toFixed(2)}
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("status")}</dt>
            <dd className="font-medium">
              <Badge variant={statusVariant[bankReconciliation.status] || "default"}>{bankReconciliation.status}</Badge>
            </dd>
          </div>
        </dl>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
      )}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editReconciliation")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("startDate")} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <Input label={t("endDate")} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          <Input label={t("openingBalance")} type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} required />
          <Input label={t("closingBalance")} type="number" step="0.01" value={form.closingBalance} onChange={(e) => setForm({ ...form, closingBalance: e.target.value })} required />
          <Select label={t("status")} options={[
            { value: "DRAFT", label: "Draft" },
            { value: "PENDING", label: "Pending" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
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
