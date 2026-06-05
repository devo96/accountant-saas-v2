import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { orgId } = await params;

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { organizationId: orgId, active: true },
      orderBy: { role: "asc" },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "No active user in this organization" }, { status: 404 });
    }

    const originalToken = req.cookies.get("next-auth.session-token")?.value
      || req.cookies.get("__Secure-next-auth.session-token")?.value;

    const newToken = await encode({
      token: {
        sub: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        id: targetUser.id,
        organizationId: targetUser.organizationId,
        role: targetUser.role,
        permissions: targetUser.permissions as Record<string, boolean> | null | undefined,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 60 * 60,
    });

    const res = NextResponse.json({
      success: true,
      redirectTo: "/ar/dashboard",
      targetOrgName: org.name,
    });

    if (originalToken) {
      res.cookies.set("impersonation_original", originalToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
      });
    }

    res.cookies.set("impersonation_banner", JSON.stringify({ name: org.name }), {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    });

    const baseOpts = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60,
    };
    res.cookies.set("next-auth.session-token", newToken, {
      ...baseOpts,
      secure: process.env.NODE_ENV === "production",
    });
    if (process.env.NODE_ENV === "production") {
      res.cookies.set("__Secure-next-auth.session-token", newToken, {
        ...baseOpts,
        secure: true,
      });
    }

    return res;
  } catch (error) {
    console.error("[IMPERSONATE_START]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
