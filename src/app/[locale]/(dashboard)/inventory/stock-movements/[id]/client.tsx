"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { formatCurrency, formatDate } from "@/lib/utils";

type StockMovement = {
  id: string; type: string; quantity: number; unitCost: number; totalCost: number;
  reference: string | null; description: string | null; createdAt: Date;
  item: { name: string; nameAr: string | null; sku: string | null };
  warehouse: { name: string; nameAr: string | null };
  createdBy: { name: string } | null;
};

type Props = { movement: StockMovement };

const typeColors: Record<string, "success" | "danger" | "warning" | "outline"> = {
  PURCHASE_RECEIPT: "success", SALES_DELIVERY: "danger", ADJUSTMENT_IN: "warning", ADJUSTMENT_OUT: "danger", TRANSFER: "outline",
};

export function StockMovementViewClient({ movement }: Props) {
  const t = useTranslations("stockMovements");
  const router = useRouter();

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/inventory/stock-movements")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("movementInfo")}</h2>
            <Badge variant={typeColors[movement.type] || "outline"}>{t("type" + movement.type)}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {movement.createdBy?.name ?? "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("item")}</span><span className="font-semibold">{movement.item.nameAr ?? movement.item.name} ({movement.item.sku ?? "-"})</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("warehouse")}</span><span>{movement.warehouse.nameAr ?? movement.warehouse.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("date")}</span><span>{formatDate(new Date(movement.createdAt))}</span></div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("quantity")}</span><span className="font-bold">{movement.quantity}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("unitCost")}</span><span>{formatCurrency(movement.unitCost)}</span></div>
          <div className="flex justify-between font-bold border-t dark:border-gray-700 pt-1"><span>{t("totalCost")}</span><span>{formatCurrency(movement.totalCost)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("reference")}</span><span>{movement.reference ?? "-"}</span></div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("description")}</span><span>{movement.description ?? "-"}</span></div>
        </div>
      </div>
    </div>
    </FadeIn>
  );
}
