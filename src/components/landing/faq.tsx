"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingFAQ() {
  const t = useTranslations("landing");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">{t("faqTitle")}</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden transition-all">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex items-center justify-between w-full px-6 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === i}
              >
                {faq.q}
                <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", openIndex === i && "rotate-180")} />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
