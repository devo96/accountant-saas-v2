"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

type Customer = { id: string; name: string };
type Item = { id: string; name: string; sellingPrice: number; type: string };
type TaxCode = { id: string; name: string; rate: number };

type Props = { customers: Customer[]; items: Item[]; taxCodes: TaxCode[] };

type Line = {
  key: number;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxCodeId: string;
  taxRate: number;
};

let nextKey = 1;

export function NewInvoiceClient({ customers, items, taxCodes }: Props) {
  const router = useRouter();
  const t = useTranslations("salesInvoiceNew");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ key: nextKey++, itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0 }]);

  function addLine() {
    setLines([...lines, { key: nextKey++, itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0 }]);
  }

  function removeLine(key: number) {
    setLines(lines.filter((l) => l.key !== key));
  }

  function updateLine(key: number, field: keyof Line, value: string | number) {
    setLines(lines.map((l) => {
      if (l.key !== key) return l;
      const updated = { ...l, [field]: value };
      if (field === "itemId") {
        const item = items.find((i) => i.id === value);
        if (item) {
          updated.description = item.name;
          updated.unitPrice = item.sellingPrice;
        }
      }
      if (field === "taxCodeId") {
        const tc = taxCodes.find((t) => t.id === value);
        if (tc) updated.taxRate = tc.rate;
      }
      return updated;
    }));
  }

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [lines]);
  const discountTotal = useMemo(() => lines.reduce((s, l) => s + (l.quantity * l.unitPrice * l.discountPercent / 100), 0), [lines]);
  const taxableAmount = subtotal - discountTotal;
  const taxAmount = useMemo(() => lines.reduce((s, l) => s + ((l.quantity * l.unitPrice - l.quantity * l.unitPrice * l.discountPercent / 100) * l.taxRate / 100), 0), [lines]);
  const total = taxableAmount + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceDate: new Date(date).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          customerId,
          notes,
          subtotal,
          discountAmount: discountTotal,
          taxAmount,
          total,
          lines: lines.map((l) => ({
            itemId: l.itemId || null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            taxCodeId: l.taxCodeId || null,
            taxRate: l.taxRate,
            lineTotal: l.quantity * l.unitPrice - l.quantity * l.unitPrice * l.discountPercent / 100 + (l.quantity * l.unitPrice - l.quantity * l.unitPrice * l.discountPercent / 100) * l.taxRate / 100,
          })),
        }),
      });
      if (res.ok) {
        router.push("/sales/invoices");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const customerOpts = customers.map((c) => ({ value: c.id, label: c.name }));
  const itemOpts = items.filter((i) => i.type === "PRODUCT" || i.type === "SERVICE").map((i) => ({ value: i.id, label: `${i.name} - ﷼${i.sellingPrice}` }));
  const taxOpts = taxCodes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="ghost" onClick={() => router.push("/sales/invoices")}>
            <ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" />
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Select label={t("customer")} options={customerOpts} value={customerId} onChange={(e) => setCustomerId(e.target.value)} required placeholder={t("selectCustomer")} />
          <Input label={t("invoiceDate")} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label={t("dueDate")} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="rounded-lg border">
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="font-medium">{t("invoiceLines")}</span>
            <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 ms-1" /> {t("addLine")}</Button>
          </div>
          <div className="p-4 space-y-3">
            {lines.map((line, i) => (
              <div key={line.key} className="flex gap-2 items-start p-3 bg-white rounded border">
                <div className="w-48">
                  <Select
                    placeholder={t("item")}
                    options={itemOpts}
                    value={line.itemId}
                    onChange={(e) => updateLine(line.key, "itemId", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input placeholder={t("description")} value={line.description} onChange={(e) => updateLine(line.key, "description", e.target.value)} />
                </div>
                <Input type="number" placeholder={t("qty")} className="w-20" value={line.quantity} onChange={(e) => updateLine(line.key, "quantity", Number(e.target.value))} />
                <Input type="number" placeholder={t("price")} className="w-24" value={line.unitPrice} onChange={(e) => updateLine(line.key, "unitPrice", Number(e.target.value))} />
                <Input type="number" placeholder={t("discPct")} className="w-20" value={line.discountPercent} onChange={(e) => updateLine(line.key, "discountPercent", Number(e.target.value))} />
                <div className="w-28">
                  <Select placeholder={t("tax")} options={taxOpts} value={line.taxCodeId} onChange={(e) => updateLine(line.key, "taxCodeId", e.target.value)} />
                </div>
                <div className="w-24 text-right pt-2 font-mono text-sm">
                  ﷼ {(line.quantity * line.unitPrice - line.quantity * line.unitPrice * line.discountPercent / 100 + (line.quantity * line.unitPrice - line.quantity * line.unitPrice * line.discountPercent / 100) * line.taxRate / 100).toFixed(2)}
                </div>
                <Button type="button" variant="ghost" onClick={() => removeLine(line.key)} className="text-red-500 mt-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 space-y-1 text-sm">
            <div className="flex justify-between"><span>{t("subtotal")}</span><span className="font-mono">﷼ {subtotal.toFixed(2)}</span></div>
            {discountTotal > 0 && <div className="flex justify-between text-red-600"><span>{t("discount")}</span><span className="font-mono">-﷼ {discountTotal.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span>{t("tax")}</span><span className="font-mono">﷼ {taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-1"><span>{t("total")}</span><span className="font-mono">﷼ {total.toFixed(2)}</span></div>
          </div>
        </div>

        <Input label={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/sales/invoices")}>{t("cancel")}</Button>
          <Button type="submit" disabled={submitting || !customerId || lines.length === 0}>
            {submitting ? t("creating") : t("createInvoice")}
          </Button>
        </div>
      </form>
    </div>
    </FadeIn>
  );
}
