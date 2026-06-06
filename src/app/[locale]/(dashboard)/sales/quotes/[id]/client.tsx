"use client";

import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, FileText, MoreHorizontal, Edit, Download, SendHorizontal } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type QuoteLine = { id: string; description: string; quantity: number; unitPrice: number; discountPercent: number; taxRate: number; lineTotal: number; item: { name: string } | null };
type SalesQuote = {
  id: string; number: number; quoteDate: Date; expiryDate: Date | null; status: string;
  customer: { name: string; email: string | null };
  subtotal: number; discountAmount: number; taxAmount: number; total: number;
  notes: string | null;
  lines: QuoteLine[];
  createdBy: { name: string } | null;
};

type Props = { quote: SalesQuote };

const statusVariant: Record<string, "outline" | "warning" | "success" | "danger"> = { DRAFT: "outline", CONFIRMED: "warning", ACCEPTED: "success", REJECTED: "danger" };

export function SalesQuoteViewClient({ quote: initial }: Props) {
  const t = useTranslations("salesQuotes");
  const s = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [converting, setConverting] = useState(false);
  const [form, setForm] = useState({ status: initial.status, notes: initial.notes ?? "", expiryDate: initial.expiryDate ? new Date(initial.expiryDate).toISOString().split("T")[0] : "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const statusLabels: Record<string, string> = { DRAFT: "draft", CONFIRMED: "confirmed", ACCEPTED: "accepted", REJECTED: "rejected" };
  const statusOpts = Object.entries(statusLabels).map(([value, label]) => ({ value, label: s(label) }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/sales-quotes/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expiryDate: form.expiryDate || null }),
      });
      if (res.ok) { setEditing(false); router.refresh(); }
    } finally { setSaving(false); }
  }

  async function convertToInvoice() {
    setConverting(true);
    try {
      const res = await fetch(`/api/sales-quotes/${initial.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      if (res.ok) { router.push("/sales/invoices"); router.refresh(); }
    } finally { setConverting(false); }
  }

  async function downloadPdf() {
    const element = contentRef.current;
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Quote-${initial.number}.pdf`);
  }

  function buildEmailHtml() {
    const linesHtml = initial.lines
      .map(
        (l) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${l.item?.name ?? ""}</td><td style="padding:8px;border-bottom:1px solid #eee;">${l.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${l.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(l.unitPrice)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(l.lineTotal)}</td></tr>`
      )
      .join("");
    return `<!DOCTYPE html><html dir="${document.dir || "ltr"}"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;margin:0;padding:0;"><div style="max-width:600px;margin:auto;padding:20px;"><h2>Quote #${generateNumber("Q", initial.number)}</h2><p>Dear ${initial.customer.name},</p><p>Please find your quote details below:</p><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px;border-bottom:1px solid #ddd;">Date</td><td style="padding:8px;border-bottom:1px solid #ddd;">${formatDate(new Date(initial.quoteDate))}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;">Total</td><td style="padding:8px;border-bottom:1px solid #ddd;">${formatCurrency(initial.total)}</td></tr>${initial.expiryDate ? `<tr><td style="padding:8px;border-bottom:1px solid #ddd;">Expiry</td><td style="padding:8px;border-bottom:1px solid #ddd;">${formatDate(new Date(initial.expiryDate))}</td></tr>` : ""}</table><table style="width:100%;border-collapse:collapse;margin-top:16px;"><thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:left;">Description</th><th style="padding:8px;text-align:right;">Qty</th><th style="padding:8px;text-align:right;">Price</th><th style="padding:8px;text-align:right;">Total</th></tr></thead><tbody>${linesHtml}</tbody></table>${initial.notes ? `<p style="margin-top:16px;color:#6b7280;">${initial.notes}</p>` : ""}<p style="margin-top:24px;color:#9ca3af;font-size:12px;">Thank you for your business.</p></div></body></html>`;
  }

  async function handleSendEmail() {
    if (!initial.customer.email) return;
    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: initial.customer.email,
          subject: `Quote #${generateNumber("Q", initial.number)}`,
          html: buildEmailHtml(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      setEmailSuccess(true);
    } catch (err) {
      setEmailError((err as Error).message);
    } finally {
      setSendingEmail(false);
    }
  }

  if (editing) {
    return (
      <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/sales/quotes")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("editQuote")} {generateNumber("Q", initial.number)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label={t("status")} options={statusOpts} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <Input label={t("expiry")} type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <div className="col-span-2"><Input label={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setEditing(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
    <div ref={contentRef} className="space-y-6">
      {emailSuccess && <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">{t("emailSent")}</div>}
      {emailError && <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">{t("emailFailed")}: {emailError}</div>}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/sales/quotes")}><ArrowLeft className="h-5 w-5 rtl:scale-x-[-1]" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("quoteInfo")} {generateNumber("Q", initial.number)}</h2>
            <Badge variant={statusVariant[initial.status] || "outline"}>{s(statusLabels[initial.status] || initial.status)}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("createdBy")}: {initial.createdBy?.name ?? "-"}</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu
            trigger={
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: t("downloadPdf"), icon: <Download className="h-4 w-4" />, onClick: downloadPdf },
              ...(initial.customer.email ? [{ label: t("sendEmail"), icon: <SendHorizontal className="h-4 w-4" />, onClick: handleSendEmail }] : []),
              ...(initial.status === "ACCEPTED" ? [{ label: t("convertToInvoice"), icon: <FileText className="h-4 w-4" />, onClick: () => setShowConvertDialog(true) }] : []),
              { label: t("edit"), icon: <Edit className="h-4 w-4" />, onClick: () => setEditing(true) },
            ]}
          />
        </div>
      </div>

      <Dialog open={showConvertDialog} onClose={() => setShowConvertDialog(false)} title={t("convertToInvoice")}>
        <div className="space-y-4">
          <Select
            label="Payment Method"
            options={[
              { value: "CASH", label: "Cash" },
              { value: "BANK_TRANSFER", label: "Bank Transfer" },
              { value: "CHECK", label: "Check" },
              { value: "CREDIT_CARD", label: "Credit Card" },
              { value: "OTHER", label: "Other" },
            ]}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Cancel</Button>
            <Button onClick={convertToInvoice} disabled={converting}>
              {converting ? "Converting..." : t("convertToInvoice")}
            </Button>
          </div>
        </div>
      </Dialog>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("customer")}</span><span className="font-semibold">{initial.customer.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("date")}</span><span>{formatDate(new Date(initial.quoteDate))}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("expiry")}</span><span>{initial.expiryDate ? formatDate(new Date(initial.expiryDate)) : "-"}</span></div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("subtotal")}</span><span>{formatCurrency(initial.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("discount")}</span><span className="text-red-600">-{formatCurrency(initial.discountAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("tax")}</span><span>{formatCurrency(initial.taxAmount)}</span></div>
          <div className="flex justify-between font-bold border-t dark:border-gray-700 pt-1"><span>{t("total")}</span><span>{formatCurrency(initial.total)}</span></div>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("item")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead className="text-right">{t("qty")}</TableHead>
              <TableHead className="text-right">{t("unitPrice")}</TableHead>
              <TableHead className="text-right">{t("discPct")}</TableHead>
              <TableHead className="text-right">{t("tax")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initial.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-sm">{line.item?.name ?? "-"}</TableCell>
                <TableCell className="text-sm">{line.description}</TableCell>
                <TableCell className="text-right font-mono">{line.quantity}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(line.unitPrice)}</TableCell>
                <TableCell className="text-right font-mono">{line.discountPercent > 0 ? `${line.discountPercent}%` : "-"}</TableCell>
                <TableCell className="text-right font-mono">{line.taxRate > 0 ? `${line.taxRate}%` : "-"}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(line.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {initial.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t("notes")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{initial.notes}</p>
        </div>
      )}
    </div>
    </FadeIn>
  );
}
