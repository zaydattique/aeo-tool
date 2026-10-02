/**
 * Configurable limits for visibility snapshot jobs.
 * Prefer env over magic numbers. Plan-level AI ops can be layered later.
 */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Max snapshot job starts per agency per window (HTTP rate limit). */
export function visibilitySnapshotRateLimit(): number {
  return intEnv("VISIBILITY_SNAPSHOT_RATE_LIMIT", 5);
}

/** Rate-limit window in ms (default 10 minutes). */
export function visibilitySnapshotRateWindowMs(): number {
  return intEnv("VISIBILITY_SNAPSHOT_RATE_WINDOW_MS", 10 * 60 * 1000);
}

/**
 * Monthly AI visibility operation budget per agency.
 * One op ≈ one live provider call (prompt × live engine).
 * Heuristic-only runs still reserve 1 op per prompt as a soft unit.
 */
export function visibilityOpsMonthlyLimit(): number {
  return intEnv("VISIBILITY_OPS_MONTHLY_LIMIT", 2000);
}

/** Global Inngest concurrency for visibility jobs. */
export function visibilityGlobalConcurrency(): number {
  return intEnv("VISIBILITY_GLOBAL_CONCURRENCY", 5);
}

/** Per-agency Inngest concurrency for visibility jobs. */
export function visibilityAgencyConcurrency(): number {
  return intEnv("VISIBILITY_AGENCY_CONCURRENCY", 1);
}

/** Max prompts processed in parallel inside one job. */
export function visibilityPromptConcurrency(): number {
  return intEnv("VISIBILITY_PROMPT_CONCURRENCY", 2);
}
