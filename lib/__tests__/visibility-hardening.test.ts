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
import { cappedConsume } from "../visibility-usage";
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
  it("same client matches", () => {
    expect(idempotencyKeyMatchesClient("client-a", "client-a")).toBe(true);
  });

  it("different client is a collision (must 409)", () => {
    expect(idempotencyKeyMatchesClient("client-a", "client-b")).toBe(false);
  });
});

describe("cappedConsume — usage retry / consumption cap", () => {
  it("consumes exactly requested when under reserved", () => {
    expect(cappedConsume(100, 0, 40)).toBe(40);
  });

  it("cannot consume beyond opsReserved", () => {
    expect(cappedConsume(100, 90, 20)).toBe(10);
    expect(cappedConsume(100, 100, 20)).toBe(0);
    expect(cappedConsume(100, 0, 150)).toBe(100);
  });

  it("job A release math is independent of job B reservation", () => {
    const a = cappedConsume(100, 0, 50);
    expect(a).toBe(50);
    expect(100 - a).toBe(50);
    expect(cappedConsume(100, 0, 100)).toBe(100);
  });

  it("negative or zero requests apply zero", () => {
    expect(cappedConsume(100, 10, 0)).toBe(0);
    expect(cappedConsume(100, 10, -5)).toBe(0);
  });

  it("after 40 consumed, another 40 request is capped by remaining room only", () => {
    expect(cappedConsume(100, 40, 40)).toBe(40);
    expect(cappedConsume(100, 40, 80)).toBe(60);
  });
});
