"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { formatCurrency, generateNumber } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type PayrollRun = {
  id: string;
  month: number;
  year: number;
  totalSalaries: number;
  totalGosi: number;
  netTotal: number;
  status: string;
  createdBy: { name: string } | null;
};

type Props = { runs: PayrollRun[] };

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  DRAFT: "outline",
  CONFIRMED: "warning",
  PAID: "success",
  CANCELLED: "danger",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function PayrollClient({ runs }: Props) {
  const t = useTranslations("payroll");
  const s = useTranslations("common");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), totalSalaries: "", totalGosi: "", netTotal: "" });

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", PAID: "paid", CANCELLED: "cancelled" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/payroll-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, totalSalaries: Number(form.totalSalaries), totalGosi: Number(form.totalGosi), netTotal: Number(form.netTotal) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "period", label: t("period"), render: (r: PayrollRun) => `${monthNames[r.month - 1]} ${r.year}` },
    { key: "totalSalaries", label: t("totalSalaries"), render: (r: PayrollRun) => formatCurrency(r.totalSalaries) },
    { key: "totalGosi", label: t("totalGosi"), render: (r: PayrollRun) => formatCurrency(r.totalGosi) },
    { key: "netTotal", label: t("netTotal"), render: (r: PayrollRun) => formatCurrency(r.netTotal) },
    { key: "status", label: t("status"), render: (r: PayrollRun) => <Badge variant={statusVariant[r.status] || "outline"}>{s(statusLabels[r.status] || r.status)}</Badge> },
    { key: "createdBy", label: t("createdBy"), render: (r: PayrollRun) => r.createdBy?.name ?? "-" },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("runs", { count: runs.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newRun")}</Button>
        }
      />

      <DataTable columns={columns} data={runs} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(r) => router.push(`/payroll/${(r as any).id}`)} exportable exportFilename="payroll-runs" filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]} />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("month")} type="number" min={1} max={12} value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} required />
            <Input label={t("year")} type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required />
          </div>
          <Input label={t("totalSalaries")} type="number" value={form.totalSalaries} onChange={(e) => setForm({ ...form, totalSalaries: e.target.value })} />
          <Input label={t("totalGosi")} type="number" value={form.totalGosi} onChange={(e) => setForm({ ...form, totalGosi: e.target.value })} />
          <Input label={t("netTotal")} type="number" value={form.netTotal} onChange={(e) => setForm({ ...form, netTotal: e.target.value })} />
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
