import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

function formatAsset(a: any) {
  return { ...a, purchaseCost: Number(a.purchaseCost), salvageValue: Number(a.salvageValue), bookValue: Number(a.bookValue), accumulatedDepreciation: Number(a.accumulatedDepreciation) };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("accounting.read");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const asset = await prisma.fixedAsset.findFirst({
    where: { id, organizationId: auth.session!.user.organizationId },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(formatAsset(asset));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("accounting.edit");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const orgId = auth.session!.user.organizationId;

  const existing = await prisma.fixedAsset.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.nameAr !== undefined) data.nameAr = body.nameAr;
  if (body.category !== undefined) data.category = body.category;
  if (body.purchaseDate !== undefined) data.purchaseDate = new Date(body.purchaseDate);
  if (body.purchaseCost !== undefined) {
    data.purchaseCost = Number(body.purchaseCost);
    data.bookValue = Number(body.purchaseCost) - Number(body.salvageValue ?? existing.salvageValue);
  }
  if (body.usefulLifeYears !== undefined) data.usefulLifeYears = body.usefulLifeYears;
  if (body.salvageValue !== undefined) {
    data.salvageValue = Number(body.salvageValue);
    data.bookValue = Number(body.purchaseCost ?? existing.purchaseCost) - Number(body.salvageValue);
  }
  if (body.depreciationMethod !== undefined) data.depreciationMethod = body.depreciationMethod;
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await prisma.fixedAsset.update({ where: { id }, data });
  return NextResponse.json(formatAsset(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("accounting.delete");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const existing = await prisma.fixedAsset.findFirst({
    where: { id, organizationId: auth.session!.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.fixedAsset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
