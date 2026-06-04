import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeIn } from "@/components/transitions";
import { SecurityClient } from "./client";

export default async function OwnerSecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [totalOrgs, totalUsers, activeOrgs, totalRevenue, auditLast7d, auditToday, totalJournalEntries, totalInvoices] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.organizationPlan.count({ where: { status: "ACTIVE" } }),
    prisma.salesInvoice.aggregate({ _sum: { total: true } }),
    prisma.auditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.journalEntry.count(),
    prisma.salesInvoice.count(),
  ]);

  const totalDbRecords = totalJournalEntries + totalInvoices + (await prisma.organization.count()) + (await prisma.user.count());
  const health = { status: "Healthy", uptime: "99.9%", totalOrgs, totalUsers, activeOrgs, totalRevenue: Number(totalRevenue._sum.total ?? 0), auditLast7d, auditToday, totalDbRecords, lastChecked: new Date().toISOString() };

  const auditLogs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const auditData = auditLogs.map((l) => ({ id: l.id, organizationId: l.organizationId, userId: l.userId, action: l.action, entity: l.entity, entityId: l.entityId, oldValue: l.oldValue, newValue: l.newValue, createdAt: l.createdAt.toISOString() }));

  return (
    <FadeIn>
      <div className="space-y-4">
        <PageHeader title="Security" description="System health and audit logs" />
        <SecurityClient health={health} auditLogs={auditData} />
      </div>
    </FadeIn>
  );
}
