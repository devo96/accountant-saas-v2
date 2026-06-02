"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Invoice = {
  id: string;
  number: number;
  invoiceDate: Date;
  status: string;
  total: number;
  customer: { name: string } | null;
};

type Props = {
  invoices: Invoice[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customers: any[];
};

const statusVariant: Record<string, "success" | "warning" | "danger" | "default" | "outline"> = {
  DRAFT: "outline",
  CONFIRMED: "warning",
  PAID: "success",
  PARTIALLY_PAID: "warning",
  CANCELLED: "danger",
};

export function InvoicesClient({ invoices }: Props) {
  const router = useRouter();
  const t = useTranslations("salesInvoices");
  const s = useTranslations("common");

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", PAID: "paid", PARTIALLY_PAID: "partiallyPaid", CANCELLED: "cancelled" };

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => router.push("/sales/invoices/new")}>
            <Plus className="h-4 w-4 ms-1" /> {t("newInvoice")}
          </Button>
        }
      />

      <DataTable
        searchable
        searchPlaceholder={t("searchPlaceholder")}
        columns={[
          { key: "number", label: t("invoiceNo"), render: (i) => `INV-${String(i.number).padStart(5, "0")}` },
          { key: "customer", label: t("customer"), render: (i) => (i as Invoice).customer?.name ?? "-" },
          { key: "invoiceDate", label: t("date"), render: (i) => new Date((i as Invoice).invoiceDate).toLocaleDateString() },
          { key: "status", label: t("status"), render: (i) => <Badge variant={statusVariant[(i as Invoice).status] ?? "default"}>{s(statusLabels[(i as Invoice).status] || (i as Invoice).status)}</Badge> },
          { key: "total", label: t("total"), render: (i) => `﷼ ${Number((i as Invoice).total).toLocaleString()}` },
        ]}
        data={invoices as unknown as Record<string, unknown>[]}
        onRowClick={(i) => router.push(`/sales/invoices/${(i as Invoice).id}`)}
        exportable exportFilename="sales-invoices"
        filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]}
      />
    </div>
    </FadeIn>
  );
}
