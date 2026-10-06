### 2026-10-05 - Phase 1 identity, sessions, authorization, and Super Admin

**Branch:** `phase1-identity-sessions-super-admin`

**Status:** Verification complete on the Phase 1 CI gate. PR #25 remains unmerged pending explicit owner approval.

**Implemented**

- Added revocable server-side sessions bound to JWT session identifiers, with expiry and throttled last-activity updates.
- Added self-service session inspection and revocation.
- Added Super Admin users, sessions, and security-event APIs.
- Added centralized security-event recording with actor, agency, target, severity, IP, user agent, timestamp, and metadata.
- Added persistent impersonation banner with visible expiry and stop control.
- Added mandatory TOTP MFA for SUPER_ADMIN and AGENCY_OWNER, with encrypted secrets and one-time recovery codes.
- Added password-verified MFA enrollment for existing privileged accounts before privileged login can proceed.
- Raised the password baseline to 12 characters for signup, reset, and Super Admin-created owners.
- Revoked all active sessions after password reset.
- Removed password hashes and session token identifiers from admin/session API responses.
- Expanded the Super Admin UI with users, sessions, and security event visibility.
- Added Phase 1 CI covering Prisma generation/validation, TypeScript, tests, and production build.

**Verification**

- Prisma generate: PASS
- Prisma validate: PASS
- TypeScript: PASS
- Test suite: PASS
- Production build: PASS
- P0-B through P0-R regression workflows on the Phase 1 head: PASS
- Phase 1 security response contract tests: included in the passing suite

**Merge rule**

Do not merge PR #25 until the owner explicitly requests the merge after reviewing this report.

---

### 2026-10-05 - Phase 0 verification branch started

**Goal**

Create one isolated verification branch that combines the existing P0-T hardening with the new master product execution plan without touching `main`.

**What we did**

- Started `phase0-verified-master-integration` from the verified P0-T code head `1aacd260f59e04dfacb442722e5e27b3eb26b555`.
- Fixed the four known missing shared request-security imports that caused the P0-T TypeScript gate to fail.
- Integrated the existing master `PROJECT_PLAN.md`, `AGENTS.md`, and `HISTORY.md` into this verification branch.
- Preserved the rule that no merge to `main` happens until the full verification gate is green and the owner explicitly asks for the merge.

**Verification pending**

The branch still requires the full TypeScript, Prisma, test, build, security regression, and relevant workflow checks before it is eligible for merge.

**Important**

This branch is the only place for the current verification work. `main` has not been changed.

---

# AEO Command - HISTORY

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
| Rate limit | `rateLimit()` is **async** - always `await`. Optional Upstash: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| SSRF | Never use raw `fetch` for user-supplied URLs; use `safeFetch` from `lib/safe-fetch.ts` |

---

### 2026-09-30 - Phase 14B Security (SSRF, rate limits, headers, API audit)

**1. Date + phase/name**

2026-09-30 - **Phase 14B Security**

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

No clear cross-agency IDOR found on client/scan paths that use `findFirst({ where: { id, agencyId } })`. Residual risk: any route that loads by primary key only without `agencyId` - agents should keep the `findFirst` + `agencyId` pattern on every new route.

**4. Key files**

- `lib/safe-fetch.ts` - SSRF-safe HTTP client  
- `lib/url.ts` - strict website URL validation  
- `lib/crawl.ts` - uses safeFetch + validation  
- `lib/scan-worker.ts` - validate-at-scan-time  
- `lib/rate-limit.ts` - pluggable backend  
- `lib/auth.ts` - login rate limit  
- `next.config.ts` - security headers  
- `app/api/auth/*`, PDF routes - rate limits  
- `lib/__tests__/url-and-safe-fetch.test.ts` - unit tests  
- `vitest.config.ts`, `package.json` - test runner

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

### 2026-09-28 - Plan restructure: Phase 14–18 as 20-minute sessions

**Goal**

Owner asked for new phases wherever work remains, broken into **~20 minute sessions** so agents and humans can ship incrementally without multi-hour ambiguous “phases.”

