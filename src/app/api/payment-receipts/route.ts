import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const receipts = await prisma.paymentReceipt.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      salesInvoice: { select: { number: true } },
      purchaseInvoice: { select: { number: true } },
    },
  });

  return NextResponse.json(receipts.map((r) => ({ ...r, amount: Number(r.amount) })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const last = await prisma.paymentReceipt.findFirst({
    where: { organizationId: session.user.organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const receipt = await prisma.paymentReceipt.create({
    data: {
      number: (last?.number ?? 0) + 1,
      date: new Date(body.date),
      amount: Number(body.amount),
      method: body.method ?? "CASH",
      reference: body.reference || null,
      notes: body.notes || null,
      salesInvoiceId: body.salesInvoiceId || null,
      purchaseInvoiceId: body.purchaseInvoiceId || null,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(receipt);
}
