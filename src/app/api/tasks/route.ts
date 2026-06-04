import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: "desc" }, include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } } });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const task = await prisma.task.create({
    data: { projectId: body.projectId || null, title: body.title, description: body.description || null, assigneeId: body.assigneeId || null, dueDate: body.dueDate ? new Date(body.dueDate) : null, priority: body.priority || "MEDIUM", status: body.status || "TODO", estimatedHours: Number(body.estimatedHours) ?? 0, actualHours: Number(body.actualHours) ?? 0, organizationId: session.user.organizationId },
  });
  return NextResponse.json(task);
}
