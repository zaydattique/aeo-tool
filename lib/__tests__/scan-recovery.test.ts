import { describe, expect, it } from "vitest";
import { staleScanThresholdMs } from "../scan-recovery";

describe("P0-P stale scan recovery", () => {
  it("uses a bounded default timeout", () => {
    expect(staleScanThresholdMs()).toBe(15 * 60 * 1000);
  });

  it("clamps unsafe timeout configuration", () => {
    const old = process.env.SCAN_STALE_TIMEOUT_MS;
    process.env.SCAN_STALE_TIMEOUT_MS = "1000";
    expect(staleScanThresholdMs()).toBe(2 * 60 * 1000);
    process.env.SCAN_STALE_TIMEOUT_MS = "999999999";
    expect(staleScanThresholdMs()).toBe(60 * 60 * 1000);
    if (old === undefined) delete process.env.SCAN_STALE_TIMEOUT_MS;
    else process.env.SCAN_STALE_TIMEOUT_MS = old;
  });
});
