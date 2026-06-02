import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

const ENTITY_MODEL_MAP: Record<string, any> = {
  SalesInvoice: "salesInvoice",
  PurchaseInvoice: "purchaseInvoice",
  Customer: "customer",
  Vendor: "vendor",
  Item: "item",
  Expense: "expense",
  BankAccount: "bankAccount",
  TaxCode: "taxCode",
  Warehouse: "warehouse",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entity, ids } = await req.json();
  if (!entity || !ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "entity and ids[] required" }, { status: 400 });
  }

  const modelKey = ENTITY_MODEL_MAP[entity];
  if (!modelKey) {
    return NextResponse.json({ error: `Unsupported entity: ${entity}` }, { status: 400 });
  }

  const prismaModel = prisma[modelKey as keyof typeof prisma] as any;

  const result = await prismaModel.deleteMany({
    where: { id: { in: ids }, organizationId: session.user.organizationId },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "BULK_DELETE",
    entity,
    entityId: ids.join(","),
    newValue: { deletedCount: result.count, ids },
  });

  return NextResponse.json({ deletedCount: result.count });
}
