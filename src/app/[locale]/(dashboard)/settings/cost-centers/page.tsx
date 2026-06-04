import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { FolderTree } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function CostCentersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const dimensions = await prisma.accountingDimension.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { allocations: true } } },
  });

  const tnav = await getTranslations("nav");
  const td = await getTranslations("accountingDimensions");

  return (
    <FadeIn>
      <PageHeader
        title={tnav("costCenters")}
        description={`${dimensions.length} cost centers`}
      />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{td("name")}</TableHead>
              <TableHead>{td("nameAr")}</TableHead>
              <TableHead>{td("accountsCount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dimensions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <FolderTree className="h-8 w-8 text-gray-400" />
                    <span>{td("noResults")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              dimensions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-gray-500">{d.nameAr ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{d._count.allocations}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
