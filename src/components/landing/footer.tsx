"use client";

import { useTranslations, useLocale } from "next-intl";

export function LandingFooter() {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <span className="text-xl font-bold text-white">{locale === "en" ? "Qoyod" : "قيود"}</span>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">{t("footerDesc")}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t("footerQuickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#hero" className="hover:text-white transition-colors">{t("footerHome")}</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">{t("footerFeatures")}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t("footerPricing")}</a></li>
              <li><a href="#integrations" className="hover:text-white transition-colors">{t("footerIntegrations")}</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">{t("footerFAQ")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t("footerLegal")}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t("footerTerms")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footerPrivacy")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footerReturns")}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t("footerContact")}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>info@qoyod.com</li>
              <li>+966 55 123 4567</li>
              <li>{locale === "en" ? "Riyadh, Saudi Arabia" : "الرياض، المملكة العربية السعودية"}</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t("footerCopyright")}</p>
          <div className="flex gap-3">
            <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full text-gray-400">{t("footerZatca")}</span>
            <span className="text-xs bg-gray-800 px-3 py-1.5 rounded-full text-gray-400">{t("footerCloud")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
