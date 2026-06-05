import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dimensionId = searchParams.get("dimensionId");

  const where: Record<string, string> = { dimensionId: dimensionId ?? "" };
  const allocations = await prisma.dimensionAllocation.findMany({
    where: { ...where, account: { organizationId: session.user.organizationId } },
    include: { account: { select: { id: true, code: true, name: true } } },
  });

  return NextResponse.json(allocations.map((a) => ({ ...a, percentage: Number(a.percentage) })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allocation = await prisma.dimensionAllocation.create({
    data: {
      accountId: body.accountId,
      dimensionId: body.dimensionId,
      percentage: Number(body.percentage),
    },
    include: { account: { select: { id: true, code: true, name: true } } },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "DimensionAllocation",
    entityId: allocation.id,
    newValue: { accountId: body.accountId, dimensionId: body.dimensionId, percentage: body.percentage },
  });

  return NextResponse.json({ ...allocation, percentage: Number(allocation.percentage) });
}
