import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { global, perPlan } = body;

  const settingsMap: Record<string, string> = {
    ai_enabled: String(global.aiEnabled ?? true),
    ai_max_queries: String(global.maxQueries ?? 500),
    ai_max_tokens: String(global.maxTokens ?? 1000000),
    ai_proactive_alerts: String(global.proactiveAlerts ?? false),
    ai_model_provider: String(global.modelProvider ?? "openai-gpt4o"),
    ai_addon_price: String(global.addonPrice ?? 50),
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    await prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId: session.user.organizationId, key } },
      update: { value },
      create: { organizationId: session.user.organizationId, key, value },
    });
  }

  if (perPlan && Array.isArray(perPlan)) {
    for (const item of perPlan) {
      await prisma.plan.update({
        where: { id: item.planId },
        data: { features: item.features },
      });
    }
  }

  logger.info({ ownerId: session.user.id }, "AI settings updated");
  return NextResponse.json({ success: true });
}
