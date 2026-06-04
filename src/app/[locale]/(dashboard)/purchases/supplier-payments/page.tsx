import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowRightLeft } from "lucide-react";
import { formatCurrency, formatDate, generateNumber } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const methodLabels: Record<string, string> = {
  CASH: "cash",
  BANK_TRANSFER: "bankTransfer",
  CHECK: "check",
  CREDIT_CARD: "creditCard",
  OTHER: "other",
};

export default async function SupplierPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const receipts = await prisma.paymentReceipt.findMany({
    where: { organizationId: session.user.organizationId, purchaseInvoiceId: { not: null } },
    orderBy: { date: "desc" },
    include: { purchaseInvoice: { include: { vendor: true } } },
  });

  const tnav = await getTranslations("nav");
  const tp = await getTranslations("paymentReceipts");
  const tc = await getTranslations("common");

  return (
    <FadeIn>
      <PageHeader
        title={tnav("supplierPayments")}
        description={tp("receipts", { count: receipts.length })}
        actions={
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 ms-1" />
            {tc("export")}
          </Button>
        }
      />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tp("receiptNo")}</TableHead>
              <TableHead>{tc("vendor")}</TableHead>
              <TableHead>{tp("date")}</TableHead>
              <TableHead>{tp("amount")}</TableHead>
              <TableHead>{tp("method")}</TableHead>
              <TableHead>{tp("reference")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                    <span>{tc("noData")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{generateNumber("PYMT", r.number)}</TableCell>
                  <TableCell>{r.purchaseInvoice?.vendor?.name ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>{formatCurrency(Number(r.amount))}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tp(methodLabels[r.method] ?? "other")}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{r.reference ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
