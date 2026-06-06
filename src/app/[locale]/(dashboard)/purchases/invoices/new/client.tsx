"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, ArrowLeft, Upload, CreditCard } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";

type Vendor = { id: string; name: string };
type Item = { id: string; name: string; costPrice: number; type: string };
type TaxCode = { id: string; name: string; rate: number };
type PaymentTerm = { id: string; name: string; dueDays: number };
type Branch = { id: string; name: string };
type Project = { id: string; name: string };

type Props = { vendors: Vendor[]; items: Item[]; taxCodes: TaxCode[]; paymentTerms: PaymentTerm[]; branches: Branch[]; projects: Project[] };

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

function calcLineNet(l: Line) {
  return l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
}

function calcLineTotal(l: Line) {
  return calcLineNet(l) + calcLineNet(l) * l.taxRate / 100;
}

export function NewPurchaseInvoiceClient({ vendors: initialVendors, items: initialItems, taxCodes, paymentTerms, branches, projects: initialProjects }: Props) {
  const router = useRouter();
  const t = useTranslations("purchaseInvoiceNew");
  const tc = useTranslations("common");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [paymentTermId, setPaymentTermId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ key: nextKey++, itemId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: "", taxRate: 0 }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);

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
          updated.unitPrice = item.costPrice;
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
  const lineDiscount = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice * l.discountPercent / 100, 0), [lines]);
  const globalDiscount = useMemo(() => {
    if (discountType === "PERCENTAGE") return subtotal * (discountValue / 100);
    return discountValue;
  }, [subtotal, discountType, discountValue]);
  const taxableAmount = subtotal - lineDiscount - globalDiscount;
  const taxAmount = useMemo(() => lines.reduce((s, l) => s + calcLineNet(l) * l.taxRate / 100, 0), [lines]);
  const total = taxableAmount + taxAmount;

  async function handleSubmit(status: "DRAFT" | "CONFIRMED") {
    setErrorMessage("");
    if (lines.some((l) => !l.itemId)) {
      setErrorMessage(tc("errorItemRequired"));
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          invoiceDate: new Date(date).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          referenceNumber: referenceNumber || null,
          description: description || null,
          paymentTermId: paymentTermId || null,
          branchId: branchId || null,
          projectId: projectId || null,
          vendorId,
          notes,
          subtotal,
          discountAmount: lineDiscount + globalDiscount,
          discountType,
          discountValue: discountValue,
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
            lineTotal: calcLineTotal(l),
          })),
        }),
      });
      if (res.ok) {
        router.push("/purchases/invoices");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleVendorCreated = (entity: { id: string; name: string }) => {
    setVendors([...vendors, { id: entity.id, name: entity.name }]);
    setVendorId(entity.id);
  };

  const handleItemCreated = (entity: { id: string; name: string; costPrice?: number }) => {
    setItems([...items, { id: entity.id, name: entity.name, costPrice: entity.costPrice ?? 0, type: "PRODUCT" }]);
  };

  const handleProjectCreated = (entity: { id: string; name: string }) => {
    setProjects([...projects, { id: entity.id, name: entity.name }]);
    setProjectId(entity.id);
  };

  const vendorOpts = vendors.map((v) => ({ value: v.id, label: v.name }));
  const itemOpts = items.filter((i) => i.type === "PRODUCT" || i.type === "SERVICE").map((i) => ({ value: i.id, label: `${i.name} - ${formatCurrency(i.costPrice)}` }));
  const taxOpts = taxCodes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));
  const termOpts = paymentTerms.map((p) => ({ value: p.id, label: p.name }));
  const branchOpts = branches.map((b) => ({ value: b.id, label: b.name }));
  const projectOpts = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <FadeIn>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title={t("title")}
          description={t("subtitle")}
          actions={
            <Button variant="ghost" onClick={() => router.push("/purchases/invoices")}>
              <ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" />
            </Button>
          }
        />

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit("CONFIRMED"); }} className="space-y-5">
          {errorMessage && (
            <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
              {errorMessage}
            </div>
          )}
          {/* ─── Invoice Details Card ─── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <div className="p-6 space-y-5">
              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("vendor")} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      placeholder={t("selectVendor")}
                      options={vendorOpts}
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      required
                    />
                  </div>
                  <QuickCreateDialog type="vendor" onCreated={handleVendorCreated} />
                </div>
              </div>

              {/* Reference + Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("referenceNumber")}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={t("referenceNumber")}
                />
                <div>
                  <Input
                    label={t("description")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("description")}
                  />
                  <p className="text-xs text-gray-400 mt-1">{t("descriptionHint")}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label={t("invoiceDate")} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <Input label={t("dueDate")} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Select
                  label={t("paymentTerm")}
                  options={termOpts}
                  value={paymentTermId}
                  onChange={(e) => {
                    setPaymentTermId(e.target.value);
                    const term = paymentTerms.find((p) => p.id === e.target.value);
                    if (term && term.dueDays > 0 && date) {
                      const d = new Date(date);
                      d.setDate(d.getDate() + term.dueDays);
                      setDueDate(d.toISOString().split("T")[0]);
                    }
                  }}
                  placeholder={t("selectPaymentTerm")}
                />
              </div>

              {/* Branch */}
              <Select
                label={t("branch")}
                options={branchOpts}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                placeholder={t("selectBranch")}
              />
              {/* Project */}
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
            </div>
          </div>

          {/* ─── Products Table Card ─── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t("invoiceLines")}</h3>
              <div className="flex gap-2">
                <QuickCreateDialog type="item" onCreated={handleItemCreated} />
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 ms-1" /> {t("addLine")}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 min-w-[180px]">{t("item")}</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 min-w-[160px]">{t("desc")}</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 w-24">{t("qty")}</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 w-28">{t("price")}</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 w-20">{t("discPct")}</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 w-28">{t("tax")}</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-gray-400 w-28">{t("lineTotal")}</th>
                    <th className="w-12 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-400 text-sm">{t("addLine")}</td>
                    </tr>
                  )}
                  {lines.map((line) => (
                    <tr key={line.key} className="border-b border-gray-50 dark:border-gray-800 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="p-2">
                        <Select
                          placeholder={t("item")}
                          options={itemOpts}
                          value={line.itemId}
                          onChange={(e) => updateLine(line.key, "itemId", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.key, "description", e.target.value)}
                          className="text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          className="text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.key, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="text-xs text-left font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={line.discountPercent}
                          onChange={(e) => updateLine(line.key, "discountPercent", parseFloat(e.target.value) || 0)}
                          className="text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          placeholder={t("tax")}
                          options={taxOpts}
                          value={line.taxCodeId}
                          onChange={(e) => updateLine(line.key, "taxCodeId", e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-left font-mono text-sm align-middle text-gray-900 dark:text-gray-100">
                        {formatCurrency(calcLineTotal(line))}
                      </td>
                      <td className="p-2">
                        <Button type="button" variant="ghost" onClick={() => removeLine(line.key)} className="text-red-400 hover:text-red-600 h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Notes + Discount + Attachments ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Notes */}
            <div className="md:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("notes")}</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder={t("notes")} />
            </div>

            {/* Bonds */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-qoyod" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t("bonds")}</h3>
              </div>
              <p className="text-xs text-gray-400">{t("bondsHint")}</p>
            </div>

            {/* Attachments */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-5 w-5 text-qoyod" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t("attachments")}</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">{t("attachmentsHint")}</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-qoyod-bg file:text-qoyod hover:file:bg-qoyod/10"
                onChange={(e) => {
                  if (e.target.files) setAttachments(Array.from(e.target.files));
                }}
              />
              {attachments.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{attachments.length} file(s)</p>
              )}
            </div>
          </div>

          {/* ─── Summary ─── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t("subtotal")}</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {lineDiscount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>{t("lineDiscount")}</span>
                    <span className="font-mono">{formatCurrency(lineDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-500">
                  <div className="flex items-center gap-1">
                    <span>{t("globalDiscount")}</span>
                    <select
                      className="text-xs border rounded px-1 py-0.5 bg-background"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">{t("fixed")}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    {discountType === "PERCENTAGE" ? (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-16 text-xs h-6"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-20 text-xs h-6"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      />
                    )}
                    <span className="font-mono text-red-500">-{formatCurrency(globalDiscount)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t("taxLabel")}</span>
                  <span className="font-mono">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-base text-gray-900 dark:text-gray-100">
                  <span>{t("total")}</span>
                  <span className="font-mono text-qoyod">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Actions ─── */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/purchases/invoices")}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting || !vendorId || lines.length === 0 || lines.some((l) => !l.itemId)}
              onClick={() => handleSubmit("DRAFT")}
            >
              {submitting ? t("creating") : t("saveDraft")}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !vendorId || lines.length === 0 || lines.some((l) => !l.itemId)}
              className="bg-qoyod text-white hover:bg-qoyod-dark dark:bg-qoyod dark:hover:opacity-90"
            >
              {submitting ? t("creating") : t("createInvoice")}
            </Button>
          </div>
        </form>
      </div>
    </FadeIn>
  );
}
