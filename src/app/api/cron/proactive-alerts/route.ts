import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { runProactiveAnalysis } from "@/lib/ai/proactive-alerts";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET() {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const hdrs = await headers();
    if (hdrs.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const orgs = await prisma.organization.findMany({
    select: { id: true },
  });

  let totalAlerts = 0;
  for (const org of orgs) {
    const count = await runProactiveAnalysis(org.id);
    totalAlerts += count;
  }

  return NextResponse.json({ organizations: orgs.length, totalAlertsGenerated: totalAlerts });
}
