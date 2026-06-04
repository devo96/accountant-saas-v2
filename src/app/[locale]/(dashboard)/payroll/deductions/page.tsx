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
import { MinusCircle, ClipboardList, RepeatIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const typeColors: Record<string, "info" | "warning" | "danger" | "outline"> = {
  GOSI: "info",
  LOAN: "warning",
  PENALTY: "danger",
  OTHER: "outline",
};

export default async function DeductionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const deductions = await prisma.deduction.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: { employee: true },
  });

  const byType = deductions.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + Number(d.amount);
    return acc;
  }, {});
  const totalDeductions = deductions.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <FadeIn>
      <PageHeader title={tnav("deductions")} description={`${deductions.length} deductions recorded`} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(byType).map(([type, total]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 capitalize">{type.toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalDeductions)}</p>
          </CardContent>
        </Card>
      </div>
      {deductions.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No deductions</h3>
            <p className="text-sm text-gray-500">Payroll deductions will appear here once created.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.employee.name}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[d.type] || "outline"} className="capitalize">
                      {d.type.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(d.amount))}</TableCell>
                  <TableCell className="text-gray-500">{formatDate(d.date)}</TableCell>
                  <TableCell>{d.recurring ? <RepeatIcon className="h-4 w-4 text-primary" /> : "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-gray-500">{d.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}
