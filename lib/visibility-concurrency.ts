/**
 * Distributed provider concurrency guard for live visibility calls.
 *
 * Redis-backed deployments use expiring leases stored in sorted sets so a
 * crashed worker cannot hold a provider slot forever. The lease is bounded by
 * the provider request timeout and is released with an ownership-safe ZREM.
 *
 * Limits are enforced atomically across:
 * - all live visibility provider calls
 * - one provider/engine
 * - one agency
 *
 * Without Redis, tests and local development use an in-process fallback.
 * Production can require Redis with VISIBILITY_CONCURRENCY_REQUIRE_REDIS=1
 * (the default in production) to prevent horizontal instances from bypassing
 * the distributed guard.
 */

import { createHash, randomUUID } from "crypto";
import {
  visibilityConcurrencyLeaseMs,
  visibilityConcurrencyPollMs,
  visibilityConcurrencyWaitMs,
  visibilityGlobalProviderConcurrency,
  visibilityProviderConcurrency,
  visibilityAgencyProviderConcurrency,
  visibilityConcurrencyRequireRedis,
} from "./visibility-config";

type RedisConfig = { url: string; token: string };

type RedisCommandResult = { result: unknown };

function redisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisPipeline(
  cfg: RedisConfig,
  commands: unknown[][]
): Promise<RedisCommandResult[] | null> {
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });
    if (!res.ok) return null;
    return (await res.json()) as RedisCommandResult[];
  } catch {
    return null;
  }
}

function redisKey(scope: string): string {
  const digest = createHash("sha256").update(scope).digest("hex").slice(0, 32);
  return `visibility:concurrency:${digest}`;
}

const ACQUIRE_SCRIPT = `
local now = tonumber(ARGV[1])
local expires = tonumber(ARGV[2])
local token = ARGV[3]
local globalLimit = tonumber(ARGV[4])
local providerLimit = tonumber(ARGV[5])
local agencyLimit = tonumber(ARGV[6])

redis.call('zremrangebyscore', KEYS[1], '-inf', now)
redis.call('zremrangebyscore', KEYS[2], '-inf', now)
redis.call('zremrangebyscore', KEYS[3], '-inf', now)

if redis.call('zcard', KEYS[1]) >= globalLimit then return 0 end
if redis.call('zcard', KEYS[2]) >= providerLimit then return 0 end
if redis.call('zcard', KEYS[3]) >= agencyLimit then return 0 end

redis.call('zadd', KEYS[1], expires, token)
redis.call('zadd', KEYS[2], expires, token)
redis.call('zadd', KEYS[3], expires, token)
return 1
`;

const RELEASE_SCRIPT = `
local token = ARGV[1]
local removed = 0
removed = removed + redis.call('zrem', KEYS[1], token)
removed = removed + redis.call('zrem', KEYS[2], token)
removed = removed + redis.call('zrem', KEYS[3], token)
return removed
`;

type LocalState = { global: number; provider: number; agency: number };

const localState = new Map<string, LocalState>();

function localKey(engine: string, agencyId: string): string {
  return `${engine}:agency:${agencyId}`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLocal(
  key: string,
  globalLimit: number,
  providerLimit: number,
  agencyLimit: number,
  waitMs: number
): Promise<() => void> {
  const started = Date.now();

  while (true) {
    const state = localState.get(key) ?? { global: 0, provider: 0, agency: 0 };
    if (
      state.global < globalLimit &&
      state.provider < providerLimit &&
      state.agency < agencyLimit
    ) {
      state.global += 1;
      state.provider += 1;
      state.agency += 1;
      localState.set(key, state);

      let released = false;
      return () => {
        if (released) return;
        released = true;
        const current = localState.get(key);
        if (!current) return;
        current.global = Math.max(0, current.global - 1);
        current.provider = Math.max(0, current.provider - 1);
        current.agency = Math.max(0, current.agency - 1);
        if (current.global === 0 && current.provider === 0 && current.agency === 0) {
          localState.delete(key);
        }
      };
    }

    if (Date.now() - started >= waitMs) {
      throw new Error("PROVIDER_CONCURRENCY_TIMEOUT");
    }
    await sleep(visibilityConcurrencyPollMs());
  }
}

async function acquireRedis(
  cfg: RedisConfig,
  engine: string,
  agencyId: string,
  token: string
): Promise<"acquired" | "busy" | "unavailable"> {
  const now = Date.now();
  const result = await redisPipeline(cfg, [
    [
      "EVAL",
      ACQUIRE_SCRIPT,
      "3",
      redisKey("global"),
      redisKey(`provider:${engine}`),
      redisKey(`agency:${agencyId}`),
      String(now),
      String(now + visibilityConcurrencyLeaseMs()),
      token,
      String(visibilityGlobalProviderConcurrency()),
      String(visibilityProviderConcurrency()),
      String(visibilityAgencyProviderConcurrency()),
    ],
  ]);
  if (!result) return "unavailable";
  return Number(result[0]?.result ?? 0) === 1 ? "acquired" : "busy";
}

async function releaseRedis(
  cfg: RedisConfig,
  engine: string,
  agencyId: string,
  token: string
): Promise<void> {
  await redisPipeline(cfg, [
    [
      "EVAL",
      RELEASE_SCRIPT,
      "3",
      redisKey("global"),
      redisKey(`provider:${engine}`),
      redisKey(`agency:${agencyId}`),
      token,
    ],
  ]);
}

export function resetVisibilityConcurrencyForTests() {
  localState.clear();
}

export async function withVisibilityProviderConcurrency<T>(
  opts: {
    agencyId: string;
    engine: string;
  },
  fn: () => Promise<T>
): Promise<T> {
  const globalLimit = visibilityGlobalProviderConcurrency();
  const providerLimit = visibilityProviderConcurrency();
  const agencyLimit = visibilityAgencyProviderConcurrency();

  if (globalLimit < 1 || providerLimit < 1 || agencyLimit < 1) {
    throw new Error("PROVIDER_CONCURRENCY_DISABLED");
  }

  const cfg = redisConfig();
  if (!cfg) {
    if (visibilityConcurrencyRequireRedis()) {
      throw new Error("PROVIDER_CONCURRENCY_REDIS_REQUIRED");
    }

    const release = await acquireLocal(
      localKey(opts.engine, opts.agencyId),
      globalLimit,
      providerLimit,
      agencyLimit,
      visibilityConcurrencyWaitMs()
    );
    try {
      return await fn();
    } finally {
      release();
    }
  }

  const token = randomUUID();
  const started = Date.now();

  while (true) {
    const result = await acquireRedis(cfg, opts.engine, opts.agencyId, token);

    if (result === "acquired") {
      try {
        return await fn();
      } finally {
        await releaseRedis(cfg, opts.engine, opts.agencyId, token);
      }
    }

    if (result === "unavailable") {
      if (visibilityConcurrencyRequireRedis()) {
        throw new Error("PROVIDER_CONCURRENCY_REDIS_UNAVAILABLE");
      }

      const release = await acquireLocal(
        localKey(opts.engine, opts.agencyId),
        globalLimit,
        providerLimit,
        agencyLimit,
        Math.max(1, visibilityConcurrencyWaitMs() - (Date.now() - started))
      );
      try {
        return await fn();
      } finally {
        release();
      }
    }

    if (Date.now() - started >= visibilityConcurrencyWaitMs()) {
      throw new Error("PROVIDER_CONCURRENCY_TIMEOUT");
    }
    await sleep(visibilityConcurrencyPollMs());
  }
}
