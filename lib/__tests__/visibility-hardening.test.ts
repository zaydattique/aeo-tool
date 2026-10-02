import { describe, it, expect, beforeEach } from "vitest";
import {
  visibilitySnapshotRateLimit,
  visibilitySnapshotRateWindowMs,
  visibilityOpsMonthlyLimit,
  visibilityGlobalConcurrency,
  visibilityAgencyConcurrency,
  visibilityPromptConcurrency,
} from "../visibility-config";
import {
  rateLimit,
  setRateLimitBackend,
  type RateLimitBackend,
} from "../rate-limit";
import {
  countExpectedOps,
  idempotencyKeyMatchesClient,
} from "../visibility-job";
import { cappedConsume, computeJobSettlement } from "../visibility-usage";
import { getLiveEngineCapabilities } from "../visibility-check";

class MemoryTestBackend implements RateLimitBackend {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  async hit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    let b = this.buckets.get(key);
    if (!b || now >= b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, limit - b.count),
      retryAfterSec: 0,
    };
  }
}

describe("visibility-config", () => {
  it("exposes safe defaults", () => {
    expect(visibilitySnapshotRateLimit()).toBeGreaterThan(0);
    expect(visibilitySnapshotRateWindowMs()).toBeGreaterThan(0);
    expect(visibilityOpsMonthlyLimit()).toBeGreaterThan(0);
    expect(visibilityGlobalConcurrency()).toBeGreaterThan(0);
    expect(visibilityAgencyConcurrency()).toBeGreaterThan(0);
    expect(visibilityPromptConcurrency()).toBeGreaterThan(0);
  });
});

