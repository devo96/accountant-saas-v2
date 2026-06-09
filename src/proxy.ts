import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createMiddleware(routing);

function getLocale(pathname: string): string {
  return pathname.startsWith("/en") ? "en" : "ar";
}

function setLocaleCookie(response: NextResponse, locale: string): NextResponse {
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = getLocale(pathname);
  const publicPaths = ["/login", "/register", "/forgot-password"];
  const isPublic = publicPaths.some((p) => pathname.includes(p))
    || pathname === "/" || /^\/(ar|en)$/.test(pathname);

  // API routes: validate session for non-public, non-owner endpoints
  if (pathname.includes("/api/") && !pathname.includes("/api/auth/") && !pathname.includes("/api/owner/")) {
    // Agent Control Room: writes from the agent team carry a shared secret
    // instead of a user session — let those bypass the session gate.
    if (pathname.includes("/api/agents/")) {
      const agentSecret = process.env.AGENT_SECRET || process.env.CRON_SECRET;
      const provided = req.headers.get("x-agent-secret")
        || (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (agentSecret && provided === agentSecret) {
        return setLocaleCookie(intlMiddleware(req), locale);
      }
      // otherwise fall through to the normal session check (the page's own GETs)
    }
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return setLocaleCookie(intlMiddleware(req), locale);
  }

  if (isPublic) {
    return setLocaleCookie(intlMiddleware(req), locale);
  }

  const sessionToken = req.cookies.get("next-auth.session-token")?.value
    || req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return setLocaleCookie(NextResponse.redirect(loginUrl), locale);
  }

  return setLocaleCookie(intlMiddleware(req), locale);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
