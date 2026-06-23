import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { ExpenseSchema } from "@/validations";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.expense.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { lines: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...item, amount: Number(item.amount), taxAmount: Number(item.taxAmount) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const parsed = validatePartial(ExpenseSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(d.date !== undefined && { date: new Date(d.date) }),
      ...(d.category !== undefined && { category: d.category }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.amount !== undefined && { amount: d.amount }),
      ...(d.taxAmount !== undefined && { taxAmount: d.taxAmount }),
      ...(d.vendorId !== undefined && { vendorId: d.vendorId || null }),
      ...(d.paymentMethod !== undefined && { paymentMethod: d.paymentMethod }),
      ...(d.notes !== undefined && { notes: d.notes }),
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Expense",
    entityId: updated.id,
    oldValue: { description: existing.description, amount: Number(existing.amount) },
    newValue: { description: updated.description, amount: Number(updated.amount) },
  });

  return NextResponse.json({ ...updated, amount: Number(updated.amount), taxAmount: Number(updated.taxAmount) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.update({
    where: { id },
    data: {},
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "Expense",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