**What we did**

Replaced the open-ended “optional later” tail with ordered phases:

- **Phase 14** - Go live (mostly owner: DNS, DB, host, env, smoke, Search Console, optional keys). Eight sessions 14.S1–S8.
- **Phase 15** - First pilot polish (post-scan UX, empty states, report/portal tweaks, SOV on report, competitors on create). 15.S1–S8.
- **Phase 16** - Agency ops (CSV exports, bulk status, prompt packs, single recheck, archive→portal off). 16.S1–S8.
- **Phase 17** - Trust/cost (live engine caps, public rate limits, legal microcopy, health/backup docs). 17.S1–S8.
- **Phase 18** - Growth marketing surfaces aligned to Phase 13 product. 18.S1–S8.
- **Phase 19+** - Optional only when owner opens (password portal, custom domain, API, etc.).

Documented agent rules: one session at a time, HISTORY per session, prefer edit-existing, owner-only steps not faked.

**Key files**

- `PROJECT_PLAN.md` - full session tables  
- `HISTORY.md` - this entry  
- `AGENTS.md` - session discipline pointer

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

### 2026-09-28 - Phase 13.5: Richer Action drafts

Templates + enrich mapper + `/api/actions/[id]/redraft` + Action Center **Enrich draft**.

---

### 2026-09-28 - Phase 13.4: Live multi-engine

Perplexity, OpenAI, Gemini, Claude when keyed; status UI.

---

### 2026-09-28 - Phase 13.3: Competitors + SOV

---

### 2026-09-28 - Phase 13.2: PDF

---

### 2026-09-28 - Phase 13.1: Client portal

---

### 2026-09-28 - Phase 12: AEO/SEO foundation

---

Deploy reference: **docs/DEPLOY.md**.


---

### 2026-10-02 - Phase 0-C: Distributed visibility provider concurrency hardening

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

- lib/visibility-concurrency.ts - atomic Redis/local provider concurrency leases and release logic.
- lib/visibility-config.ts - P0-C concurrency and provider timeout configuration.
- lib/visibility-check.ts - applies the guard only around fresh external provider calls and adds request timeouts.
- lib/__tests__/visibility-hardening.test.ts - verifies provider, global, and agency concurrency limits.
- .github/workflows/p0c-provider-concurrency.yml - automated P0-C verification.
- .env.example - documents production concurrency, Redis, lease, wait, and timeout controls.
- README.md - records Redis-backed visibility concurrency in the architecture/deployment guidance.
- docs/FILEMAP.md - indexes the new concurrency and test paths.
- PROJECT_PLAN.md - records the completed P0-C hardening session.
- HISTORY.md - this full session record.

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

---

### 2026-10-02 - Phase 0-D: Abuse and rate-limit hardening

**Goal**

Close the rate-limit fail-open path and reduce expensive authenticated endpoint amplification before the 100k-user scalability review. P0-C bounded live provider concurrency; P0-D adds a fail-closed distributed rate-limit contract and limits additional AI/report workload classes.

**Changes**

- Production rate limiting now requires Upstash Redis by default. If Redis is missing, unavailable, times out, or returns a non-2xx response, the limiter returns a bounded 429-style result instead of allowing the request through.
- Redis rate-limit requests have a 1.5 second default timeout so a Redis outage cannot turn into indefinitely hanging API requests.
- Rate-limit keys are normalized and capped at 256 characters before being sent to Redis.
- Added agency-scoped limits for AI action redrafts and report generation: 10 requests per 10 minutes by default for each endpoint class.
- Added a 20 second timeout to the Anthropic redraft request, reusing the provider timeout configuration.
- Existing scan and visibility snapshot limits remain in place; visibility jobs retain P0-A/P0-B/P0-C usage, idempotency, cache/single-flight, and distributed provider-concurrency protections.
- Added dedicated tests for production fail-closed behavior, backend outage behavior, and local development fallback.
- Added a dedicated P0-D GitHub Actions workflow running rate-limit tests, visibility hardening tests, Prisma generation, and TypeScript compilation.
- Documented the new controls in .env.example.

