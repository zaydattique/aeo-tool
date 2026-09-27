import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Super admin routes
    if (path.startsWith("/admin")) {
      if (token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // Onboarding gate for agency owners who haven't finished
    if (
      path.startsWith("/dashboard") &&
      token?.role === "AGENCY_OWNER" &&
      token?.onboardingCompleted === false &&
      path !== "/onboarding"
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // If already onboarded, don't stay on onboarding page
    if (path === "/onboarding" && token?.onboardingCompleted === true) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public paths
        if (
          path === "/" ||
          path.startsWith("/login") ||
          path.startsWith("/signup") ||
          path.startsWith("/forgot-password") ||
          path.startsWith("/reset-password") ||
          path.startsWith("/invite") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/health")
        ) {
          return true;
        }

        // Everything else requires a session
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
  ],
};
