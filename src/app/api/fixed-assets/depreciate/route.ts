import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = session.user.organizationId;

  const body = await req.json();
  const assetId = body.assetId;

  const asset = await prisma.fixedAsset.findFirst({
    where: { id: assetId, organizationId: orgId },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.status !== "ACTIVE") return NextResponse.json({ error: "Asset is not active" }, { status: 400 });

  const cost = Number(asset.purchaseCost);
  const salvage = Number(asset.salvageValue);
  const years = asset.usefulLifeYears;
  const currentAccumulated = Number(asset.accumulatedDepreciation);

  const annualDepreciation = (cost - salvage) / years;
  const monthlyDepreciation = annualDepreciation / 12;

  const newAccumulated = currentAccumulated + monthlyDepreciation;
  const newBookValue = Math.max(cost - newAccumulated, 0);
  const newStatus = newBookValue <= 0 ? "FULLY_DEPRECIATED" : "ACTIVE";

  const updated = await prisma.fixedAsset.update({
    where: { id: assetId },
    data: {
      accumulatedDepreciation: newAccumulated,
      bookValue: newBookValue,
      status: newStatus,
    },
  });

  return NextResponse.json({
    ...updated,
    purchaseCost: Number(updated.purchaseCost),
    salvageValue: Number(updated.salvageValue),
    bookValue: Number(updated.bookValue),
    accumulatedDepreciation: Number(updated.accumulatedDepreciation),
    depreciationAmount: monthlyDepreciation,
  });
}
