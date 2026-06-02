import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.recurringInvoiceTemplate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { nextRunDate: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const template = await prisma.recurringInvoiceTemplate.create({
    data: {
      organizationId: session.user.organizationId,
      name: body.name,
      customerId: body.customerId,
      frequency: body.frequency ?? "MONTHLY",
      interval: body.interval ?? 1,
      nextRunDate: new Date(body.nextRunDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      invoiceDay: body.invoiceDay ?? null,
      dueDateDays: body.dueDateDays ?? 30,
      lines: body.lines ?? [],
      subtotal: body.subtotal ?? 0,
      discountAmount: body.discountAmount ?? 0,
      taxAmount: body.taxAmount ?? 0,
      total: body.total ?? 0,
      notes: body.notes ?? null,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "RecurringInvoiceTemplate",
    entityId: template.id,
    newValue: { name: template.name },
  });

  return NextResponse.json(template);
}
