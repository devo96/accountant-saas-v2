import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { CurrencySchema } from "@/validations";
import { validate } from "@/lib/validate";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = validate(CurrencySchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  if (d.isBase) {
    await prisma.currency.updateMany({
      where: { organizationId: session.user.organizationId, isBase: true },
      data: { isBase: false },
    });
  }

  const currency = await prisma.currency.create({
    data: {
      code: d.code,
      name: d.name,
      symbol: d.symbol ?? "",
      exchangeRate: d.exchangeRate ?? 1,
      isBase: d.isBase ?? false,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(currency);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currencies = await prisma.currency.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(currencies);
}
