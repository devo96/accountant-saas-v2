import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotes = await prisma.salesQuote.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, lines: true },
  });

  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const orgId = session.user.organizationId;
  const userId = session.user.id;

  const last = await prisma.salesQuote.findFirst({
    where: { organizationId: orgId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const quote = await prisma.salesQuote.create({
    data: {
      number: (last?.number ?? 0) + 1,
      quoteDate: new Date(body.quoteDate),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      status: "DRAFT",
      customerId: body.customerId,
      paymentTermId: body.paymentTermId || null,
      branchId: body.branchId || null,
      projectId: body.projectId || null,
      subtotal: body.subtotal,
      discountAmount: body.discountAmount ?? 0,
      taxAmount: body.taxAmount,
      total: body.total,
      notes: body.notes || null,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: body.lines.map((l: {
          itemId?: string; description: string; quantity: number;
          unitPrice: number; discountPercent: number;
          taxCodeId?: string; taxRate: number; lineTotal: number;
        }) => ({
          itemId: l.itemId || null,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent ?? 0,
          taxCodeId: l.taxCodeId || null,
          taxRate: l.taxRate ?? 0,
          lineTotal: l.lineTotal,
        })),
      },
    },
    include: { lines: true, customer: true },
  });

  return NextResponse.json(quote);
}
