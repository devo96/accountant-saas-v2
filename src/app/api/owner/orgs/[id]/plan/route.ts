import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const json = await req.json();

  const plan = await prisma.plan.findUnique({ where: { id: json.planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const now = new Date();
  let data: any = { planId: json.planId, status: json.status ?? "ACTIVE" };

  if (plan.tier === "FREE" && (!json.status || json.status === "TRIALING")) {
    data.status = "TRIALING";
    data.trialEndsAt = new Date(now.getTime() + 30 * 86400000);
    data.endsAt = null;
  }

  const existing = await prisma.organizationPlan.findUnique({ where: { organizationId: id } });
  if (existing) {
    await prisma.organizationPlan.update({ where: { organizationId: id }, data });
  } else {
    await prisma.organizationPlan.create({ data: { organizationId: id, ...data } });
  }

  return NextResponse.json({ success: true });
}
