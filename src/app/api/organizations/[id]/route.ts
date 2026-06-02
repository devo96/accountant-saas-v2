import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || session.user.organizationId !== (await params).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const org = await prisma.organization.update({
    where: { id: (await params).id },
    data: {
      name: body.name,
      nameAr: body.nameAr || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      commercialReg: body.commercialReg || null,
      taxNumber: body.taxNumber || null,
    },
  });

  return NextResponse.json(org);
}
