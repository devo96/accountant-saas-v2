import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

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

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = getLocale(pathname);
  const publicPaths = ["/login", "/register", "/forgot-password"];
  const isPublic = publicPaths.some((p) => pathname.includes(p));

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
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
