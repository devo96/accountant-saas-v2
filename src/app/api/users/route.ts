import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/permissions";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = auth.session!;

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, permissions: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = auth.session!;

  const body = await req.json();
  if (!body.email || !body.name || !body.password) {
    return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash,
      role: body.role ?? "ACCOUNTANT",
      phone: body.phone || null,
      active: body.active ?? true,
      organizationId: session.user.organizationId,
    },
    select: { id: true, name: true, email: true, role: true, active: true, phone: true, permissions: true },
  });

  return NextResponse.json(user);
}
