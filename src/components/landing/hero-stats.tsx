"use client";

import { useTranslations } from "next-intl";

const stats = [
  { key: "heroStat1", labelKey: "heroStat1Label" },
  { key: "heroStat2", labelKey: "heroStat2Label" },
  { key: "heroStat3", labelKey: "heroStat3Label" },
  { key: "heroStat4", labelKey: "heroStat4Label" },
] as const;

export function HeroStats() {
  const t = useTranslations("landing");

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
      {stats.map((s) => (
        <div key={s.key} className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">
            {t(s.key)}
          </div>
          <div className="text-sm text-gray-500">
            {t(s.labelKey)}
          </div>
        </div>
      ))}
    </div>
  );
}
