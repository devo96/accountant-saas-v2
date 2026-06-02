"use client";

import { FadeIn } from "@/components/transitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type EntryLine = { id: string; account: { code: string; name: string }; debit: number; credit: number };
type Entry = {
  id: string; number: number; date: Date; reference: string | null; description: string; status: string;
  lines: EntryLine[];
  createdBy: { name: string } | null;
  fiscalYear: { name: string } | null;
};

type Props = { entry: Entry };

const statusLabels: Record<string, string> = { DRAFT: "draft", POSTED: "posted" };

export function JournalEntryViewClient({ entry: initial }: Props) {
  const t = useTranslations("journalEntries");
  const s = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState(initial.description);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/journal-entries/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (res.ok) { setEditing(false); router.refresh(); }
    } finally { setSaving(false); }
  }

  const totalDebit = initial.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = initial.lines.reduce((s, l) => s + l.credit, 0);

  if (editing) {
    return (
      <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/accounting/journal-entries")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("editEntry")} JE-{String(initial.number).padStart(4, "0")}</h2>
        </div>
        <Input label={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <Button variant="ghost" onClick={() => router.push("/accounting/journal-entries")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("entryInfo")} JE-{String(initial.number).padStart(4, "0")}</h2>
            <Badge variant={initial.status === "POSTED" ? "success" : "outline"}>{s(statusLabels[initial.status] || initial.status)}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {initial.createdBy?.name ?? "-"}</p>
        </div>
        <Button onClick={() => setEditing(true)}><Edit2 className="h-4 w-4 ms-1" /> {t("edit")}</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-lg border p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("date")}</span><span>{new Date(initial.date).toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("reference")}</span><span>{initial.reference ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("description")}</span><span>{initial.description}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("fiscalYear")}</span><span>{initial.fiscalYear?.name ?? "-"}</span></div>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("selectAccount")}</TableHead>
              <TableHead className="text-right">{t("debit")}</TableHead>
              <TableHead className="text-right">{t("credit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initial.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-sm">{line.account.code} - {line.account.name}</TableCell>
                <TableCell className="text-right font-mono">{line.debit > 0 ? `﷼ ${line.debit.toFixed(2)}` : "-"}</TableCell>
                <TableCell className="text-right font-mono">{line.credit > 0 ? `﷼ ${line.credit.toFixed(2)}` : "-"}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell>{t("totalDebit", { amount: totalDebit.toFixed(2) })}</TableCell>
              <TableCell className="text-right">{t("totalCredit", { amount: totalCredit.toFixed(2) })}</TableCell>
              <TableCell className="text-right">{totalDebit === totalCredit ? t("balanced") : t("notBalanced")}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
    </FadeIn>
  );
}
