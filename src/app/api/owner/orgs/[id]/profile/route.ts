import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const [org, stats, payments, tickets, auditLogs, settings] = await Promise.all([
    prisma.organization.findUnique({
      where: { id },
      include: {
        organizationPlan: { include: { plan: true } },
      },
    }),
    Promise.all([
      prisma.salesInvoice.count({ where: { organizationId: id } }),
      prisma.item.count({ where: { organizationId: id } }),
      prisma.employee.count({ where: { organizationId: id } }),
      prisma.user.count({ where: { organizationId: id } }),
      prisma.salesInvoice.aggregate({
        where: { organizationId: id },
        _sum: { total: true },
      }),
    ]),
    prisma.paymentTransaction.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.supportTicket.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.auditLog.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.organizationSetting.findMany({
      where: { organizationId: id, key: { in: ["zatca_environment", "zatca_csid_id"] } },
    }),
  ]);

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const [
    totalInvoices,
    totalItems,
    totalEmployees,
    totalUsers,
    salesAgg,
  ] = stats;

  const zatcaConnected = settings.some(
    (s) => s.key === "zatca_csid_id" && s.value && s.value !== ""
  );

  return NextResponse.json({
    org: {
      id: org.id,
      name: org.name,
      email: org.email,
      phone: org.phone,
      address: org.address,
      logo: org.logo,
      commercialReg: org.commercialReg,
      taxNumber: org.taxNumber,
      createdAt: org.createdAt.toISOString(),
    },
    plan: org.organizationPlan
      ? {
          id: org.organizationPlan.plan.id,
          name: org.organizationPlan.plan.name,
          tier: org.organizationPlan.plan.tier,
          status: org.organizationPlan.status,
          startsAt: org.organizationPlan.startsAt.toISOString(),
          endsAt: org.organizationPlan.endsAt?.toISOString() ?? null,
          trialEndsAt: org.organizationPlan.trialEndsAt?.toISOString() ?? null,
          autoRenew: org.organizationPlan.autoRenew,
          overrides: org.organizationPlan.overrides,
        }
      : null,
    stats: {
      totalInvoices,
      totalItems,
      totalEmployees,
      totalUsers,
      totalSales: Number(salesAgg._sum.total ?? 0),
    },
    recentErrors: auditLogs
      .filter((l) => l.action.toUpperCase().includes("ERROR") || l.action.toUpperCase().includes("CRASH"))
      .slice(0, 5)
      .map((l) => ({ id: l.id, action: l.action, createdAt: l.createdAt.toISOString(), entity: l.entity })),
    payments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      type: p.type,
      status: p.status,
      paymentMethod: p.paymentMethod,
      reason: p.reason,
      createdAt: p.createdAt.toISOString(),
      subscriptionStart: p.subscriptionStart?.toISOString() ?? null,
      subscriptionEnd: p.subscriptionEnd?.toISOString() ?? null,
    })),
    tickets: tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      priority: t.priority,
      status: t.status,
      createdBy: t.createdBy,
      createdAt: t.createdAt.toISOString(),
    })),
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      oldValue: l.oldValue,
      newValue: l.newValue,
      createdAt: l.createdAt.toISOString(),
    })),
    zatcaConnected,
    integrations: [
      { name: "ZATCA", status: zatcaConnected ? "connected" : "disconnected", lastSync: null },
    ],
  });
}
