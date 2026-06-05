"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
type PaymentInfo = { id: string; organizationId: string; planId: string; amount: number; currency: string; type: string; status: string; paymentMethod: string | null; receiptUrl: string | null; reason: string | null; subscriptionStart: string | null; subscriptionEnd: string | null; notes: string | null; createdAt: string; organization: { name: string }; plan: { name: string }; };
const statusBadge: Record<string, string> = { SUCCESS: "text-green-600 bg-green-50", FAILED: "text-red-600 bg-red-50", PENDING: "text-amber-600 bg-amber-50" };
export function PaymentsClient({ payments }: { payments: PaymentInfo[] }) {
  const t = useTranslations("ownerPanel");
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm"><CreditCard className="h-4 w-4 inline-block mr-1" />{t("paymentsTitle", { count: payments.length })}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left"><th className="p-3 font-medium text-gray-500">{t("paymentDate")}</th><th className="p-3 font-medium text-gray-500">{t("paymentOrg")}</th><th className="p-3 font-medium text-gray-500">{t("paymentPlan")}</th><th className="p-3 font-medium text-gray-500">{t("paymentAmount")}</th><th className="p-3 font-medium text-gray-500">{t("paymentType")}</th><th className="p-3 font-medium text-gray-500">{t("paymentMethod")}</th><th className="p-3 font-medium text-gray-500">{t("paymentStatus")}</th><th className="p-3 font-medium text-gray-500">{t("paymentPeriod")}</th></tr></thead>
            <tbody>{payments.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-gray-400">{t("noPayments")}</td></tr> : payments.map((p) => {
              const typeKey = p.type === "RENEWAL" ? "renewal" : p.type === "MANUAL_ACTIVATION" ? "manual" : p.type === "COMPENSATION" ? "compensation" : p.type;
              return (<tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-3 font-medium">{p.organization.name}</td>
                <td className="p-3">{p.plan.name}</td>
                <td className="p-3 font-mono">{p.amount === 0 ? t("noPlan") : `${p.currency} ${p.amount.toFixed(2)}`}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100">{t(typeKey)}</span></td>
                <td className="p-3 text-gray-500">{p.paymentMethod ?? t("noPlan")}</td>
                <td className="p-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge[p.status] ?? ""}`}>{p.status === "SUCCESS" ? <CheckCircle className="h-3 w-3" /> : p.status === "FAILED" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{p.status}</span></td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{p.subscriptionStart && p.subscriptionEnd ? `${new Date(p.subscriptionStart).toLocaleDateString()} - ${new Date(p.subscriptionEnd).toLocaleDateString()}` : t("noPlan")}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
