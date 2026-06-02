import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/permissions";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = auth.session!;

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.active !== undefined) data.active = body.active;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.permissions !== undefined) data.permissions = body.permissions;
  if (body.email !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { email: body.email, id: { not: id } },
    });
    if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    data.email = body.email;
  }
  if (body.password) {
    data.passwordHash = await bcrypt.hash(body.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, permissions: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = auth.session!;

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
