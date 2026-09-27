import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
      if (token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (
      path.startsWith("/dashboard") &&
      token?.role === "AGENCY_OWNER" &&
      token?.onboardingCompleted === false &&
      path !== "/onboarding"
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    if (path === "/onboarding" && token?.onboardingCompleted === true) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        if (
          path === "/" ||
          path.startsWith("/login") ||
          path.startsWith("/signup") ||
          path.startsWith("/forgot-password") ||
          path.startsWith("/reset-password") ||
          path.startsWith("/invite") ||
          path.startsWith("/r/") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/health") ||
          path.startsWith("/api/billing/webhook")
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/admin/:path*",
    "/api/onboarding",
    "/api/clients/:path*",
    "/api/scans/:path*",
    "/api/actions/:path*",
    "/api/reports/:path*",
    "/api/team/:path*",
    "/api/billing/:path*",
    "/api/admin/:path*",
    "/api/prompts/:path*",
  ],
};
