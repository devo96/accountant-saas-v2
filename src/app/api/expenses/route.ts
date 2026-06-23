import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { postExpense } from "@/domains/accounting/posting";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "desc" },
    include: { lines: { include: { account: true } }, vendor: true },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const last = await prisma.expense.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const expense = await prisma.expense.create({
    data: {
      number: (last?.number ?? 0) + 1,
      date: new Date(body.date),
      description: body.description,
      amount: Number(body.amount),
      taxAmount: body.taxAmount ? Number(body.taxAmount) : 0,
      vendorId: body.vendorId || null,
      category: body.category || null,
      receipt: body.receipt || null,
      paymentMethod: body.paymentMethod ?? "CASH",
      notes: body.notes || null,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
      lines: { create: { accountId: body.accountId, amount: Number(body.amount) } },
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "Expense",
    entityId: expense.id,
    newValue: { number: expense.number, amount: expense.amount },
  });

  let postingError: string | null = null;
  try {
    await postExpense(session.user.organizationId, session.user.id, expense.id);
  } catch (e) {
    postingError = (e as Error).message;
    logger.error({ expenseId: expense.id, err: postingError }, "Expense auto-post failed");
  }

  return NextResponse.json({ ...expense, postingError });
}
