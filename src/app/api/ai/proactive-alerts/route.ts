import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.aiProactiveAlert.findMany({
    where: { organizationId: session.user.organizationId, dismissed: false },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      category: a.category,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runProactiveAnalysis } = await import("@/lib/ai/proactive-alerts");
  const count = await runProactiveAnalysis(session.user.organizationId);

  return NextResponse.json({ count });
}
