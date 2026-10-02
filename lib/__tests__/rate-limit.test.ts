import { afterEach, describe, expect, it } from "vitest";
import {
  rateLimit,
  resetRateLimitBackendForTests,
  setRateLimitBackend,
} from "../rate-limit";

describe("rate-limit fail-closed behavior", () => {
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const [key, value] of previous) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
    previous.clear();
    setRateLimitBackend(null);
    resetRateLimitBackendForTests();
  });

  it("fails closed in production when Redis is missing", async () => {
    previous.set("NODE_ENV", process.env.NODE_ENV);
    previous.set("UPSTASH_REDIS_REST_URL", process.env.UPSTASH_REDIS_REST_URL);
    previous.set("UPSTASH_REDIS_REST_TOKEN", process.env.UPSTASH_REDIS_REST_TOKEN);
    process.env.NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = await rateLimit("test", 10, 60_000);
    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBe(5);
  });

  it("fails closed when the distributed backend throws", async () => {
    previous.set("NODE_ENV", process.env.NODE_ENV);
    process.env.NODE_ENV = "production";
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
    previous.set("NODE_ENV", process.env.NODE_ENV);
    previous.set("UPSTASH_REDIS_REST_URL", process.env.UPSTASH_REDIS_REST_URL);
    previous.set("UPSTASH_REDIS_REST_TOKEN", process.env.UPSTASH_REDIS_REST_TOKEN);
    process.env.NODE_ENV = "test";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetRateLimitBackendForTests();

    const first = await rateLimit("local-test", 1, 60_000);
    const second = await rateLimit("local-test", 1, 60_000);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });
});
