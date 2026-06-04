import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const json = await req.json();
  const plan = await prisma.plan.create({
    data: {
      name: json.name,
      nameAr: json.nameAr ?? null,
      tier: json.tier ?? "FREE",
      monthlyPrice: json.monthlyPrice ?? 0,
      yearlyPrice: json.yearlyPrice ?? 0,
      maxUsers: json.maxUsers ?? 1,
      maxInvoices: json.maxInvoices ?? 50,
      maxItems: json.maxItems ?? 50,
      features: json.features ?? null,
      active: json.active ?? true,
      sortOrder: json.sortOrder ?? 0,
    },
  });
  return NextResponse.json(plan);
}
