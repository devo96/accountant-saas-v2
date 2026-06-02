"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Quote = {
  id: string;
  number: number;
  quoteDate: string;
  expiryDate: string | null;
  status: string;
  total: number;
  customerName: string;
};

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  DRAFT: "outline",
  CONFIRMED: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export default function SalesQuotesClient({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const t = useTranslations("salesQuotes");
  const s = useTranslations("common");

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", ACCEPTED: "accepted", REJECTED: "rejected" };

  const columns = [
    { key: "number", label: t("quoteNo"), render: (q: Quote) => generateNumber("Q", q.number) },
    { key: "customerName", label: t("customer") },
    { key: "quoteDate", label: t("date"), render: (q: Quote) => formatDate(new Date(q.quoteDate)) },
    { key: "expiryDate", label: t("expiry"), render: (q: Quote) => q.expiryDate ? formatDate(new Date(q.expiryDate)) : "-" },
    {
      key: "status",
      label: t("status"),
      render: (q: Quote) => <Badge variant={statusVariant[q.status] || "outline"}>{s(statusLabels[q.status] || q.status)}</Badge>,
    },
    { key: "total", label: t("total"), render: (q: Quote) => formatCurrency(q.total) },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={() => router.push("/sales/quotes/new")}>
            <Plus className="h-4 w-4 ms-2" /> {t("newQuote")}
          </Button>
        }
      />
      <DataTable columns={columns} data={quotes} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(q) => router.push(`/sales/quotes/${(q as Quote).id}`)} exportable exportFilename="sales-quotes" filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]} />
    </div>
    </FadeIn>
  );
}
