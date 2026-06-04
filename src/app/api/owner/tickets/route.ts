import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { organization: { select: { name: true } }, user: { select: { name: true, email: true } } },
    take: 100,
  });
  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const json = await req.json();
  const ticket = await prisma.supportTicket.create({
    data: {
      organizationId: json.organizationId,
      userId: json.userId ?? null,
      subject: json.subject,
      message: json.message,
      status: "OPEN",
      priority: json.priority ?? "NORMAL",
      createdBy: "OWNER",
      assignedTo: json.assignedTo ?? null,
    },
  });
  return NextResponse.json(ticket);
}
