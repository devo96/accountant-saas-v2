"use client";

import { useTranslations } from "next-intl";
import { Zap, Database, DollarSign, Image, BarChart3 } from "lucide-react";

type UsageLog = {
  id: string;
  operationType: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  createdAt: string;
};

type Props = {
  totalQueries: number;
  totalTokens: number;
  totalCostUsd: number;
  imagesProcessed: number;
  logs: UsageLog[];
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

const OP_LABELS: Record<string, { ar: string; en: string }> = {
  text_query: { ar: "استعلام نصي", en: "Text Query" },
  image_processing: { ar: "معالجة صورة", en: "Image Processing" },
  function_calling: { ar: "استدعاء أداة", en: "Function Calling" },
};

export function AiUsageClient({ totalQueries, totalTokens, totalCostUsd, imagesProcessed, logs }: Props) {
  const t = useTranslations("ownerPanel");

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2.5 bg-primary-50">
            <Zap className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("aiUsageTotalTokens")}</p>
            <p className="text-xl font-bold text-gray-900">{formatCount(totalTokens)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2.5 bg-emerald-50">
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("aiUsageTotalSpend")}</p>
            <p className="text-xl font-bold text-gray-900">${totalCostUsd.toFixed(2)}</p>
            <p className="text-[10px] text-gray-400">≈ {formatCount(totalTokens)} tokens</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2.5 bg-amber-50">
            <Database className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("aiUsageTotalQueries")}</p>
            <p className="text-xl font-bold text-gray-900">{formatCount(totalQueries)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2.5 bg-purple-50">
            <Image className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("aiUsageImagesProcessed")}</p>
            <p className="text-xl font-bold text-gray-900">{formatCount(imagesProcessed)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-semibold text-gray-800">{t("aiUsageLogTitle")}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColSession")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColType")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColModel")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColPrompt")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColCompletion")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColTotal")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColCost")}</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">{t("aiUsageColDate")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">{t("aiUsageNoData")}</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const opLabel = OP_LABELS[log.operationType] ?? { ar: log.operationType, en: log.operationType };
                  return (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-[11px]">{log.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          log.operationType === "image_processing"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-primary-100 text-primary-700"
                        }`}>
                          {opLabel.ar}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{log.modelName}</td>
                      <td className="px-4 py-2.5 text-gray-700">{log.promptTokens.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-700">{log.completionTokens.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-900 font-medium">{log.totalTokens.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-emerald-600 font-medium">${log.costUsd.toFixed(4)}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-[11px]">{new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
