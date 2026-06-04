import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function DepreciationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const assets = await prisma.fixedAsset.findMany({
    where: { organizationId: session.user.organizationId, status: "ACTIVE" },
    orderBy: { purchaseDate: "desc" },
  });

  const tnav = await getTranslations("nav");
  const tf = await getTranslations("fixedAssets");

  const totalBookValue = assets.reduce((s, a) => s + Number(a.bookValue), 0);
  const totalAccumulatedDep = assets.reduce((s, a) => s + Number(a.accumulatedDepreciation), 0);

  const assetsWithDep = assets.map((a) => {
    const cost = Number(a.purchaseCost);
    const salvage = Number(a.salvageValue);
    const usefulLife = a.usefulLifeYears;
    const annualDep = usefulLife > 0 ? (cost - salvage) / usefulLife : 0;
    return { ...a, annualDepreciation: annualDep, purchaseCost: cost, bookValue: Number(a.bookValue), accumulatedDepreciation: Number(a.accumulatedDepreciation) };
  });

  return (
    <FadeIn>
      <PageHeader title={tnav("depreciation")} description={tf("assets", { count: assets.length })} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tf("bookValue")}</CardTitle>
            <Calculator className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBookValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tf("cost")}</CardTitle>
            <TrendingDown className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAccumulatedDep)}</div>
            <p className="text-xs text-gray-500 mt-1">Accumulated Depreciation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Assets</CardTitle>
            <Calculator className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tf("code")}</TableHead>
              <TableHead>{tf("name")}</TableHead>
              <TableHead>{tf("purchaseDate")}</TableHead>
              <TableHead>{tf("cost")}</TableHead>
              <TableHead>{tf("bookValue")}</TableHead>
              <TableHead>Annual Dep.</TableHead>
              <TableHead>{tf("accumulatedDepreciation")}</TableHead>
              <TableHead>{tf("usefulLife")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assetsWithDep.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Calculator className="h-8 w-8 text-gray-400" />
                    <span>{tf("noAssets") ?? "No assets found"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              assetsWithDep.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.code}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{formatDate(a.purchaseDate)}</TableCell>
                  <TableCell>{formatCurrency(a.purchaseCost)}</TableCell>
                  <TableCell>{formatCurrency(a.bookValue)}</TableCell>
                  <TableCell>{formatCurrency(a.annualDepreciation)}</TableCell>
                  <TableCell>{formatCurrency(a.accumulatedDepreciation)}</TableCell>
                  <TableCell>{a.usefulLifeYears} yrs</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
