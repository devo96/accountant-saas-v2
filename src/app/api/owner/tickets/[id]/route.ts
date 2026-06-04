import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const json = await req.json();
  const ticket = await prisma.supportTicket.update({ where: { id }, data: json });
  return NextResponse.json(ticket);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  await prisma.supportTicket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
