import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const fromDate = url.searchParams.get("fromDate");
  const toDate = url.searchParams.get("toDate");

  const account = await prisma.account.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: id,
      journalEntry: {
        organizationId: session.user.organizationId,
        date: {
          gte: new Date(fromDate || "2000-01-01"),
          lte: new Date(toDate || "2100-01-01"),
        },
      },
    },
    include: { journalEntry: { select: { date: true, description: true, reference: true } } },
    orderBy: { journalEntry: { date: "asc" } },
  });

  const result = lines.map((l) => ({
    id: l.id,
    date: l.journalEntry.date.toISOString(),
    description: l.journalEntry.description,
    reference: l.journalEntry.reference,
    debit: Number(l.debit),
    credit: Number(l.credit),
  }));

  const priorLines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: id,
      journalEntry: {
        organizationId: session.user.organizationId,
        date: { lt: new Date(fromDate || "2000-01-01") },
      },
    },
  });

  const openingBalance = Number(account.balance) + priorLines.reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0);

  return NextResponse.json({ lines: result, openingBalance });
}
