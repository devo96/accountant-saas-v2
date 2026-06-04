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
import { CircleDollarSign, Handshake, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "warning" | "success" | "info" | "danger" | "outline"> = {
  PENDING: "warning",
  APPROVED: "info",
  PAID: "success",
  REPAID: "outline",
};

export default async function AdvancesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const advances = await prisma.advance.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: { employee: true },
  });

  const totalAmount = advances.reduce((s, a) => s + Number(a.amount), 0);
  const totalRepaid = advances.reduce((s, a) => s + Number(a.repaidAmount), 0);
  const pendingApprovals = advances.filter((a) => a.status === "PENDING").length;

  return (
    <FadeIn>
      <PageHeader title={tnav("advances")} description={`${advances.length} advances recorded`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4" /> Total Advances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingApprovals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Total Repaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRepaid)}</p>
          </CardContent>
        </Card>
      </div>
      {advances.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Handshake className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No advances</h3>
            <p className="text-sm text-gray-500">Salary advances will appear here once created.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Repaid</TableHead>
                <TableHead>Installments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.employee.name}</TableCell>
                  <TableCell>{formatCurrency(Number(a.amount))}</TableCell>
                  <TableCell className="text-gray-500">{formatDate(a.date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[a.status] || "outline"} className="capitalize">
                      {a.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(a.repaidAmount))}</TableCell>
                  <TableCell>{a.installments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}
