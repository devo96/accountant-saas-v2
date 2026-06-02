"use client";

import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { ChevronDown, ChevronLeft, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

type Account = {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: string;
  nature: string;
  parentId: string | null;
  balance: number;
  isMaster: boolean;
};

type Props = { accounts: Account[]; parentAccounts: Account[]; currencies: { id: string; code: string; name: string }[] };

const typeColors: Record<string, "success" | "danger" | "default" | "warning" | "outline"> = {
  ASSET: "success",
  LIABILITY: "warning",
  EQUITY: "default",
  INCOME: "success",
  EXPENSE: "danger",
};

function buildTree(accounts: Account[], parentId: string | null = null): Account[] {
  return accounts
    .filter((a) => a.parentId === parentId)
    .flatMap((a) => [a, ...buildTree(accounts, a.id)]);
}

export function ChartOfAccountsClient({ accounts, parentAccounts, currencies }: Props) {
  const t = useTranslations("chartOfAccounts");
  const router = useRouter();
  const tree = buildTree(accounts);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", nameAr: "", type: "EXPENSE", nature: "DEBIT", parentId: "", currencyId: "" });

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visible = tree.filter((a) => {
    if (!a.parentId) return true;
    const parent = accounts.find((p) => p.id === a.parentId);
    if (!parent) return true;
    return !collapsed.has(parent.id);
  });

  const getLevel = (id: string): number => {
    let level = 0;
    let current = accounts.find((a) => a.id === id);
    while (current?.parentId) {
      level++;
      current = accounts.find((a) => a.id === current!.parentId);
    }
    return level;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const parentOpts = parentAccounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.nameAr ?? a.name}` }));
  const currencyOpts = currencies.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const typeOpts = [
    { value: "ASSET", label: t("typeASSET") },
    { value: "LIABILITY", label: t("typeLIABILITY") },
    { value: "EQUITY", label: t("typeEQUITY") },
    { value: "INCOME", label: t("typeINCOME") },
    { value: "EXPENSE", label: t("typeEXPENSE") },
  ];
  const natureOpts = [
    { value: "DEBIT", label: t("natureDebit") },
    { value: "CREDIT", label: t("natureCredit") },
  ];

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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("nature")}</TableHead>
              <TableHead className="text-right">{t("balance")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((account) => {
              const level = getLevel(account.id);
              const hasChildren = accounts.some((a) => a.parentId === account.id);
              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-1" style={{ paddingInlineStart: level * 20 }}>
                      {hasChildren && (
                        <Button variant="ghost" size="sm" onClick={() => toggle(account.id)} className="p-0.5 h-auto">
                          {collapsed.has(account.id) ? <ChevronLeft className="h-3 w-3 rtl:scale-x-[-1]" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      )}
                      <span className="text-xs font-mono">{account.code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{account.nameAr ?? account.name}</TableCell>
                  <TableCell><Badge variant={typeColors[account.type] ?? "default"}>{t("type" + account.type)}</Badge></TableCell>
                  <TableCell>{account.nature === "DEBIT" ? t("natureDebit") : t("natureCredit")}</TableCell>
                  <TableCell className="text-right font-mono">﷼ {account.balance.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <Input label={t("nameAr")} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Select label={t("type")} options={typeOpts} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
          <Select label={t("nature")} options={natureOpts} value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value })} required />
          <Select label={t("parentAccount")} options={parentOpts} placeholder={t("noParent")} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} />
          <Select label={t("currency")} options={currencyOpts} placeholder={t("noCurrency")} value={form.currencyId} onChange={(e) => setForm({ ...form, currencyId: e.target.value })} />
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
