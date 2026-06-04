import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const json = await req.json();
  const { organizationId, type = "INFO", title, message } = json;

  if (!title || !message) return NextResponse.json({ error: "title and message required" }, { status: 400 });

  let users: { id: string; organizationId: string }[];

  if (organizationId === "*") {
    users = await prisma.user.findMany({ select: { id: true, organizationId: true } });
  } else {
    users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true, organizationId: true },
    });
  }

  if (users.length === 0) return NextResponse.json({ success: true, notices: 0 });

  await prisma.notification.createMany({
    data: users.map((u) => ({
      organizationId: u.organizationId,
      userId: u.id,
      type,
      title,
      message,
    })),
  });

  return NextResponse.json({ success: true, notices: users.length });
}
