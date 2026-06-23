import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { BankAccountSchema } from "@/validations";
import { validate } from "@/lib/validate";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validate(BankAccountSchema, body);
  if (parsed.error) return parsed.error;

  const account = await prisma.bankAccount.create({
    data: {
      name: body.name,
      accountNumber: body.accountNumber,
      iban: body.iban || null,
      bankName: body.bankName,
      openingBalance: body.openingBalance ? Number(body.openingBalance) : 0,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(account);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(accounts);
}
