import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ProjectSchema } from "@/validations";
import { validate } from "@/lib/validate";

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
  const parsed = validate(ProjectSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const project = await prisma.project.create({
    data: { name: d.name, description: d.description || null, startDate: d.startDate ? new Date(d.startDate) : null, endDate: d.endDate ? new Date(d.endDate) : null, status: d.status || "PLANNING", budget: d.budget ?? 0, customerId: d.customerId || null, managerId: d.managerId || null, progress: d.progress ?? 0, organizationId: session.user.organizationId },
  });
  return NextResponse.json(project);
}