describe("visibility rate limit (agency-scoped key)", () => {
  beforeEach(() => {
    setRateLimitBackend(new MemoryTestBackend());
  });

  it("allows requests within limit", async () => {
    const limit = 3;
    const key = `visibility:agency-test-a`;
    for (let i = 0; i < limit; i++) {
      const r = await rateLimit(key, limit, 60_000);
      expect(r.ok).toBe(true);
    }
  });

  it("returns failure over limit", async () => {
    const limit = 2;
    const key = `visibility:agency-test-b`;
    await rateLimit(key, limit, 60_000);
    await rateLimit(key, limit, 60_000);
    const r = await rateLimit(key, limit, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates tenants by key", async () => {
    const limit = 1;
    const a = await rateLimit(`visibility:tenant-a`, limit, 60_000);
    const b = await rateLimit(`visibility:tenant-b`, limit, 60_000);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    const a2 = await rateLimit(`visibility:tenant-a`, limit, 60_000);
    expect(a2.ok).toBe(false);
  });
});

describe("countExpectedOps", () => {
  it("scales with prompts and live engines", () => {
    const live = getLiveEngineCapabilities().filter((e) => e.configured).length;
    const ops = countExpectedOps(10);
    if (live === 0) {
      expect(ops).toBe(10);
    } else {
      expect(ops).toBe(10 * live);
    }
  });
});

describe("live engine capabilities (no secrets)", () => {
  it("never includes API key values", () => {
    const caps = getLiveEngineCapabilities();
    for (const c of caps) {
      expect(c).toHaveProperty("engine");
      expect(c).toHaveProperty("configured");
      expect(c).toHaveProperty("envVar");
      expect(JSON.stringify(c)).not.toMatch(/sk-/);
    }
  });
});

describe("idempotency key is client-scoped", () => {
  it("same client matches → same job (no second job)", () => {
    // agency A + client A + key X → job A; same again → match
    expect(idempotencyKeyMatchesClient("client-a", "client-a")).toBe(true);
  });

  it("different client is a collision → must 409 IDEMPOTENCY_KEY_REUSED", () => {
    // agency A + client A + key X → job A
    // agency A + client B + key X → conflict, do not return job A as client B's job
    expect(idempotencyKeyMatchesClient("client-a", "client-b")).toBe(false);
  });
});

describe("cappedConsume — usage retry / consumption cap", () => {
  it("consumes exactly requested when under reserved", () => {
    expect(cappedConsume(100, 0, 40)).toBe(40);
  });

  it("cannot consume beyond opsReserved (cap)", () => {
    // opsReserved=100, opsConsumed=90, request 20 → only 10 room
    expect(cappedConsume(100, 90, 20)).toBe(10);
    expect(cappedConsume(100, 100, 20)).toBe(0);
    expect(cappedConsume(100, 0, 150)).toBe(100);
  });

  it("job A release math is independent of job B reservation", () => {
    // Case D: job A reserved 100, job B reserved 100; A releases 50 → B untouched
    const a = cappedConsume(100, 0, 50);
    expect(a).toBe(50);
    expect(100 - a).toBe(50); // A's release remainder
    // B still has full reservation available
    expect(cappedConsume(100, 0, 100)).toBe(100);
  });

  it("negative or zero requests apply zero", () => {
    expect(cappedConsume(100, 10, 0)).toBe(0);
    expect(cappedConsume(100, 10, -5)).toBe(0);
  });

  it("after 40 consumed, another 40 request is capped by remaining room only", () => {
    // Case E: job A consumes 40 then retries — must not consume those same 40 again
    expect(cappedConsume(100, 40, 40)).toBe(40);
    expect(cappedConsume(100, 40, 80)).toBe(60);
  });
});

describe("computeJobSettlement — retry-safe usage accounting (Cases A–E)", () => {
  it("Case A: normal success — consume then settle", () => {
    // job reserves 100, consumes 40
    const s = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 0,
      usageSettled: false,
      requestedConsume: 40,
    });
    expect(s.alreadySettled).toBe(false);
    expect(s.appliedConsume).toBe(40);
    expect(s.appliedRelease).toBe(60);
    expect(s.finalOpsConsumed).toBe(40);
    expect(s.meterUsedDelta).toBe(40);
    expect(s.meterReservedDelta).toBe(-100); // full reservation released from reserved bucket
  });

  it("Case B/C: retry after settlement — no second consume", () => {
    // provider succeeded, settlement happened, worker crashes, retry
    const s = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 40,
      usageSettled: true,
      requestedConsume: 40,
    });
    expect(s.alreadySettled).toBe(true);
    expect(s.appliedConsume).toBe(0);
    expect(s.appliedRelease).toBe(0);
    expect(s.meterUsedDelta).toBe(0);
    expect(s.meterReservedDelta).toBe(0);
    expect(s.finalOpsConsumed).toBe(40);
  });

  it("Case D: job A fail/release does not touch job B reservation", () => {
    // Simulate two independent settlements against separate job rows.
    // Agency meter starts: reserved=200 (A+B), used=0
    let meterReserved = 200;
    let meterUsed = 0;

    const jobA = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 0,
      usageSettled: false,
      requestedConsume: 0, // failed → consume 0, release 100
    });
    meterReserved += jobA.meterReservedDelta;
    meterUsed += jobA.meterUsedDelta;

    expect(jobA.appliedConsume).toBe(0);
    expect(jobA.appliedRelease).toBe(100);
    expect(meterReserved).toBe(100); // only B's reservation remains
    expect(meterUsed).toBe(0);

    // job B still settles its own 100 independently
    const jobB = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 0,
      usageSettled: false,
      requestedConsume: 100,
    });
    meterReserved += jobB.meterReservedDelta;
    meterUsed += jobB.meterUsedDelta;

    expect(jobB.appliedConsume).toBe(100);
    expect(meterReserved).toBe(0);
    expect(meterUsed).toBe(100);
  });

  it("Case E: job A consumes 40 then retry must not consume those 40 again", () => {
    // First settlement attempt would apply 40
    const first = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 0,
      usageSettled: false,
      requestedConsume: 40,
    });
    expect(first.appliedConsume).toBe(40);

    // After durable usageSettled=true, retry sees alreadySettled
    const retry = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 40,
      usageSettled: true,
      requestedConsume: 40,
    });
    expect(retry.appliedConsume).toBe(0);
    expect(retry.meterUsedDelta).toBe(0);
  });

  it("consumption cap: opsReserved=100 opsConsumed=90 cannot consume another 20", () => {
    const s = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 90,
      usageSettled: false,
      requestedConsume: 20,
    });
    expect(s.appliedConsume).toBe(10);
    expect(s.finalOpsConsumed).toBe(100);
    expect(s.appliedRelease).toBe(0);
    expect(s.meterUsedDelta).toBe(10);
    expect(s.meterReservedDelta).toBe(-10);
  });

  it("usage retry simulation: reserve 100, consume 40 once → used+40 reserved-100", () => {
    let used = 0;
    let reserved = 100; // after reserveVisibilityOps

    const s = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 0,
      usageSettled: false,
      requestedConsume: 40,
    });
    used += s.meterUsedDelta;
    reserved += s.meterReservedDelta;

    expect(used).toBe(40);
    expect(reserved).toBe(0);

    // second call (retry) with usageSettled
    const s2 = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 40,
      usageSettled: true,
      requestedConsume: 40,
    });
    used += s2.meterUsedDelta;
    reserved += s2.meterReservedDelta;

    expect(used).toBe(40); // not 80
    expect(reserved).toBe(0);
  });
});


describe("visibility usage meter binding", () => {
  it("settlement math releases exactly the job-owned reservation", () => {
    const s = computeJobSettlement({
      opsReserved: 100,
      opsConsumed: 40,
      usageSettled: false,
      requestedConsume: 20,
    });
    expect(s.appliedConsume).toBe(20);
    expect(s.appliedRelease).toBe(40);
    expect(s.meterReservedDelta).toBe(-60);
  });
});
