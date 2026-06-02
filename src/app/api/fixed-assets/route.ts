import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("accounting.read");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const assets = await prisma.fixedAsset.findMany({
    where: { organizationId: auth.session!.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assets.map((a) => ({ ...a, purchaseCost: Number(a.purchaseCost), salvageValue: Number(a.salvageValue), bookValue: Number(a.bookValue), accumulatedDepreciation: Number(a.accumulatedDepreciation) })));
}

export async function POST(req: Request) {
  const auth = await requirePermission("accounting.create");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const orgId = auth.session!.user.organizationId;

  const body = await req.json();
  if (!body.code || !body.name || !body.category || !body.purchaseDate || !body.purchaseCost || !body.usefulLifeYears) {
    return NextResponse.json({ error: "code, name, category, purchaseDate, purchaseCost, and usefulLifeYears are required" }, { status: 400 });
  }

  const cost = Number(body.purchaseCost);
  const salvage = Number(body.salvageValue ?? 0);
  const bookValue = cost - salvage;

  const asset = await prisma.fixedAsset.create({
    data: {
      organizationId: orgId,
      code: body.code,
      name: body.name,
      nameAr: body.nameAr || null,
      category: body.category,
      purchaseDate: new Date(body.purchaseDate),
      purchaseCost: cost,
      usefulLifeYears: body.usefulLifeYears,
      salvageValue: salvage,
      depreciationMethod: body.depreciationMethod ?? "STRAIGHT_LINE",
      bookValue,
      accumulatedDepreciation: 0,
      status: "ACTIVE",
      notes: body.notes || null,
    },
  });

  return NextResponse.json({ ...asset, purchaseCost: Number(asset.purchaseCost), salvageValue: Number(asset.salvageValue), bookValue: Number(asset.bookValue), accumulatedDepreciation: Number(asset.accumulatedDepreciation) });
}
