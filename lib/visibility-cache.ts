import { createHash, randomUUID } from "crypto";

export type CachedProviderResult<T> = {
  value: T;
  cacheHit: boolean;
};

const CACHE_VERSION = "v1";
const DEFAULT_TTL_SECONDS = 6 * 60 * 60;
const DEFAULT_LOCK_SECONDS = 45;
const WAIT_MS = 250;
const WAIT_ATTEMPTS = 80;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

function ttlSeconds() {
  const raw = Number.parseInt(process.env.VISIBILITY_CACHE_TTL_SECONDS || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_SECONDS;
}

function lockSeconds() {
  const raw = Number.parseInt(process.env.VISIBILITY_CACHE_LOCK_SECONDS || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LOCK_SECONDS;
}

function cacheKey(input: {
  engine: string;
  model: string;
  promptText: string;
  brandName: string;
  competitorName?: string | null;
  kind?: string;
}) {
  const canonical = JSON.stringify({
    v: CACHE_VERSION,
    engine: input.engine,
    model: input.model,
    promptText: input.promptText,
    brandName: input.brandName,
    competitorName: input.competitorName || null,
    kind: input.kind || "brand",
  });
  return `visibility:provider:${createHash("sha256").update(canonical).digest("hex")}`;
}

async function redisCommand<T>(baseUrl: string, token: string, command: unknown[]): Promise<T | null> {
  const res = await fetch(`${baseUrl}/${command[0] === "pipeline" ? "pipeline" : command[0].toString().toLowerCase()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command[0] === "pipeline" ? command[1] : command.slice(1)),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function get<T>(key: string): Promise<T | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  try {
    const result = await redisCommand<{ result: string | null }>(cfg.url, cfg.token, ["GET", key]);
    const raw = result?.result;
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function setNx(key: string, value: string, ttl: number): Promise<boolean> {
  const cfg = redisConfig();
  if (!cfg) return false;
  try {
    const result = await redisCommand<{ result: string }>(cfg.url, cfg.token, [
      "SET",
      key,
      value,
      "NX",
      "EX",
      String(ttl),
    ]);
    return result?.result === "OK";
  } catch {
    return false;
  }
}

async function del(key: string): Promise<void> {
  const cfg = redisConfig();
  if (!cfg) return;
  try {
    await redisCommand(cfg.url, cfg.token, ["DEL", key]);
  } catch {
    // Cache infrastructure must never break a visibility measurement.
  }
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
  if (cached != null) return { value: cached, cacheHit: true };

  const lockKey = `${key}:lock`;
  const owner = randomUUID();

  if (await setNx(lockKey, owner, lockSeconds())) {
    try {
      const secondCheck = await get<T>(key);
      if (secondCheck != null) return { value: secondCheck, cacheHit: true };

      const value = await loader();
      if (value != null) {
        await redisCommand(cfg.url, cfg.token, [
          "SET",
          key,
          JSON.stringify(value),
          "EX",
          String(ttlSeconds()),
        ]).catch(() => null);
      }
      return { value, cacheHit: false };
    } finally {
      await del(lockKey);
    }
  }

  // Another worker owns the request. Wait for its result instead of issuing
  // another expensive provider call. If it disappears, fail open to a direct call.
  for (let i = 0; i < WAIT_ATTEMPTS; i++) {
    await sleep(WAIT_MS);
    const result = await get<T>(key);
    if (result != null) return { value: result, cacheHit: true };
  }

  return { value: await loader(), cacheHit: false };
}
