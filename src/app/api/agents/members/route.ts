import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentAuthorized } from "@/lib/agents/store";

export const dynamic = "force-dynamic";

// Update a member's live status (agents only).
// Body: { key, status?, currentTask? }
export async function PATCH(req: Request) {
  if (!agentAuthorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body.key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.status != null) data.status = body.status;
  if (body.currentTask !== undefined) data.currentTask = body.currentTask;

  const member = await prisma.agentMember.update({
    where: { key: String(body.key) },
    data,
  });
  return NextResponse.json(member);
}
