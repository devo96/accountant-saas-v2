"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Save, Brain, FileText, Bell, Cpu, Coins, Zap, Database } from "lucide-react";

type PlanInfo = {
  id: string;
  name: string;
  tier: string;
  features: Record<string, any> | null;
};

type Props = {
  plans: PlanInfo[];
  settings: Record<string, string>;
  totalTokens: number;
  totalQueries: number;
};

const AI_MODELS = [
  { value: "openai-gpt4o", label: "OpenAI - GPT-4o" },
  { value: "anthropic-claude35", label: "Anthropic - Claude 3.5 Sonnet" },
  { value: "deepseek-v3", label: "DeepSeek - V3" },
];

const FEATURES = ["ocr", "reporting", "drafting"] as const;

export function AiSettingsClient({ plans: initialPlans, settings: initialSettings, totalTokens, totalQueries }: Props) {
  const t = useTranslations("ownerPanel");
  const { toast } = useToast();
  const [plans, setPlans] = useState(initialPlans);
  const [saving, setSaving] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(initialSettings["ai_enabled"] !== "false");
  const [maxQueries, setMaxQueries] = useState(initialSettings["ai_max_queries"] || "500");
  const [maxTokens, setMaxTokens] = useState(initialSettings["ai_max_tokens"] || "1000000");
  const [proactiveAlerts, setProactiveAlerts] = useState(initialSettings["ai_proactive_alerts"] === "true");
  const [modelProvider, setModelProvider] = useState(initialSettings["ai_model_provider"] || "openai-gpt4o");
  const [addonPrice, setAddonPrice] = useState(initialSettings["ai_addon_price"] || "50");

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
          global: {
            aiEnabled,
            maxQueries: parseInt(maxQueries),
            maxTokens: parseInt(maxTokens),
            proactiveAlerts,
            modelProvider,
            addonPrice: parseInt(addonPrice),
          },
          perPlan: plans.map((p) => ({
            planId: p.id,
            features: {
              aiOcrEnabled: getAiFeatures(p).ocr,
              aiReportingEnabled: getAiFeatures(p).reporting,
              aiDraftingEnabled: getAiFeatures(p).drafting,
            },
          })),
        }),
      });
      if (res.ok) toast({ title: t("aiSettingsSaved"), type: "success" });
      else toast({ title: t("aiSettingsFailed"), type: "error" });
    } catch {
      toast({ title: t("aiSettingsFailed"), type: "error" });
    }
    setSaving(false);
  }, [aiEnabled, maxQueries, maxTokens, proactiveAlerts, modelProvider, addonPrice, plans, t]);

  const toggleClass = (on: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-indigo-500" : "bg-gray-300"}`;
  const toggleKnob = (on: boolean) =>
    `inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${on ? "translate-x-[22px]" : "translate-x-[2px]"}`;

  function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString();
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Global Usage Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center gap-4">
          <div className="rounded-lg p-2.5 bg-indigo-50 dark:bg-indigo-900/20">
            <Zap className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("aiTotalTokens")}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCount(totalTokens)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center gap-4">
          <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-900/20">
            <Database className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("aiTotalQueries")}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalQueries.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Brain className="h-5 w-5 text-indigo-500" />{t("aiGlobalSettings")}</CardTitle></CardHeader>
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
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" min={0} />
              <p className="text-xs text-gray-400 mt-1">{t("aiQueriesLabel")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">{t("aiTokensPerMonth")}</label>
              <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" min={0} />
              <p className="text-xs text-gray-400 mt-1">{t("aiTokensLabel")}</p>
            </div>
          </div>

          {/* AI Model Provider Dropdown */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              <Cpu className="h-4 w-4 inline ml-1 text-indigo-500" />
              {t("aiModelProvider")}
            </label>
            <select
              value={modelProvider}
              onChange={(e) => setModelProvider(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
            >
              {AI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{t("aiModelProviderHint")}</p>
          </div>

          {/* AI Add-on Pricing */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              <Coins className="h-4 w-4 inline ml-1 text-amber-500" />
              {t("aiAddonPrice")}
            </label>
            <div className="flex items-center gap-2">
              <input type="number" value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)}
                className="w-40 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" min={0} />
              <span className="text-sm text-gray-500">SAR</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{t("aiAddonPriceHint")}</p>
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
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-indigo-500" />{t("aiPerPlan")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {/* Table Header */}
          <div className="hidden md:flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <span className="w-36">{t("plan")}</span>
            <div className="flex items-center gap-4">
              <span className="w-28 text-center">{t("aiOcr")}</span>
              <span className="w-28 text-center">{t("aiReporting")}</span>
              <span className="w-28 text-center">{t("aiDrafting")}</span>
            </div>
          </div>

          {plans.map((plan) => {
            const feats = getAiFeatures(plan);
            const tierColors: Record<string, string> = { FREE: "text-gray-500 bg-gray-100", STARTER: "text-blue-600 bg-blue-50", PROFESSIONAL: "text-purple-600 bg-purple-50", ENTERPRISE: "text-amber-600 bg-amber-50" };
            const tc = tierColors[plan.tier] ?? "text-gray-500 bg-gray-100";
            return (
              <div key={plan.id} className="flex flex-col md:flex-row md:items-center justify-between py-3 px-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{plan.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tc}`}>{plan.tier}</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  {FEATURES.map((key) => (
                    <button key={key} onClick={() => togglePlanFeature(plan.id, key)}
                      className="flex items-center gap-2 text-xs whitespace-nowrap">
                      <span className={feats[key] ? "text-indigo-500" : "text-gray-300"}>
                        {feats[key] ? "✓" : "○"}
                      </span>
                      <span className="text-gray-500">
                        {key === "ocr" ? "OCR" : key === "reporting" ? t("aiReporting") : t("aiDrafting")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600">
          <Save className="h-4 w-4 ml-1" />
          {saving ? t("formSave") + "..." : t("formSave")}
        </Button>
      </div>
    </div>
  );
}
