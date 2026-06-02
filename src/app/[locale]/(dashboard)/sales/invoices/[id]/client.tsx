"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Mail, MoreHorizontal, Edit, FileText } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ZatcaBadge, ZatcaQrCode } from "@/components/zatca";

type Line = {
  id: string; key?: number; itemId?: string | null; description: string; quantity: number;
  unitPrice: number; discountPercent: number; taxCodeId?: string | null; taxRate: number; lineTotal: number;
};

type Invoice = {
  id: string; number: number; invoiceDate: Date; dueDate: Date | null; status: string;
  subtotal: number; discountAmount: number; taxAmount: number; total: number; paidAmount: number;
  notes: string | null; customer: { id: string; name: string; nameAr?: string | null; taxNumber?: string | null } | null;
  lines: Line[]; createdBy: { name: string } | null;
  zatcaStatus?: string; zatcaQr?: string | null; zatcaUuid?: string | null;
};

type Customer = { id: string; name: string };
type Item = { id: string; name: string; sellingPrice: number; type: string };
type TaxCode = { id: string; name: string; rate: number };

type Props = { invoice: Invoice; customers: Customer[]; items: Item[]; taxCodes: TaxCode[] };

const statusVariant: Record<string, "success" | "warning" | "danger" | "default" | "outline"> = {
  DRAFT: "outline", CONFIRMED: "warning", PAID: "success", PARTIALLY_PAID: "warning", CANCELLED: "danger",
};

let nextKey = 1000;

function toDateStr(d: Date | string | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
}

