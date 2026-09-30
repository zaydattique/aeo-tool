/**
 * Validate and normalize a website URL for client creation.
 * Rejects private IPs, IP literals, credentials, non-public TLDs,
 * non-http(s) schemes, and overly long URLs.
 */

const BLOCKED_TLDS = new Set([
  "local",
  "localhost",
  "internal",
  "lan",
  "intranet",
  "home",
  "corp",
  "private",
  "test",
  "invalid",
  "example",
  "localdomain",
]);

function isIpLiteral(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  if (h.includes(":")) return true;
  if (/^0x[0-9a-f]+$/i.test(h)) return true;
  if (/^0[0-7]+$/.test(h)) return true;
  if (/^\d+$/.test(h) && h.length >= 8) return true; // e.g. 2130706433
  return false;
}

export function validateWebsiteUrl(raw: string): {
  ok: true;
  url: string;
} | {
  ok: false;
  error: string;
} {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: "URL is required" };
  }

  if (trimmed.length > 2048) {
    return { ok: false, error: "URL is too long" };
  }

  let parsed: URL;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "URLs with credentials are not allowed" };
  }

  const port = parsed.port
    ? parseInt(parsed.port, 10)
    : parsed.protocol === "https:"
      ? 443
      : 80;
  if (port !== 80 && port !== 443) {
    return { ok: false, error: "Only ports 80 and 443 are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (!hostname) {
    return { ok: false, error: "Invalid hostname" };
  }

  if (isIpLiteral(hostname)) {
    return {
      ok: false,
      error: "IP addresses are not allowed; use a public domain name",
    };
  }

  const labels = hostname.split(".");
  const tld = labels[labels.length - 1] || "";
  if (BLOCKED_TLDS.has(tld) || hostname === "localhost") {
    return {
      ok: false,
      error: "Private or non-public domains are not allowed",
    };
  }

  if (!hostname.includes(".")) {
    return {
      ok: false,
      error: "Hostname must be a fully-qualified public domain",
    };
  }

  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".localhost")
  ) {
    return { ok: false, error: "Private or local URLs are not allowed" };
  }

  const normalized =
    parsed.origin +
    (parsed.pathname === "/" ? "" : parsed.pathname) +
    parsed.search;

  return { ok: true, url: normalized };
}

export function suggestBrandName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "";
  }
}
