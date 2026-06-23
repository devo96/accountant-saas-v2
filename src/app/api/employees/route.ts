import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { EmployeeSchema } from "@/validations";
import { validate } from "@/lib/validate";

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
  const parsed = validate(EmployeeSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const employee = await prisma.employee.create({
    data: {
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      position: d.position || null,
      userId: d.userId || null,
      basicSalary: d.basicSalary ?? 0,
      allowances: d.allowances ?? 0,
      gosiContribution: d.gosiContribution ?? 0,
      iqamaNumber: d.iqamaNumber || null,
      bankAccountNumber: d.bankAccountNumber || null,
      active: d.active ?? true,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json({ ...employee, basicSalary: Number(employee.basicSalary), allowances: Number(employee.allowances), gosiContribution: Number(employee.gosiContribution) });
}