**Important behavior**

Development/test environments may still use the in-process rate limiter when Redis is not configured. Production should set RATE_LIMIT_REQUIRE_REDIS=1 explicitly and provide the existing Upstash credentials. This phase does not claim that rate limiting alone provides DDoS immunity; upstream edge/WAF protection and provider/network quotas remain separate layers.

**Deferred**

The next scalability layer should audit queue admission and scan creation as a transaction-level invariant, public auth endpoint abuse controls, crawl fan-out/resource limits, and edge/WAF configuration. These are intentionally not treated as solved by this phase.

---

### 2026-10-02 - Phase 0-E: Queue admission and scan race hardening

P0-E closes a concurrency gap that remained after P0-D: two app instances could independently pass the active-scan check before either created its scan, and scheduled rescans had the same check/create race. Manual admission now serializes active-scan and monthly-plan checks with creation under a PostgreSQL advisory transaction lock. A partial unique database index independently enforces the one-active-scan-per-client invariant. The active-scan query also has a supporting composite index.

Scheduled rescans use the same client advisory lock and perform admission inside a transaction. The Inngest event is published only after the transaction commits, preventing a worker from receiving an event before the scan row is visible. If event publication fails, the newly admitted scheduled scan is marked FAILED rather than remaining indefinitely QUEUED.

This phase is specifically about queue admission correctness; it does not claim that the system has DDoS immunity or unlimited crawl capacity. Crawl resource budgets, public authentication abuse controls, global backlog quotas, and edge/WAF protections remain separate work.

---

### 2026-10-02 - Phase 0-F: Crawl resource hardening

P0-F adds bounded crawl resource controls for hostile or unusually large websites. The SSRF-safe fetcher now supports bounded total/connect timeouts, redirect counts, and response bytes through environment configuration, with conservative defaults and hard min/max bounds. Firecrawl requests receive an explicit execution timeout and a 10MB response-payload ceiling. The existing SSRF protections, manual redirect validation, content-type restrictions, and response cap remain in place.

These controls reduce application/provider resource amplification from slow, redirect-heavy, or oversized targets. They are not a substitute for edge/WAF DDoS mitigation, provider-side quotas, or a full distributed crawl scheduler.


---

### 2026-10-02 - Phase 0-H: Public authentication abuse hardening

P0-H adds defense-in-depth controls to public account and recovery endpoints. Signup now has a per-email bucket in addition to its existing per-IP bucket. Password recovery has a per-email bucket in addition to its existing per-IP bucket, reducing reset-email flooding against one account. Reset-password requests add a hashed-token bucket, and invite acceptance receives a per-IP bucket.

Client IP extraction is centralized with an explicit trust-boundary comment: forwarding headers are only trustworthy when the public edge/proxy strips and rewrites client-supplied values. This phase does not claim edge/WAF bot protection or DDoS immunity.


## P0-I - Provider/network cost isolation
- Added distributed hourly global + agency provider budgets for scan crawl and paid AI calls.
- Added bounded AI provider timeout/response size and normalized AI issue output limits.
- Added Firecrawl response, stored-link, and metadata caps to limit response amplification.
- Preserved P0-B/C visibility caching/concurrency and P0-G scan admission/execution controls.
- Production budget/rate controls fail closed when Redis is required but unavailable.


## P0-J - Database/query hardening
- Added tenant-scoped composite indexes for high-frequency list/status queries.
- Added bounded list responses for clients, actions, and visibility snapshots with explicit `hasMore` metadata.
- Documented bounded Prisma connection-pool guidance for production Postgres.
- Preserved the prior P0-A through P0-I controls.


---

### 2026-10-05 - Master product execution plan redesign

**Goal**

The previous PROJECT_PLAN had grown around short 20-minute sessions and no longer represented the actual product ambition. The owner requested a single, deeply connected execution plan covering security, backend, frontend, UI, UX, analytics, AI visibility, citations, competitors, crawlability, pricing, profitability, Super Admin, email and provider configuration, chatbot spend, accessibility, content, marketing, legal, scale, and final PDF integration. The acceptance criteria for this documentation ship were that the plan must group related work into substantial phases, explain implementation steps in human language, define exact verification rather than generic "test it" statements, protect the existing architecture, prohibit layered overrides and unnecessary duplicate files, and place marketing late enough that it reflects the finished product.

