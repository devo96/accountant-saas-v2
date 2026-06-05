import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { AccountingDimensionsClient } from "./client";

export default async function AccountingDimensionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const dimensions = await prisma.accountingDimension.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { allocations: true } } },
  });

  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId, active: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const t = await getTranslations("accountingDimensions");
  return (
    <AccountingDimensionsClient
      dimensions={dimensions.map((d) => ({ ...d, _count: { allocations: d._count.allocations } }))}
      accounts={accounts}
      translations={{ title: t("title"), newDimension: t("newDimension"), searchPlaceholder: t("searchPlaceholder"), dialogTitle: t("dialogTitle"), name: t("name"), accountsCount: t("accountsCount"), save: t("save"), cancel: t("cancel"), saving: t("saving"), noResults: t("noResults") }}
    />
  );
}
