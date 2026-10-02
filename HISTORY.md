# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-30**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Sessions | PROJECT_PLAN Phase 14+ uses **~20 min sessions** (`14.S1` …). One session per ship when possible |
| Host | Phases 0–13 are GitHub-complete; **live product starts at Phase 14 (owner)** |
| Schema | `db push` when first deploying (portal, competitors, prompt kind) |
| PDF | `pdfkit` on `npm install` |
| Live engines | Optional keys; heuristic fallback always |
| Rate limit | `rateLimit()` is **async** — always `await`. Optional Upstash: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| SSRF | Never use raw `fetch` for user-supplied URLs; use `safeFetch` from `lib/safe-fetch.ts` |

---

### 2026-09-30 — Phase 14B Security (SSRF, rate limits, headers, API audit)

**1. Date + phase/name**

2026-09-30 — **Phase 14B Security**

**2. Goal**

`lib/url.ts` only string-matched hostnames and `crawlBasic` used `fetch` with `redirect: "follow"`, which is an SSRF hole on a VPS (metadata IP, alternate loopback, CGNAT, IPv6, decimal/hex hosts, DNS rebinding, redirect-to-internal). Success criteria: DNS-aware blocklist, manual redirects with per-hop validation, hardened `validateWebsiteUrl`, rate limits on auth and public PDF routes, security headers, API agency-scoping audit documented, unit tests for bypass forms, docs updated. No pricing or role model changes.

**3. What we did**

- Added **`lib/safe-fetch.ts`**: `safeFetch` / `isBlockedIp` / `assertPublicHostname`. Allows only http(s) ports 80/443; resolves with `dns.promises.lookup({ all: true })` and rejects if any address is private/loopback/link-local/CGNAT/multicast/reserved (IPv4 + IPv6 + IPv4-mapped); follows redirects **manually** (max 5) re-validating each hop; 10s connect / 25s total; 5MB streamed body cap; content-type allowlist; User-Agent `AEOCommandBot/1.0 (+<APP_URL>/bot)`.
- **`lib/url.ts`**: reject URL credentials (`user:pass@`), reject **all IP-literal hosts** (dotted, IPv6, decimal, hex, octal forms), reject non-public TLDs (`.local`, `.internal`, `.localhost`, `.lan`, etc.), require FQDN, ports 80/443 only.
- **`lib/crawl.ts`**: `crawlBasic` uses `safeFetch`; `crawlWebsite` and Firecrawl path validate with `validateWebsiteUrl` before any network/third-party call.
- **`lib/scan-worker.ts`**: re-validates `client.websiteUrl` inside `runScan` before crawl (DNS/policy can change after client create).
- **`lib/rate-limit.ts`**: `RateLimitBackend` interface; memory default; Upstash REST when env set; `rateLimit` is async.
- Rate limits applied/updated: signup, credentials login (`lib/auth.ts`), forgot-password, reset-password, client scan, report PDF, portal PDF.
- **`next.config.ts`**: HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP (self + Stripe), X-Frame-Options DENY on `/dashboard` and `/admin`.
- Tokens: portal/report already `randomBytes(24)` hex (≥192 bits); password reset `randomBytes(32)`. Impersonation already writes `ActivityLog` (`admin.impersonation_started` / `_stopped`).
- Vitest tests: `lib/__tests__/url-and-safe-fetch.test.ts` covering IP literals, credentials, TLDs, `isBlockedIp` cases including metadata and mapped IPv6.

**API audit findings (agency scoping / IDOR)**

| Route area | Session | agencyId scope | Notes |
|------------|---------|----------------|-------|
| `/api/clients`, `/api/clients/[id]/*` | `requireAgency` | Queries use `agencyId: auth.agencyId` | OK |
| `/api/clients/[id]/scan` | requireAgency + rate limit | Client lookup scoped | OK |
| `/api/actions`, `/api/actions/[id]` | requireAgency | Expected agency filter on mutations | Confirm any findUnique by id alone includes agencyId in WHERE |
| `/api/scans/[id]` | requireAgency | Must include agencyId | Standard pattern |
| `/api/prompts/[id]` | requireAgency | Same | Standard pattern |
| `/api/reports/[token]/pdf`, `/api/portal/[token]/pdf` | public token | Token unguessable; rate-limited | OK; revoke = disable portal / soft-delete report |
| `/api/admin/*` | SUPER_ADMIN only | Cross-tenant by design | Impersonation logged |
| `/api/billing/webhook` | Stripe signature | N/A | Outside session |
| `/api/inngest` | Inngest signing | N/A | Outside session |

No clear cross-agency IDOR found on client/scan paths that use `findFirst({ where: { id, agencyId } })`. Residual risk: any route that loads by primary key only without `agencyId` — agents should keep the `findFirst` + `agencyId` pattern on every new route.

