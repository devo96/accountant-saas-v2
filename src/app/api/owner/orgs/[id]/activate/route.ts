import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { OrgPlanStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const json = await req.json();
  // json: { planId, days, reason (BANK_TRANSFER|CASH|COMPENSATION), receiptUrl?, notes? }

  const days = Math.max(1, json.days ?? 30);
  const now = new Date();
  const end = new Date(now.getTime() + days * 86400000);

  let status: OrgPlanStatus = "ACTIVE";
  let trialEndsAt: Date | null = null;
  if (json.reason === "COMPENSATION") {
    trialEndsAt = end;
  } else {
    trialEndsAt = null;
  }

  const existing = await prisma.organizationPlan.findUnique({ where: { organizationId: id } });
  if (existing) {
    // Extend from current end date if exists
    const currentEnd = existing.endsAt && existing.endsAt > now ? existing.endsAt : now;
    const newEnd = new Date(currentEnd.getTime() + days * 86400000);
    await prisma.organizationPlan.update({
      where: { organizationId: id },
      data: { planId: json.planId, status, endsAt: newEnd, trialEndsAt },
    });
  } else {
    await prisma.organizationPlan.create({
      data: { organizationId: id, planId: json.planId, status, endsAt: end, trialEndsAt },
    });
  }

  // Log payment transaction
  const plan = await prisma.plan.findUnique({ where: { id: json.planId } });
  await prisma.paymentTransaction.create({
    data: {
      organizationId: id,
      planId: json.planId,
      amount: json.reason === "COMPENSATION" ? 0 : (plan?.monthlyPrice ?? 0),
      type: json.reason === "COMPENSATION" ? "COMPENSATION" : "MANUAL_ACTIVATION",
      status: "SUCCESS",
      paymentMethod: json.reason === "COMPENSATION" ? null : json.reason,
      receiptUrl: json.receiptUrl ?? null,
      reason: json.reason,
      subscriptionStart: now,
      subscriptionEnd: end,
      notes: json.notes ?? null,
    },
  });

  return NextResponse.json({ success: true, endsAt: end });
}
