import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.project.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const project = await prisma.project.update({ where: { id }, data: { name: body.name ?? existing.name, description: body.description ?? existing.description, startDate: body.startDate ? new Date(body.startDate) : existing.startDate, endDate: body.endDate ? new Date(body.endDate) : existing.endDate, status: body.status ?? existing.status, budget: body.budget !== undefined ? Number(body.budget) : existing.budget, customerId: body.customerId ?? existing.customerId, managerId: body.managerId ?? existing.managerId, progress: body.progress ?? existing.progress } });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.project.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
