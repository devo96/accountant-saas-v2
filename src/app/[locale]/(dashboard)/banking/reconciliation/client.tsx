"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "@/i18n/navigation";
import { Plus } from "lucide-react";

type BankAccount = {
  id: string;
  name: string;
  bankName: string;
};

type Reconciliation = {
  id: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  difference: number;
  status: string;
  bankAccount: BankAccount;
};

type Props = {
  data: Reconciliation[];
  bankAccounts: BankAccount[];
};

function statusBadge(status: string) {
  const map: Record<string, "warning" | "success" | "danger" | "default"> = {
    DRAFT: "warning",
    PENDING: "warning",
    COMPLETED: "success",
    CANCELLED: "danger",
  };
  return <Badge variant={map[status] || "default"}>{status}</Badge>;
}

export function BankReconciliationClient({ data, bankAccounts }: Props) {
  const router = useRouter();
  const t = useTranslations("bankReconciliation");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bankAccountId: "", startDate: "", endDate: "", openingBalance: "", closingBalance: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/bank-reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: form.bankAccountId,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          openingBalance: Number(form.openingBalance),
          closingBalance: Number(form.closingBalance),
        }),
      });
      if (res.ok) { setOpen(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "bankAccount",
      label: t("bankAccount"),
      render: (r: Reconciliation) => `${r.bankAccount.name} (${r.bankAccount.bankName})`,
    },
    {
      key: "endDate",
      label: t("statementDate"),
      render: (r: Reconciliation) => new Date(r.endDate).toLocaleDateString(),
    },
    {
      key: "closingBalance",
      label: t("endingBalance"),
      render: (r: Reconciliation) => r.closingBalance.toFixed(2),
    },
    {
      key: "status",
      label: t("status"),
      render: (r: Reconciliation) => statusBadge(r.status),
    },
    {
      key: "difference",
      label: t("difference"),
      render: (r: Reconciliation) => (
        <span className={r.difference === 0 ? "text-green-600" : "text-red-600 font-medium"}>
          {r.difference.toFixed(2)}
        </span>
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
            <Plus className="h-4 w-4 ms-2" /> {t("newReconciliation")}
          </Button>
        }
      />

      <DataTable columns={columns} data={data} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(r) => router.push(`/banking/reconciliation/${(r as any).id}`)} exportable exportFilename="reconciliation" />

      <Dialog open={open} onClose={() => setOpen(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t("bankAccount")}
            options={bankAccounts.map((b) => ({ value: b.id, label: `${b.name} - ${b.bankName}` }))}
            placeholder={t("selectAccount")}
            value={form.bankAccountId}
            onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
          />
          <Input label={t("startDate")} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <Input label={t("endDate")} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          <Input label={t("openingBalance")} type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} required />
          <Input label={t("closingBalance")} type="number" step="0.01" value={form.closingBalance} onChange={(e) => setForm({ ...form, closingBalance: e.target.value })} required />
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
