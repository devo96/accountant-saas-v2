import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const branches = await prisma.branch.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } });
  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const branch = await prisma.branch.create({
    data: { name: body.name, code: body.code || "", address: body.address || null, phone: body.phone || null, active: body.active ?? true, organizationId: session.user.organizationId },
  });
  return NextResponse.json(branch);
}
