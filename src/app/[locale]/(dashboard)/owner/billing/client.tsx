"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Plus, Edit3, Trash2, CreditCard } from "lucide-react";
import { useState, useCallback } from "react";
import { CouponForm } from "../_forms";

type CouponInfo = { id: string; code: string; discountType: string; discountValue: number; maxUses: number; usedCount: number; minAmount: number; planId: string | null; expiresAt: string | null; active: boolean };

export function BillingClient({ coupons: initialCoupons }: { coupons: CouponInfo[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [couponDialog, setCouponDialog] = useState<CouponInfo | null | undefined>(undefined);

  const refresh = useCallback(async () => { const r = await fetch("/api/owner/coupons"); if (r.ok) setCoupons(await r.json()); }, []);

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/owner/coupons/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => setCouponDialog(null)}><Plus className="h-4 w-4 mr-1" />New Coupon</Button></div>
      <Card>
        <CardHeader><CardTitle className="text-sm"><CreditCard className="h-4 w-4 inline-block mr-1" />Coupons & Discounts ({coupons.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Code</th><th className="p-3 font-medium text-gray-500">Type</th><th className="p-3 font-medium text-gray-500">Value</th><th className="p-3 font-medium text-gray-500">Uses</th><th className="p-3 font-medium text-gray-500">Max</th><th className="p-3 font-medium text-gray-500">Expires</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500"></th></tr></thead>
              <tbody>{coupons.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-gray-400">No coupons</td></tr> : coupons.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3">{c.discountType === "PERCENTAGE" ? "%" : "﷼"}</td>
                  <td className="p-3">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `﷼${c.discountValue}`}</td>
                  <td className="p-3">{c.usedCount}</td>
                  <td className="p-3">{c.maxUses || "∞"}</td>
                  <td className="p-3 text-gray-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.active ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-100"}`}>{c.active ? "Active" : "Inactive"}</span></td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" onClick={() => setCouponDialog(c)}><Edit3 className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteCoupon(c.id)}><Trash2 className="h-3 w-3" /></Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {couponDialog !== undefined && (
        <Dialog open onClose={() => setCouponDialog(undefined)} title={couponDialog ? "Edit Coupon" : "New Coupon"}>
          <CouponForm coupon={couponDialog} onClose={() => setCouponDialog(undefined)} onSave={() => { refresh(); setCouponDialog(undefined); }} />
        </Dialog>
      )}
    </div>
  );
}
