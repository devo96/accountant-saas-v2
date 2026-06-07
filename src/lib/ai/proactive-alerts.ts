import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type AlertInput = { title: string; message: string; severity: "INFO" | "WARNING" | "CRITICAL"; category: string; data?: any };

const CATEGORIES = {
  CASH_FLOW: "CASH_FLOW",
  RECEIVABLES: "RECEIVABLES",
  PAYABLES: "PAYABLES",
  PROFIT: "PROFIT",
} as const;

export async function runProactiveAnalysis(orgId: string): Promise<number> {
  const enabled = await prisma.organizationSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key: "ai_proactive_alerts" } },
  });

  if (enabled?.value !== "true") return 0;

  const alerts: AlertInput[] = [];

  const bankAccounts = await prisma.bankAccount.findMany({ where: { organizationId: orgId } });
  const totalCash = bankAccounts.reduce((s, a) => s + Number(a.currentBalance), 0);
  if (totalCash < 0) {
    alerts.push({
      title: "رصيد البنك سلبي",
      message: `إجمالي أرصدة الحسابات البنكية سالب بقيمة ${Math.abs(totalCash).toLocaleString()} ريال. يرجى مراجعة فوري.`,
      severity: "CRITICAL", category: CATEGORIES.CASH_FLOW, data: { totalCash },
    });
  } else if (totalCash < 5000) {
    alerts.push({
      title: "رصيد بنكي منخفض",
      message: `إجمالي الأرصدة البنكية ${totalCash.toLocaleString()} ريال فقط. قد تواجه صعوبة في تغطية الالتزامات القريبة.`,
      severity: "WARNING", category: CATEGORIES.CASH_FLOW, data: { totalCash },
    });
  }

  const overdueReceivables = await prisma.salesInvoice.findMany({
      where: { organizationId: orgId, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] }, dueDate: { lt: new Date(), not: null } },
    include: { customer: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  if (overdueReceivables.length > 0) {
    const totalDue = overdueReceivables.reduce((s, inv) => s + (Number(inv.total) - Number(inv.paidAmount ?? 0)), 0);
    const oldestDate = overdueReceivables[0]!.dueDate!;
    alerts.push({
      title: `فواتير مبيعات متأخرة (${overdueReceivables.length})`,
      message: `إجمالي المستحقات المتأخرة ${totalDue.toLocaleString()} ريال. أقدمها من تاريخ ${oldestDate.toLocaleDateString("ar-SA")}.`,
      severity: overdueReceivables.length > 5 ? "CRITICAL" : "WARNING",
      category: CATEGORIES.RECEIVABLES,
      data: { count: overdueReceivables.length, totalDue, oldestDate },
    });
  }

  const overduePayables = await prisma.purchaseInvoice.findMany({
      where: { organizationId: orgId, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] }, dueDate: { lt: new Date(), not: null } },
    include: { vendor: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  if (overduePayables.length > 0) {
    const totalDue = overduePayables.reduce((s, inv) => s + (Number(inv.total) - Number(inv.paidAmount ?? 0)), 0);
    const oldestDate = overduePayables[0]!.dueDate!;
    alerts.push({
      title: `فواتير مشتريات متأخرة (${overduePayables.length})`,
      message: `إجمالي المستحقات المتأخرة للموردين ${totalDue.toLocaleString()} ريال. أقدمها من تاريخ ${oldestDate.toLocaleDateString("ar-SA")}.`,
      severity: overduePayables.length > 5 ? "CRITICAL" : "WARNING",
      category: CATEGORIES.PAYABLES,
      data: { count: overduePayables.length, totalDue, oldestDate },
    });
  }

  const recentInvoices = await prisma.salesInvoice.findMany({
    where: { organizationId: orgId },
    orderBy: { invoiceDate: "desc" },
    take: 50,
    select: { total: true, invoiceDate: true },
  });

  if (recentInvoices.length >= 10) {
    const mid = Math.floor(recentInvoices.length / 2);
    const recentHalf = recentInvoices.slice(0, mid);
    const olderHalf = recentInvoices.slice(mid);
    const recentAvg = recentHalf.reduce((s, inv) => s + Number(inv.total), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((s, inv) => s + Number(inv.total), 0) / olderHalf.length;

    if (olderAvg > 0 && recentAvg < olderAvg * 0.7) {
      alerts.push({
        title: "انخفاض ملحوظ في المبيعات",
        message: `متوسط المبيعات انخفض من ${olderAvg.toLocaleString()} ريال إلى ${recentAvg.toLocaleString()} ريال. انخفاض بنسبة ${Math.round((1 - recentAvg / olderAvg) * 100)}%.`,
        severity: "WARNING", category: CATEGORIES.PROFIT,
        data: { previousAvg: olderAvg, currentAvg: recentAvg, decline: Math.round((1 - recentAvg / olderAvg) * 100) },
      });
    }
  }

  if (alerts.length > 0) {
    const now = new Date();
    await prisma.aiProactiveAlert.createMany({
      data: alerts.map((a) => ({
        organizationId: orgId, title: a.title, message: a.message,
        severity: a.severity, category: a.category, data: a.data ?? undefined,
        createdAt: now,
      })),
    });

    logger.info({ orgId, count: alerts.length }, "Proactive alerts generated");
  }

  return alerts.length;
}
