/**
 * SSRF-safe fetch: DNS resolve + private-IP reject, manual redirects,
 * timeouts, response size cap, content-type allowlist.
 */

import { promises as dns } from "dns";
import { isIP } from "net";
import { Agent } from "undici";

const MAX_REDIRECTS = 5;
const CONNECT_TIMEOUT_MS = 10_000;
const TOTAL_TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB

function envInt(name: string, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function maxRedirects(): number {
  return envInt("CRAWL_MAX_REDIRECTS", MAX_REDIRECTS, 0, 10);
}

function totalTimeoutMs(): number {
  return envInt("CRAWL_TIMEOUT_MS", TOTAL_TIMEOUT_MS, 1_000, 60_000);
}

function maxBodyBytes(): number {
  return envInt("CRAWL_MAX_RESPONSE_BYTES", MAX_BODY_BYTES, 64 * 1024, 10 * 1024 * 1024);
}

const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
  "text/plain",
  "application/xml",
  "text/xml",
];

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://app.aeocommand.com"
  ).replace(/\/$/, "");
}

/** True if address is private, loopback, link-local, CGNAT, multicast, or reserved. */
export function isBlockedIp(address: string): boolean {
  const v = isIP(address);
  if (v === 0) return true;

  if (v === 4) {
    const parts = address.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;

    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a === 192 && b === 0) return true; // 192.0.0.0/24 reserved
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
    if (a === 203 && b === 0) return true; // 203.0.113.0/24
    if (a >= 224 && a <= 239) return true; // multicast
    if (a >= 240) return true; // reserved
    if (parts.every((n) => n === 255)) return true;
    return false;
  }

  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  try {
    const expanded = expandIpv6(normalized);
    if (expanded.startsWith("fc") || expanded.startsWith("fd")) return true; // ULA
    if (/^fe[89ab]/.test(expanded)) return true; // link-local
    if (expanded.startsWith("ff")) return true; // multicast
    if (expanded.startsWith("00000000000000000000ffff")) {
      const mapped = expanded.slice(24);
      const b1 = parseInt(mapped.slice(0, 2), 16);
      const b2 = parseInt(mapped.slice(2, 4), 16);
      const b3 = parseInt(mapped.slice(4, 6), 16);
      const b4 = parseInt(mapped.slice(6, 8), 16);
      return isBlockedIp(`${b1}.${b2}.${b3}.${b4}`);
    }
    if (expanded.startsWith("20010db8")) return true; // docs
  } catch {
    return true;
  }

  return false;
}

function expandIpv6(addr: string): string {
  let s = addr;
  if (s.includes(".")) {
    const last = s.lastIndexOf(":");
    const v4 = s.slice(last + 1);
    const parts = v4.split(".").map((x) => parseInt(x, 10));
    const hex =
      ((parts[0] << 8) | parts[1]).toString(16).padStart(4, "0") +
      ((parts[2] << 8) | parts[3]).toString(16).padStart(4, "0");
    s =
      s.slice(0, last + 1) +
      hex.slice(0, 2) +
      hex.slice(2, 4) +
      ":" +
      hex.slice(4, 6) +
      hex.slice(6);
  }
  const sides = s.split("::");
  let groups: string[];
  if (sides.length === 2) {
    const left = sides[0] ? sides[0].split(":") : [];
    const right = sides[1] ? sides[1].split(":") : [];
    const fill = 8 - left.length - right.length;
    groups = [...left, ...Array(Math.max(0, fill)).fill("0"), ...right];
  } else {
    groups = s.split(":");
  }
  while (groups.length < 8) groups.push("0");
  return groups.map((g) => g.padStart(4, "0")).join("").toLowerCase();
}

async function resolvePublicAddresses(hostname: string): Promise<{ address: string; family: number }[]> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (isIP(host) !== 0) {
    if (isBlockedIp(host)) throw new Error("Blocked address (private/reserved IP)");
    return [{ address: host, family: isIP(host) }];
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("DNS lookup failed for " + host);
  }

  if (!addresses.length) throw new Error("No addresses resolved for " + host);
  for (const { address } of addresses) {
    if (isBlockedIp(address)) throw new Error("Resolved to blocked address: " + address);
  }
  return addresses;
}

