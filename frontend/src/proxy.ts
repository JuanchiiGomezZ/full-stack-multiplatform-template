import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

/**
 * Create the i18n proxy handler
 */
const intlProxy = createMiddleware(routing);

/**
 * Auth cookie name
 */
const AUTH_COOKIE = "auth-token";

/**
 * Protected route patterns
 */
const PROTECTED_PATTERNS = ["/tool"];

/**
 * Auth route patterns (should redirect to dashboard if logged in)
 */
const AUTH_PATTERNS = ["/login", "/register"];

/**
 * Check if a path matches any of the patterns
 */
function matchesPattern(pathname: string, patterns: string[]): boolean {
  // Remove locale prefix for matching
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, "");
  return patterns.some((pattern) => pathWithoutLocale.startsWith(pattern));
}

/**
 * Combined proxy: i18n + auth
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // First, apply i18n proxy
  const response = intlProxy(request);

  // Get Auth token
  const authToken = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = !!authToken;

  // Check protected routes
  if (matchesPattern(pathname, PROTECTED_PATTERNS) && !isAuthenticated) {
    // Get the locale from pathname or default
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (matchesPattern(pathname, AUTH_PATTERNS) && isAuthenticated) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}/tool/dashboard`, request.url)
    );
  }

  return response;
}

/**
 * Matcher configuration
 * Exclude static files and apply to all other routes
 */
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
