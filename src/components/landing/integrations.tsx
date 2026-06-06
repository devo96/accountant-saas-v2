"use client";

import { useTranslations } from "next-intl";

export function LandingIntegrations() {
  const t = useTranslations("landing");

  const integrations = [
    { name: t("intSallaName"), desc: t("intSallaDesc"), icon: "🛍️" },
    { name: t("intZidName"), desc: t("intZidDesc"), icon: "🛒" },
    { name: t("intPaymentsName"), desc: t("intPaymentsDesc"), icon: "💳" },
    { name: t("intPosName"), desc: t("intPosDesc"), icon: "🏪" },
  ];

  return (
    <section id="integrations" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("integrationsTitle")}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("integrationsSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {integrations.map((int, i) => (
            <div key={i} className="text-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary-200 transition-all hover:shadow-lg">
              <span className="text-4xl mb-3 block">{int.icon}</span>
              <h3 className="text-base font-bold text-gray-900 mb-2">{int.name}</h3>
              <p className="text-sm text-gray-600">{int.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
