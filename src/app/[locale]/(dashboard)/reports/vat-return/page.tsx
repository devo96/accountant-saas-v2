import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function VatReturnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const orgId = session.user.organizationId;

  const [salesInvoices, purchaseInvoices] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { organizationId: orgId, status: { in: ["CONFIRMED", "PAID"] } },
      select: { taxAmount: true, total: true, subtotal: true },
    }),
    prisma.purchaseInvoice.findMany({
      where: { organizationId: orgId, status: { in: ["CONFIRMED", "PAID"] } },
      select: { taxAmount: true, total: true, subtotal: true },
    }),
  ]);

  const totalSalesTax = salesInvoices.reduce((s, i) => s + Number(i.taxAmount), 0);
  const totalPurchaseTax = purchaseInvoices.reduce((s, i) => s + Number(i.taxAmount), 0);
  const netTaxPayable = totalSalesTax - totalPurchaseTax;
  const totalSales = salesInvoices.reduce((s, i) => s + Number(i.subtotal), 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + Number(i.subtotal), 0);

  const tnav = await getTranslations("nav");
  const tc = await getTranslations("common");

  return (
    <FadeIn>
      <PageHeader title={tnav("vatReturn")} description="VAT return summary for the period" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sales (excl. Tax)</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Output VAT</CardTitle>
            <Receipt className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalesTax)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Purchases (excl. Tax)</CardTitle>
            <TrendingDown className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchases)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Input VAT</CardTitle>
            <ArrowRightLeft className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPurchaseTax)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Net VAT Payable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-500">Output VAT - Input VAT</span>
            <span className={`text-3xl font-bold ${netTaxPayable >= 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(netTaxPayable)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {netTaxPayable >= 0
              ? "Amount payable to tax authority"
              : "Amount recoverable from tax authority"}
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>{tc("subtotal")}</TableHead>
              <TableHead>{tc("tax")}</TableHead>
              <TableHead>{tc("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Sales</TableCell>
              <TableCell>{formatCurrency(totalSales)}</TableCell>
              <TableCell>{formatCurrency(totalSalesTax)}</TableCell>
              <TableCell>{formatCurrency(totalSales + totalSalesTax)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Purchases</TableCell>
              <TableCell>{formatCurrency(totalPurchases)}</TableCell>
              <TableCell>{formatCurrency(totalPurchaseTax)}</TableCell>
              <TableCell>{formatCurrency(totalPurchases + totalPurchaseTax)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