export function SalesInvoiceViewClient({ invoice: initial, customers, items, taxCodes }: Props) {
  const router = useRouter();
  const t = useTranslations("salesInvoiceView");
  const ct = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inv, setInv] = useState(initial);

  const [customerId, setCustomerId] = useState(inv.customer?.id ?? "");
  const [date, setDate] = useState(toDateStr(inv.invoiceDate));
  const [dueDate, setDueDate] = useState(toDateStr(inv.dueDate));
  const [notes, setNotes] = useState(inv.notes ?? "");
  const [lines, setLines] = useState<Line[]>(inv.lines.map((l) => ({ ...l, key: nextKey++ })));

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState(inv.customer ? inv.customer.name + "@" : "");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState("");

  const statusLabel = inv.status === "DRAFT" ? ct("draft") : inv.status === "CONFIRMED" ? ct("confirmed") : inv.status === "PAID" ? ct("paid") : inv.status === "PARTIALLY_PAID" ? ct("partiallyPaid") : ct("cancelled");

  function addLine() {
    setLines([...lines, { id: "", key: nextKey++, itemId: null, description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxCodeId: null, taxRate: 0, lineTotal: 0 }]);
  }
  function removeLine(key: number) { setLines(lines.filter((l) => l.key !== key)); }
  function updateLine(key: number, field: string, value: string | number) {
    setLines(lines.map((l) => {
      if (l.key !== key) return l;
      const updated = { ...l, [field]: value };
      if (field === "itemId") {
        const item = items.find((i) => i.id === value);
        if (item) { updated.description = item.name; updated.unitPrice = item.sellingPrice; }
      }
      if (field === "taxCodeId") {
        const tc = taxCodes.find((t) => t.id === value);
        if (tc) updated.taxRate = tc.rate;
      }
      return updated;
    }));
  }

  const calcSubtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [lines]);
  const calcDiscount = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice * l.discountPercent / 100, 0), [lines]);
  const calcTax = useMemo(() => lines.reduce((s, l) => s + (l.quantity * l.unitPrice - l.quantity * l.unitPrice * l.discountPercent / 100) * l.taxRate / 100, 0), [lines]);
  const calcTotal = calcSubtotal - calcDiscount + calcTax;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/sales-invoices/${inv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceDate: new Date(date).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          customerId,
          notes,
          subtotal: calcSubtotal,
          discountAmount: calcDiscount,
          taxAmount: calcTax,
          total: calcTotal,
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
        const updated = await res.json();
        setInv(updated);
        setEditing(false);
        router.refresh();
      }
    } finally { setSaving(false); }
  }

  function cancelEdit() {
    setInv(initial);
    setCustomerId(initial.customer?.id ?? "");
    setDate(toDateStr(initial.invoiceDate));
    setDueDate(toDateStr(initial.dueDate));
    setNotes(initial.notes ?? "");
    setLines(initial.lines.map((l) => ({ ...l, key: nextKey++ })));
    setEditing(false);
  }

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/sales-invoices/${inv.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInv(updated);
      router.refresh();
    }
  }

  async function submitToZatca() {
    const res = await fetch("/api/zatca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: inv.id, type: "sales" }),
    });
    if (res.ok) {
      const data = await res.json();
      setInv({ ...inv, zatcaStatus: data.zatcaStatus });
      router.refresh();
    }
  }

  if (editing) {
    const customerOpts = customers.map((c) => ({ value: c.id, label: c.name }));
    const itemOpts = items.filter((i) => i.type === "PRODUCT" || i.type === "SERVICE").map((i) => ({ value: i.id, label: `${i.name} - ﷼${i.sellingPrice}` }));
    const taxOpts = taxCodes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }));

    return (
      <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/sales/invoices")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("editTitle")} INV-{String(inv.number).padStart(5, "0")}</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select label={t("customer")} options={customerOpts} value={customerId} onChange={(e) => setCustomerId(e.target.value)} required placeholder={t("selectCustomer")} />
          <Input label={t("invoiceDate")} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label={t("dueDate")} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="rounded-lg border">
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="font-medium">{t("invoiceLines")}</span>
            <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 ms-1" /> {t("addLine")}</Button>
          </div>
          <div className="p-4 space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="flex gap-2 items-start p-3 bg-white rounded border">
                <div className="w-48"><Select placeholder={t("item")} options={itemOpts} value={line.itemId ?? ""} onChange={(e) => updateLine(line.key!, "itemId", e.target.value)} /></div>
                <div className="flex-1"><Input placeholder={t("description")} value={line.description} onChange={(e) => updateLine(line.key!, "description", e.target.value)} /></div>
                <Input type="number" placeholder={t("qty")} className="w-20" value={line.quantity} onChange={(e) => updateLine(line.key!, "quantity", Number(e.target.value))} />
                <Input type="number" placeholder={t("price")} className="w-24" value={line.unitPrice} onChange={(e) => updateLine(line.key!, "unitPrice", Number(e.target.value))} />
                <Input type="number" placeholder={t("discPct")} className="w-20" value={line.discountPercent} onChange={(e) => updateLine(line.key!, "discountPercent", Number(e.target.value))} />
                <div className="w-28"><Select placeholder={t("tax")} options={taxOpts} value={line.taxCodeId ?? ""} onChange={(e) => updateLine(line.key!, "taxCodeId", e.target.value)} /></div>
                <div className="w-24 text-right pt-2 font-mono text-sm">﷼ {(line.quantity * line.unitPrice - line.quantity * line.unitPrice * line.discountPercent / 100 + (line.quantity * line.unitPrice - line.quantity * line.unitPrice * line.discountPercent / 100) * line.taxRate / 100).toFixed(2)}</div>
                <Button type="button" variant="ghost" onClick={() => removeLine(line.key!)} className="text-red-500 mt-1"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-1 text-sm">
            <div className="flex justify-between"><span>{t("subtotal")}</span><span className="font-mono">﷼ {calcSubtotal.toFixed(2)}</span></div>
            {calcDiscount > 0 && <div className="flex justify-between text-red-600"><span>{t("discount")}</span><span className="font-mono">-﷼ {calcDiscount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span>{t("tax")}</span><span className="font-mono">﷼ {calcTax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-1"><span>{t("total")}</span><span className="font-mono">﷼ {calcTotal.toFixed(2)}</span></div>
          </div>
        </div>

        <Input label={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={cancelEdit}>{t("cancel")}</Button>
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
        <Button variant="ghost" onClick={() => router.push("/sales/invoices")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")} INV-{String(inv.number).padStart(5, "0")}</h2>
            <Badge variant={statusVariant[inv.status] ?? "default"}>{statusLabel}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {inv.createdBy?.name ?? "-"}</p>
        </div>
        <div className="flex gap-2">
          {inv.status === "DRAFT" && <Button variant="outline" onClick={() => updateStatus("CONFIRMED")}>{t("confirm")}</Button>}
          {inv.status !== "CANCELLED" && inv.status !== "PAID" && <Button variant="outline" className="text-red-600" onClick={() => updateStatus("CANCELLED")}>{t("cancelInvoice")}</Button>}
          <DropdownMenu
            trigger={
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: t("edit"), icon: <Edit className="h-4 w-4" />, onClick: () => setEditing(true) },
              { label: ct("print"), icon: <FileText className="h-4 w-4" />, onClick: () => window.print() },
              { label: t("sendEmail"), icon: <Mail className="h-4 w-4" />, onClick: () => setShowEmailDialog(true) },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t("customerInfo")}</h3>
          <p className="text-lg font-semibold">{inv.customer?.name ?? "-"}</p>
          {inv.customer?.taxNumber && <p className="text-sm text-gray-500 dark:text-gray-400">{t("taxNumber")}: {inv.customer.taxNumber}</p>}
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("invoiceDate")}</span><span>{new Date(inv.invoiceDate).toLocaleDateString()}</span></div>
            {inv.dueDate && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("dueDate")}</span><span>{new Date(inv.dueDate).toLocaleDateString()}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("total")}</span><span className="font-bold">﷼ {inv.total.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("paid")}</span><span className="font-semibold text-green-600">﷼ {inv.paidAmount.toLocaleString()}</span></div>
            {inv.total - inv.paidAmount > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("balance")}</span><span className="font-semibold text-red-600">﷼ {(inv.total - inv.paidAmount).toLocaleString()}</span></div>}
          </div>
          {inv.status !== "DRAFT" && inv.status !== "CANCELLED" && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">{t("zatcaStatus")}</h3>
                <ZatcaBadge status={inv.zatcaStatus} />
              </div>
              {inv.zatcaStatus === "NOT_SUBMITTED" && (
                <Button size="sm" variant="outline" onClick={submitToZatca}>
                  <Upload className="h-4 w-4 ms-1" /> {t("submitToZatca")}
                </Button>
              )}
              {inv.zatcaQr && <div className="mt-2"><ZatcaQrCode base64={inv.zatcaQr} /></div>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("item")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead className="text-right">{t("qty")}</TableHead>
              <TableHead className="text-right">{t("price")}</TableHead>
              <TableHead className="text-right">{t("discPct")}</TableHead>
              <TableHead className="text-right">{t("tax")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-sm">{line.itemId ? items.find((i) => i.id === line.itemId)?.name ?? "-" : "-"}</TableCell>
                <TableCell className="text-sm">{line.description}</TableCell>
                <TableCell className="text-right font-mono">{line.quantity}</TableCell>
                <TableCell className="text-right font-mono">﷼ {line.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono">{line.discountPercent > 0 ? `${line.discountPercent}%` : "-"}</TableCell>
                <TableCell className="text-right font-mono">{line.taxRate > 0 ? `${line.taxRate}%` : "-"}</TableCell>
                <TableCell className="text-right font-mono">﷼ {line.lineTotal.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell colSpan={4} />
              <TableCell colSpan={2} className="text-right">{t("subtotal")}</TableCell>
              <TableCell className="text-right">﷼ {inv.subtotal.toFixed(2)}</TableCell>
            </TableRow>
            {inv.discountAmount > 0 && (
              <TableRow><TableCell colSpan={4} /><TableCell colSpan={2} className="text-right text-red-600">{t("discount")}</TableCell><TableCell className="text-right text-red-600">-﷼ {inv.discountAmount.toFixed(2)}</TableCell></TableRow>
            )}
            <TableRow><TableCell colSpan={4} /><TableCell colSpan={2} className="text-right">{t("tax")}</TableCell><TableCell className="text-right">﷼ {inv.taxAmount.toFixed(2)}</TableCell></TableRow>
            <TableRow className="font-bold text-lg border-t-2"><TableCell colSpan={4} /><TableCell colSpan={2} className="text-right">{t("total")}</TableCell><TableCell className="text-right">﷼ {inv.total.toFixed(2)}</TableCell></TableRow>
          </TableBody>
        </Table>
      </div>

      {inv.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t("notes")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{inv.notes}</p>
        </div>
      )}

      {showEmailDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmailDialog(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t("sendEmail")}</h3>
            <div className="space-y-4">
              <Input label={ct("email")} type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="customer@example.com" />
              {emailResult && <p className="text-sm text-gray-600 dark:text-gray-400">{emailResult}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>{ct("cancel")}</Button>
                <Button disabled={emailSending || !emailTo} onClick={async () => {
                  setEmailSending(true);
                  setEmailResult("");
                  const res = await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: emailTo,
                      subject: `Invoice INV-${String(inv.number).padStart(5, "0")}`,
                      html: `<p>Dear ${inv.customer?.name ?? "Customer"},</p><p>Please find attached invoice INV-${String(inv.number).padStart(5, "0")} for ${inv.total.toFixed(2)} SAR.</p><p>Thank you for your business.</p>`,
                    }),
                  });
                  setEmailResult(res.ok ? ct("sent") : (await res.json()).error);
                  setEmailSending(false);
                }}>{emailSending ? ct("sending") : ct("send")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </FadeIn>
  );
}
