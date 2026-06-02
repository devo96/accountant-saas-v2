"use client";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, FileText, MoreHorizontal, Edit } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate, formatCurrency, generateNumber } from "@/lib/utils";

type QuoteLine = { id: string; description: string; quantity: number; unitPrice: number; discountPercent: number; taxRate: number; lineTotal: number; item: { name: string } | null };
type SalesQuote = {
  id: string; number: number; quoteDate: Date; expiryDate: Date | null; status: string;
  customer: { name: string };
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
  const [form, setForm] = useState({ status: initial.status, notes: initial.notes ?? "", expiryDate: initial.expiryDate ? new Date(initial.expiryDate).toISOString().split("T")[0] : "" });

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
    const res = await fetch(`/api/sales-quotes/${initial.id}/convert`, { method: "POST" });
    if (res.ok) { router.push("/sales/invoices"); router.refresh(); }
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
    <div className="space-y-6">
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
              ...(initial.status === "ACCEPTED" ? [{ label: t("convertToInvoice"), icon: <FileText className="h-4 w-4" />, onClick: convertToInvoice }] : []),
              { label: t("edit"), icon: <Edit className="h-4 w-4" />, onClick: () => setEditing(true) },
            ]}
          />
        </div>
      </div>

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
