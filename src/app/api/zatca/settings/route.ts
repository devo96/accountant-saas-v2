import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const SETTING_KEYS = ["zatca_environment", "zatca_csid_id", "zatca_csid_secret", "zatca_certificate", "zatca_private_key", "zatca_public_key"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.organizationSetting.findMany({
    where: { organizationId: session.user.organizationId, key: { in: SETTING_KEYS } },
  });

  const result: Record<string, string> = {};
  for (const s of settings) result[s.key] = s.value;
  for (const k of SETTING_KEYS) if (!result[k]) result[k] = "";

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  for (const key of SETTING_KEYS) {
    if (body[key] !== undefined) {
      await prisma.organizationSetting.upsert({
        where: { organizationId_key: { organizationId: session.user.organizationId, key } },
        update: { value: body[key] },
        create: { organizationId: session.user.organizationId, key, value: body[key] },
      });
    }
  }

  return NextResponse.json({ success: true });
}
