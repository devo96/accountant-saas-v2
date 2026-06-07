"use client";

import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";

const BOOKMARKLET_URL = "javascript:(function(){document.body.appendChild(document.createElement('script')).src='/bookmarklet.js?'+Date.now()})()";

export function BookmarkletClient() {
  const t = useTranslations("bookmarklet");
  const s = useTranslations("common");

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="rounded-lg border p-6 space-y-6">
        <div className="text-center p-8 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <p className="text-lg font-semibold mb-4">{t("dragInstruction")}</p>
          <a
            href={BOOKMARKLET_URL}
            onClick={(e) => e.preventDefault()}
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-blue-700 transition-colors cursor-grab active:cursor-grabbing select-none"
            draggable={false}
            onMouseDown={(e) => {
              const target = e.currentTarget;
              const a = document.createElement("a");
              a.href = BOOKMARKLET_URL;
              a.textContent = `🔍 ${t("bookmarkletName")}`;
              a.style.position = "fixed";
              a.style.left = "-9999px";
              document.body.appendChild(a);
              a.setAttribute("draggable", "true");
              setTimeout(() => document.body.removeChild(a), 100);
            }}
          >
            🔍 {t("bookmarkletName")}
          </a>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("dragHint")}</p>
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
