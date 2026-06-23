import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { postExpense } from "@/domains/accounting/posting";
import { logger } from "@/lib/logger";
import { ExpenseSchema } from "@/validations";
import { validate } from "@/lib/validate";

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
  const parsed = validate(ExpenseSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const last = await prisma.expense.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const expense = await prisma.expense.create({
    data: {
      number: (last?.number ?? 0) + 1,
      date: new Date(d.date),
      description: d.description,
      amount: d.amount,
      taxAmount: d.taxAmount ?? 0,
      vendorId: d.vendorId || null,
      category: d.category || null,
      receipt: d.receipt || null,
      paymentMethod: d.paymentMethod ?? "CASH",
      notes: d.notes || null,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
      lines: { create: { accountId: d.accountId, amount: d.amount } },
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
