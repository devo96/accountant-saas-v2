import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { FiscalYearSchema } from "@/validations";
import { validate } from "@/lib/validate";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const years = await prisma.fiscalYear.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(years);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = validate(FiscalYearSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const existing = await prisma.fiscalYear.findFirst({
    where: { organizationId: session.user.organizationId, name: d.name },
  });
  if (existing) {
    return NextResponse.json({ error: "Fiscal year with this name already exists" }, { status: 409 });
  }

  const year = await prisma.fiscalYear.create({
    data: {
      name: d.name,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      isClosed: d.isClosed ?? false,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(year);
}
