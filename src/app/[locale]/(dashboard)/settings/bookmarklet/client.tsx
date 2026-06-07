"use client";

import { useState, useRef } from "react";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";

const BOOKMARKLET_LOADER = `/bookmarklet.js?${Date.now()}`;
const BOOKMARKLET_URL = `javascript:(function(){document.body.appendChild(document.createElement('script')).src='${BOOKMARKLET_LOADER}'})()`;

export function BookmarkletClient() {
  const t = useTranslations("bookmarklet");
  const s = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function copyCode() {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(BOOKMARKLET_URL).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="rounded-lg border p-6 space-y-6">
        <div className="text-center p-8 bg-blue-50 dark:bg-blue-950/30 rounded-xl space-y-4">
          <p className="text-lg font-semibold">{t("dragInstruction")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("dragHint")}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("stepsTitle")}</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
          </ol>
        </div>

        <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t("manualTitle")}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t("manualDesc")}</p>
          <div className="flex gap-2 items-center">
            <input ref={inputRef} readOnly value={BOOKMARKLET_URL} className="flex-1 px-3 py-2 text-xs font-mono border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 truncate cursor-pointer" onClick={copyCode} />
            <button onClick={copyCode} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shrink-0">{copied ? "✓" : t("copyBtn")}</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">{t("manualNote")}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">{t("featuresTitle")}</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>{t("feature1")}</li>
            <li>{t("feature2")}</li>
            <li>{t("feature3")}</li>
            <li>{t("feature4")}</li>
          </ul>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="font-semibold mb-1">{s("note")}</p>
          <p>{t("note")}</p>
        </div>
      </div>
    </div>
    </FadeIn>
  );
}
