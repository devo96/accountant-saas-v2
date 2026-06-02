"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type PurchaseReturn = {
  id: string;
  number: number;
  returnDate: string;
  status: string;
  total: number;
  vendorName: string;
};

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  DRAFT: "outline",
  CONFIRMED: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export default function PurchaseReturnsClient({ returns }: { returns: PurchaseReturn[] }) {
  const router = useRouter();
  const t = useTranslations("purchaseReturns");
  const s = useTranslations("common");
  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", ACCEPTED: "accepted", REJECTED: "rejected" };
  const columns = [
    { key: "number", label: t("returnNo"), render: (r: PurchaseReturn) => generateNumber("PR", r.number) },
    { key: "vendorName", label: t("vendor") },
    { key: "returnDate", label: t("date"), render: (r: PurchaseReturn) => formatDate(new Date(r.returnDate)) },
    { key: "status", label: t("status"), render: (r: PurchaseReturn) => <Badge variant={statusVariant[r.status] || "outline"}>{s(statusLabels[r.status] || r.status)}</Badge> },
    { key: "total", label: t("total"), render: (r: PurchaseReturn) => formatCurrency(r.total) },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <DataTable columns={columns} data={returns} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(r) => router.push(`/purchases/returns/${(r as PurchaseReturn).id}`)} exportable exportFilename="purchase-returns" filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]} />
    </div>
    </FadeIn>
  );
}
