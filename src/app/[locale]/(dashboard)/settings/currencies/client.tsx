"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Currency = { id: string; code: string; name: string; symbol: string; exchangeRate: number; isBase: boolean };
type Props = { currencies: Currency[] };

export function CurrenciesClient({ currencies }: Props) {
  const router = useRouter();
  const t = useTranslations("currencies");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", nameAr: "", symbol: "", exchangeRate: "", isBase: false });
  const [loading, setLoading] = useState(false);

  function startEdit(c: Currency) {
    setForm({ code: c.code, name: c.name, nameAr: "", symbol: c.symbol, exchangeRate: String(c.exchangeRate), isBase: c.isBase });
    setEditingId(c.id);
    setShowAdd(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/currencies/${editingId}` : "/api/currencies";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, exchangeRate: Number(form.exchangeRate) }),
      });
      if (res.ok) { setShowAdd(false); setEditingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/currencies/${deletingId}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); router.refresh(); }
    } finally { setLoading(false); }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("currencies", { count: currencies.length })}
        actions={
          <Button onClick={() => { setEditingId(null); setForm({ code: "", name: "", nameAr: "", symbol: "", exchangeRate: "", isBase: false }); setShowAdd(true); }}><Plus className="h-4 w-4 ms-1" /> {t("newCurrency")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "code", label: t("code") },
          { key: "name", label: t("name") },
          { key: "symbol", label: t("symbol") },
          { key: "exchangeRate", label: t("exchangeRate"), render: (c) => Number((c as Currency).exchangeRate).toFixed(4) },
          { key: "isBase", label: t("base"), render: (c) => (c as Currency).isBase ? <Badge variant="success">{t("base")}</Badge> : "-" },
          { key: "actions", label: "", render: (c) => {
            const cur = c as Currency;
            return (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(cur)} className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletingId(cur.id)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          }},
        ]}
        data={currencies as unknown as Record<string, unknown>[]}
        exportable exportFilename="currencies"
      />

      <Dialog open={showAdd} onClose={() => { setShowAdd(false); setEditingId(null); }} title={editingId ? t("editTitle") : t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder={t("codePlaceholder")} />
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("symbol")} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required placeholder={t("symbolPlaceholder")} />
          <Input label={t("exchangeRate")} type="number" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isBase} onChange={(e) => setForm({ ...form, isBase: e.target.checked })} />
            {t("setAsBase")}
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingId(null); }}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)} title={t("deleteTitle")}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t("deleteConfirm")}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setDeletingId(null)}>{t("cancel")}</Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>{loading ? t("saving") : t("delete")}</Button>
        </div>
      </Dialog>
    </div>
    </FadeIn>
  );
}
