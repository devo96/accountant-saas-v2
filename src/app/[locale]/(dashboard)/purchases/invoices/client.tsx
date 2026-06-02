"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Invoice = { id: string; number: number; invoiceDate: Date; status: string; total: number; vendor: { name: string } | null };
type Props = { invoices: Invoice[] };

const statusVariant: Record<string, "success" | "warning" | "danger" | "default" | "outline"> = {
  DRAFT: "outline", CONFIRMED: "warning", PAID: "success", PARTIALLY_PAID: "warning", CANCELLED: "danger",
};

export function PurchaseInvoicesClient({ invoices }: Props) {
  const t = useTranslations("purchaseInvoices");
  const s = useTranslations("common");
  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", PAID: "paid", PARTIALLY_PAID: "partiallyPaid", CANCELLED: "cancelled" };
  const router = useRouter();

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("invoices", { count: invoices.length })}
        actions={
          <Button onClick={() => router.push("/purchases/invoices/new")}><Plus className="h-4 w-4 ms-1" /> {t("newInvoice")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "number", label: t("invoiceNo"), render: (i) => `PINV-${String((i as Invoice).number).padStart(5, "0")}` },
          { key: "vendor", label: t("vendor"), render: (i) => (i as Invoice).vendor?.name ?? "-" },
          { key: "invoiceDate", label: t("date"), render: (i) => new Date((i as Invoice).invoiceDate).toLocaleDateString() },
          { key: "status", label: t("status"), render: (i) => <Badge variant={statusVariant[(i as Invoice).status] ?? "default"}>{s(statusLabels[(i as Invoice).status] || (i as Invoice).status)}</Badge> },
          { key: "total", label: t("total"), render: (i) => `﷼ ${Number((i as Invoice).total).toLocaleString()}` },
        ]}
        data={invoices as unknown as Record<string, unknown>[]}
        onRowClick={(i) => router.push(`/purchases/invoices/${(i as Invoice).id}`)}
        exportable exportFilename="purchase-invoices"
        filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]}
      />
    </div>
    </FadeIn>
  );
}
