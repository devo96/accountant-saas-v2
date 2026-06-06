"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";

export function LandingPricing() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      name: t("planBasicName"),
      tier: "starter",
      monthly: 99,
      yearly: 949,
      desc: t("planBasicDesc"),
      popular: false,
      features: [t("planBasicFeat1"), t("planBasicFeat2"), t("planBasicFeat3"), t("planBasicFeat4"), t("planBasicFeat5")],
    },
    {
      name: t("planProName"),
      tier: "professional",
      monthly: 249,
      yearly: 2389,
      desc: t("planProDesc"),
      popular: true,
      features: [t("planProFeat1"), t("planProFeat2"), t("planProFeat3"), t("planProFeat4"), t("planProFeat5")],
    },
    {
      name: t("planEnterpriseName"),
      tier: "enterprise",
      monthly: 0,
      yearly: 0,
      desc: t("planEnterpriseDesc"),
      popular: false,
      features: [t("planEnterpriseFeat1"), t("planEnterpriseFeat2"), t("planEnterpriseFeat3"), t("planEnterpriseFeat4"), t("planEnterpriseFeat5")],
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("pricingTitle")}</h2>
          <p className="text-lg text-gray-600">{t("pricingSubtitle")}</p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!yearly ? "text-gray-900" : "text-gray-400"}`}>{t("pricingMonthly")}</span>
            <button onClick={() => setYearly(!yearly)} className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? "bg-primary-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${yearly ? "ltr:translate-x-7 rtl:-translate-x-7" : "ltr:translate-x-0.5 rtl:-translate-x-0.5"} ${yearly ? "end-0.5" : "start-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-gray-900" : "text-gray-400"}`}>{t("pricingYearly")} <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">{t("pricingSave20")}</span></span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-6 rounded-2xl border-2 transition-all ${plan.popular ? "border-primary-500 shadow-xl shadow-primary-100" : "border-gray-200 hover:border-primary-200"}`}>
              {plan.popular && (
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-bold px-4 py-1 rounded-full">{t("pricingMostPopular")}</span>
              )}
              {plan.tier === "enterprise" ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-4">{t("pricingCustom")}</p>
                  <ul className="space-y-2 mb-6 text-sm">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-700"><span className="text-green-500 text-lg">✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href={`/${locale}/register`} className="block w-full py-2.5 text-center text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">{t("pricingContact")}</a>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(yearly ? plan.yearly : plan.monthly)}
                    <span className="text-sm font-normal text-gray-400">{yearly ? t("pricingPerYear") : t("pricingPerMonth")}</span>
                  </p>
                  {yearly && <p className="text-xs text-green-600 mb-4">{t("pricingYearlyHint", { price: plan.monthly })}</p>}
                  <ul className="space-y-2 mb-6 text-sm mt-4">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-700"><span className="text-green-500 text-lg">✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href={`/${locale}/register`} className={`block w-full py-2.5 text-center text-sm font-medium rounded-xl transition-colors ${plan.popular ? "text-white bg-primary-600 hover:bg-primary-700" : "text-primary-600 bg-primary-50 hover:bg-primary-100"}`}>{t("pricingSubscribe")}</a>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
