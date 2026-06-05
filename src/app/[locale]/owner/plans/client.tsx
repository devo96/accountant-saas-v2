"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Dialog } from "@/components/ui/dialog"; import { Plus, Edit3, Trash2, Crown } from "lucide-react"; import { useState, useCallback } from "react"; import { PlanForm } from "../_forms";
type PlanExt = { id: string; name: string; tier: string; monthlyPrice: number; yearlyPrice: number; maxUsers: number; maxInvoices: number; active: boolean; orgCount: number; };
const tierColors: Record<string, string> = { FREE: "text-gray-500 bg-gray-100", STARTER: "text-blue-600 bg-blue-50", PROFESSIONAL: "text-purple-600 bg-purple-50", ENTERPRISE: "text-amber-600 bg-amber-50" };
export function PlansClient({ plans: initialPlans }: { plans: PlanExt[] }) {
  const t = useTranslations("ownerPanel");
  const [plans, setPlans] = useState(initialPlans);
  const [planDialog, setPlanDialog] = useState<PlanExt | null | undefined>(undefined);
  const refresh = useCallback(async () => { const r = await fetch("/api/owner/plans"); if (r.ok) setPlans(await r.json()); }, []);
  async function deletePlan(id: string) { if (!confirm(t("deletePlanConfirm"))) return; await fetch(`/api/owner/plans/${id}`, { method: "DELETE" }); refresh(); }
  return (
    <div>
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => setPlanDialog(null)}><Plus className="h-4 w-4 mr-1" />{t("newPlan")}</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {plans.length === 0 ? <p className="text-xs text-gray-400 col-span-full text-center py-8">{t("noPlans")}</p> : plans.map((plan) => {
          const tc = tierColors[plan.tier] ?? "text-gray-500 bg-gray-100";
          return (<Card key={plan.id} className={plan.active ? "" : "opacity-50"}>
            <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="h-4 w-4 text-primary-500" /><span className="text-sm">{plan.name}</span></CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{plan.tier}</p>
              <div className="flex gap-3">
                <p className="text-lg font-bold">﷼ {plan.monthlyPrice}<span className="text-xs font-normal text-gray-400">{t("perMonth")}</span></p>
                <p className="text-lg font-bold text-gray-500">﷼ {plan.yearlyPrice}<span className="text-xs font-normal text-gray-400">{t("perYear")}</span></p>
              </div>
              <div className="space-y-1 text-xs">
                <p className="flex justify-between"><span className="text-gray-400">{t("maxUsers")}</span><span>{plan.maxUsers}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">{t("maxInvoices")}</span><span>{plan.maxInvoices}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">{t("organizations")}</span><span>{plan.orgCount}</span></p>
              </div>
              <div className="flex gap-1 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setPlanDialog(plan)}><Edit3 className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deletePlan(plan.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>);
        })}
      </div>
      {planDialog !== undefined && (
        <Dialog open onClose={() => setPlanDialog(undefined)} title={planDialog ? t("editPlan") : t("newPlan")}>
          <PlanForm plan={planDialog} onClose={() => setPlanDialog(undefined)} onSave={refresh} />
        </Dialog>
      )}
    </div>
  );
}
