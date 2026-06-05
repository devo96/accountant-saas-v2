import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.isDefault) {
    await prisma.taxCode.updateMany({
      where: { organizationId: session.user.organizationId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const taxCode = await prisma.taxCode.create({
    data: {
      name: body.name,
      rate: Number(body.rate),
      isDefault: body.isDefault ?? false,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(taxCode);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taxCodes = await prisma.taxCode.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(taxCodes);
}
