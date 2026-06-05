import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const movements = await prisma.stockMovement.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { name: true, sku: true } },
      warehouse: { select: { name: true } },
    },
  });

  return NextResponse.json(movements.map((m) => ({
    ...m,
    unitCost: Number(m.unitCost),
    totalCost: Number(m.totalCost),
  })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const movement = await prisma.stockMovement.create({
    data: {
      itemId: body.itemId,
      warehouseId: body.warehouseId,
      type: body.type,
      quantity: Number(body.quantity),
      unitCost: Number(body.unitCost) || 0,
      totalCost: Number(body.totalCost) || 0,
      reference: body.reference || null,
      description: body.description || null,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
    include: {
      item: { select: { name: true, sku: true } },
      warehouse: { select: { name: true } },
    },
  });

  return NextResponse.json({
    ...movement,
    unitCost: Number(movement.unitCost),
    totalCost: Number(movement.totalCost),
  });
}
