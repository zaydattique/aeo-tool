import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("P0-L cursor pagination", () => {
  it("uses a stable createdAt/id cursor for clients", () => {
    const s = read("app/api/clients/route.ts");
    expect(s).toContain('searchParams.get("cursor")');
    expect(s).toContain("createdAt: { lt: new Date(cursorData.createdAt) }");
    expect(s).toContain("id: { lt: cursorData.id }");
    expect(s).toContain("nextCursor");
  });

  it("uses a stable priority/time/id cursor for actions", () => {
    const s = read("app/api/actions/route.ts");
    expect(s).toContain('sp.get("cursor")');
    expect(s).toContain('cursorData.priority === "HIGH"');
    expect(s).toContain('priority: { in: laterPriorities }');
    expect(s).toContain("nextCursor");
  });

  it("uses a stable recordedAt/id cursor for snapshots", () => {
    const s = read("app/api/clients/[id]/snapshots/route.ts");
    expect(s).toContain('_req.nextUrl.searchParams.get("cursor")');
    expect(s).toContain("recordedAt: { gt: new Date(cursorData.recordedAt) }");
    expect(s).toContain("id: { gt: cursorData.id }");
    expect(s).toContain("nextCursor");
  });
});
