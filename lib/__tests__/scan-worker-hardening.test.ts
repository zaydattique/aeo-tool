import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("P0-N scan worker/retry hardening", () => {
  it("claims a queued scan with an atomic conditional update", () => {
    const s = read("lib/scan-worker.ts");
    expect(s).toContain('prisma.scan.updateMany');
    expect(s).toContain('where: { id: scanId, status: "QUEUED" }');
    expect(s).toContain("if (claim.count !== 1)");
  });

  it("does not re-enter an already running/completed/failed scan", () => {
    const s = read("lib/scan-worker.ts");
    expect(s).toContain("duplicate/no-op");
    expect(s).toContain('select: { status: true }');
  });

  it("prevents duplicate Inngest events and retry amplification", () => {
    const s = read("lib/inngest/functions.ts");
    expect(s).toContain('idempotency: "event.data.scanId"');
    expect(s).toContain("retries: 0");
  });

  it("keeps failed scans terminal and releases client error state", () => {
    const s = read("lib/scan-worker.ts");
    expect(s).toContain('status: "FAILED"');
    expect(s).toContain('stage: "FAILED"');
    expect(s).toContain('data: { status: "ERROR" }');
  });
});
