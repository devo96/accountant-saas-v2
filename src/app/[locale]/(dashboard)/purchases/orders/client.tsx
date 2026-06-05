"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type PurchaseOrder = {
  id: string;
  number: number;
  orderDate: Date;
  expectedDate: Date | null;
  status: string;
  vendor: { name: string };
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes: string | null;
};

type Vendor = { id: string; name: string };

type Props = { orders: PurchaseOrder[]; vendors: Vendor[] };

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = {
  DRAFT: "outline",
  CONFIRMED: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export function PurchaseOrdersClient({ orders, vendors }: Props) {
  const t = useTranslations("purchaseOrders");
  const s = useTranslations("common");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ vendorId: "", orderDate: new Date().toISOString().split("T")[0], expectedDate: "", subtotal: "", discountAmount: "0", taxAmount: "0", total: "", notes: "" });

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", ACCEPTED: "accepted", REJECTED: "rejected" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subtotal: Number(form.subtotal), discountAmount: Number(form.discountAmount), taxAmount: Number(form.taxAmount), total: Number(form.total) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const vendorOpts = vendors.map((v) => ({ value: v.id, label: v.name }));

  const columns = [
    { key: "number", label: t("orderNo"), render: (o: PurchaseOrder) => generateNumber("PO", o.number) },
    { key: "vendor", label: t("vendor"), render: (o: PurchaseOrder) => o.vendor.name },
    { key: "orderDate", label: t("orderDate"), render: (o: PurchaseOrder) => formatDate(new Date(o.orderDate)) },
    { key: "expectedDate", label: t("expectedDate"), render: (o: PurchaseOrder) => o.expectedDate ? formatDate(new Date(o.expectedDate)) : "-" },
    { key: "status", label: t("status"), render: (o: PurchaseOrder) => <Badge variant={statusVariant[o.status] || "outline"}>{s(statusLabels[o.status] || o.status)}</Badge> },
    { key: "total", label: t("total"), render: (o: PurchaseOrder) => formatCurrency(o.total) },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("orders", { count: orders.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("newOrder")}</Button>
        }
      />

      <DataTable columns={columns} data={orders} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(o) => router.push(`/purchases/orders/${(o as PurchaseOrder).id}`)} exportable exportFilename="purchase-orders" filters={[{ key: "status", label: t("status"), type: "select", options: Object.keys(statusLabels).map((k) => ({ label: s(statusLabels[k]), value: k })) }]} />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t("vendor")} options={vendorOpts} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("orderDate")} type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} required />
            <Input label={t("expectedDate")} type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("subtotal")} type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} required />
            <Input label={t("discount")} type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("taxAmount")} type="number" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
            <Input label={t("total")} type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} required />
          </div>
          <Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
