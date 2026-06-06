"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { ProductsMegaMenu, ResourcesDropdown } from "./mega-menu";

export function LandingHeader() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold text-primary-600">{locale === "en" ? "Qoyod" : "قيود"}</a>
            <nav className="hidden md:flex items-center gap-6">
              <ProductsMegaMenu />
              <a href="#features" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("features")}</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("pricing")}</a>
              <a href="#integrations" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("integrations")}</a>
              <ResourcesDropdown />
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/${locale}/login`} className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">{t("login")}</a>
            <a href={`/${locale}/register`} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">{t("freeTrial")}</a>
            <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="md:hidden p-2 text-gray-600">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <a href="#features" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("features")}</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("pricing")}</a>
            <a href="#integrations" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("integrations")}</a>
            <a href="#faq" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">{t("faq")}</a>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <a href={`/${locale}/login`} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-gray-700">{t("login")}</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
