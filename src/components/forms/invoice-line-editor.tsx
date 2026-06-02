"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";

export type LineItem = {
  id: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxCodeId: string;
  taxRate: number;
  lineTotal: number;
};

type InvoiceLineEditorProps = {
  items: { id: string; name: string }[];
  taxCodes: { id: string; name: string; rate: number }[];
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
};

function calculateLineTotal(qty: number, price: number, discount: number, taxRate: number): number {
  const subtotal = qty * price;
  const afterDiscount = subtotal * (1 - discount / 100);
  return afterDiscount * (1 + taxRate / 100);
}

function createEmptyLine(items: { id: string; name: string }[], taxCodes: { id: string; name: string; rate: number }[]): LineItem {
  const firstItem = items[0];
  const firstTax = taxCodes.find((t) => t.rate > 0) ?? taxCodes[0];
  return {
    id: crypto.randomUUID(),
    itemId: firstItem?.id ?? "",
    description: firstItem?.name ?? "",
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    taxCodeId: firstTax?.id ?? "",
    taxRate: firstTax?.rate ?? 0,
    lineTotal: 0,
  };
}

export function InvoiceLineEditor({ items, taxCodes, lines, onChange }: InvoiceLineEditorProps) {
  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = lines.map((line, i) => {
      if (i !== index) return line;
      const newLine = { ...line, [field]: value };
      if (field === "itemId") {
        const item = items.find((it) => it.id === value);
        if (item) {
          newLine.description = item.name;
        }
      }
      if (field === "taxCodeId") {
        const tc = taxCodes.find((t) => t.id === value);
        if (tc) newLine.taxRate = tc.rate;
      }
      newLine.lineTotal = calculateLineTotal(
        newLine.quantity,
        newLine.unitPrice,
        newLine.discountPercent,
        newLine.taxRate
      );
      return newLine;
    });
    onChange(updated);
  };

  const addLine = () => {
    onChange([...lines, createEmptyLine(items, taxCodes)]);
  };

  const removeLine = (index: number) => {
    onChange(lines.filter((_, i) => i !== index));
  };

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const discountTotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice * l.discountPercent / 100, 0);
  const taxTotal = lines.reduce((s, l) => s + l.lineTotal - l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const grandTotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right w-20">Qty</TableHead>
              <TableHead className="text-right w-28">Price</TableHead>
              <TableHead className="text-right w-20">Disc %</TableHead>
              <TableHead className="text-right w-28">Tax</TableHead>
              <TableHead className="text-right w-28">Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, i) => (
              <TableRow key={line.id}>
                <TableCell>
                  <Select
                    options={items.map((it) => ({ value: it.id, label: it.name }))}
                    value={line.itemId}
                    onChange={(e) => updateLine(i, "itemId", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(i, "description", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.unitPrice}
                    onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={line.discountPercent}
                    onChange={(e) => updateLine(i, "discountPercent", parseFloat(e.target.value) || 0)}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    options={taxCodes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))}
                    value={line.taxCodeId}
                    onChange={(e) => updateLine(i, "taxCodeId", e.target.value)}
                  />
                </TableCell>
                <TableCell className="text-right font-mono">{line.lineTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => removeLine(i)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" size="sm" onClick={addLine}>
        <Plus className="h-4 w-4 ms-1" /> Add Line
      </Button>
      <div className="flex justify-end">
        <div className="w-72 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span className="font-mono">-{discountTotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span className="font-mono">{taxTotal.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span className="font-mono">{grandTotal.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
