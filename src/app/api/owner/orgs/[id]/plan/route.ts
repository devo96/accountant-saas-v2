import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const json = await req.json();

  const existing = await prisma.organizationPlan.findUnique({ where: { organizationId: id } });
  if (existing) {
    await prisma.organizationPlan.update({
      where: { organizationId: id },
      data: { planId: json.planId, status: json.status ?? existing.status },
    });
  } else {
    await prisma.organizationPlan.create({
      data: { organizationId: id, planId: json.planId, status: json.status ?? "ACTIVE" },
    });
  }

  return NextResponse.json({ success: true });
}
