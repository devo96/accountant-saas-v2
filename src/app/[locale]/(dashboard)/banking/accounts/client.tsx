"use client";

import { useTranslations } from "next-intl";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type BankAccount = { id: string; name: string; accountNumber: string; bankName: string; currentBalance: number };
type Props = { accounts: BankAccount[] };

export function BankAccountsClient({ accounts }: Props) {
  const t = useTranslations("bankAccounts");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", accountNumber: "", iban: "", bankName: "", openingBalance: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowAdd(false); router.refresh(); }
    setLoading(false);
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("accounts", { count: accounts.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addAccount")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("accountName") },
          { key: "bankName", label: t("bank") },
          { key: "accountNumber", label: t("accountNumber") },
          { key: "currentBalance", label: t("balance"), render: (a) => `﷼ ${Number((a as BankAccount).currentBalance).toLocaleString()}` },
        ]}
        data={accounts as unknown as Record<string, unknown>[]}
        onRowClick={(a) => router.push(`/banking/accounts/${(a as any).id}`)}
        exportable exportFilename="bank-accounts"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("accountName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("bankName")} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
          <Input label={t("accountNumber")} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
          <Input label={t("iban")} value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
          <Input label={t("openingBalance")} type="number" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
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
