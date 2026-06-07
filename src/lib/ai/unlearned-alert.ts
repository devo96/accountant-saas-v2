import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function triggerAdminUnlearnedAlert(orgId: string, userId: string, question: string) {
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId,
      action: "AI_UNLEARNED_QUERY",
      entity: "AI",
      newValue: { question: question.slice(0, 500) },
    },
  });

  const owners = await prisma.user.findMany({
    where: { organizationId: orgId, role: "OWNER", active: true },
    select: { id: true },
  });

  if (owners.length > 0) {
    await prisma.notification.createMany({
      data: owners.map((owner) => ({
        organizationId: orgId,
        userId: owner.id,
        type: "AI_UNLEARNED",
        title: "استفسار لم يتمكن المحاسب الذكي من الإجابة عليه",
        message: `لم يتمكن الذكاء الاصطناعي من الإجابة على السؤال التالي: "${question.slice(0, 200)}"`,
        entityType: "AI",
        link: "/owner/ai-settings",
      })),
    });
  }

  logger.warn({ orgId, userId, question: question.slice(0, 200) }, "AI unlearned query recorded");
}
