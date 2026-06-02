import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

export async function GET() {
  const auth = await requirePermission("settings.email-templates.read");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const templates = await prisma.emailTemplate.findMany({
    where: { organizationId: auth.session!.user.organizationId },
    orderBy: { key: "asc" },
  });

  return NextResponse.json(templates);
}

export async function PUT(req: Request) {
  const auth = await requirePermission("settings.email-templates.edit");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const orgId = auth.session!.user.organizationId;

  const body = await req.json();
  const { key, subject, body: htmlBody } = body;

  if (!key || !subject || !htmlBody) {
    return NextResponse.json({ error: "key, subject, and body are required" }, { status: 400 });
  }

  const template = await prisma.emailTemplate.upsert({
    where: { organizationId_key: { organizationId: orgId, key } },
    create: { organizationId: orgId, key, subject, body: htmlBody },
    update: { subject, body: htmlBody },
  });

  return NextResponse.json(template);
}
