"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type PaymentReceipt = {
  id: string; number: number; date: string; amount: number; method: string;
  reference: string | null; notes: string | null;
  salesInvoice: { number: number } | null;
  purchaseInvoice: { number: number } | null;
};

type Props = { paymentReceipt: PaymentReceipt };

const methodColors: Record<string, "outline" | "success" | "warning" | "danger"> = {
  CASH: "success", BANK_TRANSFER: "warning", CHECK: "outline", CREDIT_CARD: "success", OTHER: "outline",
};

const methodLabels: Record<string, string> = {
  CASH: "cash", BANK_TRANSFER: "bankTransfer", CHECK: "check", CREDIT_CARD: "creditCard", OTHER: "other",
};

export function PaymentReceiptDetailClient({ paymentReceipt }: Props) {
  const router = useRouter();
  const t = useTranslations("paymentReceipts");
  const s = useTranslations("common");

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/banking/payment-receipts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("receiptInfo")}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("receiptNo")}: {paymentReceipt.number}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("receiptInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("receiptNo")}</dt>
            <dd className="font-medium">{String(paymentReceipt.number).padStart(4, "0")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("date")}</dt>
            <dd className="font-medium">{new Date(paymentReceipt.date).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("amount")}</dt>
            <dd className="font-medium">{paymentReceipt.amount.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("method")}</dt>
            <dd className="font-medium">
              <Badge variant={methodColors[paymentReceipt.method] || "outline"}>{s(methodLabels[paymentReceipt.method] || paymentReceipt.method)}</Badge>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("reference")}</dt>
            <dd className="font-medium">{paymentReceipt.reference ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("invoice")}</dt>
            <dd className="font-medium">
              {paymentReceipt.salesInvoice
                ? `SI-${String(paymentReceipt.salesInvoice.number).padStart(4, "0")}`
                : paymentReceipt.purchaseInvoice
                  ? `PI-${String(paymentReceipt.purchaseInvoice.number).padStart(4, "0")}`
                  : "-"}
            </dd>
          </div>
          {paymentReceipt.notes && (
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("notes")}</dt>
              <dd className="font-medium">{paymentReceipt.notes}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
    </FadeIn>
  );
}
