import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const returns = await prisma.salesReturn.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  return NextResponse.json(returns);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const orgId = session.user.organizationId;
  const userId = session.user.id;

  const last = await prisma.salesReturn.findFirst({
    where: { organizationId: orgId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const salesReturn = await prisma.salesReturn.create({
    data: {
      number: (last?.number ?? 0) + 1,
      returnDate: new Date(body.returnDate),
      originalInvoiceId: body.originalInvoiceId || null,
      status: "DRAFT",
      customerId: body.customerId,
      subtotal: body.subtotal,
      taxAmount: body.taxAmount,
      total: body.total,
      notes: body.notes || null,
      organizationId: orgId,
      createdById: userId,
    },
    include: { customer: true },
  });

  return NextResponse.json(salesReturn);
}
