import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createJournalEntry } from "@/domains/accounting";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");
  const entries = await prisma.journalEntry.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "desc" },
    include: { lines: { include: { account: true } }, createdBy: { select: { name: true } } },
  });

  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const entry = await createJournalEntry(session.user.organizationId, session.user.id, {
      date: new Date(body.date).toISOString(),
      description: body.description,
      status: body.status,
      lines: body.lines.map((l: { accountId: string; debit: number; credit: number }) => ({
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
      })),
    });

    await createAuditLog({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: "CREATE",
      entity: "JournalEntry",
      entityId: entry.id,
      newValue: { description: entry.description, number: entry.number },
    });

    return NextResponse.json(entry);
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: (e as unknown as { issues: unknown }).issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
