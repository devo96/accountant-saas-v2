import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function AssetTransferPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const assets = await prisma.fixedAsset.findMany({
    where: { organizationId: session.user.organizationId, status: "TRANSFERRED" },
    orderBy: { updatedAt: "desc" },
  });

  const tnav = await getTranslations("nav");
  const tf = await getTranslations("fixedAssets");

  return (
    <FadeIn>
      <PageHeader
        title={tnav("assetTransfer")}
        description={`${assets.length} transferred assets`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Transferred</CardTitle>
            <ArrowRightLeft className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tf("cost")}</CardTitle>
            <RefreshCw className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(assets.reduce((s, a) => s + Number(a.purchaseCost), 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{tf("bookValue")}</CardTitle>
            <RefreshCw className="h-5 w-5 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(assets.reduce((s, a) => s + Number(a.bookValue), 0))}</div>
          </CardContent>
        </Card>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tf("code")}</TableHead>
              <TableHead>{tf("name")}</TableHead>
              <TableHead>{tf("category")}</TableHead>
              <TableHead>{tf("cost")}</TableHead>
              <TableHead>{tf("bookValue")}</TableHead>
              <TableHead>Transfer Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                    <span>No transferred assets found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.code}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell>{formatCurrency(Number(a.purchaseCost))}</TableCell>
                  <TableCell>{formatCurrency(Number(a.bookValue))}</TableCell>
                  <TableCell>{formatDate(a.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
