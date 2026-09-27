/**
 * Validate and normalize a website URL for client creation.
 * Rejects private IPs, non-http(s) schemes, and overly long URLs.
 */
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
    // Auto-prepend https if no scheme
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

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and private ranges
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return { ok: false, error: "Private or local URLs are not allowed" };
  }

  // Normalize: strip trailing slash from pathname if root
  const normalized = parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname) +
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
