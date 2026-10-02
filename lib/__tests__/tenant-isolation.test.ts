import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function route(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("P0-K tenant isolation guards", () => {
  it("keeps report generation tenant-scoped for dependent reads", () => {
    const source = route("app/api/clients/[id]/reports/route.ts");
    expect(source).toContain('where: { clientId, agencyId: auth.agencyId, status: "COMPLETED" }');
    expect(source).toContain("where: { clientId, agencyId: auth.agencyId, deletedAt: null },");
  });

  it("keeps seeded prompt reads tenant-scoped", () => {
    const source = route("app/api/clients/[id]/prompts/route.ts");
    expect(source).toContain("where: { clientId, agencyId: auth.agencyId, deletedAt: null }");
  });

  it("keeps competitor prompt discovery tenant-scoped", () => {
    const source = route("app/api/clients/[id]/competitors/route.ts");
    expect(source).toContain("agencyId: auth.agencyId,");
  });
});
