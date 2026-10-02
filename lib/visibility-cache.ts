import { createHash, randomUUID } from "crypto";
import {
  visibilityCacheLockSeconds,
  visibilityCacheTtlSeconds,
} from "./visibility-config";

export type CachedProviderResult<T> = {
  value: T;
  cacheHit: boolean;
  cachedAt?: string;
};

type CacheEnvelope<T> = {
  value: T;
  cachedAt: string;
};

const CACHE_VERSION = "v1";
const WAIT_MS = 250;
const WAIT_ATTEMPTS = 80;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

function cacheKey(input: {
  agencyId: string;
  clientId: string;
  engine: string;
  model: string;
  promptText: string;
  brandName: string;
  competitorName?: string | null;
  kind?: string;
}) {
  const canonical = JSON.stringify({
    v: CACHE_VERSION,
    agencyId: input.agencyId,
    clientId: input.clientId,
    engine: input.engine,
    model: input.model,
    promptText: input.promptText,
    brandName: input.brandName,
    competitorName: input.competitorName || null,
    kind: input.kind || "brand",
  });
  return `visibility:provider:${createHash("sha256").update(canonical).digest("hex")}`;
}

async function pipeline<T>(baseUrl: string, token: string, commands: unknown[][]): Promise<T[] | null> {
  try {
    const res = await fetch(`${baseUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

async function get<T>(key: string): Promise<CacheEnvelope<T> | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  const result = await pipeline<{ result: string | null }>(cfg.url, cfg.token, [["GET", key]]);
  const raw = result?.[0]?.result;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed !== "object" || !parsed.cachedAt || !("value" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function setNx(key: string, value: string, ttl: number): Promise<"acquired" | "busy" | "unavailable"> {
  const cfg = redisConfig();
  if (!cfg) return "unavailable";
  const result = await pipeline<{ result: string }>(cfg.url, cfg.token, [
    ["SET", key, value, "NX", "EX", String(ttl)],
  ]);
  if (!result) return "unavailable";
  return result[0]?.result === "OK" ? "acquired" : "busy";
}

async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  const cfg = redisConfig();
  if (!cfg) return;
  const envelope: CacheEnvelope<unknown> = { value, cachedAt: new Date().toISOString() };
  await pipeline(cfg.url, cfg.token, [["SET", key, JSON.stringify(envelope), "EX", String(ttl)]]);
}

async function releaseLock(key: string, owner: string): Promise<void> {
  const cfg = redisConfig();
  if (!cfg) return;

  // Compare-and-delete prevents an expired lock from being deleted after a
  // different worker has already acquired the same lock.
  await pipeline(cfg.url, cfg.token, [[
    "EVAL",
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    "1",
    key,
    owner,
  ]]);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared provider-result cache + distributed single-flight.
 *
 * If Redis is unavailable, this deliberately becomes a no-op rather than
 * pretending that an in-process cache is safe for a horizontally scaled app.
 */
export async function withProviderCache<T>(
  input: {
    agencyId: string;
    clientId: string;
    engine: string;
    model: string;
    promptText: string;
    brandName: string;
    competitorName?: string | null;
    kind?: string;
  },
  loader: () => Promise<T | null>
): Promise<CachedProviderResult<T | null>> {
  const cfg = redisConfig();
  if (!cfg) {
    return { value: await loader(), cacheHit: false };
  }

  const key = cacheKey(input);
  const cached = await get<T>(key);
  if (cached != null) return { value: cached.value, cacheHit: true, cachedAt: cached.cachedAt };

  const lockKey = `${key}:lock`;
  const owner = randomUUID();

  const lock = await setNx(lockKey, owner, visibilityCacheLockSeconds());
  if (lock === "unavailable") {
    // Redis is an optimization/cost-control layer, not a hard dependency for
    // completing a measurement. Fail open immediately if Redis is unhealthy.
    return { value: await loader(), cacheHit: false };
  }

  if (lock === "acquired") {
    try {
      const secondCheck = await get<T>(key);
      if (secondCheck != null) return { value: secondCheck.value, cacheHit: true, cachedAt: secondCheck.cachedAt };

      const value = await loader();
      if (value != null) {
        await setCache(key, value, visibilityCacheTtlSeconds());
      }
      return { value, cacheHit: false };
    } finally {
      await releaseLock(lockKey, owner);
    }
  }

  // Another worker owns the request. Wait for its result instead of issuing
  // another expensive provider call. If it disappears, fail open to a direct call.
  for (let i = 0; i < WAIT_ATTEMPTS; i++) {
    await sleep(WAIT_MS);
    const result = await get<T>(key);
    if (result != null) return { value: result.value, cacheHit: true, cachedAt: result.cachedAt };
  }

  return { value: await loader(), cacheHit: false };
}
