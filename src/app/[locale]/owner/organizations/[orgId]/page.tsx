import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { OrgProfileClient } from "./client";

export default async function OrgProfilePage({ params }: { params: Promise<{ locale: string; orgId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const { locale, orgId } = await params;
  const t = await getTranslations("ownerPanel");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) redirect("/owner/organizations");

  return (
    <FadeIn>
      <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <OrgProfileClient orgId={orgId} orgName={org.name} />
      </div>
    </FadeIn>
  );
}
