import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await prisma.category.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const category = await prisma.category.create({
    data: { name: body.name, type: body.type || "PRODUCT", description: body.description || null, parentId: body.parentId || null, active: body.active ?? true, organizationId: session.user.organizationId },
  });
  return NextResponse.json(category);
}
