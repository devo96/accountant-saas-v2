import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { hasRole } from "@/lib/permissions";
import { AuditLogsClient } from "./client";

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (!hasRole(session.user.role, "ADMIN")) redirect("/dashboard");

  const t = await getTranslations("auditLogs");
  return (
    <AuditLogsClient
      translations={{ title: t("title"), searchPlaceholder: t("searchPlaceholder"), entity: t("entity"), action: t("action"), user: t("user"), details: t("details"), date: t("date"), noResults: t("noResults"), loading: t("loading") }}
    />
  );
}
