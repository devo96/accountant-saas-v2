import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { CustomerSchema } from "@/validations";
import { validate } from "@/lib/validate";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validate(CustomerSchema, body);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const customer = await prisma.customer.create({
    data: {
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      mobile: d.mobile || null,
      address: d.address || null,
      crNumber: d.crNumber || null,
      street: d.street || null,
      city: d.city || null,
      district: d.district || null,
      region: d.region || null,
      country: d.country || null,
      postalCode: d.postalCode || null,
      taxNumber: d.taxNumber || null,
      creditLimit: d.creditLimit ?? 0,
      organizationId: session.user.organizationId,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "Customer",
    entityId: customer.id,
    newValue: { name: customer.name, creditLimit: Number(customer.creditLimit) },
  });

  return NextResponse.json(customer);
}
