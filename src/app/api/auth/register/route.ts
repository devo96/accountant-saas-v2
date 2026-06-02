import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.email || !body.password || !body.name || !body.organizationName) {
    return NextResponse.json({ error: "Email, password, name, and organization name are required" }, { status: 400 });
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
      role: "ADMIN",
      organization: {
        create: { name: body.organizationName },
      },
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ message: "Account created successfully", userId: user.id }, { status: 201 });
}
