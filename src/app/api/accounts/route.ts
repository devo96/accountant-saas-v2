import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(accounts.map((a) => ({ ...a, balance: Number(a.balance) })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const account = await prisma.account.create({
    data: {
      code: body.code,
      name: body.name,
      type: body.type,
      nature: body.nature,
      parentId: body.parentId || null,
      currencyId: body.currencyId || null,
      active: body.active ?? true,
      isMaster: false,
      balance: 0,
      organizationId: session.user.organizationId,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "Account",
    entityId: account.id,
    newValue: { code: account.code, name: account.name },
  });

  return NextResponse.json({ ...account, balance: Number(account.balance) });
}
