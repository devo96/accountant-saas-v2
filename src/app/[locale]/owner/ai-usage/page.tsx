import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { AiUsageClient } from "./client";

export default async function OwnerAiUsagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const t = await getTranslations("ownerPanel");
  const thisMonth = new Date().toISOString().slice(0, 7).replace("-", "");

  const [usageAgg, imageCount, usageLogs] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: { month: thisMonth },
      _sum: { queryCount: true, promptTokens: true, completionTokens: true, totalTokens: true, costUsd: true },
    }),
    prisma.aiUsageLog.count({
      where: { operationType: "image_processing", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.aiUsageLog.findMany({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const logs = usageLogs.map((l) => ({
    id: l.id,
    operationType: l.operationType,
    modelName: l.modelName,
    promptTokens: l.promptTokens,
    completionTokens: l.completionTokens,
    totalTokens: l.totalTokens,
    costUsd: l.costUsd,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title={t("aiUsageTitle")} description={t("aiUsageSubtitle")} />
        <AiUsageClient
          totalQueries={usageAgg._sum.queryCount ?? 0}
          totalTokens={usageAgg._sum.totalTokens ?? 0}
          totalCostUsd={usageAgg._sum.costUsd ?? 0}
          imagesProcessed={imageCount}
          logs={logs}
        />
      </div>
    </FadeIn>
  );
}
