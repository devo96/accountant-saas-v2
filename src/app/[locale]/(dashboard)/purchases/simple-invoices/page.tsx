import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate, generateNumber } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const statusVariants: Record<string, "default" | "success" | "warning" | "danger" | "outline" | "info"> = {
  DRAFT: "default",
  CONFIRMED: "info",
  PAID: "success",
  PARTIALLY_PAID: "warning",
  CANCELLED: "danger",
};

export default async function SimpleInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const invoices = (await prisma.purchaseInvoice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: true },
  })).map((i) => ({ ...i, total: Number(i.total) }));

  const tnav = await getTranslations("nav");
  const tp = await getTranslations("purchaseInvoices");
  const tc = await getTranslations("common");

  return (
    <FadeIn>
      <PageHeader
        title={tnav("simpleInvoices")}
        description={tp("subtitle")}
      />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tp("invoiceNo")}</TableHead>
              <TableHead>{tp("vendor")}</TableHead>
              <TableHead>{tp("date")}</TableHead>
              <TableHead>{tp("status")}</TableHead>
              <TableHead>{tp("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span>{tc("noData")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{generateNumber("PI", inv.number)}</TableCell>
                  <TableCell>{inv.vendor?.name ?? "—"}</TableCell>
                  <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[inv.status] ?? "default"}>
                      {tc(inv.status.toLowerCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(inv.total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </FadeIn>
  );
}
