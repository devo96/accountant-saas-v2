import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dimensions = await prisma.accountingDimension.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(dimensions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const dimension = await prisma.accountingDimension.create({
    data: {
      name: body.name,
      organizationId: session.user.organizationId,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "AccountingDimension",
    entityId: dimension.id,
    newValue: { name: dimension.name },
  });

  return NextResponse.json(dimension);
}
