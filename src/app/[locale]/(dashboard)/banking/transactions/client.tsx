"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type BankAccount = {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string | null;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  debit: number;
  credit: number;
  reconciled: boolean;
  bankAccount: BankAccount;
};

type Props = {
  data: Transaction[];
  bankAccounts: BankAccount[];
};

function getType(debit: number, credit: number): string {
  if (credit > 0 && debit === 0) return "DEPOSIT";
  if (debit > 0 && credit === 0) return "WITHDRAWAL";
  return "TRANSFER";
}

export function BankTransactionsClient({ data, bankAccounts }: Props) {
  const router = useRouter();
  const t = useTranslations("bankTransactions");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    bankAccountId: "",
    type: "DEPOSIT",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/bank-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "date",
      label: t("date"),
      render: (tr: Transaction) => new Date(tr.date).toLocaleDateString(),
    },
    {
      key: "bankAccount",
      label: t("bankAccount"),
      render: (tr: Transaction) => `${tr.bankAccount.name} (${tr.bankAccount.bankName})`,
    },
    {
      key: "type",
      label: t("type"),
      render: (tr: Transaction) => {
        const type = getType(tr.debit, tr.credit);
        const variant = type === "DEPOSIT" ? "success" : type === "WITHDRAWAL" ? "danger" : "default";
        return <Badge variant={variant}>{t(type === "DEPOSIT" ? "deposit" : type === "WITHDRAWAL" ? "withdrawal" : "transfer")}</Badge>;
      },
    },
    {
      key: "amount",
      label: t("amount"),
      render: (tr: Transaction) => {
        const amount = tr.debit > 0 ? tr.debit : tr.credit;
        const isDeposit = tr.credit > 0 && tr.debit === 0;
        return (
          <span className={isDeposit ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {isDeposit ? "+" : "-"}{amount.toFixed(2)}
          </span>
        );
      },
    },
    { key: "description", label: t("description") },
    {
      key: "reconciled",
      label: t("status"),
      render: (tr: Transaction) => (
        <Badge variant={tr.reconciled ? "success" : "warning"}>
          {tr.reconciled ? t("reconciled") : t("pending")}
        </Badge>
      ),
    },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 ms-2" /> {t("newTransaction")}
          </Button>
        }
      />

      <DataTable columns={columns} data={data} searchable searchPlaceholder={t("searchPlaceholder")} exportable exportFilename="transactions" />

      <Dialog open={open} onClose={() => setOpen(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t("bankAccount")}
            options={bankAccounts.map((b) => ({ value: b.id, label: `${b.name} - ${b.bankName}` }))}
            placeholder={t("selectAccount")}
            value={form.bankAccountId}
            onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
            required
          />
          <Select
            label={t("type")}
            options={[
              { value: "DEPOSIT", label: t("deposit") },
              { value: "WITHDRAWAL", label: t("withdrawal") },
              { value: "TRANSFER", label: t("transfer") },
            ]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          />
          <Input
            label={t("amount")}
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label={t("date")}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label={t("description")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <Input
            label={t("reference")}
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
