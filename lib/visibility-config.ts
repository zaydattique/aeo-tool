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

export function visibilityCacheTtlSeconds(): number {
  return intEnv("VISIBILITY_CACHE_TTL_SECONDS", 6 * 60 * 60);
}

export function visibilityCacheLockSeconds(): number {
  return intEnv("VISIBILITY_CACHE_LOCK_SECONDS", 45);
}
