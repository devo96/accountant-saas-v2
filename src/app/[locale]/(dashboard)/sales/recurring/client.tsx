"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Customer = { id: string; name: string };
type Line = { description: string; quantity: number; unitPrice: number; taxRate: number; lineTotal: number };

type Template = {
  id: string; name: string; customerId: string; frequency: string; interval: number;
  nextRunDate: string; lastRunDate: string | null; endDate: string | null;
  invoiceDay: number | null; dueDateDays: number; active: boolean;
  subtotal: number; total: number; notes: string | null;
};

type Props = { templates: Template[]; customers: Customer[] };

export function RecurringInvoicesClient({ templates, customers }: Props) {
  const t = useTranslations("recurringInvoices");
  const ct = useTranslations("common");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", customerId: "", frequency: "MONTHLY", interval: 1,
    nextRunDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endDate: "", dueDateDays: 30, subtotal: 0, total: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/recurring-invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subtotal: Number(form.subtotal),
        total: Number(form.total),
        endDate: form.endDate || null,
        lines: [{ description: "Auto-generated", quantity: 1, unitPrice: Number(form.subtotal), taxRate: 0, lineTotal: Number(form.subtotal) }],
      }),
    });
    if (res.ok) { setShowAdd(false); router.refresh(); }
    setSaving(false);
  }

  async function generateNow(id: string) {
    await fetch(`/api/recurring-invoices/generate/${id}`, { method: "POST" });
    router.refresh();
  }

  async function toggleActive(t: Template) {
    await fetch(`/api/recurring-invoices/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    router.refresh();
  }

  const customerOpts = customers.map((c) => ({ value: c.id, label: c.name }));

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newTemplate")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("name") },
          {
            key: "customerId", label: t("customer"),
            render: (tpl) => customers.find((c) => c.id === (tpl as Template).customerId)?.name ?? "-",
          },
          { key: "frequency", label: t("frequency") },
          { key: "interval", label: t("interval") },
          {
            key: "nextRunDate", label: t("nextRun"),
            render: (tpl) => new Date((tpl as Template).nextRunDate).toLocaleDateString(),
          },
          { key: "total", label: ct("total"), render: (tpl) => `﷼ ${Number((tpl as Template).total).toFixed(2)}` },
          {
            key: "active", label: ct("status"),
            render: (tpl) => (tpl as Template).active ? "Active" : "Inactive",
          },
        ]}
        data={templates as unknown as Record<string, unknown>[]}
        bulkActions={[
          {
            label: "Generate Now",
            onClick: async (ids) => { for (const id of ids) await generateNow(id); },
          },
        ]}
        selectable
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("newTemplate")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label={t("customer")} options={customerOpts} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required />
          <Select label={t("frequency")} options={[
            { value: "DAILY", label: "Daily" }, { value: "WEEKLY", label: "Weekly" },
            { value: "MONTHLY", label: "Monthly" }, { value: "QUARTERLY", label: "Quarterly" },
            { value: "YEARLY", label: "Yearly" },
          ]} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
          <Input label={t("interval")} type="number" value={form.interval} onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })} />
          <Input label={t("nextRun")} type="date" value={form.nextRunDate} onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })} required />
          <Input label={t("endDate")} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Input label={t("dueDays")} type="number" value={form.dueDateDays} onChange={(e) => setForm({ ...form, dueDateDays: Number(e.target.value) })} />
          <Input label={ct("total")} type="number" value={form.total} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} required />
          <Input label={ct("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{ct("cancel")}</Button>
            <Button type="submit" disabled={saving}>{saving ? ct("saving") : ct("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
