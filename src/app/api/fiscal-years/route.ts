import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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

  const existing = await prisma.fiscalYear.findFirst({
    where: { organizationId: session.user.organizationId, name: body.name },
  });
  if (existing) {
    return NextResponse.json({ error: "Fiscal year with this name already exists" }, { status: 409 });
  }

  const year = await prisma.fiscalYear.create({
    data: {
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isClosed: body.isClosed ?? false,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(year);
}
