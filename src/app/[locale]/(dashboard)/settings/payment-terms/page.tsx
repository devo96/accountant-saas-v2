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
import { Handshake } from "lucide-react";

export default async function PaymentTermsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const terms = await prisma.paymentTerm.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <FadeIn>
      <PageHeader title={tnav("paymentTerms")} description={`${terms.length} payment terms defined`} />
      {terms.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Handshake className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No payment terms</h3>
            <p className="text-sm text-gray-500">Define payment terms to apply on sales and purchase invoices.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Arabic Name</TableHead>
                <TableHead>Due Days</TableHead>
                <TableHead>Discount Days</TableHead>
                <TableHead>Discount %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.nameAr || "-"}</TableCell>
                  <TableCell>{t.dueDays}</TableCell>
                  <TableCell>{t.discountDays}</TableCell>
                  <TableCell>{Number(t.discountPercent)}%</TableCell>
                  <TableCell>
                    <Badge variant={t.active ? "success" : "danger"}>{t.active ? "Active" : "Inactive"}</Badge>
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
