import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.currency.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.isBase) {
    await prisma.currency.updateMany({
      where: { organizationId: session.user.organizationId, isBase: true },
      data: { isBase: false },
    });
  }

  const currency = await prisma.currency.update({
    where: { id },
    data: {
      code: body.code ?? existing.code,
      name: body.name ?? existing.name,
      symbol: body.symbol ?? existing.symbol,
      exchangeRate: body.exchangeRate !== undefined ? Number(body.exchangeRate) : existing.exchangeRate,
      isBase: body.isBase ?? existing.isBase,
    },
  });

  return NextResponse.json({ ...currency, exchangeRate: Number(currency.exchangeRate) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.currency.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.currency.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
