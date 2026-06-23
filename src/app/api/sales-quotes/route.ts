import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validate } from "@/lib/validate";
import { SalesQuoteSchema } from "@/validations";

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

  const parsed = validate(SalesQuoteSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

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
      quoteDate: new Date(d.quoteDate),
      expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
      status: "DRAFT",
      customerId: d.customerId,
      paymentTermId: d.paymentTermId || null,
      branchId: d.branchId || null,
      projectId: d.projectId || null,
      subtotal: d.subtotal,
      discountAmount: d.discountAmount ?? 0,
      taxAmount: d.taxAmount,
      total: d.total,
      notes: d.notes || null,
      organizationId: orgId,
      createdById: userId,
      lines: {
        create: d.lines.map((l) => ({
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
