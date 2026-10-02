/**
 * Rate limiter with pluggable backend.
 * - Default: in-memory (single process)
 * - When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set: Upstash REST
 *
 * `rateLimit` is async so Redis works; existing callers must await.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

function requireDistributedRateLimit(): boolean {
  const raw = process.env.RATE_LIMIT_REQUIRE_REDIS;
  if (raw == null || raw === "") return process.env.NODE_ENV === "production";
  return raw === "1" || raw.toLowerCase() === "true";
}

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function failClosedResult(): RateLimitResult {
  return { ok: false, remaining: 0, retryAfterSec: 5 };
}

function normalizeKey(key: string): string {
  return key.slice(0, 256).replace(/[^a-zA-Z0-9:_-]/g, "_");
}

export interface RateLimitBackend {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  hitPair?(first: { key: string; limit: number }, second: { key: string; limit: number }, windowMs: number): Promise<{ first: RateLimitResult; second: RateLimitResult }>;
}

class MemoryBackend implements RateLimitBackend {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.buckets) {
        if (now >= v.resetAt) this.buckets.delete(k);
      }
    }, 60_000).unref?.();
  }

  async hitPair(first: { key: string; limit: number }, second: { key: string; limit: number }, windowMs: number): Promise<{ first: RateLimitResult; second: RateLimitResult }> {
    const rawTimeout = Number.parseInt(process.env.RATE_LIMIT_REDIS_TIMEOUT_MS || "1500", 10);
    const timeoutMs = Number.isFinite(rawTimeout) ? Math.min(5000, Math.max(250, rawTimeout)) : 1500;
    const res = await fetch(`${this.baseUrl}/pipeline`, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["EVAL", ATOMIC_PAIR_SCRIPT, "2", `rl:${normalizeKey(first.key)}`, `rl:${normalizeKey(second.key)}`, String(first.limit), String(second.limit), String(Math.max(1, Math.ceil(windowMs / 1000)))]])
    });
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const data = (await res.json()) as { result: unknown }[];
    const out = Array.isArray(data[0]?.result) ? data[0].result.map(Number) : [];
    if (out[0] !== 1) {
      const denied = { ok: false, remaining: 0, retryAfterSec: Math.max(1, Number(out[1] || 1)) };
      return { first: denied, second: denied };
    }
    return {
      first: { ok: true, remaining: Math.max(0, Number(out[1] || 0)), retryAfterSec: 0 },
      second: { ok: true, remaining: Math.max(0, Number(out[2] || 0)), retryAfterSec: 0 },
    };
  }

  async hit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
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

const ATOMIC_PAIR_SCRIPT = `
local a = tonumber(redis.call('get', KEYS[1]) or '0')
local b = tonumber(redis.call('get', KEYS[2]) or '0')
local limitA = tonumber(ARGV[1])
local limitB = tonumber(ARGV[2])
local windowSec = tonumber(ARGV[3])
if a >= limitA then
  local ttl = redis.call('ttl', KEYS[1])
  return {0, math.max(1, ttl)}
end
if b >= limitB then
  local ttl = redis.call('ttl', KEYS[2])
  return {0, math.max(1, ttl)}
end
a = redis.call('incr', KEYS[1])
redis.call('expire', KEYS[1], windowSec, 'NX')
b = redis.call('incr', KEYS[2])
redis.call('expire', KEYS[2], windowSec, 'NX')
return {1, limitA - a, limitB - b}
`;

class UpstashBackend implements RateLimitBackend {
  constructor(
    private baseUrl: string,
    private token: string
  ) {}

  async hit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const redisKey = `rl:${normalizeKey(key)}`;
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    const res = await fetch(`${this.baseUrl}/pipeline`, {
      method: "POST",
      signal: AbortSignal.timeout(Math.min(5000, Math.max(250, Number.parseInt(process.env.RATE_LIMIT_REDIS_TIMEOUT_MS || "1500", 10) || 1500)),
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec, "NX"],
        ["TTL", redisKey],
      ]),
    });
    if (!res.ok) {
      console.error("[rate-limit] Upstash error", res.status);
      return failClosedResult();
    }
    const data = (await res.json()) as { result: unknown }[];
    const count = Number(data[0]?.result ?? 0);
    const ttl = Number(data[2]?.result ?? windowSec);
    if (count > limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSec: Math.max(1, ttl > 0 ? ttl : windowSec),
      };
    }
    return {
      ok: true,
      remaining: Math.max(0, limit - count),
      retryAfterSec: 0,
    };
  }
}

let backend: RateLimitBackend | null = null;

function getBackend(): RateLimitBackend {
  if (backend) return backend;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    backend = new UpstashBackend(url.replace(/\/$/, ""), token);
  } else {
    backend = new MemoryBackend();
  }
  return backend;
}

/** Allow tests to inject a backend */
export function setRateLimitBackend(b: RateLimitBackend | null) {
  backend = b;
}

export async function rateLimitPair(first: { key: string; limit: number }, second: { key: string; limit: number }, windowMs: number): Promise<{ first: RateLimitResult; second: RateLimitResult }> {
  if (!redisConfigured() && requireDistributedRateLimit()) {
    const denied = failClosedResult();
    return { first: denied, second: denied };
  }
  try {
    const b = getBackend();
    if (b.hitPair) return await b.hitPair(first, second, windowMs);
    const a = await b.hit(first.key, first.limit, windowMs);
    if (!a.ok) return { first: a, second: a };
    const c = await b.hit(second.key, second.limit, windowMs);
    return { first: a, second: c };
  } catch (err) {
    console.error("[rate-limit] pair backend failure", err instanceof Error ? err.message : "unknown");
    const denied = requireDistributedRateLimit() ? failClosedResult() : { ok: true, remaining: first.limit, retryAfterSec: 0 };
    return { first: denied, second: denied };
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!redisConfigured() && requireDistributedRateLimit()) {
    console.error("[rate-limit] Redis is required in this environment");
    return failClosedResult();
  }

  try {
    return await getBackend().hit(key, limit, windowMs);
  } catch (err) {
    console.error("[rate-limit] backend failure", err instanceof Error ? err.message : "unknown");
    return requireDistributedRateLimit()
      ? failClosedResult()
      : { ok: true, remaining: limit, retryAfterSec: 0 };
  }
}

export function resetRateLimitBackendForTests(): void {
  backend = null;
}
