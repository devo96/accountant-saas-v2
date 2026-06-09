import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agentAuthorized, ensureSeeded } from "@/lib/agents/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const run = await ensureSeeded();
  const tasks = await prisma.agentTask.findMany({
    where: { runId: run.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(tasks);
}

// Create a task (agents only).
export async function POST(req: Request) {
  if (!agentAuthorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const run = await ensureSeeded();
  const task = await prisma.agentTask.create({
    data: {
      runId: run.id,
      title: String(body.title || "مهمة"),
      description: body.description || null,
      assignee: body.assignee || null,
      status: body.status || "TODO",
      etaMinutes: body.etaMinutes != null ? Number(body.etaMinutes) : null,
      order: body.order != null ? Number(body.order) : 0,
    },
  });
  return NextResponse.json(task);
}

// Update a task (agents only). Accepts { id, status?, assignee?, etaMinutes?, title?, description?, order? }
export async function PATCH(req: Request) {
  if (!agentAuthorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = String(body.title);
  if (body.description !== undefined) data.description = body.description;
  if (body.assignee !== undefined) data.assignee = body.assignee;
  if (body.etaMinutes !== undefined) data.etaMinutes = body.etaMinutes != null ? Number(body.etaMinutes) : null;
  if (body.order != null) data.order = Number(body.order);
  if (body.status != null) {
    data.status = body.status;
    if (body.status === "IN_PROGRESS") data.startedAt = new Date();
    if (body.status === "DONE") data.completedAt = new Date();
  }

  const task = await prisma.agentTask.update({ where: { id: String(body.id) }, data });
  return NextResponse.json(task);
}
