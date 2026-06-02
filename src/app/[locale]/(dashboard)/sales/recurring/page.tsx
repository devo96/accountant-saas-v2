import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecurringInvoicesClient } from "./client";

export default async function RecurringInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const [templates, customers] = await Promise.all([
    prisma.recurringInvoiceTemplate.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { nextRunDate: "asc" },
    }),
    prisma.customer.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
  ]);

  const serialized = templates.map((t) => ({
    ...t,
    subtotal: Number(t.subtotal),
    total: Number(t.total),
    nextRunDate: t.nextRunDate.toISOString(),
    lastRunDate: t.lastRunDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
  }));

  return (
    <RecurringInvoicesClient
      templates={serialized}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
