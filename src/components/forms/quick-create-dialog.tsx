"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type EntityType = "customer" | "vendor" | "item" | "project";

interface QuickCreateProps {
  type: EntityType;
  onCreated: (entity: { id: string; name: string; sellingPrice?: number; costPrice?: number; description?: string }) => void;
}

const API_MAP: Record<EntityType, string> = {
  customer: "/api/customers",
  vendor: "/api/vendors",
  item: "/api/items",
  project: "/api/projects",
};

export function QuickCreateDialog({ type, onCreated }: QuickCreateProps) {
  const t = useTranslations("quickCreate");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const fields = (() => {
    if (type === "customer") return [
      { key: "name", label: t("name"), required: true },
      { key: "email", label: t("email") },
      { key: "phone", label: t("phone") },
      { key: "mobile", label: t("mobile") },
      { key: "address", label: t("address") },
      { key: "crNumber", label: t("crNumber") },
      { key: "street", label: t("street") },
      { key: "city", label: t("city") },
      { key: "district", label: t("district") },
      { key: "region", label: t("region") },
      { key: "country", label: t("country") },
      { key: "postalCode", label: t("postalCode") },
      { key: "taxNumber", label: t("taxNumber") },
    ];
    if (type === "vendor") return [
      { key: "name", label: t("name"), required: true },
      { key: "email", label: t("email") },
      { key: "phone", label: t("phone") },
      { key: "mobile", label: t("mobile") },
      { key: "address", label: t("address") },
      { key: "crNumber", label: t("crNumber") },
      { key: "street", label: t("street") },
      { key: "city", label: t("city") },
      { key: "district", label: t("district") },
      { key: "region", label: t("region") },
      { key: "country", label: t("country") },
      { key: "postalCode", label: t("postalCode") },
      { key: "taxNumber", label: t("taxNumber") },
    ];
    return [
      { key: "name", label: t("name"), required: true },
      { key: "sku", label: t("sku") },
      { key: "type", label: t("itemType"), type: "select", options: [{ value: "PRODUCT", label: t("product") }, { value: "SERVICE", label: t("service") }] },
      { key: "unit", label: t("unit") },
      { key: "sellingPrice", label: t("sellingPrice"), type: "number" },
      { key: "costPrice", label: t("costPrice"), type: "number" },
    ];
    if (type === "project") return [
      { key: "name", label: t("name"), required: true },
      { key: "description", label: t("description") },
    ];
    return [];
  })();

  const handleSubmit = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) {
        const val = form[f.key];
        if (val !== undefined && val !== "") {
          body[f.key] = f.type === "number" ? parseFloat(val) : val;
        }
      }
      const res = await fetch(API_MAP[type], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const entity = await res.json();
      onCreated({ id: entity.id, name: entity.name, sellingPrice: entity.sellingPrice, costPrice: entity.costPrice, description: entity.description });
      setForm({});
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="whitespace-nowrap shrink-0" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 ms-1" />
        {t("add")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t(`${type}.title`)}>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t(`${type}.description`)}</p>
        <div className="grid gap-4">
          {fields.map((f) => (
            f.type === "select" ? (
              <Select
                key={f.key}
                label={f.label}
                options={f.options ?? []}
                placeholder={f.label}
                value={form[f.key] ?? ""}
                onChange={(e) => update(f.key, e.target.value)}
              />
            ) : (
              <Input
                key={f.key}
                label={`${f.label}${f.required ? " *" : ""}`}
                type={f.type === "number" ? "number" : "text"}
                step={f.type === "number" ? "0.01" : undefined}
                value={form[f.key] ?? ""}
                onChange={(e) => update(f.key, e.target.value)}
                required={f.required}
              />
            )
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.name}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("save")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
