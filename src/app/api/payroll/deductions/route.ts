import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deductions = await prisma.deduction.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: "desc" }, include: { employee: { select: { id: true, name: true } } } });
  return NextResponse.json(deductions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const deduction = await prisma.deduction.create({
    data: { employeeId: body.employeeId, amount: Number(body.amount), date: new Date(body.date), type: body.type || "OTHER", description: body.description || null, recurring: body.recurring ?? false, organizationId: session.user.organizationId },
  });
  return NextResponse.json(deduction);
}