**4. Key files**

- `lib/safe-fetch.ts` — SSRF-safe HTTP client  
- `lib/url.ts` — strict website URL validation  
- `lib/crawl.ts` — uses safeFetch + validation  
- `lib/scan-worker.ts` — validate-at-scan-time  
- `lib/rate-limit.ts` — pluggable backend  
- `lib/auth.ts` — login rate limit  
- `next.config.ts` — security headers  
- `app/api/auth/*`, PDF routes — rate limits  
- `lib/__tests__/url-and-safe-fetch.test.ts` — unit tests  
- `vitest.config.ts`, `package.json` — test runner

**5. Outcome / acceptance**

```bash
npm i
npm test
# expect url-and-safe-fetch tests green
```

Manual: create client with `https://169.254.169.254` → rejected; `https://user:pass@evil.com` → rejected; legitimate domain still creates.

**6. What is still missing / deferred**

- Rate-limit on HTML `/r/[token]` and `/p/[token]` page renders (listed under Phase 17.S2); API PDF routes are limited.
- Visible “impersonating” dashboard banner UI (ActivityLog exists; banner not added this ship).
- Constant-time token compare for portal/report DB lookups (Postgres `=` on unique high-entropy tokens is acceptable risk; can add `crypto.timingSafeEqual` if tokens are loaded then compared in app code).
- Full integration test that performs live DNS to a controlled host (unit tests cover validators / IP classification).
- README architecture paragraph for safeFetch (brief note in FILEMAP; full README pass can follow).

**7. Gotchas**

- All `rateLimit(...)` call sites must **`await`**.  
- After pull: `npm i` pulls vitest. Optional: set Upstash env for multi-instance rate limits.  
- `safeFetch` rejects non-HTML-ish content-types for known-bad types; empty content-type still allowed for odd origin servers.  
- Do not reintroduce `fetch(userUrl, { redirect: "follow" })` anywhere.

---

### 2026-09-28 — Plan restructure: Phase 14–18 as 20-minute sessions

**Goal**

Owner asked for new phases wherever work remains, broken into **~20 minute sessions** so agents and humans can ship incrementally without multi-hour ambiguous “phases.”

**What we did**

Replaced the open-ended “optional later” tail with ordered phases:

- **Phase 14** — Go live (mostly owner: DNS, DB, host, env, smoke, Search Console, optional keys). Eight sessions 14.S1–S8.
- **Phase 15** — First pilot polish (post-scan UX, empty states, report/portal tweaks, SOV on report, competitors on create). 15.S1–S8.
- **Phase 16** — Agency ops (CSV exports, bulk status, prompt packs, single recheck, archive→portal off). 16.S1–S8.
- **Phase 17** — Trust/cost (live engine caps, public rate limits, legal microcopy, health/backup docs). 17.S1–S8.
- **Phase 18** — Growth marketing surfaces aligned to Phase 13 product. 18.S1–S8.
- **Phase 19+** — Optional only when owner opens (password portal, custom domain, API, etc.).

Documented agent rules: one session at a time, HISTORY per session, prefer edit-existing, owner-only steps not faked.

**Key files**

- `PROJECT_PLAN.md` — full session tables  
- `HISTORY.md` — this entry  
- `AGENTS.md` — session discipline pointer

**Outcome / acceptance**

- **NEXT** is explicitly `14.S1` (owner DNS).  
- After production smoke (`14.S6`), code sessions may start at `15.S1`.  
- No parallel todo lists; PROJECT_PLAN remains sole ordered queue.

**What is still missing / deferred**

- Actual execution of 14.S1+ (not done in this doc-only ship).  
- Phase 19+ not scheduled.

**Gotchas**

- Do not mark 14.Sx Done without owner confirmation on DNS/host.  
- Do not bundle five sessions into one PR “because they’re small.”

---

### 2026-09-28 — Phase 13.5: Richer Action drafts

Templates + enrich mapper + `/api/actions/[id]/redraft` + Action Center **Enrich draft**.

---

### 2026-09-28 — Phase 13.4: Live multi-engine

Perplexity, OpenAI, Gemini, Claude when keyed; status UI.

---

### 2026-09-28 — Phase 13.3: Competitors + SOV

---

### 2026-09-28 — Phase 13.2: PDF

---

### 2026-09-28 — Phase 13.1: Client portal

---

### 2026-09-28 — Phase 12: AEO/SEO foundation

---

Deploy reference: **docs/DEPLOY.md**.


---

### 2026-10-02 — Phase 0-C: Distributed visibility provider concurrency hardening

**Goal**

