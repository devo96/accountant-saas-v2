import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getQualityChecks(orgId: string) {
  const totalEntries = await prisma.journalEntry.count({ where: { organizationId: orgId } });
  const draftEntries = await prisma.journalEntry.count({ where: { organizationId: orgId, status: "DRAFT" } });
  const postedEntries = totalEntries - draftEntries;

  const unbalancedEntries = await prisma.journalEntry.findMany({
    where: { organizationId: orgId },
    include: { lines: true },
  });
  const unbalanced = unbalancedEntries.filter((e) => {
    const totalDebit = e.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = e.lines.reduce((s, l) => s + Number(l.credit), 0);
    return e.status === "POSTED" && totalDebit !== totalCredit;
  });

  const unreconciledTransactions = await prisma.bankTransaction.count({
    where: { organizationId: orgId, reconciled: false },
  });

  const accounts = await prisma.account.findMany({
    where: { organizationId: orgId },
  });
  const negativeBalanceAccounts = accounts.filter((a) => Number(a.balance) < 0).length;

  const score = Math.round(
    ((totalEntries === 0 ? 1 : postedEntries / Math.max(totalEntries, 1)) * 40 +
      (totalEntries === 0 ? 1 : (totalEntries - unbalanced.length) / Math.max(totalEntries, 1)) * 30 +
      (1 - negativeBalanceAccounts / Math.max(accounts.length, 1)) * 30)
  );

  return { totalEntries, draftEntries, postedEntries, unbalanced: unbalanced.length, unreconciledTransactions, negativeBalanceAccounts, score };
}

export default async function AccountingQualityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const checks = await getQualityChecks(orgId);

  const checksList = [
    {
      label: "Posted Entries",
      status: checks.draftEntries === 0 ? "pass" : checks.draftEntries < checks.totalEntries * 0.2 ? "warn" : "fail",
      detail: `${checks.postedEntries} of ${checks.totalEntries} entries posted (${checks.draftEntries} drafts)`,
    },
    {
      label: "Balanced Entries",
      status: checks.unbalanced === 0 ? "pass" : "fail",
      detail: `${checks.unbalanced} posted entries with unbalanced debits/credits`,
    },
    {
      label: "Reconciled Transactions",
      status: checks.unreconciledTransactions === 0 ? "pass" : "warn",
      detail: `${checks.unreconciledTransactions} unreconciled bank transactions`,
    },
    {
      label: "Account Balances",
      status: checks.negativeBalanceAccounts === 0 ? "pass" : "warn",
      detail: `${checks.negativeBalanceAccounts} accounts with negative balances`,
    },
  ];

  const scoreColor = checks.score >= 80 ? "text-green-600" : checks.score >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg = checks.score >= 80 ? "bg-green-50 dark:bg-green-950/30 border-green-200" : checks.score >= 50 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" : "bg-red-50 dark:bg-red-950/30 border-red-200";

  return (
    <FadeIn>
      <PageHeader title={tnav("accountingQuality")} description="Review the health of your accounting data" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`lg:col-span-1 flex flex-col items-center justify-center p-8 ${scoreBg}`}>
          <p className="text-sm font-medium text-gray-500 mb-2">Quality Score</p>
          <p className={`text-6xl font-bold ${scoreColor}`}>{checks.score}</p>
          <p className="text-sm text-gray-500 mt-2">/ 100</p>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {checksList.map((c) => (
            <Card key={c.label} className={`border-l-4 ${c.status === "pass" ? "border-l-green-500" : c.status === "warn" ? "border-l-amber-500" : "border-l-red-500"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {c.status === "pass" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : c.status === "warn" ? (
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">{c.label}</p>
                    <p className="text-sm text-gray-500">{c.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
