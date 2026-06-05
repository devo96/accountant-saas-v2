import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const savedToken = req.cookies.get("impersonation_original")?.value;

    const res = NextResponse.json({
      success: true,
      redirectTo: "/ar/owner/organizations",
    });

    if (savedToken) {
      const baseOpts = {
        path: "/",
        httpOnly: true,
        sameSite: "lax" as const,
        maxAge: 30 * 24 * 60 * 60,
      };
      res.cookies.set("next-auth.session-token", savedToken, {
        ...baseOpts,
        secure: process.env.NODE_ENV === "production",
      });
      if (process.env.NODE_ENV === "production") {
        res.cookies.set("__Secure-next-auth.session-token", savedToken, {
          ...baseOpts,
          secure: true,
        });
      }
    }

    res.cookies.set("impersonation_original", "", { path: "/", maxAge: 0 });
    res.cookies.set("impersonation_banner", "", { path: "/", maxAge: 0 });

    return res;
  } catch (error) {
    console.error("[IMPERSONATE_EXIT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