**What we did**

Replaced the previous micro-session roadmap with a master phase-based execution plan. The new plan begins with security consolidation and the outstanding P0-T verification, then moves through identity and Super Admin, configuration and provider cost control, canonical analytics, AI visibility and citation intelligence, crawl/SEO/AEO/GEO intelligence, Action Center execution, dashboard UX, client reporting, accessibility, QA, pricing and margin controls, marketing-site chatbot accounting, blog/content infrastructure, final marketing and legal, competitor sales enablement, production scale, enterprise capabilities, final owner-supplied PDF template integration, and launch certification.

The plan now explicitly requires a closed-loop product workflow from discovery through implementation and recheck. It defines more than 50 analytics categories as a canonical metric architecture rather than independent dashboard calculations. It requires Super Admin control over sessions, security events, provider and email configuration, costs, branding, marketing headings, pricing, media, legal content, chatbot usage, and operational health. It specifies a server-enforced $0.05 target budget per unique marketing chatbot visitor with atomic spend admission and reconciliation. It makes accessibility a first-class product phase, including screen-reader, keyboard, deaf/hard-of-hearing, chart, notification, and WCAG 2.2 AA requirements.

The plan also establishes the recommended product identity as Threezero AEO with the descriptor AI Search Visibility Platform and the footer attribution Backed by threezero.agency, while requiring the values to be editable through Super Admin. It explicitly keeps marketing late, requires SEO/AEO/GEO protection for every public-route change, adds a detailed content and blog system, and reserves final PDF visual integration until the owner supplies the template.

AGENTS.md was updated to retire the old 20-minute session rule and enforce the new phase model, the no-duplicate/no-layered-override engineering rules, dollar-based product pricing, admin-managed branding/media, accessibility, and exact phase acceptance criteria.

**Key files**

- PROJECT_PLAN.md - replaced the short-session roadmap with the master ordered product execution plan and exact phase acceptance criteria.
- AGENTS.md - aligned all future agent behavior with the new phase model and engineering constraints.
- HISTORY.md - records why the planning model changed and what the new plan guarantees.

**Outcome / acceptance**

The branch must show PROJECT_PLAN.md as the only ordered execution plan, with Phase 0 as the current next work. The plan must explicitly cover backend, frontend, UI, UX, security, multi-tenant isolation, Super Admin, providers, email, cost accounting, analytics, accessibility, content, marketing, legal, pricing, chatbot, scale, and final PDF work. It must also require exact tests and verification for each major phase rather than generic completion statements.

**What is still missing / deferred**

This ship changes the execution plan and agent rules. It does not implement the product features described by the new plan. Phase 0 is intentionally next and must finish the outstanding P0-T security consolidation before feature expansion. The final product name remains a recommended working identity until the owner confirms it. The owner-supplied PDF design is intentionally deferred to the final PDF phase.

**Gotchas**

The current main branch remains the production code baseline. The planning branch must not be mistaken for a product-feature branch. The open P0-T branch still requires its known TypeScript import fixes and full verification before merge. The new plan deliberately does not claim DDoS immunity or 100k-user scale without infrastructure and load evidence.


---

### 2026-10-07 - Product execution memory, live validation checkpoint, and final dashboard reference

**Goal**

Record the owner's requirement that the product must not be developed blindly until the entire roadmap is finished. The owner wants a hosted environment for real testing before public launch, and wants the final dashboard UI to closely reproduce the supplied reference rather than receiving a loosely inspired redesign.

**Decisions recorded**

