"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Adjustment = {
  id: string; quantityBefore: number; quantityAfter: number; reason: string; reference: string | null; createdAt: Date;
  item: { name: string; sku: string | null };
  warehouse: { name: string };
  createdBy: { name: string } | null;
};

type Props = { adjustment: Adjustment };

export function AdjustmentViewClient({ adjustment }: Props) {
  const t = useTranslations("inventoryAdjustments");
  const router = useRouter();
  const diff = adjustment.quantityAfter - adjustment.quantityBefore;

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/inventory/adjustments")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("adjustmentInfo")}</h2>
            <Badge variant={diff >= 0 ? "success" : "danger"}>{diff >= 0 ? t("add") : t("remove")}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {adjustment.createdBy?.name ?? "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("item")}</span><span className="font-semibold">{adjustment.item.name}{adjustment.item.sku ? ` (${adjustment.item.sku})` : ""}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("warehouse")}</span><span>{adjustment.warehouse.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("date")}</span><span>{new Date(adjustment.createdAt).toLocaleDateString()}</span></div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("quantityBefore")}</span><span>{adjustment.quantityBefore}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("quantityAfter")}</span><span>{adjustment.quantityAfter}</span></div>
          <div className="flex justify-between font-bold border-t dark:border-gray-700 pt-1"><span className="text-gray-500 dark:text-gray-400">{t("reason")}</span><span>{adjustment.reason}</span></div>
        </div>
      </div>

      {adjustment.reference && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t("reference")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{adjustment.reference}</p>
        </div>
      )}
    </div>
    </FadeIn>
  );
}
