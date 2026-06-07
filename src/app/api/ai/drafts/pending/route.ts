import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.aiActionDraft.findMany({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ drafts: drafts.map((d) => ({
    id: d.id,
    actionType: d.actionType,
    summary: d.summary,
    payload: d.payload,
    createdAt: d.createdAt.toISOString(),
    expiresAt: d.expiresAt?.toISOString(),
  }))});
}
