"use client";

import { useTranslations } from "next-intl";

export function AppStore() {
  const t = useTranslations("landing");

  return (
    <section className="py-20 bg-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t("appStoreTitle")}
        </h2>
        <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
          {t("appStoreSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#" className="inline-flex items-center gap-3 px-8 py-3.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-lg">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            <div className="text-left">
              <div className="text-xs text-gray-500">{t("appStoreIos")}</div>
              <div className="text-sm font-semibold">iOS</div>
            </div>
          </a>
          <a href="#" className="inline-flex items-center gap-3 px-8 py-3.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-lg">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.61 1.63C3.24 1.85 3 2.3 3 2.77v18.46c0 .47.24.92.61 1.14L3.72 22.5 15.5 12 3.61 1.63z"/><path d="M20.22 13.45l-4.07-2.38-2.32 2.27 2 1.96 4.39-1.25c.56-.16.78-.5.78-.9 0-.4-.22-.74-.78-.9z"/><path d="M16.15 10.93l4.07-2.38c.56-.16.78-.5.78-.9 0-.4-.22-.74-.78-.9L5.63 2.22 3.61 1.63 15.5 12l-2.25 2.2 2.9-2.85v-.42z"/></svg>
            <div className="text-left">
              <div className="text-xs text-gray-500">{t("appStoreAndroid")}</div>
              <div className="text-sm font-semibold">Android</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
