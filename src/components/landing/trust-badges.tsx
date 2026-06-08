"use client";

import { useTranslations } from "next-intl";

const badges = [
  { icon: "🔒", key: "trustPayment" },
  { icon: "🇸🇦", key: "trustDataCenter" },
  { icon: "✅", key: "trustZatca" },
  { icon: "🛡️", key: "trustSsl" },
] as const;

export function TrustBadges() {
  const t = useTranslations("landing");

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {t("trustTitle")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("trustSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((b) => (
            <div key={b.key} className="text-center p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{b.icon}</div>
              <div className="font-semibold text-gray-900 text-sm mb-1">{t(`${b.key}`)}</div>
              <div className="text-xs text-gray-500">{t(`${b.key}Desc`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
