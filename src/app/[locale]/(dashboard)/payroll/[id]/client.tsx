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

type PayrollRun = {
  id: string; month: number; year: number; totalSalaries: number;
  totalGosi: number; netTotal: number; status: string;
};

type Props = { payrollRun: PayrollRun };

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  DRAFT: "outline", CONFIRMED: "warning", PAID: "success", CANCELLED: "danger",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function PayrollRunDetailClient({ payrollRun }: Props) {
  const router = useRouter();
  const t = useTranslations("payroll");
  const s = useTranslations("common");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    month: payrollRun.month,
    year: payrollRun.year,
    status: payrollRun.status,
  });
  const [loading, setLoading] = useState(false);

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", PAID: "paid", CANCELLED: "cancelled" };

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll-runs/${payrollRun.id}`, {
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
          <Button variant="ghost" onClick={() => router.push("/payroll")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{monthNames[payrollRun.month - 1]} {payrollRun.year}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("runInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("runInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("period")}</dt>
            <dd className="font-medium">{monthNames[payrollRun.month - 1]} {payrollRun.year}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("totalSalaries")}</dt>
            <dd className="font-medium">{payrollRun.totalSalaries.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("totalGosi")}</dt>
            <dd className="font-medium">{payrollRun.totalGosi.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("netTotal")}</dt>
            <dd className="font-medium">{payrollRun.netTotal.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("status")}</dt>
            <dd className="font-medium">
              <Badge variant={statusVariant[payrollRun.status] || "outline"}>{s(statusLabels[payrollRun.status] || payrollRun.status)}</Badge>
            </dd>
          </div>
        </dl>
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editRun")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("month")} type="number" min={1} max={12} value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} required />
          <Input label={t("year")} type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required />
          <Select label={t("status")} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label: s(label) }))} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
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
