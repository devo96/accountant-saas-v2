import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { calculatePayroll } from "@/domains/payroll/engine";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runs = await prisma.payrollRun.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(runs.map((r) => ({
    ...r,
    totalSalaries: Number(r.totalSalaries),
    totalGosi: Number(r.totalGosi),
    netTotal: Number(r.netTotal),
  })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const existing = await prisma.payrollRun.findFirst({
    where: { organizationId: session.user.organizationId, month: body.month, year: body.year },
  });
  if (existing) {
    return NextResponse.json({ error: "Payroll run already exists for this month" }, { status: 409 });
  }

  let totalSalaries = Number(body.totalSalaries) || 0;
  let totalGosi = Number(body.totalGosi) || 0;
  let netTotal = Number(body.netTotal) || 0;

  if (body.autoCalculate) {
    const calc = await calculatePayroll(session.user.organizationId, Number(body.month), Number(body.year));
    totalSalaries = calc.totalSalaries;
    totalGosi = calc.totalGosi;
    netTotal = calc.netTotal;
  }

  const run = await prisma.payrollRun.create({
    data: {
      month: Number(body.month),
      year: Number(body.year),
      totalSalaries,
      totalGosi,
      netTotal,
      status: body.status ?? "DRAFT",
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ ...run, totalSalaries: Number(run.totalSalaries), totalGosi: Number(run.totalGosi), netTotal: Number(run.netTotal) });
}
