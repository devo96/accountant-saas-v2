import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reconciliations = await prisma.bankReconciliation.findMany({
    where: { organizationId: session.user.organizationId },
    include: { bankAccount: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reconciliations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const reconciliation = await prisma.bankReconciliation.create({
    data: {
      bankAccountId: body.bankAccountId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      openingBalance: Number(body.openingBalance),
      closingBalance: Number(body.closingBalance),
      difference: Number(body.difference ?? 0),
      status: "DRAFT",
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
    include: { bankAccount: true },
  });

  return NextResponse.json(reconciliation);
}