- The current roadmap is exactly 16 major phases.
- Every phase is implemented on a new branch from the latest verified main.
- Every phase is verified before merge.
- The owner explicitly approves the merge.
- The merged main branch is verified before the next phase branch is created.
- Phase 15 is the first hosted, production-like owner testing checkpoint.
- Phase 15 is not the public customer launch.
- Phase 16 is the final UI/UX rebuild, accessibility work, owner-supplied PDF template integration, and public launch certification.
- Public production launch happens only after Phase 16.
- The final UI rebuild remains intentionally last.
- The supplied 2026-10-05 dashboard reference is the visual source of truth for the final dashboard.
- The dashboard must combine the reference with the owner's claymorphism requirement.
- The dashboard must be mobile-first.
- Important analytics must remain accessible to blind and low-vision users through semantic summaries and underlying data.
- Important notifications must not depend on sound, supporting deaf and hard-of-hearing users.
- Product requirements and decisions must be written into repository documentation, not kept only in chat memory.

**Documentation updated**

- PROJECT_PLAN.md: replaced stale roadmap/status text with the current 16-phase plan, branch/merge contract, live testing checkpoints, dashboard reference requirements, and launch gates.
- README.md: corrected product identity, current status, development workflow, live testing strategy, architecture direction, accessibility, analytics, and dashboard requirements.
- AGENTS.md: reinforced branch discipline, repository-as-memory rules, live testing checkpoint, and final dashboard requirements.
- docs/DEPLOY.md: replaced stale deployment notes with Phase 15 staging and Phase 16 public launch gates.
- docs/FILEMAP.md: indexed Phase 1 security/admin paths and current documentation.
- docs/UI_REFERENCE.md: created the canonical repository record of the supplied dashboard reference, visual hierarchy, claymorphism, mobile-first behavior, and accessibility requirements.

**Verification**

Documentation was written on the existing Phase 1 branch rather than directly on main. The updated files are intended to be reviewed as part of the existing Phase 1 PR. No application feature behavior was changed by this documentation-only addition.

**Remaining**

Phase 1 still requires the owner's explicit merge approval. Phase 2 remains next after that merge. The Phase 15 staging deployment and Phase 16 public launch gates are future work.

**Important correction**

Older HISTORY entries contain the previous roadmap and short-session model because they are historical records. Those entries are not current instructions. PROJECT_PLAN.md is the current ordered source of truth.


---

### 2026-10-07 - Mandatory public SEO/AEO/GEO foundation

**Decision**

The public Threezero AEO website must not launch with a partial search foundation. The requirement is a complete, tested, preventable-defect-free SEO/AEO/GEO foundation before public production.

This is not a promise of instant ranking. Search engines and AI systems independently decide crawling, indexing, ranking, citations, and answer inclusion. The product requirement is to remove known technical and structural barriers and provide strong crawlability, indexability, entity clarity, useful content, machine readability, AI crawler access, performance, accessibility, and discovery signals before launch.

**Repository changes**

- PROJECT_PLAN.md now contains the Search Visibility Launch Standard.
- docs/SEARCH_FOUNDATION.md contains the detailed release checklist.
- README.md links the new foundation and records the launch principle.
- Official Google and Bing guidance was checked while defining the current standard.

**Launch rule**

The website is blocked from public production if there is an accidental noindex, crawler block, wrong canonical, broken sitemap, inaccessible important content, serious structured-data issue, contradictory entity information, serious mobile/performance failure, critical accessibility failure, placeholder content, missing legal requirements, or unresolved P0/P1 SEO/AEO/GEO issue.

Actual rankings and AI citations will be measured after launch rather than guaranteed in advance.


---

### 2026-10-07 - Phase 2 provider, email, secrets, cost, and operational control plane

Branch: `phase2-provider-operational-control-plane`

Implemented one canonical provider registry for OpenAI, Anthropic, Perplexity, Gemini, Firecrawl, Resend, Stripe, Redis, and Inngest. Added encrypted credential storage, fingerprints, enable/disable state, model and operational limits, monthly budgets, connection-test state, credential rotation history, usage events, Super Admin APIs and UI, operational usage summaries, email test endpoint, and email lifecycle schema. Live visibility providers and Firecrawl now resolve through the control plane so a database-disabled provider cannot silently use its environment credential.

Automated verification is still pending. This branch is not merged.
