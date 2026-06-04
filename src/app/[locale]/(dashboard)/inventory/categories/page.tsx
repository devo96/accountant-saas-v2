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
import { FolderTree, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const categories = await prisma.category.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <FadeIn>
      <PageHeader title={tnav("categories")} description={`${categories.length} categories configured`} />
      {categories.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderTree className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No categories yet</h3>
            <p className="text-sm text-gray-500">Create categories to organize your items.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Arabic Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.nameAr || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{c.type.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.active ? "success" : "danger"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </FadeIn>
  );
}
