"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type SalesReturn = {
  id: string;
  number: number;
  returnDate: string;
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

export default function SalesReturnsClient({ returns }: { returns: SalesReturn[] }) {
  const router = useRouter();
  const t = useTranslations("salesReturns");
  const s = useTranslations("common");
  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", ACCEPTED: "accepted", REJECTED: "rejected" };
  const columns = [
    { key: "number", label: t("returnNo"), render: (r: SalesReturn) => generateNumber("SR", r.number) },
    { key: "customerName", label: t("customer") },
    { key: "returnDate", label: t("date"), render: (r: SalesReturn) => formatDate(new Date(r.returnDate)) },
    { key: "status", label: t("status"), render: (r: SalesReturn) => <Badge variant={statusVariant[r.status] || "outline"}>{s(statusLabels[r.status] || r.status)}</Badge> },
    { key: "total", label: t("total"), render: (r: SalesReturn) => formatCurrency(r.total) },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <DataTable columns={columns} data={returns} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(r) => router.push(`/sales/returns/${(r as SalesReturn).id}`)} exportable exportFilename="sales-returns" filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]} />
    </div>
    </FadeIn>
  );
}
