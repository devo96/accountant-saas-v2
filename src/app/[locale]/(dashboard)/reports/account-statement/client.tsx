"use client";

import { useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { exportToExcel } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";

type Account = { id: string; code: string; name: string; balance: number };

export function AccountStatementClient({ accounts }: { accounts: Account[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<{ id: string; date: string; description: string; reference: string | null; debit: number; credit: number }[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  const accountOpts = accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }));

  const fetchStatement = useCallback(async () => {
    if (!accountId || !fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/statement?fromDate=${fromDate}&toDate=${toDate}`);
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines);
        setOpeningBalance(data.openingBalance);
      }
    } finally {
      setLoading(false);
    }
  }, [accountId, fromDate, toDate]);

  const closingBalance = lines.reduce((s, l) => s + l.debit - l.credit, openingBalance);

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("accountStatement")}
          description={t("asOf", { date: toDate ? new Date(toDate).toLocaleDateString() : new Date().toLocaleDateString() })}
        />
        <div className="flex flex-wrap items-end gap-3">
          <Select label={t("account")} options={accountOpts} placeholder={tc("selectAccount")} value={accountId} onChange={(e) => setAccountId(e.target.value)} />
          <Input label={tc("from")} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label={tc("to")} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Button onClick={fetchStatement} disabled={loading || !accountId || !fromDate || !toDate}>
            <Search className="h-4 w-4 ms-1" /> {tc("filter")}
          </Button>
        </div>
        {lines.length > 0 && (
          <>
            <div className="flex justify-between text-sm px-1">
              <span className="text-gray-500">{tc("openingBalance")}: <strong>{formatCurrency(openingBalance)}</strong></span>
              <span className="text-gray-500">{tc("closingBalance")}: <strong>{formatCurrency(closingBalance)}</strong></span>
            </div>
            <div className="rounded-lg border dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>{t("date")}</TableHead><TableHead>{t("description")}</TableHead><TableHead>{t("reference")}</TableHead><TableHead className="text-right">{t("debit")}</TableHead><TableHead className="text-right">{t("credit")}</TableHead><TableHead className="text-right">{t("balance")}</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, i) => {
                    const runningBalance = lines.slice(0, i + 1).reduce((s, x) => s + x.debit - x.credit, openingBalance);
                    return (
                      <TableRow key={l.id}>
                        <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
                        <TableCell>{l.description}</TableCell>
                        <TableCell>{l.reference ?? "-"}</TableCell>
                        <TableCell className="text-right font-mono">{l.debit > 0 ? l.debit.toFixed(2) : ""}</TableCell>
                        <TableCell className="text-right font-mono">{l.credit > 0 ? l.credit.toFixed(2) : ""}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(runningBalance)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportToExcel(lines.map((l) => ({ Date: new Date(l.date).toLocaleDateString(), Description: l.description, Reference: l.reference ?? "", Debit: l.debit, Credit: l.credit })), "account-statement", [{ key: "Date", label: "Date" }, { key: "Description", label: "Description" }, { key: "Reference", label: "Reference" }, { key: "Debit", label: "Debit" }, { key: "Credit", label: "Credit" }])}>
                <Download className="h-4 w-4 ms-1" /> Export Excel
              </Button>
            </div>
          </>
        )}
      </div>
    </FadeIn>
  );
}
