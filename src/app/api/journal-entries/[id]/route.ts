import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { syncJournalEntryBalances } from "@/domains/accounting/gl";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      lines: { include: { account: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...item, date: item.date.toISOString() });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      ...(body.reference !== undefined && { reference: body.reference }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  if (body.status !== undefined) {
    const wasPosted = existing.status === "POSTED";
    const nowPosted = updated.status === "POSTED";
    if (nowPosted && !wasPosted) {
      await syncJournalEntryBalances(updated.id);
    } else if (wasPosted && !nowPosted) {
      await syncJournalEntryBalances(updated.id, true);
    }
  }

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "JournalEntry",
    entityId: updated.id,
    oldValue: { description: existing.description, status: existing.status },
    newValue: { description: updated.description, status: updated.status },
  });

  return NextResponse.json({ ...updated, date: updated.date.toISOString() });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.journalEntry.update({
    where: { id },
    data: { status: "DRAFT" },
  });

  if (existing.status === "POSTED") {
    await syncJournalEntryBalances(id, true);
  }

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "JournalEntry",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
