"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";

type Template = { key: string; subject: string; body: string; isCustom: boolean };
type Props = { templates: Template[] };

export function EmailTemplatesClient({ templates: initial }: Props) {
  const t = useTranslations("emailTemplates");
  const [templates, setTemplates] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", body: "" });
  const [saving, setSaving] = useState(false);

  function startEdit(key: string) {
    const tmpl = templates.find((t) => t.key === key);
    if (!tmpl) return;
    setEditing(key);
    setForm({ subject: tmpl.subject, body: tmpl.body });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editing, ...form }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTemplates((prev) => prev.map((t) => (t.key === editing ? { ...t, subject: updated.subject, body: updated.body, isCustom: true } : t)));
      setEditing(null);
    }
    setSaving(false);
  }

  const templateLabels: Record<string, string> = {
    "invoice.created": t("invoiceCreated"),
    "invoice.paid": t("invoicePaid"),
    "quote.accepted": t("quoteAccepted"),
    "expense.approved": t("expenseApproved"),
  };

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      <div className="space-y-4">
        {templates.map((tmpl) => (
          <div key={tmpl.key} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{templateLabels[tmpl.key] ?? tmpl.key}</span>
                {tmpl.isCustom && <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">{t("customized")}</span>}
              </div>
              <Button variant="outline" size="sm" onClick={() => startEdit(tmpl.key)}>{t("edit")}</Button>
            </div>
            {editing === tmpl.key ? (
              <div className="mt-3 space-y-3">
                <Input label={t("subject")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("body")}</label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[120px] font-mono"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(null)}>{t("cancel")}</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <div><span className="text-gray-400">{t("subject")}:</span> {tmpl.subject}</div>
                <div className="text-xs whitespace-pre-wrap line-clamp-2"><span className="text-gray-400">{t("body")}:</span> {tmpl.body}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </FadeIn>
  );
}
