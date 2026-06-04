import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function DisposalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const assets = await prisma.fixedAsset.findMany({
    where: { organizationId: session.user.organizationId, status: "DISPOSED" },
    orderBy: { updatedAt: "desc" },
  });

  const tnav = await getTranslations("nav");
  const tf = await getTranslations("fixedAssets");

  return (
    <FadeIn>
      <PageHeader
        title={tnav("disposals")}
        description={`${assets.length} disposed assets`}
      />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tf("code")}</TableHead>
              <TableHead>{tf("name")}</TableHead>
              <TableHead>{tf("category")}</TableHead>
              <TableHead>{tf("cost")}</TableHead>
              <TableHead>{tf("bookValue")}</TableHead>
              <TableHead>Disposal Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Trash2 className="h-8 w-8 text-gray-400" />
                    <span>No disposed assets found</span>
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
