import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const terms = await prisma.paymentTerm.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } });
  return NextResponse.json(terms);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const term = await prisma.paymentTerm.create({
    data: { name: body.name, nameAr: body.nameAr || null, dueDays: body.dueDays ?? 30, discountDays: body.discountDays ?? 0, discountPercent: body.discountPercent ?? 0, active: body.active ?? true, organizationId: session.user.organizationId },
  });
  return NextResponse.json(term);
}
