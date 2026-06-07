"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Save, Bot, Brain, FileText, Bell, AlertTriangle } from "lucide-react";

type PlanInfo = {
  id: string;
  name: string;
  tier: string;
  features: Record<string, any> | null;
};

type Props = {
  plans: PlanInfo[];
  settings: Record<string, string>;
};

export function AiSettingsClient({ plans: initialPlans, settings: initialSettings }: Props) {
  const t = useTranslations("ownerPanel");
  const { toast } = useToast();
  const [plans, setPlans] = useState(initialPlans);
  const [saving, setSaving] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(initialSettings["ai_enabled"] !== "false");
  const [maxQueries, setMaxQueries] = useState(initialSettings["ai_max_queries"] || "500");
  const [maxTokens, setMaxTokens] = useState(initialSettings["ai_max_tokens"] || "1000000");
  const [proactiveAlerts, setProactiveAlerts] = useState(initialSettings["ai_proactive_alerts"] === "true");

  function getAiFeatures(plan: PlanInfo) {
    return {
      ocr: plan.features?.aiOcrEnabled !== false,
      reporting: plan.features?.aiReportingEnabled !== false,
      drafting: plan.features?.aiDraftingEnabled !== false,
    };
  }

  function togglePlanFeature(planId: string, feature: "ocr" | "reporting" | "drafting") {
    setPlans((prev) => prev.map((p) => {
      if (p.id !== planId) return p;
      const feats = getAiFeatures(p);
      feats[feature] = !feats[feature];
      return { ...p, features: { ...p.features, aiOcrEnabled: feats.ocr, aiReportingEnabled: feats.reporting, aiDraftingEnabled: feats.drafting } };
    }));
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/owner/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          global: { aiEnabled, maxQueries: parseInt(maxQueries), maxTokens: parseInt(maxTokens), proactiveAlerts },
          perPlan: plans.map((p) => ({ planId: p.id, features: { aiOcrEnabled: getAiFeatures(p).ocr, aiReportingEnabled: getAiFeatures(p).reporting, aiDraftingEnabled: getAiFeatures(p).drafting } })),
        }),
      });
      if (res.ok) toast({ title: t("aiSettingsSaved"), type: "success" });
      else toast({ title: t("aiSettingsFailed"), type: "error" });
    } catch {
      toast({ title: t("aiSettingsFailed"), type: "error" });
    }
    setSaving(false);
  }, [aiEnabled, maxQueries, maxTokens, proactiveAlerts, plans, t]);

  const toggleClass = (on: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-primary-600" : "bg-gray-300"}`;
  const toggleKnob = (on: boolean) =>
    `inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${on ? "translate-x-[22px]" : "translate-x-[2px]"}`;

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Brain className="h-5 w-5 text-primary-600" />{t("aiGlobalSettings")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">{t("aiOcr")}</p></div>
            <button onClick={() => setAiEnabled(!aiEnabled)} className={toggleClass(aiEnabled)}>
              <span className={toggleKnob(aiEnabled)} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">{t("aiMaxQueries")}</label>
              <input type="number" value={maxQueries} onChange={(e) => setMaxQueries(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" min={0} />
              <p className="text-xs text-gray-400 mt-1">{t("aiQueriesLabel")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">{t("aiTokensPerMonth")}</label>
              <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" min={0} />
              <p className="text-xs text-gray-400 mt-1">{t("aiTokensLabel")}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <div><p className="text-sm font-medium">{t("aiProactiveAlerts")}</p><p className="text-xs text-gray-400">{t("aiProactiveAlertsHint")}</p></div>
            </div>
            <button onClick={() => setProactiveAlerts(!proactiveAlerts)} className={toggleClass(proactiveAlerts)}>
              <span className={toggleKnob(proactiveAlerts)} />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-primary-600" />{t("aiPerPlan")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {plans.map((plan) => {
            const feats = getAiFeatures(plan);
            const tierColors: Record<string, string> = { FREE: "text-gray-500 bg-gray-100", STARTER: "text-blue-600 bg-blue-50", PROFESSIONAL: "text-purple-600 bg-purple-50", ENTERPRISE: "text-amber-600 bg-amber-50" };
            const tc = tierColors[plan.tier] ?? "text-gray-500 bg-gray-100";
            return (
              <div key={plan.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{plan.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{plan.tier}</span>
                </div>
                <div className="flex items-center gap-4">
                  {[["ocr", t("aiOcr")], ["reporting", t("aiReporting")], ["drafting", t("aiDrafting")]].map(([key, label]) => (
                    <button key={key} onClick={() => togglePlanFeature(plan.id, key as any)}
                      className="flex items-center gap-1.5 text-xs" title={label as string}>
                      <span className={feats[key as keyof typeof feats] ? "text-emerald-600" : "text-gray-300"}>
                        {feats[key as keyof typeof feats] ? "✓" : "○"}
                      </span>
                      <span className="text-gray-500">{key === "ocr" ? "OCR" : key === "reporting" ? t("aiReporting").slice(0, 10) : t("aiDrafting").slice(0, 8)}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 ml-1" />
          {saving ? t("formSave") + "..." : t("formSave")}
        </Button>
      </div>
    </div>
  );
}
