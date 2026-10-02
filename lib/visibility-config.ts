/** Configurable limits for visibility snapshot jobs. */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function visibilitySnapshotRateLimit(): number {
  return intEnv("VISIBILITY_SNAPSHOT_RATE_LIMIT", 5);
}

export function visibilitySnapshotRateWindowMs(): number {
  return intEnv("VISIBILITY_SNAPSHOT_RATE_WINDOW_MS", 10 * 60 * 1000);
}

export function visibilityOpsMonthlyLimit(): number {
  return intEnv("VISIBILITY_OPS_MONTHLY_LIMIT", 2000);
}

export function visibilityGlobalConcurrency(): number {
  return intEnv("VISIBILITY_GLOBAL_CONCURRENCY", 5);
}

export function visibilityAgencyConcurrency(): number {
  return intEnv("VISIBILITY_AGENCY_CONCURRENCY", 1);
}

export function visibilityPromptConcurrency(): number {
  return intEnv("VISIBILITY_PROMPT_CONCURRENCY", 2);
}

/** Maximum simultaneous live provider HTTP calls across the whole deployment. */
export function visibilityGlobalProviderConcurrency(): number {
  return intEnv("VISIBILITY_GLOBAL_PROVIDER_CONCURRENCY", 12);
}

/** Maximum simultaneous calls to one answer engine. */
export function visibilityProviderConcurrency(): number {
  return intEnv("VISIBILITY_PROVIDER_CONCURRENCY", 4);
}

/** Maximum simultaneous live provider calls attributable to one agency. */
export function visibilityAgencyProviderConcurrency(): number {
  return intEnv("VISIBILITY_AGENCY_PROVIDER_CONCURRENCY", 4);
}

/** Provider lease duration; must exceed the provider HTTP timeout. */
export function visibilityConcurrencyLeaseMs(): number {
  return intEnv("VISIBILITY_CONCURRENCY_LEASE_MS", 30_000);
}

/** Maximum time a prompt waits for a provider slot before failing. */
export function visibilityConcurrencyWaitMs(): number {
  return intEnv("VISIBILITY_CONCURRENCY_WAIT_MS", 20_000);
}

export function visibilityConcurrencyPollMs(): number {
  return intEnv("VISIBILITY_CONCURRENCY_POLL_MS", 250);
}

/** Production defaults to fail closed if Redis is missing/unavailable. */
export function visibilityConcurrencyRequireRedis(): boolean {
  const raw = process.env.VISIBILITY_CONCURRENCY_REQUIRE_REDIS;
  if (raw == null || raw === "") return process.env.NODE_ENV === "production";
  return raw === "1" || raw.toLowerCase() === "true";
}

/** Hard cap for one provider HTTP request so leases cannot be held indefinitely. */
export function visibilityProviderTimeoutMs(): number {
  return intEnv("VISIBILITY_PROVIDER_TIMEOUT_MS", 20_000);
}

export function visibilityCacheTtlSeconds(): number {
  return intEnv("VISIBILITY_CACHE_TTL_SECONDS", 6 * 60 * 60);
}

export function visibilityCacheLockSeconds(): number {
  return intEnv("VISIBILITY_CACHE_LOCK_SECONDS", 45);
}
