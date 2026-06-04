"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

type PaymentInfo = {
  id: string; organizationId: string; planId: string;
  amount: number; currency: string; type: string; status: string;
  paymentMethod: string | null; receiptUrl: string | null; reason: string | null;
  subscriptionStart: string | null; subscriptionEnd: string | null;
  notes: string | null; createdAt: string;
  organization: { name: string }; plan: { name: string };
};

const statusBadge: Record<string, string> = {
  SUCCESS: "text-green-600 bg-green-50",
  FAILED: "text-red-600 bg-red-50",
  PENDING: "text-amber-600 bg-amber-50",
};
const typeLabels: Record<string, string> = {
  RENEWAL: "Renewal",
  MANUAL_ACTIVATION: "Manual",
  COMPENSATION: "Compensation",
};

export function PaymentsClient({ payments }: { payments: PaymentInfo[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm"><CreditCard className="h-4 w-4 inline-block mr-1" />Payment History ({payments.length})</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">Date</th><th className="p-3 font-medium text-gray-500">Organization</th><th className="p-3 font-medium text-gray-500">Plan</th><th className="p-3 font-medium text-gray-500">Amount</th><th className="p-3 font-medium text-gray-500">Type</th><th className="p-3 font-medium text-gray-500">Method</th><th className="p-3 font-medium text-gray-500">Status</th><th className="p-3 font-medium text-gray-500">Period</th></tr></thead>
            <tbody>{payments.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-gray-400">No payment records</td></tr> : payments.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-3 font-medium">{p.organization.name}</td>
                <td className="p-3">{p.plan.name}</td>
                <td className="p-3 font-mono">{p.amount === 0 ? "—" : `${p.currency} ${p.amount.toFixed(2)}`}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100">{typeLabels[p.type] ?? p.type}</span></td>
                <td className="p-3 text-gray-500">{p.paymentMethod ?? (p.type === "COMPENSATION" ? "—" : "—")}</td>
                <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge[p.status] ?? ""}`}>{p.status === "SUCCESS" ? <CheckCircle className="h-3 w-3" /> : p.status === "FAILED" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{p.status}</span></td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{p.subscriptionStart && p.subscriptionEnd ? `${new Date(p.subscriptionStart).toLocaleDateString()} - ${new Date(p.subscriptionEnd).toLocaleDateString()}` : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
