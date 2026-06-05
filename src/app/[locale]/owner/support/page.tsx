import { prisma } from "@/lib/prisma"; import { getServerSession } from "next-auth"; import { authOptions } from "@/lib/auth"; import { redirect } from "next/navigation"; import { getTranslations } from "next-intl/server"; import { PageHeader } from "@/components/ui/page-header"; import { FadeIn } from "@/components/transitions"; import { SupportClient } from "./client";
export default async function OwnerSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");
  const t = await getTranslations("ownerPanel");
  const tickets = await prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" }, include: { organization: { select: { name: true } }, user: { select: { name: true, email: true } } } });
  const ticketsData = tickets.map((ticket) => ({ id: ticket.id, organizationId: ticket.organizationId, subject: ticket.subject, message: ticket.message, status: ticket.status, priority: ticket.priority, createdBy: ticket.createdBy, assignedTo: ticket.assignedTo, createdAt: ticket.createdAt.toISOString(), organization: { name: ticket.organization.name }, user: ticket.user ? { name: ticket.user.name, email: ticket.user.email } : null }));
  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title={t("supportTitle")} description={t("supportSubtitle")} />
        <SupportClient tickets={ticketsData} />
      </div>
    </FadeIn>
  );
}
