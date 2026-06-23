import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validate } from "@/lib/validate";
import { PurchaseReturnSchema } from "@/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const returns = await prisma.purchaseReturn.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { vendor: true },
  });

  return NextResponse.json(returns);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = validate(PurchaseReturnSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const orgId = session.user.organizationId;
  const userId = session.user.id;

  const last = await prisma.purchaseReturn.findFirst({
    where: { organizationId: orgId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const purchaseReturn = await prisma.purchaseReturn.create({
    data: {
      number: (last?.number ?? 0) + 1,
      returnDate: new Date(d.returnDate),
      originalInvoiceId: d.originalInvoiceId || null,
      status: "DRAFT",
      vendorId: d.vendorId,
      subtotal: d.subtotal,
      taxAmount: d.taxAmount,
      total: d.total,
      notes: d.notes || null,
      organizationId: orgId,
      createdById: userId,
    },
    include: { vendor: true },
  });

  return NextResponse.json(purchaseReturn);
}
