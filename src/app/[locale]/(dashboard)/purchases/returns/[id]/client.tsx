"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";

type PurchaseReturn = {
  id: string; number: number; returnDate: Date; status: string;
  vendor: { name: string };
  total: number; notes: string | null;
  createdBy: { name: string } | null;
};

type Props = { ret: PurchaseReturn };

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = { DRAFT: "outline", CONFIRMED: "warning", ACCEPTED: "success", REJECTED: "danger" };

export function PurchaseReturnViewClient({ ret: initial }: Props) {
  const t = useTranslations("purchaseReturns");
  const s = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: initial.status, notes: initial.notes ?? "" });

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", ACCEPTED: "accepted", REJECTED: "rejected" };
  const statusOpts = Object.entries(statusLabels).map(([value, label]) => ({ value, label: s(label) }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/purchase-returns/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setEditing(false); router.refresh(); }
    } finally { setSaving(false); }
  }

  if (editing) {
    return (
      <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/purchases/returns")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("editReturn")} {generateNumber("PR", initial.number)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label={t("status")} options={statusOpts} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <div className="col-span-2"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setEditing(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/purchases/returns")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("returnInfo")} {generateNumber("PR", initial.number)}</h2>
            <Badge variant={statusVariant[initial.status] || "outline"}>{s(statusLabels[initial.status] || initial.status)}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {initial.createdBy?.name ?? "-"}</p>
        </div>
        <Button onClick={() => setEditing(true)}><Edit2 className="h-4 w-4 ms-1" /> {t("edit")}</Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("vendor")}</span><span className="font-semibold">{initial.vendor.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("date")}</span><span>{formatDate(new Date(initial.returnDate))}</span></div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between font-bold"><span className="text-gray-500 dark:text-gray-400">{t("total")}</span><span>{formatCurrency(initial.total)}</span></div>
        </div>
      </div>

      {initial.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t("notes")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{initial.notes}</p>
        </div>
      )}
    </div>
    </FadeIn>
  );
}
