import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("P0-S worker queue saturation hardening", () => {
  it("does not fall back to unbounded in-process scan execution in production", () => {
    const s = read("lib/scan-worker.ts");
    expect(s).toContain('process.env.NODE_ENV !== "production"');
    expect(s).toContain('process.env.ALLOW_IN_PROCESS_SCAN_FALLBACK === "1"');
    expect(s).toContain('errorMessage: "Durable scan queue unavailable"');
  });

  it("serializes scheduled worker cron executions", () => {
    const s = read("lib/inngest/functions.ts");
    expect(s).toContain('key: \'"stale-scan-recovery"\'');
    expect(s).toContain('key: \'"weekly-rescan-cron"\'');
    expect(s).toContain('key: \'"weekly-digest-cron"\'');
    expect(s).toContain("limit: 1");
  });

  it("keeps scheduled rescan fan-out bounded per cron invocation", () => {
    const s = read("lib/inngest/functions.ts");
    expect(s).toContain("take: 50");
    expect(s).toContain('id: "weekly-rescan-cron"');
  });
});
