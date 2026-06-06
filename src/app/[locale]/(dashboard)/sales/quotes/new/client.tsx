"use client";

import { useState, useMemo } from "react";
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
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";

type Customer = { id: string; name: string };
type Item = { id: string; name: string; sellingPrice: number; type: string };
type TaxCode = { id: string; name: string; rate: number };
type PaymentTerm = { id: string; name: string; dueDays: number };
type Branch = { id: string; name: string };
type Project = { id: string; name: string };

type LineItem = {
  key: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxCodeId: string;
  taxRate: number;
};

export default function NewQuoteClient({
  customers,
  items: initialItems,
  taxCodes,
  paymentTerms,
  branches,
  projects: initialProjects,
}: {
  customers: Customer[];
  items: Item[];
  taxCodes: TaxCode[];
  paymentTerms: PaymentTerm[];
  branches: Branch[];
  projects: Project[];
}) {
  const router = useRouter();
  const t = useTranslations("salesQuoteNew");
  const tc = useTranslations("common");
  const [customerId, setCustomerId] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentTermId, setPaymentTermId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [lines, setLines] = useState<LineItem[]>([
    { key: crypto.randomUUID(), itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);

  const addLine = () => {
    setLines([...lines, { key: crypto.randomUUID(), itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0 }]);
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
        return updated;
      })
    );
  };

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [lines]);
  const lineDiscount = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.discountPercent / 100), 0), [lines]);
  const globalDiscount = useMemo(() => {
    if (discountType === "PERCENTAGE") return subtotal * (discountValue / 100);
    return discountValue;
  }, [subtotal, discountType, discountValue]);
  const afterDiscount = subtotal - lineDiscount - globalDiscount;
  const taxAmount = useMemo(() => lines.reduce((s, l) => {
    const net = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
    return s + net * (l.taxRate / 100);
  }, 0), [lines]);
  const total = afterDiscount + taxAmount;

  const handleSubmit = async () => {
    if (!customerId) return;
    setErrorMessage("");
    if (lines.some((l) => !l.itemId)) {
      setErrorMessage(tc("errorItemRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          quoteDate,
          expiryDate: expiryDate || null,
          paymentTermId: paymentTermId || null,
          branchId: branchId || null,
          projectId: projectId || null,
          subtotal,
          discountAmount: lineDiscount + globalDiscount,
          discountType,
          discountValue: discountType === "PERCENTAGE" ? discountValue : discountValue,
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
            lineTotal: l.quantity * l.unitPrice * (1 - l.discountPercent / 100) + (l.quantity * l.unitPrice * (1 - l.discountPercent / 100)) * l.taxRate / 100,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || t("failedToCreateQuote"));
        return;
      }
      router.push("/sales/quotes");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerCreated = (entity: { id: string; name: string }) => {
    customers.push({ id: entity.id, name: entity.name });
    setCustomerId(entity.id);
  };

  const handleItemCreated = (entity: { id: string; name: string; sellingPrice?: number }) => {
    setItems([...items, { id: entity.id, name: entity.name, sellingPrice: entity.sellingPrice ?? 0, type: "PRODUCT" }]);
  };

  const handleProjectCreated = (entity: { id: string; name: string }) => {
    setProjects([...projects, { id: entity.id, name: entity.name }]);
    setProjectId(entity.id);
  };

  const itemOpts = items.filter((i) => i.type === "PRODUCT" || i.type === "SERVICE").map((i) => ({ value: i.id, label: `${i.name} - ${formatCurrency(i.sellingPrice)}` }));
  const taxOpts = taxCodes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));
  const termOpts = paymentTerms.map((p) => ({ value: p.id, label: p.name }));
  const branchOpts = branches.map((b) => ({ value: b.id, label: b.name }));
  const projectOpts = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <FadeIn>
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={t("title")}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>{t("back")}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !customerId || lines.some((l) => !l.itemId)}>
              {submitting ? t("creating") : t("createQuote")}
            </Button>
          </div>
        }
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("quoteDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                label={t("customer")}
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
                placeholder={t("selectCustomer")}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>
            <QuickCreateDialog type="customer" onCreated={handleCustomerCreated} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label={t("quoteDate")} type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
            <Input label={t("expiryDate")} type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            <Select
              label={t("paymentTerm")}
              options={termOpts}
              value={paymentTermId}
              onChange={(e) => setPaymentTermId(e.target.value)}
              placeholder={t("selectPaymentTerm")}
            />
          </div>
          <Select
            label={t("branch")}
            options={branchOpts}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            placeholder={t("selectBranch")}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                label="Project"
                options={projectOpts}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Select project"
              />
            </div>
            <QuickCreateDialog type="project" onCreated={handleProjectCreated} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("lineItems")}</CardTitle>
          <div className="flex gap-2">
            <QuickCreateDialog type="item" onCreated={handleItemCreated} />
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 ms-1" /> {t("addLine")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-start text-gray-500">
                <th className="py-2 pe-2 min-w-[180px]">{t("item")}</th>
                <th className="py-2 pe-2 min-w-[140px]">{t("description")}</th>
                <th className="py-2 pe-2 w-20">{t("qty")}</th>
                <th className="py-2 pe-2 w-28">{t("unitPrice")}</th>
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
                      options={itemOpts}
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
                      onChange={(e) => updateLine(line.key, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={line.discountPercent}
                      onChange={(e) => updateLine(line.key, "discountPercent", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 pe-2">
                    <Select
                      options={taxOpts}
                      placeholder={t("noTax")}
                      value={line.taxCodeId}
                      onChange={(e) => updateLine(line.key, "taxCodeId", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pe-2 text-right font-medium">
                    {formatCurrency(line.quantity * line.unitPrice * (1 - line.discountPercent / 100) * (1 + line.taxRate / 100))}
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
            {lineDiscount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{t("lineDiscount")}</span>
                <span>-{formatCurrency(lineDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{t("globalDiscount")}</span>
                <select
                  className="text-xs border rounded px-1 py-0.5 bg-background"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">{t("fixed")}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                {discountType === "PERCENTAGE" ? (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-20 text-xs h-7"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-24 text-xs h-7"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                )}
                <span className="text-gray-500">-{formatCurrency(globalDiscount)}</span>
              </div>
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
