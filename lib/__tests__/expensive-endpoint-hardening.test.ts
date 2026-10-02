import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("P0-M expensive-operation hardening", () => {
  it("layers PDF throttles by IP, token, and global budget", () => {
    const s = read("lib/expensive-rate-limits.ts");
    expect(s).toContain('pdfPerIpLimit');
    expect(s).toContain('pdfPerTokenLimit');
    expect(s).toContain('rateLimit("pdf:global"');
  });

  it("throttles authenticated billing operations", () => {
    expect(read("app/api/billing/checkout/route.ts")).toContain("billing-checkout:");
    expect(read("app/api/billing/portal/route.ts")).toContain("billing-portal:");
    expect(read("app/api/billing/usage/route.ts")).toContain("billing-usage:");
  });

  it("isolates AI redraft spend and caps provider response buffering", () => {
    const s = read("app/api/actions/[id]/redraft/route.ts");
    expect(s).toContain('consumeProviderBudget("ai"');
    expect(s).toContain("raw.length > 1_000_000");
    expect(s).toContain("text.slice(0, 8000)");
  });

  it("throttles team invitation creation after authorization", () => {
    const s = read("app/api/team/invites/route.ts");
    expect(s).toContain("team-invite:");
    expect(s.indexOf('auth.session.user.role !== "AGENCY_OWNER"')).toBeLessThan(
      s.indexOf("team-invite:")
    );
  });
});
