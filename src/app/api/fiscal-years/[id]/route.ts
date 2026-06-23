import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const year = await prisma.fiscalYear.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isClosed = body.isClosed !== undefined ? body.isClosed : year.isClosed;

  const updated = await prisma.fiscalYear.update({
    where: { id },
    data: { isClosed },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: isClosed ? "CLOSE_FISCAL_YEAR" : "OPEN_FISCAL_YEAR",
    entity: "FiscalYear",
    entityId: id,
    oldValue: { isClosed: year.isClosed },
    newValue: { isClosed },
  });

  return NextResponse.json(updated);
}
