import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ruler } from "lucide-react";

export default async function UnitsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const units = await prisma.unitOfMeasure.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <FadeIn>
      <PageHeader title={tnav("units")} description={`${units.length} units of measure defined`} />
      {units.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Ruler className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No units of measure</h3>
            <p className="text-sm text-gray-500">Add units like pieces, kg, or liters to standardize inventory.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Arabic Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.nameAr || "-"}</TableCell>
                  <TableCell className="font-mono">{u.symbol || "-"}</TableCell>
                  <TableCell>{u.precision}</TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "success" : "danger"}>{u.active ? "Active" : "Inactive"}</Badge>
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
