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

  it("has persistent impersonation visibility in the root shell", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const banner = readFileSync("components/impersonation-banner.tsx", "utf8");
    expect(layout).toContain("ImpersonationBanner");
    expect(banner).toContain("Impersonation active:");
    expect(banner).toContain("expires in");
  });
});