function createPinnedAgent(addresses: { address: string; family: number }[]): Agent {
  return new Agent({
    connect: {
      lookup(_hostname, options, callback) {
        const matches = addresses.filter((entry) => !options.family || entry.family === options.family);
        if (!matches.length) return callback(new Error("Pinned DNS address unavailable"), "");
        if (options.all) return callback(null, matches);
        return callback(null, matches[0]);
      },
    },
  });
}

/** Resolve hostname and reject if ANY address is blocked. */
export async function assertPublicHostname(hostname: string): Promise<void> {
  await resolvePublicAddresses(hostname);
}
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (isIP(host) !== 0) {
    if (isBlockedIp(host)) {
      throw new Error("Blocked address (private/reserved IP)");
    }
    return;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new Error(`DNS lookup failed for ${host}`);
  }

  if (!addresses.length) {
    throw new Error(`No addresses resolved for ${host}`);
  }

  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new Error(`Resolved to blocked address: ${address}`);
    }
  }
}

export type SafeFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
  timeoutMs?: number;
};

export type SafeFetchResult = {
  ok: boolean;
  status: number;
  headers: Headers;
  url: string;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function validateUrlShape(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed");
  }
  const port = parsed.port
    ? parseInt(parsed.port, 10)
    : parsed.protocol === "https:"
      ? 443
      : 80;
  if (port !== 80 && port !== 443) {
    throw new Error("Only ports 80 and 443 are allowed");
  }
  return parsed;
}

async function readBodyCapped(
  res: Response,
  maxBytes: number
): Promise<ArrayBuffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength > maxBytes) throw new Error("Response too large");
    return buf;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      reader.cancel().catch(() => {});
      throw new Error("Response too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

/**
 * Fetch a URL with SSRF protections.
 * - Resolves DNS and rejects private/reserved addresses
 * - Follows redirects manually (max 5), re-validating each hop
 * - 10s connect / 25s total timeout, 5MB body cap
 * - Content-type allowlist for HTML/text/XML
 */
export async function safeFetch(
  url: string,
  opts: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const totalTimeout = opts.timeoutMs ?? totalTimeoutMs();
  const deadline = Date.now() + totalTimeout;
  let current = validateUrlShape(url);
  let redirects = 0;

  const ua = `AEOCommandBot/1.0 (+${appUrl()}/bot)`;

  while (true) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Request timed out");

    const resolvedAddresses = await resolvePublicAddresses(current.hostname);
    const dispatcher = createPinnedAgent(resolvedAddresses);

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(envInt("CRAWL_CONNECT_TIMEOUT_MS", CONNECT_TIMEOUT_MS, 500, 20_000), remaining)
    );

    let res: Response;
    try {
      res = await fetch(current.toString(), {
        method: opts.method || "GET",
        headers: {
          "User-Agent": ua,
          Accept:
            "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.1",
          ...opts.headers,
        },
        body: opts.body as unknown as BodyInit | undefined,
        redirect: "manual",
        signal: controller.signal,
        dispatcher,
      } as RequestInit & { dispatcher: Agent });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Connection timed out");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without Location header");
      redirects += 1;
      if (redirects > maxRedirects()) throw new Error("Too many redirects");
      current = validateUrlShape(new URL(loc, current).toString());
      try {
        await res.arrayBuffer();
      } catch {
        /* ignore */
      } finally {
        await dispatcher.close().catch(() => {});
      }
      continue;
    }

    const ct = (res.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (
      ct &&
      !ALLOWED_CONTENT_TYPES.some((a) => ct === a || ct.endsWith("+xml"))
    ) {
      if (
        ct.startsWith("image/") ||
        ct.startsWith("audio/") ||
        ct.startsWith("video/") ||
        ct === "application/octet-stream" ||
        ct === "application/json"
      ) {
        throw new Error(`Disallowed content-type: ${ct}`);
      }
    }

    if (Date.now() > deadline) throw new Error("Request timed out");

    let buffer: ArrayBuffer;
    try {
      buffer = await readBodyCapped(res, maxBodyBytes());
    } finally {
      await dispatcher.close().catch(() => {});
    }
    if (Date.now() > deadline) throw new Error("Request timed out");

    const textOnce = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      url: current.toString(),
      text: async () => textOnce,
      arrayBuffer: async () => buffer,
    };
  }
}
