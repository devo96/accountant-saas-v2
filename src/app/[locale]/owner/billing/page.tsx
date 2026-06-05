import { prisma } from "@/lib/prisma"; import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth"; import { redirect } from "next/navigation"; import { getTranslations } from "next-intl/server"; import { PageHeader } from "@/components/ui/page-header"; import { FadeIn } from "@/components/transitions"; import { BillingClient } from "./client";
export default async function OwnerBillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");
  const t = await getTranslations("ownerPanel");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title={t("billingTitle")} description={t("billingSubtitle")} />
        <BillingClient coupons={coupons.map((c) => ({ ...c, expiresAt: c.expiresAt?.toISOString() ?? null, createdAt: c.createdAt.toISOString(), planId: c.planId, minAmount: Number(c.minAmount), discountValue: Number(c.discountValue) }))} />
      </div>
    </FadeIn>
  );
}
