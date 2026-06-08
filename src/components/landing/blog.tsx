"use client";

import { useTranslations } from "next-intl";

const posts = [
  { titleKey: "blogPost1Title", descKey: "blogPost1Desc", dateKey: "blogPost1Date" },
  { titleKey: "blogPost2Title", descKey: "blogPost2Desc", dateKey: "blogPost2Date" },
  { titleKey: "blogPost3Title", descKey: "blogPost3Desc", dateKey: "blogPost3Date" },
] as const;

const thumbnails = ["📊", "💰", "☁️"];

export function Blog() {
  const t = useTranslations("landing");

  return (
    <section id="blog" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("blogTitle")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("blogSubtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <a key={i} href="#" className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
              <div className="h-40 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-5xl">
                {thumbnails[i]}
              </div>
              <div className="p-6">
                <div className="text-xs text-gray-400 mb-2">{t(post.dateKey)}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                  {t(post.titleKey)}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {t(post.descKey)}
                </p>
                <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
                  {t("blogReadMore")} →
                </span>
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="#" className="inline-flex items-center px-6 py-3 border-2 border-primary-200 text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-colors">
            {t("blogViewAll")}
          </a>
        </div>
      </div>
    </section>
  );
}
