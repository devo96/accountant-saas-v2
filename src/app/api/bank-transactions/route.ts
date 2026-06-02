import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBankTransaction, getBankTransactions } from "@/domains/banking";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getBankTransactions(session.user.organizationId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bankAccountId, type, amount, date, description, reference } = body;

  if (!["DEPOSIT", "WITHDRAWAL", "TRANSFER"].includes(type)) {
    return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
  }

  const amountNum = Number(amount);
  const debit = type === "WITHDRAWAL" || type === "TRANSFER" ? amountNum : 0;
  const credit = type === "DEPOSIT" || type === "TRANSFER" ? amountNum : 0;

  const result = await createBankTransaction(session.user.organizationId, {
    bankAccountId,
    date: new Date(date),
    description,
    reference,
    debit,
    credit,
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "BankTransaction",
    entityId: result.transaction.id,
    newValue: { description, amount: amountNum, type },
  });

  return NextResponse.json(result);
}
