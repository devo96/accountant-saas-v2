import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, BookOpen } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function OpeningBalancesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const accounts = await prisma.account.findMany({
    where: { organizationId: orgId },
    orderBy: { code: "asc" },
    include: { currency: true },
  });

  const nonZeroAccounts = accounts.filter((a) => Number(a.balance) !== 0);
  const totalDebitBalance = nonZeroAccounts
    .filter((a) => a.nature === "DEBIT")
    .reduce((s, a) => s + Number(a.balance), 0);
  const totalCreditBalance = nonZeroAccounts
    .filter((a) => a.nature === "CREDIT")
    .reduce((s, a) => s + Number(a.balance), 0);

  return (
    <FadeIn>
      <PageHeader
        title={tnav("openingBalances")}
        description={`${nonZeroAccounts.length} حساب برصيد غير صفري`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الأرصدة المدينة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDebitBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الأرصدة الدائنة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCreditBalance)}</p>
          </CardContent>
        </Card>
      </div>
      {nonZeroAccounts.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">جميع الأرصدة صفرية</h3>
            <p className="text-sm text-gray-500">حدد الأرصدة الافتتاحية للحسابات للبدء.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الطبيعة</TableHead>
                <TableHead>الرصيد</TableHead>
                <TableHead>العملة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonZeroAccounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm">{a.code}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{a.type.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.nature === "DEBIT" ? "info" : "warning"}>{a.nature}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(a.balance))}</TableCell>
                  <TableCell>{a.currency?.code || "SAR"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}
