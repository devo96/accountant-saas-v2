import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const json = await req.json();
  const coupon = await prisma.coupon.create({
    data: {
      code: json.code.toUpperCase(),
      discountType: json.discountType,
      discountValue: json.discountValue ?? 0,
      maxUses: json.maxUses ?? 0,
      minAmount: json.minAmount ?? 0,
      planId: json.planId ?? null,
      expiresAt: json.expiresAt ? new Date(json.expiresAt) : null,
      active: json.active ?? true,
    },
  });
  return NextResponse.json(coupon);
}
