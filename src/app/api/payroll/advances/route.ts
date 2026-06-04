import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const advances = await prisma.advance.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: "desc" }, include: { employee: { select: { id: true, name: true } } } });
  return NextResponse.json(advances);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const advance = await prisma.advance.create({
    data: { employeeId: body.employeeId, amount: Number(body.amount), date: new Date(body.date), description: body.description || null, status: body.status || "PENDING", repaidAmount: body.repaidAmount ?? 0, installments: body.installments ?? 1, organizationId: session.user.organizationId },
  });
  return NextResponse.json(advance);
}
