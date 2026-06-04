import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const records = await prisma.socialInsuranceRecord.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: "desc" }, include: { employee: { select: { id: true, name: true } } } });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const totalContribution = Number(body.employeeShare) + Number(body.employerShare);
  const record = await prisma.socialInsuranceRecord.create({
    data: { employeeId: body.employeeId, period: body.period, employeeShare: Number(body.employeeShare), employerShare: Number(body.employerShare), totalContribution, salary: Number(body.salary), status: body.status || "PENDING", organizationId: session.user.organizationId },
  });
  return NextResponse.json(record);
}
