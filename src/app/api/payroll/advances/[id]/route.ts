import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.advance.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const advance = await prisma.advance.update({ where: { id }, data: { amount: body.amount !== undefined ? Number(body.amount) : existing.amount, date: body.date ? new Date(body.date) : existing.date, description: body.description ?? existing.description, status: body.status ?? existing.status, repaidAmount: body.repaidAmount !== undefined ? Number(body.repaidAmount) : existing.repaidAmount, installments: body.installments ?? existing.installments } });
  return NextResponse.json(advance);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.advance.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.advance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
