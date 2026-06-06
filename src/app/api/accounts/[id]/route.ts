import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.account.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const account = await prisma.account.update({
    where: { id },
    data: {
      code: body.code ?? existing.code,
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      nature: body.nature ?? existing.nature,
      parentId: body.parentId === "" ? null : (body.parentId ?? existing.parentId),
      currencyId: body.currencyId === "" ? null : (body.currencyId ?? existing.currencyId),
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Account",
    entityId: id,
    oldValue: { code: existing.code, name: existing.name },
    newValue: { code: account.code, name: account.name },
  });

  return NextResponse.json({ ...account, balance: Number(account.balance) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.account.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const journalLinesCount = await prisma.journalEntryLine.count({ where: { accountId: id } });
  if (journalLinesCount > 0) {
    return NextResponse.json({ error: "Cannot delete account with journal entries. Only editing is allowed." }, { status: 400 });
  }

  await prisma.account.delete({ where: { id } });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "Account",
    entityId: id,
    oldValue: { code: existing.code, name: existing.name },
  });

  return NextResponse.json({ success: true });
}
