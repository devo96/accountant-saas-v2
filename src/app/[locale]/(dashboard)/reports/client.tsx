"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { exportToExcel } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";

type Account = { id: string; code: string; name: string; type: string; nature: string; calculatedBalance: number };

type Props = { accounts: Account[]; type: "trial-balance" | "income-statement" | "balance-sheet" };

export function ReportsClient({ accounts, type }: Props) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const title = t(type === "trial-balance" ? "trialBalance" : type === "income-statement" ? "incomeStatement" : "balanceSheet");

  const tbColumns = (type === "trial-balance" ? [{ key: "code", label: t("code") }, { key: "name", label: t("account") }, { key: "debit", label: t("debit") }, { key: "credit", label: t("credit") }] : []);

  if (type === "trial-balance") {
    const totalDebit = accounts.reduce((s, a) => s + (a.nature === "DEBIT" ? a.calculatedBalance : 0), 0);
    const totalCredit = accounts.reduce((s, a) => s + (a.nature === "CREDIT" ? a.calculatedBalance : 0), 0);

    return (
      <FadeIn>
        <div className="space-y-6">
          <PageHeader
            title={title}
            description={t("asOf", { date: new Date().toLocaleDateString() })}
            actions={
              <Button variant="outline" size="sm" onClick={() => exportToExcel(accounts.map((a) => ({ code: a.code, name: a.name, debit: a.nature === "DEBIT" ? a.calculatedBalance : 0, credit: a.nature === "CREDIT" ? a.calculatedBalance : 0 })), "trial-balance", tbColumns)}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
            }
          />
          <div className="rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("account")}</TableHead>
                  <TableHead className="text-right">{t("debit")}</TableHead>
                  <TableHead className="text-right">{t("credit")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="text-right font-mono">{a.nature === "DEBIT" ? formatCurrency(a.calculatedBalance) : ""}</TableCell>
                    <TableCell className="text-right font-mono">{a.nature === "CREDIT" ? formatCurrency(a.calculatedBalance) : ""}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2 dark:border-gray-700">
                  <TableCell colSpan={2}>{t("total")}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (type === "balance-sheet") {
    const assets = accounts.filter((a) => a.type === "ASSET");
    const liabilities = accounts.filter((a) => a.type === "LIABILITY");
    const equity = accounts.filter((a) => a.type === "EQUITY");
    const totalAssets = assets.reduce((s, a) => s + a.calculatedBalance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.calculatedBalance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.calculatedBalance, 0);

    const bsData = [...assets.map((a) => ({ section: "Assets", account: a.name, amount: a.calculatedBalance })), { section: "", account: "Total Assets", amount: totalAssets }, ...liabilities.map((a) => ({ section: "Liabilities", account: a.name, amount: a.calculatedBalance })), { section: "", account: "Total Liabilities", amount: totalLiabilities }, ...equity.map((a) => ({ section: "Equity", account: a.name, amount: a.calculatedBalance })), { section: "", account: "Total Equity", amount: totalEquity }];

    return (
      <FadeIn>
        <div className="space-y-6">
          <PageHeader
            title={title}
            description={t("asOf", { date: new Date().toLocaleDateString() })}
            actions={
              <Button variant="outline" size="sm" onClick={() => exportToExcel(bsData.map((d) => ({ Account: d.account, Amount: d.amount })), "balance-sheet", [{ key: "Account", label: "Account" }, { key: "Amount", label: t("amount") }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
            }
          />
          <div className="rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader><TableRow><TableHead>{t("account")}</TableHead><TableHead className="text-right">{t("amount")}</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell colSpan={2} className="font-bold dark:text-gray-300">{t("assets")}</TableCell></TableRow>
                {assets.map((a) => <TableRow key={a.id}><TableCell className="ps-8">{a.name}</TableCell><TableCell className="text-right font-mono">{formatCurrency(a.calculatedBalance)}</TableCell></TableRow>)}
                <TableRow><TableCell className="font-bold dark:text-gray-300">{t("totalAssets")}</TableCell><TableCell className="text-right font-bold font-mono">{formatCurrency(totalAssets)}</TableCell></TableRow>
                <TableRow><TableCell colSpan={2} className="font-bold dark:text-gray-300">{t("liabilities")}</TableCell></TableRow>
                {liabilities.map((a) => <TableRow key={a.id}><TableCell className="ps-8">{a.name}</TableCell><TableCell className="text-right font-mono">{formatCurrency(a.calculatedBalance)}</TableCell></TableRow>)}
                <TableRow><TableCell className="font-bold dark:text-gray-300">{t("totalLiabilities")}</TableCell><TableCell className="text-right font-bold font-mono">{formatCurrency(totalLiabilities)}</TableCell></TableRow>
                <TableRow><TableCell colSpan={2} className="font-bold dark:text-gray-300">{t("equity")}</TableCell></TableRow>
                {equity.map((a) => <TableRow key={a.id}><TableCell className="ps-8">{a.name}</TableCell><TableCell className="text-right font-mono">{formatCurrency(a.calculatedBalance)}</TableCell></TableRow>)}
                <TableRow><TableCell className="font-bold dark:text-gray-300">{t("totalEquity")}</TableCell><TableCell className="text-right font-bold font-mono">{formatCurrency(totalEquity)}</TableCell></TableRow>
                <TableRow className="font-bold border-t-2 dark:border-gray-700"><TableCell>{t("totalLiabilitiesEquity")}</TableCell><TableCell className="text-right font-mono">{formatCurrency(totalLiabilities + totalEquity)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (type === "income-statement") {
    const incomeAccounts = accounts.filter((a) => a.type === "INCOME");
    const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");
    const totalIncome = incomeAccounts.reduce((s, a) => s + a.calculatedBalance, 0);
    const totalExpense = expenseAccounts.reduce((s, a) => s + a.calculatedBalance, 0);
    const netIncome = totalIncome - totalExpense;

    const isData = [...incomeAccounts.map((a) => ({ section: "Income", account: a.name, amount: a.calculatedBalance })), ...expenseAccounts.map((a) => ({ section: "Expenses", account: a.name, amount: a.calculatedBalance }))];

    return (
      <FadeIn>
        <div className="space-y-6">
          <PageHeader
            title={title}
            description={t("forPeriod", { date: new Date().toLocaleDateString() })}
            actions={
              <Button variant="outline" size="sm" onClick={() => exportToExcel(isData.map((d) => ({ Account: d.account, Amount: d.amount })), "income-statement", [{ key: "Account", label: "Account" }, { key: "Amount", label: t("amount") }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
            }
          />
          <div className="rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("account")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell colSpan={2} className="font-bold dark:text-gray-300">{t("income")}</TableCell></TableRow>
                {incomeAccounts.map((a) => (
                  <TableRow key={a.id}><TableCell className="ps-8">{a.name}</TableCell><TableCell className="text-right font-mono">{formatCurrency(a.calculatedBalance)}</TableCell></TableRow>
                ))}
                <TableRow><TableCell className="font-bold dark:text-gray-300">{t("totalIncome")}</TableCell><TableCell className="text-right font-bold font-mono">{formatCurrency(totalIncome)}</TableCell></TableRow>
                <TableRow><TableCell colSpan={2} className="font-bold dark:text-gray-300">{t("expenses")}</TableCell></TableRow>
                {expenseAccounts.map((a) => (
                  <TableRow key={a.id}><TableCell className="ps-8">{a.name}</TableCell><TableCell className="text-right font-mono">{formatCurrency(a.calculatedBalance)}</TableCell></TableRow>
                ))}
                <TableRow><TableCell className="font-bold dark:text-gray-300">{t("totalExpenses")}</TableCell><TableCell className="text-right font-bold font-mono">{formatCurrency(totalExpense)}</TableCell></TableRow>
                <TableRow className="font-bold border-t-2 dark:border-gray-700 text-lg">
                  <TableCell>{netIncome >= 0 ? t("netIncome") : t("netLoss")}</TableCell>
                  <TableCell className={`text-right ${netIncome >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>{formatCurrency(Math.abs(netIncome))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>
    );
  }

  return null;
}

type JournalLine = { id: string; account: { code: string; name: string }; debit: number; credit: number };
type JournalEntry = { id: string; number: number; date: string | Date; description: string; reference: string | null; status: string; createdBy: { name: string } | null; lines: JournalLine[] };

export function JournalEntriesReport({ entries }: { entries: JournalEntry[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const grandTotal = entries.reduce((s, e) => ({ debit: s.debit + e.lines.reduce((ls, l) => ls + l.debit, 0), credit: s.credit + e.lines.reduce((ls, l) => ls + l.credit, 0) }), { debit: 0, credit: 0 });

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("journalEntries")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(entries.map((e) => ({ "#": e.number, Date: new Date(e.date).toLocaleDateString(), Description: e.description, Reference: e.reference ?? "", "Debit Total": e.lines.reduce((s, l) => s + l.debit, 0), "Credit Total": e.lines.reduce((s, l) => s + l.credit, 0), Status: e.status })), "journal-entries", [{ key: "#", label: "#" }, { key: "Date", label: "Date" }, { key: "Description", label: "Description" }, { key: "Reference", label: "Reference" }, { key: "Debit Total", label: "Debit Total" }, { key: "Credit Total", label: "Credit Total" }, { key: "Status", label: "Status" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("description")}</TableHead><TableHead>{t("reference")}</TableHead><TableHead className="text-right">{t("debit")}</TableHead><TableHead className="text-right">{t("credit")}</TableHead><TableHead>{t("status")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <>
                  <TableRow key={e.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                    <TableCell className="font-mono text-xs">{String(e.number).padStart(5, "0")}</TableCell>
                    <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.reference ?? "-"}</TableCell>
                    <TableCell className="text-right font-mono">{e.lines.reduce((s, l) => s + l.debit, 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{e.lines.reduce((s, l) => s + l.credit, 0).toFixed(2)}</TableCell>
                    <TableCell>{e.status}</TableCell>
                  </TableRow>
                  {expandedId === e.id && e.lines.map((l) => (
                    <TableRow key={l.id} className="bg-gray-50 dark:bg-gray-800/50">
                      <TableCell />
                      <TableCell colSpan={2} className="text-xs ps-8">{l.account.code} - {l.account.name}</TableCell>
                      <TableCell className="text-xs">{t("description")}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.debit > 0 ? l.debit.toFixed(2) : ""}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{l.credit > 0 ? l.credit.toFixed(2) : ""}</TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell colSpan={4}>{t("total")}</TableCell>
                <TableCell className="text-right">{grandTotal.debit.toFixed(2)}</TableCell>
                <TableCell className="text-right">{grandTotal.credit.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function SalesReportClient({ invoices }: { invoices: { id: string; number: number; invoiceDate: Date; customer: { name: string }; subtotal: number; taxAmount: number; total: number; status: string }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const totals = invoices.reduce((s, inv) => ({ subtotal: s.subtotal + inv.subtotal, tax: s.tax + inv.taxAmount, total: s.total + inv.total }), { subtotal: 0, tax: 0, total: 0 });

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("salesReport")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(invoices.map((inv) => ({ "#": String(inv.number).padStart(5, "0"), Customer: inv.customer.name, Date: inv.invoiceDate.toLocaleDateString(), Subtotal: inv.subtotal, Tax: inv.taxAmount, Total: inv.total })), "sales-report", [{ key: "#", label: "Invoice #" }, { key: "Customer", label: "Customer" }, { key: "Date", label: "Date" }, { key: "Subtotal", label: "Subtotal" }, { key: "Tax", label: "Tax" }, { key: "Total", label: "Total" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("invoiceNo")}</TableHead><TableHead>{t("customer")}</TableHead><TableHead>{t("date")}</TableHead><TableHead className="text-right">{t("subtotal")}</TableHead><TableHead className="text-right">{t("tax")}</TableHead><TableHead className="text-right">{t("total")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{String(inv.number).padStart(5, "0")}</TableCell>
                  <TableCell>{inv.customer.name}</TableCell>
                  <TableCell>{inv.invoiceDate.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-mono">{inv.subtotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{inv.taxAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{inv.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell colSpan={3}>{t("total")}</TableCell>
                <TableCell className="text-right">{totals.subtotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.tax.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.total.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function PurchaseReportClient({ invoices }: { invoices: { id: string; number: number; invoiceDate: Date; vendor: { name: string }; subtotal: number; taxAmount: number; total: number; status: string }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const totals = invoices.reduce((s, inv) => ({ subtotal: s.subtotal + inv.subtotal, tax: s.tax + inv.taxAmount, total: s.total + inv.total }), { subtotal: 0, tax: 0, total: 0 });

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("purchaseReport")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(invoices.map((inv) => ({ "#": String(inv.number).padStart(5, "0"), Vendor: inv.vendor.name, Date: inv.invoiceDate.toLocaleDateString(), Subtotal: inv.subtotal, Tax: inv.taxAmount, Total: inv.total })), "purchase-report", [{ key: "#", label: "Invoice #" }, { key: "Vendor", label: "Vendor" }, { key: "Date", label: "Date" }, { key: "Subtotal", label: "Subtotal" }, { key: "Tax", label: "Tax" }, { key: "Total", label: "Total" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("invoiceNo")}</TableHead><TableHead>{t("vendor")}</TableHead><TableHead>{t("date")}</TableHead><TableHead className="text-right">{t("subtotal")}</TableHead><TableHead className="text-right">{t("tax")}</TableHead><TableHead className="text-right">{t("total")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{String(inv.number).padStart(5, "0")}</TableCell>
                  <TableCell>{inv.vendor.name}</TableCell>
                  <TableCell>{inv.invoiceDate.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-mono">{inv.subtotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{inv.taxAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{inv.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell colSpan={3}>{t("total")}</TableCell>
                <TableCell className="text-right">{totals.subtotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.tax.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.total.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function ExpenseReportClient({ expenses }: { expenses: { id: string; date: Date; description: string; lines: { id: string; account: { name: string; code: string }; amount: number }[] }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const total = expenses.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.amount, 0), 0);

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("expenseReport")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(expenses.flatMap((exp) => exp.lines.map((line) => ({ Date: exp.date.toLocaleDateString(), Description: exp.description, Account: `${line.account.code} - ${line.account.name}`, Amount: line.amount }))), "expense-report", [{ key: "Date", label: "Date" }, { key: "Description", label: "Description" }, { key: "Account", label: "Account" }, { key: "Amount", label: "Amount" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("date")}</TableHead><TableHead>{t("description")}</TableHead><TableHead>{t("account")}</TableHead><TableHead className="text-right">{t("amount")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) =>
                exp.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{exp.date.toLocaleDateString()}</TableCell>
                    <TableCell>{exp.description}</TableCell>
                    <TableCell>{line.account.code} - {line.account.name}</TableCell>
                    <TableCell className="text-right font-mono">{line.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell colSpan={3}>{t("total")}</TableCell>
                <TableCell className="text-right">{total.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function TaxReportClient({ data }: { data: { taxCodeId: string; taxCodeName: string; rate: number; taxableAmount: number; taxAmount: number }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const totals = data.reduce((s, d) => ({ taxable: s.taxable + d.taxableAmount, tax: s.tax + d.taxAmount }), { taxable: 0, tax: 0 });

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("taxReport")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(data.map((d) => ({ "Tax Code": d.taxCodeName, Rate: `${d.rate}%`, "Taxable Amount": d.taxableAmount, "Tax Amount": d.taxAmount })), "tax-report", [{ key: "Tax Code", label: "Tax Code" }, { key: "Rate", label: "Rate" }, { key: "Taxable Amount", label: "Taxable Amount" }, { key: "Tax Amount", label: "Tax Amount" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("taxCode")}</TableHead><TableHead className="text-right">{t("rate")}</TableHead><TableHead className="text-right">{t("taxableAmount")}</TableHead><TableHead className="text-right">{t("taxAmount")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.taxCodeId}>
                  <TableCell>{d.taxCodeName}</TableCell>
                  <TableCell className="text-right font-mono">{d.rate}%</TableCell>
                  <TableCell className="text-right font-mono">{d.taxableAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{d.taxAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell colSpan={2}>{t("total")}</TableCell>
                <TableCell className="text-right">{totals.taxable.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.tax.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function CashFlowClient({ data }: { data: { month: string; inflows: number; outflows: number; netCashFlow: number }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const totals = data.reduce((s, d) => ({ inflows: s.inflows + d.inflows, outflows: s.outflows + d.outflows, net: s.net + d.netCashFlow }), { inflows: 0, outflows: 0, net: 0 });

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("cashFlow")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(data.map((d) => ({ Month: d.month, Inflows: d.inflows, Outflows: d.outflows, "Net Cash Flow": d.netCashFlow })), "cash-flow", [{ key: "Month", label: "Month" }, { key: "Inflows", label: "Inflows" }, { key: "Outflows", label: "Outflows" }, { key: "Net Cash Flow", label: "Net Cash Flow" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("month")}</TableHead><TableHead className="text-right">{t("inflows")}</TableHead><TableHead className="text-right">{t("outflows")}</TableHead><TableHead className="text-right">{t("netCashFlow")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.month}>
                  <TableCell>{d.month}</TableCell>
                  <TableCell className="text-right font-mono">{d.inflows.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{d.outflows.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-mono ${d.netCashFlow >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>{d.netCashFlow.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell>{t("total")}</TableCell>
                <TableCell className="text-right">{totals.inflows.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totals.outflows.toFixed(2)}</TableCell>
                <TableCell className={`text-right ${totals.net >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>{totals.net.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function ARAgingClient({ customers }: { customers: { id: string; name: string; total: number; current: number; days1_30: number; days31_60: number; days61_90: number; days90Plus: number }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const grandTotal = customers.reduce((s, c) => s + c.total, 0);

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("arAging")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(customers.filter((c) => c.total > 0).map((c) => ({ Customer: c.name, Total: c.total, Current: c.current, "1-30 Days": c.days1_30, "31-60 Days": c.days31_60, "61-90 Days": c.days61_90, "90+ Days": c.days90Plus })), "ar-aging", [{ key: "Customer", label: "Customer" }, { key: "Total", label: "Total" }, { key: "Current", label: "Current" }, { key: "1-30 Days", label: "1-30 Days" }, { key: "31-60 Days", label: "31-60 Days" }, { key: "61-90 Days", label: "61-90 Days" }, { key: "90+ Days", label: "90+ Days" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("customer")}</TableHead><TableHead className="text-right">{t("total")}</TableHead><TableHead className="text-right">{t("current")}</TableHead><TableHead className="text-right">{t("days1to30")}</TableHead><TableHead className="text-right">{t("days31to60")}</TableHead><TableHead className="text-right">{t("days61to90")}</TableHead><TableHead className="text-right">{t("days90plus")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {customers.filter((c) => c.total > 0).map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-right font-mono">{c.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{c.current.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{c.days1_30.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{c.days31_60.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{c.days61_90.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{c.days90Plus.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell>{t("total")}</TableCell>
                <TableCell className="text-right">{grandTotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">{customers.reduce((s, c) => s + c.current, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{customers.reduce((s, c) => s + c.days1_30, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{customers.reduce((s, c) => s + c.days31_60, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{customers.reduce((s, c) => s + c.days61_90, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{customers.reduce((s, c) => s + c.days90Plus, 0).toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}

export function APAgingClient({ vendors }: { vendors: { id: string; name: string; total: number; current: number; days1_30: number; days31_60: number; days61_90: number; days90Plus: number }[] }) {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const grandTotal = vendors.reduce((s, v) => s + v.total, 0);

  return (
    <FadeIn>
      <div className="space-y-6">
        <PageHeader
          title={t("apAging")}
          description={t("asOf", { date: new Date().toLocaleDateString() })}
          actions={
            <Button variant="outline" size="sm" onClick={() => exportToExcel(vendors.filter((v) => v.total > 0).map((v) => ({ Vendor: v.name, Total: v.total, Current: v.current, "1-30 Days": v.days1_30, "31-60 Days": v.days31_60, "61-90 Days": v.days61_90, "90+ Days": v.days90Plus })), "ap-aging", [{ key: "Vendor", label: "Vendor" }, { key: "Total", label: "Total" }, { key: "Current", label: "Current" }, { key: "1-30 Days", label: "1-30 Days" }, { key: "31-60 Days", label: "31-60 Days" }, { key: "61-90 Days", label: "61-90 Days" }, { key: "90+ Days", label: "90+ Days" }])}>
                <Download className="h-4 w-4 ms-1" /> {tc("export")}
              </Button>
          }
        />
        <div className="rounded-lg border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("vendor")}</TableHead><TableHead className="text-right">{t("total")}</TableHead><TableHead className="text-right">{t("current")}</TableHead><TableHead className="text-right">{t("days1to30")}</TableHead><TableHead className="text-right">{t("days31to60")}</TableHead><TableHead className="text-right">{t("days61to90")}</TableHead><TableHead className="text-right">{t("days90plus")}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {vendors.filter((v) => v.total > 0).map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.name}</TableCell>
                  <TableCell className="text-right font-mono">{v.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{v.current.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{v.days1_30.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{v.days31_60.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{v.days61_90.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{v.days90Plus.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 dark:border-gray-700">
                <TableCell>{t("total")}</TableCell>
                <TableCell className="text-right">{grandTotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">{vendors.reduce((s, v) => s + v.current, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{vendors.reduce((s, v) => s + v.days1_30, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{vendors.reduce((s, v) => s + v.days31_60, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{vendors.reduce((s, v) => s + v.days61_90, 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">{vendors.reduce((s, v) => s + v.days90Plus, 0).toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </FadeIn>
  );
}
