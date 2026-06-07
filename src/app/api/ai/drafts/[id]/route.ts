import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string; // "approve" or "reject"

  const draft = await prisma.aiActionDraft.findUnique({ where: { id } });
  if (!draft || draft.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (draft.status !== "PENDING") {
    return NextResponse.json({ error: "Draft already processed" }, { status: 400 });
  }

  if (action === "reject") {
    await prisma.aiActionDraft.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: "AI_DRAFT_REJECTED",
      entity: "AiActionDraft",
      entityId: id,
    });

    logger.info({ draftId: id, userId: session.user.id }, "Draft rejected");
    return NextResponse.json({ success: true, status: "REJECTED" });
  }

  if (action === "approve") {
    if (draft.actionType === "JOURNAL_ENTRY") {
      const payload = draft.payload as any;
      const lastEntry = await prisma.journalEntry.findFirst({
        where: { organizationId: session.user.organizationId },
        orderBy: { number: "desc" },
        select: { number: true },
      });

      const entry = await prisma.journalEntry.create({
        data: {
          number: (lastEntry?.number ?? 0) + 1,
          date: new Date(payload.date),
          description: payload.description || draft.summary,
          descriptionAr: draft.summary,
          organizationId: session.user.organizationId,
          createdById: session.user.id,
          status: "POSTED",
          lines: {
            create: (payload.lines || []).map((l: any) => ({
              accountId: l.accountId,
              description: l.description,
              debit: l.debit || 0,
              credit: l.credit || 0,
            })),
          },
        },
        include: { lines: { include: { account: true } } },
      });

      await prisma.aiActionDraft.update({
        where: { id },
        data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.user.id, resultId: entry.id, resultType: "JournalEntry" },
      });

      await createAuditLog({
        organizationId: session.user.organizationId, userId: session.user.id,
        action: "AI_DRAFT_APPROVED", entity: "AiActionDraft", entityId: id,
        newValue: { entryId: entry.id, number: entry.number },
      });

      logger.info({ draftId: id, entryId: entry.id, userId: session.user.id }, "Draft approved, journal entry created");
      return NextResponse.json({ success: true, status: "APPROVED", resultId: entry.id, resultType: "JournalEntry" });
    }

    return NextResponse.json({ error: `Cannot process draft type: ${draft.actionType}` }, { status: 400 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
