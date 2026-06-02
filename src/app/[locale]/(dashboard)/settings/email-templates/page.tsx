import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { EmailTemplatesClient } from "./client";
import { DEFAULT_TEMPLATES } from "./defaults";

export default async function EmailTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (!hasPermission(session.user.role as "ADMIN" | "ACCOUNTANT" | "VIEWER", null, "settings.email-templates.read")) redirect("/dashboard");

  const orgId = session.user.organizationId;
  const customTemplates = await prisma.emailTemplate.findMany({
    where: { organizationId: orgId },
    select: { key: true, subject: true, body: true },
  });

  const customMap = new Map(customTemplates.map((t) => [t.key, t]));

  const templates = Object.entries(DEFAULT_TEMPLATES).map(([key, def]) => ({
    key,
    subject: customMap.get(key)?.subject ?? def.subject,
    body: customMap.get(key)?.body ?? def.body,
    isCustom: customMap.has(key),
  }));

  return <EmailTemplatesClient templates={templates} />;
}
