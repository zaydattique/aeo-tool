import { rateLimit, type RateLimitResult } from "./rate-limit";

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function billingCheckoutLimit(): number {
  return envInt("BILLING_CHECKOUT_RATE_LIMIT", 5, 1, 50);
}

export function billingCheckoutWindowMs(): number {
  return envInt("BILLING_CHECKOUT_RATE_WINDOW_MS", 60 * 60 * 1000, 60_000, 24 * 60 * 60 * 1000);
}

export function billingPortalLimit(): number {
  return envInt("BILLING_PORTAL_RATE_LIMIT", 10, 1, 100);
}

export function billingPortalWindowMs(): number {
  return envInt("BILLING_PORTAL_RATE_WINDOW_MS", 60 * 60 * 1000, 60_000, 24 * 60 * 60 * 1000);
}

export function billingUsageLimit(): number {
  return envInt("BILLING_USAGE_RATE_LIMIT", 60, 1, 600);
}

export function billingUsageWindowMs(): number {
  return envInt("BILLING_USAGE_RATE_WINDOW_MS", 60 * 1000, 10_000, 60 * 60 * 1000);
}

export function teamInviteLimit(): number {
  return envInt("TEAM_INVITE_RATE_LIMIT", 20, 1, 200);
}

export function teamInviteWindowMs(): number {
  return envInt("TEAM_INVITE_RATE_WINDOW_MS", 60 * 60 * 1000, 60_000, 24 * 60 * 60 * 1000);
}

export function pdfPerIpLimit(): number {
  return envInt("PDF_PER_IP_RATE_LIMIT", 30, 1, 300);
}

export function pdfPerTokenLimit(): number {
  return envInt("PDF_PER_TOKEN_RATE_LIMIT", 10, 1, 100);
}

export function pdfGlobalLimit(): number {
  return envInt("PDF_GLOBAL_RATE_LIMIT", 300, 10, 10_000);
}

export function pdfRateWindowMs(): number {
  return envInt("PDF_RATE_WINDOW_MS", 60 * 1000, 10_000, 60 * 60 * 1000);
}

export async function checkPdfRateLimit(ip: string, token: string, kind: "report" | "portal"): Promise<RateLimitResult> {
  const windowMs = pdfRateWindowMs();
  const prefix = kind === "report" ? "pdf-report" : "pdf-portal";

  const perIp = await rateLimit(`${prefix}:ip:${ip}`, pdfPerIpLimit(), windowMs);
  if (!perIp.ok) return perIp;

  const perToken = await rateLimit(`${prefix}:token:${token}`, pdfPerTokenLimit(), windowMs);
  if (!perToken.ok) return perToken;

  return rateLimit("pdf:global", pdfGlobalLimit(), windowMs);
}
