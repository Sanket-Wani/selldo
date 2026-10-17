import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";

const PUBLIC_PATHS = ["/login", "/api/auth", "/favicon.ico", "/_next"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting on Authentication Endpoints
  if (pathname.startsWith("/api/auth/callback/credentials") || pathname.startsWith("/api/auth/signin")) {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const { allowed, resetInMs } = checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many authentication attempts. Please try again later.",
          retryAfterSeconds: Math.ceil(resetInMs / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(resetInMs / 1000)),
          },
        }
      );
    }
  }

  // 2. Auth Session Check for Protected Routes
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!isPublic && !sessionToken && pathname !== "/") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and visiting /login, redirect to /dashboard
  if (pathname === "/login" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Security Headers (STRIDE & OWASP Hardening)
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self';"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, favicon, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
