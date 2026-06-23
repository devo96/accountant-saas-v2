import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { TaskSchema } from "@/validations";
import { validate } from "@/lib/validate";

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
  const parsed = validate(TaskSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const task = await prisma.task.create({
    data: { projectId: d.projectId || null, title: d.title, description: d.description || null, assigneeId: d.assigneeId || null, dueDate: d.dueDate ? new Date(d.dueDate) : null, priority: d.priority || "MEDIUM", status: d.status || "TODO", estimatedHours: d.estimatedHours ?? 0, actualHours: d.actualHours ?? 0, organizationId: session.user.organizationId },
  });
  return NextResponse.json(task);
}
