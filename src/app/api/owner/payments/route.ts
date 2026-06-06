import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const DEFAULT_CURRENCY = "SAR";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const payments = await prisma.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true } }, plan: { select: { name: true } } },
  });
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const json = await req.json();
  const payment = await prisma.paymentTransaction.create({
    data: {
      organizationId: json.organizationId,
      planId: json.planId,
      amount: json.amount ?? 0,
      currency: json.currency ?? DEFAULT_CURRENCY,
      type: json.type ?? "MANUAL_ACTIVATION",
      status: json.status ?? "SUCCESS",
      paymentMethod: json.paymentMethod ?? null,
      receiptUrl: json.receiptUrl ?? null,
      reason: json.reason ?? null,
      subscriptionStart: json.subscriptionStart ?? null,
      subscriptionEnd: json.subscriptionEnd ?? null,
      notes: json.notes ?? null,
    },
  });
  return NextResponse.json(payment);
}
