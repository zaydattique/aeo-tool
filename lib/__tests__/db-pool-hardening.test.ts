import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("P0-O database connection lifecycle hardening", () => {
  it("reuses the Prisma singleton in production as well as development", () => {
    const s = readFileSync(resolve(process.cwd(), "lib/prisma.ts"), "utf8");
    expect(s).toContain("globalForPrisma.prisma = prisma;");
    expect(s).not.toContain('process.env.NODE_ENV !== "production"');
  });

  it("keeps pool sizing explicitly bounded at deployment level", () => {
    const s = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    expect(s).toContain("connection_limit=10&pool_timeout=10");
    expect(s).toContain("Keep the pool bounded per app instance");
  });
});
