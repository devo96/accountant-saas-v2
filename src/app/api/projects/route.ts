import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: "desc" }, include: { customer: { select: { id: true, name: true } }, manager: { select: { id: true, name: true } } } });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const project = await prisma.project.create({
    data: { name: body.name, nameAr: body.nameAr || null, description: body.description || null, startDate: body.startDate ? new Date(body.startDate) : null, endDate: body.endDate ? new Date(body.endDate) : null, status: body.status || "PLANNING", budget: Number(body.budget) ?? 0, customerId: body.customerId || null, managerId: body.managerId || null, progress: body.progress ?? 0, organizationId: session.user.organizationId },
  });
  return NextResponse.json(project);
}
