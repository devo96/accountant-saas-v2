import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.task.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const task = await prisma.task.update({ where: { id }, data: { projectId: body.projectId ?? existing.projectId, title: body.title ?? existing.title, description: body.description ?? existing.description, assigneeId: body.assigneeId ?? existing.assigneeId, dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate, priority: body.priority ?? existing.priority, status: body.status ?? existing.status, estimatedHours: body.estimatedHours !== undefined ? Number(body.estimatedHours) : existing.estimatedHours, actualHours: body.actualHours !== undefined ? Number(body.actualHours) : existing.actualHours } });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.task.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
