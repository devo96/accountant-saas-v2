import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validate } from "@/lib/validate";
import { RecurringInvoiceSchema } from "@/validations";

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

  const parsed = validate(RecurringInvoiceSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const template = await prisma.recurringInvoiceTemplate.create({
    data: {
      organizationId: session.user.organizationId,
      name: d.name,
      customerId: d.customerId,
      frequency: d.frequency ?? "MONTHLY",
      interval: d.interval ?? 1,
      nextRunDate: new Date(d.nextRunDate),
      endDate: d.endDate ? new Date(d.endDate) : null,
      invoiceDay: d.invoiceDay ?? null,
      dueDateDays: d.dueDateDays ?? 30,
      lines: d.lines ?? [],
      subtotal: d.subtotal ?? 0,
      discountAmount: d.discountAmount ?? 0,
      taxAmount: d.taxAmount ?? 0,
      total: d.total ?? 0,
      notes: d.notes ?? null,
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