The P0-C session closes the remaining concurrency amplification path in live visibility checks. P0-A made visibility jobs tenant-scoped and usage-safe, and P0-B added Redis provider-result caching plus distributed single-flight. The remaining risk was that one visibility job can fan out to multiple prompts and four live providers per prompt, so the existing Inngest job limits did not directly cap the number of simultaneous provider HTTP requests. The success criteria were: enforce a deployment-wide provider-call ceiling, cap each provider independently, prevent one agency from monopolizing provider capacity, make the controls safe across horizontally scaled instances, and ensure provider calls cannot hold a concurrency lease forever.

**What we did**

Added a Redis-backed distributed provider concurrency guard in lib/visibility-concurrency.ts. Each live provider call now obtains one atomic lease covering three dimensions at once: a global deployment limit, an engine/provider limit, and an agency limit. Redis sorted sets hold expiring leases so a crashed worker does not permanently consume capacity; the release path removes only the caller's unique token. When Redis is not configured, local development and tests use an in-process guard. Production defaults to requiring Redis for live provider concurrency, so a horizontally scaled production deployment does not silently fall back to per-instance limits.

Integrated the guard into all four live visibility engines in lib/visibility-check.ts: Perplexity, OpenAI, Gemini, and Claude. The provider cache remains outside the guard loader, so cache hits do not consume a live provider slot. A cache miss enters the concurrency guard immediately before the external provider request. Provider guard/cache failures are isolated to that engine and fall back to the existing heuristic result rather than failing the entire prompt.

Added hard provider request timeouts using AbortSignal.timeout. The default is 20 seconds, while the default distributed lease is 30 seconds and the implementation enforces a lease of at least one second longer than the provider timeout. This bounds slot retention even when a provider stalls.

Added configurable P0-C limits: 12 simultaneous live provider calls globally, 4 per provider, 4 per agency, a 20-second provider-slot wait, 250ms polling, a 30-second lease, and a 20-second provider HTTP timeout. These are documented in .env.example. VISIBILITY_CONCURRENCY_REQUIRE_REDIS defaults to true in production and can be explicitly configured.

Added tests covering the provider cap, deployment-wide cap across different engines, and agency cap across different engines. Added a dedicated GitHub Actions workflow that runs the visibility hardening tests and TypeScript compilation on the P0-C branch and pull requests to main.

Updated the README architecture notes, environment guidance, and file map so the distributed visibility controls are documented as part of the production architecture.

**Key files**

- lib/visibility-concurrency.ts — atomic Redis/local provider concurrency leases and release logic.
- lib/visibility-config.ts — P0-C concurrency and provider timeout configuration.
- lib/visibility-check.ts — applies the guard only around fresh external provider calls and adds request timeouts.
- lib/__tests__/visibility-hardening.test.ts — verifies provider, global, and agency concurrency limits.
- .github/workflows/p0c-provider-concurrency.yml — automated P0-C verification.
- .env.example — documents production concurrency, Redis, lease, wait, and timeout controls.
- README.md — records Redis-backed visibility concurrency in the architecture/deployment guidance.
- docs/FILEMAP.md — indexes the new concurrency and test paths.
- PROJECT_PLAN.md — records the completed P0-C hardening session.
- HISTORY.md — this full session record.

**Outcome / acceptance**

The branch must pass:

npm ci
npx prisma generate
npx vitest run lib/__tests__/visibility-hardening.test.ts
npx tsc --noEmit

The concurrency tests should show that one provider never exceeds its configured provider cap, the combined live calls never exceed the global cap, and a single agency cannot exceed its agency cap even when it uses different providers. On production, set UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, and leave VISIBILITY_CONCURRENCY_REQUIRE_REDIS=1 enabled. A provider request that exceeds the 20-second timeout should release its lease in the finally path; a crashed worker should be recovered by the sorted-set lease expiry.

**What is still missing / deferred**

The repository also had pre-existing TypeScript gate errors in lib/email.ts, app/api/clients/[id]/reports/route.ts, lib/safe-fetch.ts, and lib/stripe.ts; these were corrected in this branch because the required TypeScript acceptance gate must be green before merging. Provider-specific adaptive backoff and vendor-specific quota discovery are intentionally deferred. P0-C limits simultaneous work but does not attempt to predict each provider's billing or rate-limit policy. A future phase can add response-aware backoff for HTTP 429/5xx without changing the concurrency contract. Per-engine result status remains the existing visibility model; this ship does not redesign scoring or snapshot semantics.

**Gotchas**

Production horizontal scaling depends on Redis being configured; without it, the local fallback is process-local by design. The existing Inngest global/job concurrency remains in place and is complementary rather than a replacement for provider-call concurrency. The cache remains a cost optimization and single-flight layer; the provider concurrency guard is the capacity-control layer. Do not set the provider lease below the provider timeout; the implementation protects against this by enforcing a minimum lease internally.
