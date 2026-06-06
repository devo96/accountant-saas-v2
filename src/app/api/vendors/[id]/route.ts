import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const vendor = await prisma.vendor.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      purchaseInvoices: { orderBy: { invoiceDate: "desc" }, take: 20 },
    },
  });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(vendor);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.vendor.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      mobile: body.mobile ?? null,
      address: body.address ?? null,
      crNumber: body.crNumber ?? null,
      street: body.street ?? null,
      city: body.city ?? null,
      district: body.district ?? null,
      region: body.region ?? null,
      country: body.country ?? null,
      postalCode: body.postalCode ?? null,
      taxNumber: body.taxNumber ?? null,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "UPDATE",
    entity: "Vendor",
    entityId: vendor.id,
    oldValue: { name: existing.name },
    newValue: { name: vendor.name },
  });

  return NextResponse.json(vendor);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.vendor.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vendor.update({
    where: { id },
    data: { active: false },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "DELETE",
    entity: "Vendor",
    entityId: id,
    oldValue: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
