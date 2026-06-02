import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adjustments = await prisma.inventoryAdjustment.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      item: true,
      warehouse: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(adjustments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { itemId, warehouseId, quantityBefore, quantityAfter, reason, reference } = body;

  const adjustment = await prisma.inventoryAdjustment.create({
    data: {
      itemId,
      warehouseId,
      quantityBefore: parseInt(quantityBefore),
      quantityAfter: parseInt(quantityAfter),
      reason,
      reference,
      organizationId: session.user.organizationId,
      createdById: session.user.id!,
    },
    include: {
      item: true,
      warehouse: true,
    },
  });

  return NextResponse.json(adjustment);
}
