"use client";

import { useState, useRef } from "react";
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
type Project = { id: string; name: string };

export default function NewJournalEntryClient({ accounts, projects }: { accounts: Account[]; projects: Project[] }) {
  const router = useRouter();
  const t = useTranslations("journalEntries");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
    lines: [{ accountId: "", debit: "", credit: "" }],
  });
  const [projectId, setProjectId] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function addLine() { setForm({ ...form, lines: [...form.lines, { accountId: "", debit: "", credit: "" }] }); }
  function removeLine(i: number) { setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }); }
  function updateLine(i: number, field: string, value: string) {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: value };
    setForm({ ...form, lines });
  }

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const accountOpts = accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }));
  const projectOpts = projects.map((p) => ({ value: p.id, label: p.name }));

  async function handleSubmit(status: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: new Date(form.date).toISOString(),
            description: form.description,
            reference: form.reference || undefined,
            projectId: projectId || undefined,
            attachments: attachments.length > 0 ? JSON.stringify(attachments.map(f => f.name)) : undefined,
            status,
            lines: form.lines.filter((l) => l.accountId).map((l) => ({ accountId: l.accountId, debit: Number(l.debit), credit: Number(l.credit) })),
          }),
      });
      if (res.ok) router.push("/accounting/journal-entries");
    } finally { setSubmitting(false); }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("newEntry")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
            <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={submitting || !isBalanced || form.lines.length < 2}>{submitting ? t("saving") : t("saveDraft")}</Button>
            <Button onClick={() => handleSubmit("POSTED")} disabled={submitting || !isBalanced || form.lines.length < 2}>{submitting ? t("saving") : t("postEntry")}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("dialogTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Input label={t("date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label={t("reference")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Select label={t("project")} options={projectOpts} placeholder={t("selectProject")} value={projectId} onChange={(e) => setProjectId(e.target.value)} />
          <div className="col-span-3"><Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-3"><Input label={t("attachments")} type="file" ref={fileRef} multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("lines")}</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 ms-1" /> {t("addLine")}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select options={accountOpts} placeholder={t("selectAccount")} value={line.accountId} onChange={(e) => updateLine(i, "accountId", e.target.value)} />
              </div>
              <Input placeholder={t("debit")} type="number" value={line.debit} onChange={(e) => updateLine(i, "debit", e.target.value)} className="w-28" />
              <Input placeholder={t("credit")} type="number" value={line.credit} onChange={(e) => updateLine(i, "credit", e.target.value)} className="w-28" />
              <Button type="button" variant="ghost" onClick={() => removeLine(i)} className="text-red-500 mt-1"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t pt-2">
            <span>{t("totalDebit", { amount: totalDebit.toFixed(2) })}</span>
            <span>{t("totalCredit", { amount: totalCredit.toFixed(2) })}</span>
            <span className={isBalanced ? "text-green-600" : "text-red-600"}>{isBalanced ? t("balanced") : t("notBalanced")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
