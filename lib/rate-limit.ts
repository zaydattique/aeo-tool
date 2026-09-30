/**
 * Rate limiter with pluggable backend.
 * - Default: in-memory (single process)
 * - When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set: Upstash REST
 *
 * `rateLimit` is async so Redis works; existing callers must await.
 */

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export interface RateLimitBackend {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
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
    const redisKey = `rl:${key}`;
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    const res = await fetch(`${this.baseUrl}/pipeline`, {
      method: "POST",
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
      return { ok: true, remaining: limit, retryAfterSec: 0 };
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

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  return getBackend().hit(key, limit, windowMs);
}
