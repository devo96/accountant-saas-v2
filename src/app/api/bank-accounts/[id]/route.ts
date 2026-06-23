import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { BankAccountSchema } from "@/validations";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.bankAccount.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const parsed = validatePartial(BankAccountSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.bankAccount.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.bankAccount.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.accountNumber !== undefined && { accountNumber: d.accountNumber }),
      ...(d.iban !== undefined && { iban: d.iban }),
      ...(d.bankName !== undefined && { bankName: d.bankName }),
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "BankAccount",
    entityId: updated.id,
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await prisma.bankAccount.update({
    where: { id },
    data: { active: false },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "BankAccount",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
