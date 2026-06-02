"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Warehouse = {
  id: string;
  name: string;
  nameAr: string | null;
  address: string | null;
  active: boolean;
};

type Props = {
  data: Warehouse[];
};

export function WarehousesClient({ data }: Props) {
  const router = useRouter();
  const t = useTranslations("warehouses");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", nameAr: "", address: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "name", label: t("name") },
    { key: "nameAr", label: t("nameAr") },
    {
      key: "address",
      label: t("location"),
      render: (w: Warehouse) => w.address || "-",
    },
    {
      key: "active",
      label: t("status"),
      render: (w: Warehouse) => (
        <Badge variant={w.active ? "success" : "danger"}>
          {w.active ? t("active") : t("inactive")}
        </Badge>
      ),
    },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 ms-2" /> {t("addWarehouse")}
          </Button>
        }
      />

      <DataTable columns={columns} data={data} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(w) => router.push(`/inventory/warehouses/${(w as any).id}`)} exportable exportFilename="warehouses" />

      <Dialog open={open} onClose={() => setOpen(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={t("nameAr")}
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
          <Input
            label={t("location")}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
