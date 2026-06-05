"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Item = {
  id: string; name: string; sku: string | null;
  barcode: string | null; type: string; unit: string; currentStock: number;
  minStock: number; sellingPrice: number; costPrice: number;
  description: string | null; active: boolean;
};

type Props = { item: Item };

export function ItemDetailClient({ item }: Props) {
  const router = useRouter();
  const t = useTranslations("items");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    sku: item.sku ?? "",
    barcode: item.barcode ?? "",
    type: item.type,
    unit: item.unit,
    sellingPrice: String(item.sellingPrice),
    costPrice: String(item.costPrice),
    minStock: String(item.minStock),
    description: item.description ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEdit(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/inventory/items")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("itemInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("itemInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("name")}</dt>
            <dd className="font-medium">{item.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("sku")}</dt>
            <dd className="font-medium">{item.sku ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("barcode")}</dt>
            <dd className="font-medium">{item.barcode ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("type")}</dt>
            <dd className="font-medium">{item.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("unit")}</dt>
            <dd className="font-medium">{item.unit}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("stock")}</dt>
            <dd className="font-medium">{item.currentStock.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("minStock")}</dt>
            <dd className="font-medium">{item.minStock.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("sellPrice")}</dt>
            <dd className="font-medium">﷼ {item.sellingPrice.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("costPrice")}</dt>
            <dd className="font-medium">﷼ {item.costPrice.toLocaleString()}</dd>
          </div>
          {item.description && (
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("description")}</dt>
              <dd className="font-medium">{item.description}</dd>
            </div>
          )}
        </dl>
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editItem")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("sku")} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label={t("barcode")} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <Select label={t("type")} options={[{ value: "PRODUCT", label: t("product") }, { value: "SERVICE", label: t("service") }]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label={t("unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <Input label={t("sellPrice")} type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          <Input label={t("costPrice")} type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          <Input label={t("minStock")} type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
