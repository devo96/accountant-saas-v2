"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Warehouse = {
  id: string; name: string; address: string | null;
  active: boolean;
};

type Props = { warehouse: Warehouse };

export function WarehouseDetailClient({ warehouse }: Props) {
  const router = useRouter();
  const t = useTranslations("warehouses");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: warehouse.name,
    address: warehouse.address ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/warehouses/${warehouse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowEdit(false); router.refresh(); }
      else { const data = await res.json().catch(() => ({})); setErrorMessage(data?.message || "Failed to save"); }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/inventory/warehouses")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{warehouse.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("warehouseInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("warehouseInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("name")}</dt>
            <dd className="font-medium">{warehouse.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("location")}</dt>
            <dd className="font-medium">{warehouse.address ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("status")}</dt>
            <dd className="font-medium">
              <Badge variant={warehouse.active ? "success" : "danger"}>
                {warehouse.active ? t("active") : t("inactive")}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editWarehouse")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("location")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
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
