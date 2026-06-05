import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const item = await prisma.item.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...item, costPrice: Number(item.costPrice), sellingPrice: Number(item.sellingPrice) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.item.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await prisma.item.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku ?? null,
      barcode: body.barcode ?? null,
      type: body.type ?? "PRODUCT",
      unit: body.unit ?? "piece",
      sellingPrice: Number(body.sellingPrice) || 0,
      costPrice: Number(body.costPrice) || 0,
      minStock: body.minStock ? Number(body.minStock) : 0,
      description: body.description ?? null,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Item",
    entityId: item.id,
    oldValue: { name: existing.name, sku: existing.sku },
    newValue: { name: item.name, sku: item.sku },
  });

  return NextResponse.json({ ...item, costPrice: Number(item.costPrice), sellingPrice: Number(item.sellingPrice) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await prisma.item.update({
    where: { id },
    data: { active: false },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "Item",
    entityId: id,
    oldValue: { name: "" },
  });

  return NextResponse.json({ success: true });
}
