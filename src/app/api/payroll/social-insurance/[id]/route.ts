import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.socialInsuranceRecord.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const employeeShare = body.employeeShare !== undefined ? Number(body.employeeShare) : Number(existing.employeeShare);
  const employerShare = body.employerShare !== undefined ? Number(body.employerShare) : Number(existing.employerShare);
  const record = await prisma.socialInsuranceRecord.update({ where: { id }, data: { employeeShare, employerShare, totalContribution: employeeShare + employerShare, salary: body.salary !== undefined ? Number(body.salary) : existing.salary, status: body.status ?? existing.status, paidAt: body.status === "PAID" ? new Date() : body.status !== "PAID" ? null : existing.paidAt } });
  return NextResponse.json(record);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.socialInsuranceRecord.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.socialInsuranceRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
