import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { checkPlanLimit } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const limit = await checkPlanLimit(session.user.organizationId, "items");
  if (limit.limited) return limit.error;

  const item = await prisma.item.create({
    data: {
      name: body.name,
      sku: body.sku || null,
      barcode: body.barcode || null,
      type: body.type ?? "PRODUCT",
      unit: body.unit || "piece",
      sellingPrice: Number(body.sellingPrice) || 0,
      costPrice: Number(body.costPrice) || 0,
      minStock: body.minStock ? Number(body.minStock) : 0,
      description: body.description || null,
      organizationId: session.user.organizationId,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "Item",
    entityId: item.id,
    newValue: { name: item.name, sku: item.sku },
  });

  return NextResponse.json({
    ...item,
    costPrice: Number(item.costPrice),
    sellingPrice: Number(item.sellingPrice),
  });
}
