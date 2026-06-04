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
import { Building2 } from "lucide-react";

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const branches = await prisma.branch.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <FadeIn>
      <PageHeader title={tnav("branches")} description={`${branches.length} branches configured`} />
      {branches.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No branches</h3>
            <p className="text-sm text-gray-500">Create branches for multi-location support.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Arabic Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.code || "-"}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.nameAr || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{b.address || "-"}</TableCell>
                  <TableCell>{b.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={b.active ? "success" : "danger"}>{b.active ? "Active" : "Inactive"}</Badge>
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
