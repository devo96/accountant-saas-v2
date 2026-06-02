"use client";

import { useTranslations } from "next-intl";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type Entry = {
  id: string;
  number: number;
  date: Date;
  description: string;
  status: string;
  createdBy: { name: string } | null;
  lines: { id: string; account: { code: string; name: string }; debit: number; credit: number }[];
};

type Account = { id: string; code: string; name: string; nameAr: string | null };
type FiscalYear = { id: string; name: string };

type Props = { entries: Entry[]; accounts: Account[]; fiscalYears: FiscalYear[] };

export function JournalEntriesClient({ entries, accounts, fiscalYears }: Props) {
  const t = useTranslations("journalEntries");
  const s = useTranslations("common");
  const statusLabels: Record<string, string> = { DRAFT: "draft", POSTED: "posted" };
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    descriptionAr: "",
    reference: "",
    fiscalYearId: "",
    lines: [{ accountId: "", debit: "", credit: "" }],
  });

  function addLine() {
    setForm({ ...form, lines: [...form.lines, { accountId: "", debit: "", credit: "" }] });
  }

  function removeLine(i: number) {
    setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  }

  function updateLine(i: number, field: string, value: string) {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: value };
    setForm({ ...form, lines });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(form.date).toISOString(),
        description: form.description,
        descriptionAr: form.descriptionAr || undefined,
        reference: form.reference || undefined,
        fiscalYearId: form.fiscalYearId || undefined,
        lines: form.lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit),
          credit: Number(l.credit),
        })),
      }),
    });
    if (res.ok) { setShowAdd(false); router.refresh(); }
  }

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const fiscalYearOpts = fiscalYears.map((fy) => ({ value: fy.id, label: fy.name }));
  const accountOpts = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} - ${a.nameAr ?? a.name}`,
  }));

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("entries", { count: entries.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newEntry")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "number", label: t("hash"), render: (e) => `JE-${String((e as Entry).number).padStart(4, "0")}` },
          { key: "date", label: t("date"), render: (e) => new Date((e as Entry).date).toLocaleDateString() },
          { key: "description", label: t("description") },
          { key: "status", label: t("status"), render: (e) => <Badge variant={(e as Entry).status === "POSTED" ? "success" : "outline"}>{s(statusLabels[(e as Entry).status] || (e as Entry).status)}</Badge> },
          { key: "createdBy", label: t("createdBy"), render: (e) => (e as Entry).createdBy?.name ?? "-" },
        ]}
        data={entries as unknown as Record<string, unknown>[]}
        onRowClick={(e) => router.push(`/accounting/journal-entries/${(e as Entry).id}`)}
        exportable exportFilename="journal-entries"
        filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]}
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")} className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label={t("reference")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input label={t("descriptionAr")} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
          <Select label={t("fiscalYear")} options={fiscalYearOpts} placeholder={t("selectFiscalYear")} value={form.fiscalYearId} onChange={(e) => setForm({ ...form, fiscalYearId: e.target.value })} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("lines")}</span>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>{t("addLine")}</Button>
            </div>
            {form.lines.map((line, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Select
                    options={accountOpts}
                    placeholder={t("selectAccount")}
                    value={line.accountId}
                    onChange={(e) => updateLine(i, "accountId", e.target.value)}
                  />
                </div>
                <Input placeholder={t("debit")} value={line.debit} onChange={(e) => updateLine(i, "debit", e.target.value)} className="w-28" />
                <Input placeholder={t("credit")} value={line.credit} onChange={(e) => updateLine(i, "credit", e.target.value)} className="w-28" />
                <Button type="button" variant="ghost" onClick={() => removeLine(i)} className="text-red-500 mt-1"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t pt-2">
              <span>{t("totalDebit", { amount: totalDebit.toFixed(2) })}</span>
              <span>{t("totalCredit", { amount: totalCredit.toFixed(2) })}</span>
              <span className={isBalanced ? "text-green-600" : "text-red-600"}>
                {isBalanced ? t("balanced") : t("notBalanced")}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!isBalanced || form.lines.length < 2}>
            {t("postEntry")}
          </Button>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
