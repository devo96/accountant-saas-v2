"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Customer = { id: string; name: string };
type Item = { id: string; name: string; sellingPrice: number };
type TaxCode = { id: string; name: string; rate: number };

type LineItem = {
  key: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxCodeId: string;
  taxRate: number;
  lineTotal: number;
};

export default function NewQuoteClient({
  customers,
  items,
  taxCodes,
}: {
  customers: Customer[];
  items: Item[];
  taxCodes: TaxCode[];
}) {
  const router = useRouter();
  const t = useTranslations("salesQuoteNew");
  const [customerId, setCustomerId] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { key: crypto.randomUUID(), itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0, lineTotal: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setLines([...lines, { key: crypto.randomUUID(), itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0, lineTotal: 0 }]);
  };

  const removeLine = (key: string) => {
    if (lines.length === 1) return;
    setLines(lines.filter((l) => l.key !== key));
  };

  const updateLine = (key: string, field: keyof LineItem, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => {
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
          const tax = taxCodes.find((t) => t.id === value);
          updated.taxRate = tax ? tax.rate : 0;
        }

        const qty = typeof updated.quantity === "string" ? parseInt(updated.quantity) || 0 : updated.quantity;
        const price = typeof updated.unitPrice === "string" ? parseFloat(updated.unitPrice) || 0 : updated.unitPrice;
        const discount = typeof updated.discountPercent === "string" ? parseFloat(updated.discountPercent) || 0 : updated.discountPercent;
        const subtotal = qty * price;
        const discountAmt = subtotal * (discount / 100);
        const afterDiscount = subtotal - discountAmt;
        const taxAmt = afterDiscount * (updated.taxRate / 100);
        updated.lineTotal = afterDiscount + taxAmt;

        return updated;
      })
    );
  };

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const discountAmount = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.discountPercent / 100), 0);
  const taxAmount = lines.reduce((s, l) => {
    const afterDiscount = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
    return s + afterDiscount * (l.taxRate / 100);
  }, 0);
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = async () => {
    if (!customerId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          quoteDate,
          expiryDate: expiryDate || null,
          subtotal,
          discountAmount,
          taxAmount,
          total,
          notes: notes || null,
          lines: lines.map((l) => ({
            itemId: l.itemId || undefined,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            taxCodeId: l.taxCodeId || undefined,
            taxRate: l.taxRate,
            lineTotal: l.lineTotal,
          })),
        }),
      });
      if (!res.ok) throw new Error(t("failedToCreateQuote"));
      router.push("/sales/quotes");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("back")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !customerId}>
              {submitting ? t("creating") : t("createQuote")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("quoteDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Select
            label={t("customer")}
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t("selectCustomer")}
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <Input label={t("quoteDate")} type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
          <Input label={t("expiryDate")} type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("lineItems")}</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 ms-1" /> {t("addLine")}
          </Button>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-start text-gray-500">
                <th className="py-2 pe-2 w-48">{t("item")}</th>
                <th className="py-2 pe-2">{t("description")}</th>
                <th className="py-2 pe-2 w-20">{t("qty")}</th>
                <th className="py-2 pe-2 w-24">{t("unitPrice")}</th>
                <th className="py-2 pe-2 w-20">{t("discPct")}</th>
                <th className="py-2 pe-2 w-24">{t("tax")}</th>
                <th className="py-2 pe-2 w-24 text-right">{t("lineTotal")}</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key} className="border-b">
                  <td className="py-2 pe-2">
                    <Select
                      options={items.map((i) => ({ value: i.id, label: i.name }))}
                      placeholder={t("selectItem")}
                      value={line.itemId}
                      onChange={(e) => updateLine(line.key, "itemId", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(line.key, "description", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={line.discountPercent}
                      onChange={(e) => updateLine(line.key, "discountPercent", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Select
                      options={taxCodes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))}
                      placeholder={t("noTax")}
                      value={line.taxCodeId}
                      onChange={(e) => updateLine(line.key, "taxCodeId", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2 text-right font-medium">
                    {formatCurrency(line.lineTotal)}
                  </td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      onClick={() => removeLine(line.key)}
                      className="text-red-500"
                      disabled={lines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t("discount")}</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t("tax")}</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>{t("total")}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
