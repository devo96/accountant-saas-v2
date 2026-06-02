import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.organizationSetting.findMany({
    where: { organizationId: session.user.organizationId },
  });

  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Record<string, string> = await req.json();
  const orgId = session.user.organizationId;

  for (const [key, value] of Object.entries(body)) {
    await prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId: orgId, key } },
      update: { value },
      create: { organizationId: orgId, key, value },
    });
  }

  return NextResponse.json({ success: true });
}
