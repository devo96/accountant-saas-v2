import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrganizationSettingsClient } from "./client";

export default async function OrganizationSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!org) redirect("/auth/login");

  const rawSettings = await prisma.organizationSetting.findMany({
    where: { organizationId: session.user.organizationId },
  });
  const settings: Record<string, string> = {};
  for (const s of rawSettings) settings[s.key] = s.value;

  return <OrganizationSettingsClient org={{ ...org, createdAt: org.createdAt.toISOString() }} settings={settings} />;
}
