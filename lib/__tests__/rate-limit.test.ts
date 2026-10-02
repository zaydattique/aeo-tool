import { afterEach, describe, expect, it, vi } from "vitest";
import {
  rateLimit,
  resetRateLimitBackendForTests,
  setRateLimitBackend,
} from "../rate-limit";

describe("rate-limit fail-closed behavior", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    setRateLimitBackend(null);
    resetRateLimitBackendForTests();
  });

  it("fails closed in production when Redis is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = await rateLimit("test", 10, 60_000);
    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBe(5);
  });

  it("fails closed when the distributed backend throws", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    setRateLimitBackend({
      hit: async () => {
        throw new Error("redis unavailable");
      },
    });

    const result = await rateLimit("test", 10, 60_000);
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("keeps local development usable without Redis", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetRateLimitBackendForTests();

    const first = await rateLimit("local-test", 1, 60_000);
    const second = await rateLimit("local-test", 1, 60_000);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });
});
