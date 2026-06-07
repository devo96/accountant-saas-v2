import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { AiSettingsClient } from "./client";

export default async function OwnerAiSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const t = await getTranslations("ownerPanel");

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  const plansData = plans.map((p) => ({
    id: p.id, name: p.name, tier: p.tier,
    features: p.features as Record<string, any> | null,
  }));

  const globalSettings = await prisma.organizationSetting.findMany({
    where: { organizationId: session.user.organizationId, key: { startsWith: "ai_" } },
  });
  const settingsMap: Record<string, string> = {};
  for (const s of globalSettings) settingsMap[s.key] = s.value;

  const thisMonth = new Date().toISOString().slice(0, 7).replace("-", "");
  const usageAgg = await prisma.aiUsage.aggregate({
    where: { month: thisMonth },
    _sum: { queryCount: true },
  });
  const totalQueries = usageAgg._sum.queryCount ?? 0;
  const totalTokens = Number(totalQueries) * 3500;

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title={t("aiSettingsTitle")} description={t("aiSettingsSubtitle")} />
        <AiSettingsClient
          plans={plansData}
          settings={settingsMap}
          totalTokens={totalTokens}
          totalQueries={totalQueries}
        />
      </div>
    </FadeIn>
  );
}
