"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

type Line = {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
};

type Entry = {
  id: string;
  number: number;
  date: string;
  description: string;
  status: string;
  createdByName: string;
  lines: Line[];
};

export default function GeneralLedgerClient({ entries }: { entries: Entry[] }) {
  const t = useTranslations("generalLedger");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const filtered = search
    ? entries.filter(
        (e) =>
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.number.toString().includes(search) ||
          e.createdByName.toLowerCase().includes(search.toLowerCase()) ||
          e.lines.some(
            (l) =>
              l.accountCode.toLowerCase().includes(search.toLowerCase()) ||
              l.accountName.toLowerCase().includes(search.toLowerCase())
          )
      )
    : entries;

  const allTotalDebit = filtered.reduce(
    (s, e) => s + e.lines.reduce((ls, l) => ls + l.debit, 0),
    0
  );
  const allTotalCredit = filtered.reduce(
    (s, e) => s + e.lines.reduce((ls, l) => ls + l.credit, 0),
    0
  );

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <Input
          placeholder={t("filterPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">{t("noEntries")}</p>
        )}
        {filtered.map((entry) => {
          const open = expanded.has(entry.id);
          const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
          const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
          return (
            <Card key={entry.id}>
              <CardHeader className="cursor-pointer py-4" onClick={() => toggle(entry.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    <div>
                      <CardTitle className="text-base">
                        JE-{String(entry.number).padStart(5, "0")}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {formatDate(new Date(entry.date))} &mdash; {entry.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{t("posted")}</Badge>
                    <span className="text-sm text-gray-500">{entry.createdByName}</span>
                  </div>
                </div>
              </CardHeader>
              {open && (
                <CardContent className="pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("accountCode")}</TableHead>
                        <TableHead>{t("accountName")}</TableHead>
                        <TableHead className="text-right">{t("debit")}</TableHead>
                        <TableHead className="text-right">{t("credit")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono">{line.accountCode}</TableCell>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell className="text-right">
                            {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold border-t-2 border-gray-300">
                        <TableCell colSpan={2}>{t("total")}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{t("grandTotal", { count: filtered.length })}</span>
            <div className="flex gap-8">
              <span>{t("debits", { amount: formatCurrency(allTotalDebit) })}</span>
              <span>{t("credits", { amount: formatCurrency(allTotalCredit) })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
