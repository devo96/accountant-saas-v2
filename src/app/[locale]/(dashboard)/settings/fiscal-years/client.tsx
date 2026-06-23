"use client";

import { useTranslations } from "next-intl";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Lock, Unlock } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type FiscalYear = { id: string; name: string; startDate: Date; endDate: Date; isClosed: boolean };

type Props = { years: FiscalYear[] };

export function FiscalYearsClient({ years }: Props) {
  const t = useTranslations("fiscalYears");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);

  async function handleToggle(id: string, isClosed: boolean) {
    await fetch(`/api/fiscal-years/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isClosed: !isClosed }),
    });
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/fiscal-years", {
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
        description={t("years", { count: years.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addYear")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("name") },
          { key: "startDate", label: t("startDate"), render: (y) => new Date((y as FiscalYear).startDate).toLocaleDateString() },
          { key: "endDate", label: t("endDate"), render: (y) => new Date((y as FiscalYear).endDate).toLocaleDateString() },
          { key: "isClosed", label: t("status"), render: (y) => {
            const fy = y as FiscalYear;
            return (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${fy.isClosed ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"}`}>
                {fy.isClosed ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {fy.isClosed ? t("closed") : t("open")}
              </span>
            );
          }},
          { key: "actions", label: "", render: (y) => {
            const fy = y as FiscalYear;
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggle(fy.id, fy.isClosed)}
              >
                {fy.isClosed ? t("open") : t("close")}
              </Button>
            );
          }},
        ]}
        data={years as unknown as Record<string, unknown>[]}
        exportable exportFilename="fiscal-years"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="2026" />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("startDate")} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <Input label={t("endDate")} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
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
