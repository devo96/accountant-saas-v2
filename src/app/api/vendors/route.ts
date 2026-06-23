import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { VendorSchema } from "@/validations";
import { validate } from "@/lib/validate";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(vendors);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validate(VendorSchema, body);
  if (parsed.error) return parsed.error;

  const vendor = await prisma.vendor.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      mobile: body.mobile || null,
      address: body.address || null,
      crNumber: body.crNumber || null,
      street: body.street || null,
      city: body.city || null,
      district: body.district || null,
      region: body.region || null,
      country: body.country || null,
      postalCode: body.postalCode || null,
      taxNumber: body.taxNumber || null,
      organizationId: session.user.organizationId,
    },
  });

  await createAuditLog({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "CREATE",
    entity: "Vendor",
    entityId: vendor.id,
    newValue: { name: vendor.name },
  });

  return NextResponse.json(vendor);
}
