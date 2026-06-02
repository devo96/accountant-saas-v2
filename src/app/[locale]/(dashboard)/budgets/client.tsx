"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

type FY = { id: string; name: string; startDate: string; endDate: string };
type MonthData = { month: number; budget: number; actual: number };
type AccountItem = { accountId: string; accountCode: string; accountName: string; accountNameAr: string | null; months: MonthData[] };

type Props = { fiscalYears: FY[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function BudgetsClient({ fiscalYears }: Props) {
  const t = useTranslations("budgets");
  const ct = useTranslations("common");
  const [fyId, setFyId] = useState(fiscalYears[0]?.id ?? "");
  const [incomeAccounts, setIncomeAccounts] = useState<AccountItem[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<AccountItem[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!fyId) return;
    const res = await fetch(`/api/budgets?fiscalYearId=${fyId}`);
    const data = await res.json();
    setIncomeAccounts(data.incomeAccounts ?? []);
    setExpenseAccounts(data.expenseAccounts ?? []);
    setEdits({});
  }, [fyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function setBudget(accountId: string, month: number, val: string) {
    const key = `${accountId}:${month}`;
    setEdits({ ...edits, [key]: Number(val) || 0 });
  }

  function getBudget(accountId: string, month: number): number {
    const key = `${accountId}:${month}`;
    if (edits[key] !== undefined) return edits[key];
    const acct = [...incomeAccounts, ...expenseAccounts].find((a) => a.accountId === accountId);
    return acct?.months.find((m) => m.month === month)?.budget ?? 0;
  }

  async function handleSave() {
    setSaving(true);
    const budgetData = Object.entries(edits).map(([key, amount]) => {
      const [accountId, month] = key.split(":");
      return { accountId, month: Number(month), amount };
    });
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fiscalYearId: fyId, budgets: budgetData }),
    });
    setSaving(false);
    fetchData();
  }

  function renderTable(accounts: AccountItem[], label: string) {
    if (accounts.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-start w-40">{ct("account")}</th>
                {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-center text-xs">{m}</th>)}
                <th className="px-2 py-2 text-center text-xs font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const totalBudget = a.months.reduce((s, m) => s + getBudget(a.accountId, m.month), 0);
                const totalActual = a.months.reduce((s, m) => s + m.actual, 0);
                const variance = totalActual - totalBudget;
                return (
                  <tr key={a.accountId} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs font-medium">{a.accountCode} - {a.accountName}</td>
                    {a.months.map((m) => (
                      <td key={m.month} className="px-1 py-1">
                        <div className="space-y-0.5">
                          <input
                            type="number"
                            className="w-full rounded border border-gray-200 px-1 py-0.5 text-xs text-right"
                            value={getBudget(a.accountId, m.month)}
                            onChange={(e) => setBudget(a.accountId, m.month, e.target.value)}
                          />
                          <div className={`text-[10px] text-right ${m.actual > getBudget(a.accountId, m.month) ? "text-red-500" : "text-green-600"}`}>
                            {m.actual.toFixed(0)}
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-xs text-center">
                      <div>B: {totalBudget.toFixed(0)}</div>
                      <div>A: {totalActual.toFixed(0)}</div>
                      <div className={variance > 0 ? "text-red-500" : "text-green-600"}>{variance > 0 ? "+" : ""}{variance.toFixed(0)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      <div className="flex items-center gap-3">
        <Select label={t("fiscalYear")} options={fiscalYears.map((fy) => ({ value: fy.id, label: fy.name }))} value={fyId} onChange={(e) => setFyId(e.target.value)} />
        <Button onClick={handleSave} disabled={saving}>{saving ? ct("saving") : ct("save")}</Button>
      </div>

      {fyId && (
        <div className="space-y-8">
          {renderTable(incomeAccounts, t("income"))}
          {renderTable(expenseAccounts, t("expenses"))}
          {incomeAccounts.length === 0 && expenseAccounts.length === 0 && (
            <p className="text-center text-gray-500 py-8">{t("noAccounts")}</p>
          )}
        </div>
      )}
    </div>
    </FadeIn>
  );
}
