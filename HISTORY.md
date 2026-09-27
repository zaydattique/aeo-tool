# AEO Command — HISTORY (operational memory)

> **Read before changing code.** This is the detailed log of *what was built, why, and what files changed* — not a one-line “phase done” list.  
> Repo: `zaydattique/aeo-tool`  
> Last updated: **2026-09-28**  
> Related: [AGENTS.md](./AGENTS.md) · [README.md](./README.md) · [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [docs/FILEMAP.md](./docs/FILEMAP.md)

---

## How agents must use this file

After **every** phase or meaningful ship:

1. Append a **dated section** with: **Goal** · **What we did** · **Key files** · **Outcome / acceptance** · **Gotchas**
2. Do **not** only write “Phase X complete.” That is useless for the next agent.
3. Never delete old entries; mark superseded notes in place.

---

## Product identity (stable)

**AEO Command** is a multi-tenant SaaS for agencies doing Answer Engine Optimization (AEO / GEO).

**Core loop:** paste client URL → crawl + AI analysis → prioritized **Action Center** (assign / status / copy fix) → visibility prompts over time → **white-label live report**.

**Isolation:** every business row is scoped by `agencyId`. Roles: `SUPER_ADMIN` | `AGENCY_OWNER` | `AGENCY_MEMBER`.

**Domains (planned):** marketing `threezero.agency` · app `app.threezero.agency` · admin `admin.threezero.agency`.

Language with owner: **English, Urdu, or Roman Urdu only**.

---

## Open gotchas (current)

| Topic | Detail |
|-------|--------|
| Scan quality | Works **without** API keys via basic fetch + heuristic scorer. Production quality needs `FIRECRAWL_API_KEY` + `ANTHROPIC_API_KEY`. |
| Scan worker | Fire-and-forget via `setImmediate` in-process (not durable queue). Swap to Inngest/BullMQ later. |
| Visibility snapshots | MVP: base score from last scan ± variance — **not** live multi-engine citation checks. |
| Reports PDF | Browser print-to-PDF on `/r/[token]`; no server-side PDF binary. |
| Stripe | Checkout/portal/webhook implemented; needs `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` or checkout returns 503. |
| Super admin | User must have `role: SUPER_ADMIN`. Pure SA often has `agencyId: null` until impersonation. |
| New scan vs actions | Completing a scan **soft-deletes** previous open (TODO/IN_PROGRESS) actions for that client so Action Center matches latest analysis. |
| Rate limit store | In-memory Map — resets on cold start; multi-instance needs Redis. |
| Ranking | Marketing foundation exists; **not** yet a full topical content cluster (Phase 10). Domain authority still needs real deploy + backlinks. |

---

## Chronology (detailed)

### 2026-09-27 — Phase 0: Foundation & agent rules

**Goal:** Empty GitHub repo had no usable code from a prior agent. Make the repo agent-safe before any feature work.

**What we did:** Created governance files; locked complete-files-only rules.

**Key files:** `AGENTS.md`, `HISTORY.md`, `PROJECT_PLAN.md`, `README.md`, `.cursorrules`, `.gitignore`

**Outcome:** Repo bootable for agents.

---

### 2026-09-27 — Phase 1: Project scaffold & tech lock

**Goal:** Production skeleton that installs and runs.

**What we did:** Next.js 15, TS, Tailwind, Prisma, NextAuth scaffold, health route.

**Key files:** `package.json`, configs, `app/layout.tsx`, `lib/prisma.ts`, `.env.example`

**Outcome:** Install + generate + dev path clear.

---

### 2026-09-27 — Phase 2: Multi-tenant database schema

**Goal:** Full Prisma schema with isolation and seed plans.

**What we did:** 13 models, enums, soft deletes, 6 regional plans seed.

**Key files:** `prisma/schema.prisma`, `prisma/seed.ts`

**Outcome:** Schema is multi-tenant source of truth.

---

### 2026-09-27 — Phase 3: Auth + agency onboarding

**Goal:** Signup → agency + owner → login → onboarding gate.

**What we did:** NextAuth JWT credentials; signup/forgot/reset/invite; middleware gates.

**Key files:** `lib/auth.ts`, `middleware.ts`, `app/api/auth/**`, `app/(auth)/**`, `app/onboarding`

**Outcome:** Full auth loop works.

---

### 2026-09-27 — Phase 4: Client management + scan queue

**Goal:** Add clients and start scans with progress.

**What we did:** Client CRUD, URL validation, scan enqueue, progress UI (simulated worker first).

**Key files:** `lib/session.ts`, `lib/url.ts`, `app/api/clients/**`, `app/dashboard/**`

**Outcome:** Add client → scan progress path works.

---

### 2026-09-27 — Phase 5: Real crawl + AI analysis

**Goal:** Real crawl + structured AEO analysis.

**What we did:** Firecrawl/basic crawl, Claude/heuristic analysis, worker stages, analysis UI.

**Key files:** `lib/crawl.ts`, `lib/ai-analysis.ts`, `lib/scan-worker.ts`

**Outcome:** Meaningful analysis offline or with API keys.

---

### 2026-09-27 — Phase 6: Action Center

**Goal:** Issues → assignable Actions.

**What we did:** Persist actions on scan complete; filter/assign/status/copy UI.

**Key files:** `app/api/actions/**`, `action-center.tsx`

**Outcome:** Core product loop complete.

---

### 2026-09-27 — Phase 7: Visibility + white-label reports

**Goal:** Prompts over time + shareable reports.

**What we did:** Tracked prompts, snapshots/chart, report generator, `/r/[token]`.

**Key files:** prompts/snapshots/reports APIs, `app/r/[token]/page.tsx`

**Outcome:** Live report links work.

---

### 2026-09-28 — Phase 8: Team, billing & super admin

**Goal:** Commercial layer + operator tools.

**What we did:** Invites, Stripe checkout/portal/webhook, usage UI, `/admin` impersonate/suspend.

**Key files:** `lib/stripe.ts`, `lib/usage.ts`, billing/admin/team APIs, settings + admin pages

**Outcome:** Commercial APIs ready; SA can manage tenants.

---

### 2026-09-28 — Docs pass

**Goal:** Thick HISTORY/README/FILEMAP; ban thin phase logs in AGENTS.md.

**Outcome:** Docs usable as operational memory.

---

### 2026-09-28 — Phase 9: Marketing foundation + security polish

**Goal:** Ship a real public marketing surface that is SEO- and AEO-aware (so the product is not invisible while selling visibility), plus rate limits on abuse-prone routes. Owner also wants a later deeper ranking/content phase — Phase 10 opened for that.

**What we did:**
- Marketing chrome: `MarketingNav` + `MarketingFooter`
- Pages: upgraded home (hero, value props, AEO pitch, CTAs); `/product` workflow + features; `/pricing` with Pakistan/International toggle and plan cards; `/aeo` long-form guide (AEO vs SEO, GEO, agency workflow) with **FAQPage + Article JSON-LD**
- Technical SEO/AEO: root metadata (title template, keywords, OG, Twitter), SoftwareApplication JSON-LD in root layout; `app/robots.ts`; `app/sitemap.ts`; `public/llms.txt` for AI crawlers
- Security: `lib/rate-limit.ts` in-memory limiter; signup limited 5/hour/IP; scan start limited 10/10min/agency (plus existing monthly plan caps)

**Key files:**
- `components/marketing-nav.tsx`
- `app/page.tsx`, `app/product/page.tsx`, `app/pricing/page.tsx`, `app/aeo/page.tsx`
- `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt`
- `lib/rate-limit.ts`, `app/api/auth/signup/route.ts`, `app/api/clients/[id]/scan/route.ts`
- `PROJECT_PLAN.md` (Phase 10 opened)

**Outcome / acceptance:**
- Public site has product story + pricing + educational AEO page crawlers and assistants can use
- `/sitemap.xml`, `/robots.txt`, `/llms.txt` available after deploy
- Signup/scan abuse harder without Redis yet

**Gotchas:**
- Ranking will not happen from code alone — needs production domain, indexing, links, and Phase 10 content cluster
- In-memory rate limits are per-instance
- Pricing numbers on `/pricing` are marketing display; live Stripe amounts still come from DB `Plan` rows at checkout

---

## Deploy reminder

When going live: Postgres, `NEXTAUTH_URL` = production HTTPS, secrets, Stripe webhook → `/api/billing/webhook`, submit sitemap in Search Console, verify `llms.txt` reachable.
