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
import { ShieldCheck, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant: Record<string, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  PAID: "success",
  CANCELLED: "danger",
};

export default async function SocialInsurancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const records = await prisma.socialInsuranceRecord.findMany({
    where: { organizationId: orgId },
    orderBy: [{ period: "desc" }, { employee: { name: "asc" } }],
    include: { employee: true },
  });

  const totalEmployeeShare = records.reduce((s, r) => s + Number(r.employeeShare), 0);
  const totalEmployerShare = records.reduce((s, r) => s + Number(r.employerShare), 0);
  const totalContributions = records.reduce((s, r) => s + Number(r.totalContribution), 0);

  return (
    <FadeIn>
      <PageHeader title={tnav("socialInsurance")} description={`${records.length} contribution records`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Employee Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalEmployeeShare)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Employer Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalEmployerShare)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalContributions)}</p>
          </CardContent>
        </Card>
      </div>
      {records.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No social insurance records</h3>
            <p className="text-sm text-gray-500">Records will appear once contributions are calculated.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Employee Share</TableHead>
                <TableHead>Employer Share</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.period}</TableCell>
                  <TableCell className="font-medium">{r.employee.name}</TableCell>
                  <TableCell>{formatCurrency(Number(r.salary))}</TableCell>
                  <TableCell>{formatCurrency(Number(r.employeeShare))}</TableCell>
                  <TableCell>{formatCurrency(Number(r.employerShare))}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(Number(r.totalContribution))}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status] || "warning"} className="capitalize">
                      {r.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}
