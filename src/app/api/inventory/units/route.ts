import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const units = await prisma.unitOfMeasure.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } });
  return NextResponse.json(units);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const unit = await prisma.unitOfMeasure.create({
    data: { name: body.name, symbol: body.symbol || "", precision: body.precision ?? 0, active: body.active ?? true, organizationId: session.user.organizationId },
  });
  return NextResponse.json(unit);
}
