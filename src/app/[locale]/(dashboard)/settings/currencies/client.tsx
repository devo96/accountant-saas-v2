"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Currency = { id: string; code: string; name: string; symbol: string; exchangeRate: number; isBase: boolean };
type Props = { currencies: Currency[] };

export function CurrenciesClient({ currencies }: Props) {
  const router = useRouter();
  const t = useTranslations("currencies");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", nameAr: "", symbol: "", exchangeRate: "", isBase: false });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, exchangeRate: Number(form.exchangeRate) }),
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
        description={t("currencies", { count: currencies.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newCurrency")}</Button>
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
        ]}
        data={currencies as unknown as Record<string, unknown>[]}
        exportable exportFilename="currencies"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder={t("codePlaceholder")} />
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("nameAr")} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t("symbol")} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required placeholder={t("symbolPlaceholder")} />
          <Input label={t("exchangeRate")} type="number" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isBase} onChange={(e) => setForm({ ...form, isBase: e.target.checked })} />
            {t("setAsBase")}
          </label>
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
