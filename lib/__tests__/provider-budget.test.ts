import { afterEach, describe, expect, it, vi } from "vitest";
import {
  consumeProviderBudget,
  providerAgencyAiBudget,
  providerAgencyCrawlBudget,
  providerGlobalAiBudget,
  providerGlobalCrawlBudget,
  providerBudgetWindowMs,
} from "../provider-budget";
import { setRateLimitBackend, resetRateLimitBackendForTests, type RateLimitBackend } from "../rate-limit";

describe("provider budget", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimitBackendForTests();
  });

  it("uses configurable crawl and AI budgets", () => {
    vi.stubEnv("PROVIDER_BUDGET_WINDOW_MS", "120000");
    vi.stubEnv("PROVIDER_GLOBAL_CRAWL_BUDGET", "7");
    vi.stubEnv("PROVIDER_AGENCY_CRAWL_BUDGET", "3");
    vi.stubEnv("PROVIDER_GLOBAL_AI_BUDGET", "9");
    vi.stubEnv("PROVIDER_AGENCY_AI_BUDGET", "4");

    expect(providerBudgetWindowMs()).toBe(120000);
    expect(providerGlobalCrawlBudget()).toBe(7);
    expect(providerAgencyCrawlBudget()).toBe(3);
    expect(providerGlobalAiBudget()).toBe(9);
    expect(providerAgencyAiBudget()).toBe(4);
  });

  it("checks the agency bucket before the global bucket", async () => {
    const calls: string[] = [];
    const backend: RateLimitBackend = {
      async hit(key) {
        calls.push(key);
        return key.includes(":agency:") 
          ? { ok: false, remaining: 0, retryAfterSec: 17 }
          : { ok: true, remaining: 10, retryAfterSec: 0 };
      },
    };
    setRateLimitBackend(backend);

    const result = await consumeProviderBudget("ai", "agency-1");

    expect(result).toEqual({ ok: false, retryAfterSec: 17 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("provider-budget:ai:agency:agency-1");
  });

  it("uses an atomic pair backend when available", async () => {
    vi.stubEnv("PROVIDER_AGENCY_AI_BUDGET", "4");
    vi.stubEnv("PROVIDER_GLOBAL_AI_BUDGET", "9");
    let called = false;
    setRateLimitBackend({
      async hit() { throw new Error("sequential fallback should not run"); },
      async hitPair(first, second) {
        called = true;
        expect(first.limit).toBe(4);
        expect(second.limit).toBe(9);
        return {
          first: { ok: true, remaining: 3, retryAfterSec: 0 },
          second: { ok: true, remaining: 8, retryAfterSec: 0 },
        };
      },
    });
    const result = await consumeProviderBudget("ai", "agency-atomic");
    expect(called).toBe(true);
    expect(result).toEqual({ ok: true, retryAfterSec: 0 });
  });

  it("requires both agency and global buckets to pass", async () => {
    const calls: string[] = [];
    const backend: RateLimitBackend = {
      async hit(key) {
        calls.push(key);
        if (key.includes(":global")) {
          return { ok: false, remaining: 0, retryAfterSec: 23 };
        }
        return { ok: true, remaining: 10, retryAfterSec: 0 };
      },
    };
    setRateLimitBackend(backend);

    const result = await consumeProviderBudget("crawl", "agency-2");

    expect(result).toEqual({ ok: false, retryAfterSec: 23 });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("provider-budget:crawl:agency:agency-2");
    expect(calls[1]).toContain("provider-budget:crawl:global");
  });
});
