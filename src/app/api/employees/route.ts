import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employees = await prisma.employee.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees.map((e) => ({
    ...e,
    basicSalary: Number(e.basicSalary),
    allowances: Number(e.allowances),
    gosiContribution: Number(e.gosiContribution),
  })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const employee = await prisma.employee.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      position: body.position || null,
      userId: body.userId || null,
      basicSalary: Number(body.basicSalary) || 0,
      allowances: Number(body.allowances) || 0,
      gosiContribution: Number(body.gosiContribution) || 0,
      iqamaNumber: body.iqamaNumber || null,
      bankAccountNumber: body.bankAccountNumber || null,
      active: body.active ?? true,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json({ ...employee, basicSalary: Number(employee.basicSalary), allowances: Number(employee.allowances), gosiContribution: Number(employee.gosiContribution) });
}
