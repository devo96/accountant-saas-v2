import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { ItemSchema } from "@/validations";

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

  const parsed = validatePartial(ItemSchema, body);
  if (parsed.error) return parsed.error;
  const data = parsed.data;

  const existing = await prisma.item.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.item.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      type: data.type ?? "PRODUCT",
      unit: data.unit ?? "piece",
      sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : Number(existing.sellingPrice),
      costPrice: data.costPrice !== undefined ? data.costPrice : Number(existing.costPrice),
      minStock: data.minStock !== undefined ? data.minStock : Number(existing.minStock),
      description: data.description ?? null,
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
