"use client";

import { useTranslations } from "next-intl";

const testimonials = [
  { nameKey: "testimonial1Name", roleKey: "testimonial1Role", quoteKey: "testimonial1Quote" },
  { nameKey: "testimonial2Name", roleKey: "testimonial2Role", quoteKey: "testimonial2Quote" },
  { nameKey: "testimonial3Name", roleKey: "testimonial3Role", quoteKey: "testimonial3Quote" },
] as const;

const avatars = ["👨‍💼", "👩‍💼", "👨‍💻"];

export function Testimonials() {
  const t = useTranslations("landing");

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("testimonialsTitle")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("testimonialsSubtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{avatars[i]}</span>
                <div>
                  <div className="font-semibold text-gray-900">{t(item.nameKey)}</div>
                  <div className="text-sm text-gray-500">{t(item.roleKey)}</div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">&ldquo;{t(item.quoteKey)}&rdquo;</p>
              <div className="flex gap-0.5 mt-4">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
