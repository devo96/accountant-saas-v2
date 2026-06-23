import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { validatePartial } from "@/lib/validate";
import { CustomerSchema } from "@/validations";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      salesInvoices: { orderBy: { invoiceDate: "desc" }, take: 20 },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(customer);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const parsed = validatePartial(CustomerSchema, body);
  if (parsed.error) return parsed.error;
  const data = parsed.data;

  const existing = await prisma.customer.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      mobile: data.mobile ?? null,
      address: data.address ?? null,
      crNumber: data.crNumber ?? null,
      street: data.street ?? null,
      city: data.city ?? null,
      district: data.district ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      postalCode: data.postalCode ?? null,
      taxNumber: data.taxNumber ?? null,
      creditLimit: data.creditLimit ?? Number(existing.creditLimit),
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Customer",
    entityId: customer.id,
    oldValue: { name: existing.name, creditLimit: Number(existing.creditLimit) },
    newValue: { name: customer.name, creditLimit: Number(customer.creditLimit) },
  });

  return NextResponse.json(customer);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.customer.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.customer.update({
    where: { id },
    data: { active: false },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "Customer",
    entityId: id,
    oldValue: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
