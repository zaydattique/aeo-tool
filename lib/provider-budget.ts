import { rateLimitPair } from "./rate-limit";

export type ProviderBudgetKind = "crawl" | "ai";

export type ProviderBudgetResult = {
  ok: boolean;
  retryAfterSec: number;
};

function envInt(name: string, fallback: number, min = 1, max = 1_000_000): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function providerBudgetWindowMs(): number {
  return envInt("PROVIDER_BUDGET_WINDOW_MS", 60 * 60 * 1000, 60_000, 24 * 60 * 60 * 1000);
}

export function providerGlobalCrawlBudget(): number {
  return envInt("PROVIDER_GLOBAL_CRAWL_BUDGET", 500, 1, 1_000_000);
}

export function providerAgencyCrawlBudget(): number {
  return envInt("PROVIDER_AGENCY_CRAWL_BUDGET", 60, 1, 100_000);
}

export function providerGlobalAiBudget(): number {
  return envInt("PROVIDER_GLOBAL_AI_BUDGET", 500, 1, 1_000_000);
}

export function providerAgencyAiBudget(): number {
  return envInt("PROVIDER_AGENCY_AI_BUDGET", 60, 1, 100_000);
}

export async function consumeProviderBudget(
  kind: ProviderBudgetKind,
  agencyId: string
): Promise<ProviderBudgetResult> {
  const windowMs = providerBudgetWindowMs();
  const globalLimit =
    kind === "crawl" ? providerGlobalCrawlBudget() : providerGlobalAiBudget();
  const agencyLimit =
    kind === "crawl" ? providerAgencyCrawlBudget() : providerAgencyAiBudget();

  // Check the tenant bucket first so a single agency cannot consume global
  // budget merely by attempting requests after its own allowance is exhausted.
  const pair = await rateLimitPair(
    {
      key: `provider-budget:${kind}:agency:${agencyId}`,
      limit: agencyLimit,
    },
    {
      key: `provider-budget:${kind}:global`,
      limit: globalLimit,
    },
    windowMs
  );

  if (!pair.first.ok) {
    return { ok: false, retryAfterSec: pair.first.retryAfterSec };
  }
  if (!pair.second.ok) {
    return { ok: false, retryAfterSec: pair.second.retryAfterSec };
  }

  return { ok: true, retryAfterSec: 0 };
}
