import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Phase 1 security response contracts", () => {
  it("does not return credential material from admin agency creation", () => {
    const source = readFileSync("app/api/admin/agencies/route.ts", "utf8");
    expect(source).not.toContain("return NextResponse.json(result, { status: 201 })");
    expect(source).toContain("owner: {");
    expect(source).not.toContain("passwordHash:");
  });

  it("does not expose reusable session identifiers in session APIs", () => {
    const userSessions = readFileSync("app/api/auth/sessions/route.ts", "utf8");
    const adminSessions = readFileSync("app/api/admin/sessions/route.ts", "utf8");
    expect(userSessions).not.toMatch(/sessions:\s*sessions\.map\(\(s\) => \(\{ \...s/);
    expect(adminSessions).not.toContain("tokenId: true");
  });

  it("keeps the internal session revocation identifier non-enumerable", () => {
    const auth = readFileSync("lib/auth.ts", "utf8");
    expect(auth).toContain('Object.defineProperty(session.user, "sessionId"');
    expect(auth).toContain("enumerable: false");
  });

  it("has safe application error boundaries", () => {
    const error = readFileSync("app/error.tsx", "utf8");
    const notFound = readFileSync("app/not-found.tsx", "utf8");
    const globalError = readFileSync("app/global-error.tsx", "utf8");
    expect(error).toContain("No sensitive error details");
    expect(notFound).toContain("Page not found");
    expect(globalError).toContain("Detailed server errors are not exposed");
  });

  it("does not redirect unauthorized Super Admin API requests to an HTML page", () => {
    const middleware = readFileSync("middleware.ts", "utf8");
    expect(middleware).toContain('path.startsWith("/api/admin")');
    expect(middleware).toContain('NextResponse.json({ error: "Forbidden" }, { status: 403 })');
  });

  it("does not trust raw forwarding or user-agent headers for security identity", () => {
    const auth = readFileSync("lib/auth.ts", "utf8");
    const events = readFileSync("lib/security-events.ts", "utf8");
    const requestSecurity = readFileSync("lib/request-security.ts", "utf8");
    expect(auth).not.toContain("req.headers");
    expect(events).not.toContain("request.headers.get");
    expect(requestSecurity).not.toContain("req.headers.get");
    expect(requestSecurity).not.toContain("res.headers.get");
  });

  it("stores password reset tokens only as hashes", () => {
    const forgot = readFileSync("app/api/auth/forgot-password/route.ts", "utf8");
    const reset = readFileSync("app/api/auth/reset-password/route.ts", "utf8");
    expect(forgot).toContain("tokenHash");
    expect(forgot).toContain("passwordResetToken: tokenHash");
    expect(forgot).not.toContain('console.log("[DEV] Password reset link:"');
    expect(reset).toContain("tokenHash");
    expect(reset).toContain("passwordResetToken: tokenHash");
  });

  it("has persistent impersonation visibility in the root shell", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const banner = readFileSync("components/impersonation-banner.tsx", "utf8");
    expect(layout).toContain("ImpersonationBanner");
    expect(banner).toContain("Impersonation active:");
    expect(banner).toContain("expires in");
  });
});
