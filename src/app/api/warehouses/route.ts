import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WarehouseSchema } from "@/validations";
import { validate } from "@/lib/validate";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(warehouses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validate(WarehouseSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const warehouse = await prisma.warehouse.create({
    data: {
      name: d.name,
      address: d.address || null,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(warehouse);
}
