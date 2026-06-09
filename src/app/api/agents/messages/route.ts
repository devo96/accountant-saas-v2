import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agentAuthorized, ensureSeeded } from "@/lib/agents/store";

export const dynamic = "force-dynamic";

// List recent messages for the active run.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const run = await ensureSeeded();
  const messages = await prisma.agentMessage.findMany({
    where: { runId: run.id },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
  return NextResponse.json(messages);
}

// Post a message.
//  - A logged-in user  -> author = "USER" (answers any open @mentions).
//  - An agent (x-agent-secret) -> author = body.author (e.g. "backend").
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = await getServerSession(authOptions);
  const isAgent = agentAuthorized(req);

  if (!session?.user && !isAgent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await ensureSeeded();
  const author = isAgent ? String(body.author || "agent") : "USER";

  const message = await prisma.agentMessage.create({
    data: {
      runId: run.id,
      taskId: body.taskId || null,
      author,
      role: body.role || null,
      type: body.type || "CHAT",
      content: String(body.content || "").slice(0, 8000),
      mentionsUser: isAgent ? Boolean(body.mentionsUser) : false,
    },
  });

  // When the user replies, close any open questions and clear WAITING_USER status.
  if (!isAgent) {
    await prisma.agentMessage.updateMany({
      where: { runId: run.id, mentionsUser: true, answered: false },
      data: { answered: true },
    });
    await prisma.agentMember.updateMany({
      where: { status: "WAITING_USER" },
      data: { status: "WORKING" },
    });
  }

  return NextResponse.json(message);
}
