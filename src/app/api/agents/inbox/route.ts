import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentAuthorized, ensureSeeded } from "@/lib/agents/store";

export const dynamic = "force-dynamic";

// Agent polling endpoint: returns the user's messages (instructions / answers)
// since a given time, plus whether the team is currently blocked on the user.
// Query: ?since=<ISO timestamp>
export async function GET(req: Request) {
  if (!agentAuthorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const run = await ensureSeeded();

  const userMessages = await prisma.agentMessage.findMany({
    where: {
      runId: run.id,
      author: "USER",
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const openQuestions = await prisma.agentMessage.findMany({
    where: { runId: run.id, mentionsUser: true, answered: false },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    runId: run.id,
    userMessages,
    openQuestions,
    waitingOnUser: openQuestions.length > 0,
    now: new Date().toISOString(),
  });
}
