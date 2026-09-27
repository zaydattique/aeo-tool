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

---

## Chronology (detailed)

### 2026-09-27 — Phase 0: Foundation & agent rules

**Goal:** Empty GitHub repo had no usable code from a prior agent. Make the repo agent-safe before any feature work.

**What we did:**
- Created governance files so every future AI follows the same rules.
- Locked “no placeholders, complete files only, append HISTORY after ship.”

**Key files:** `AGENTS.md`, `HISTORY.md`, `PROJECT_PLAN.md`, `README.md`, `.cursorrules`, `.gitignore`

**Outcome:** Repo is bootable for agents; roadmap exists as ordered phases.

---

### 2026-09-27 — Phase 1: Project scaffold & tech lock

**Goal:** Production skeleton that installs and runs — no product features yet.

**What we did:**
- Locked stack: **Next.js 15 App Router**, TypeScript, Tailwind, Prisma, PostgreSQL, NextAuth, Zod.
- Added `package.json` scripts (`dev`, `db:push`, `db:seed`), Prisma client singleton, health route, basic landing layout.

**Key files:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/api/health/route.ts`, `lib/prisma.ts`, `lib/utils.ts`, `.env.example`

**Outcome:** `npm install` + `prisma generate` + `npm run dev` path is clear.

---

### 2026-09-27 — Phase 2: Multi-tenant database schema

**Goal:** Full Prisma schema matching the product blueprint with isolation, soft deletes, indexes, seed plans.

**What we did:**
- Models: `Plan`, `Agency`, `User`, `Client`, `Scan`, `Action`, `TrackedPrompt`, `VisibilitySnapshot`, `Report`, `TeamInvite`, `ActivityLog`, `Subscription`, `UsageMeter`.
- Enums for roles, statuses, action priority/category/effort, billing region.
- Seed: 6 plans (Starter/Growth/Agency × Pakistan/International).

**Key files:** `prisma/schema.prisma`, `prisma/seed.ts`

**Outcome:** Schema is the source of truth for multi-tenant data; ready for `db push` + seed.

---

### 2026-09-27 — Phase 3: Auth + agency onboarding

**Goal:** Signup creates agency + owner; login; protect dashboard; onboarding gate.

**What we did:**
- NextAuth **JWT** + credentials (bcrypt). Session carries `id`, `role`, `agencyId`, `agencyName`, `onboardingCompleted`.
- APIs: signup (agency + owner + 14-day trial + starter plan), forgot/reset password, accept team invite, onboarding complete.
- Pages: login, signup, forgot/reset password, invite accept, onboarding wizard.
- Middleware protects dashboard/admin and forces incomplete owners through `/onboarding`.
- Schema adds: `passwordResetToken/Expires` on User, `onboardingCompleted` on Agency.

**Key files:** `lib/auth.ts`, `types/next-auth.d.ts`, `middleware.ts`, `app/api/auth/**`, `app/(auth)/**`, `app/onboarding/page.tsx`, `app/dashboard/page.tsx` (placeholder at the time), `components/providers.tsx`

**Outcome:** Flow works: **signup → login → onboarding → dashboard**.

---

### 2026-09-27 — Phase 4: Client management + scan queue

**Goal:** Agencies add clients and start scans with live progress (simulated stages first).

**What we did:**
- Client CRUD APIs with URL validation (block private/local hosts), brand name suggestion, plan max-clients check.
- Start scan API with concurrent-scan guard + monthly scan limit.
- Simulated worker advanced stages QUEUED→…→COMPLETED with progress %.
- Dashboard client list: add form, Start scan, progress bar polling, client detail + scan history.

**Key files:** `lib/session.ts`, `lib/url.ts`, `lib/scan-worker.ts` (simulated), `app/api/clients/**`, `app/api/scans/[id]/route.ts`, `app/dashboard/client-list.tsx`, `app/dashboard/clients/[id]/**`

**Outcome:** **Add client → Start scan → progress → complete** (simulated analysis).

---

### 2026-09-27 — Phase 5: Real crawl + AI analysis

**Goal:** Real website fetch/crawl + structured AEO analysis stored on Scan.

**What we did:**
- `lib/crawl.ts`: Firecrawl when key set; else basic HTML fetch + signal extraction (title, meta, Hn, JSON-LD, OG, word count, links, llms.txt, etc.).
- `lib/ai-analysis.ts`: Claude structured JSON when key set; else deterministic heuristic scorer + issue list.
- Scan worker rewritten to CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED; stores `rawCrawlData` + `aiAnalysis` (scores, issues, token/duration metadata).
- Client detail shows summary, dimension scores, strengths/weaknesses, issues.

**Key files:** `lib/crawl.ts`, `lib/ai-analysis.ts`, `lib/scan-worker.ts`, client detail page updates, `.env.example`

**Outcome:** Scanning a public URL produces meaningful analysis even offline (heuristics); better with keys.

---

### 2026-09-27 — Phase 6: Action Center (core product)

**Goal:** Turn analysis issues into assignable, trackable Action rows — the product promise.

**What we did:**
- On scan complete: create `Action` rows from issues; soft-delete prior open actions for that client.
- APIs: list/filter actions; PATCH status/assignee/complete; team members for dropdown.
- UI: filters (status/priority/category), status dropdown, assign, **Copy** suggested fix.
- Integrated into client detail page (replaced static issue list).

**Key files:** `lib/scan-worker.ts` (action persistence), `app/api/actions/**`, `app/api/team/members/route.ts`, `app/dashboard/clients/[id]/action-center.tsx`

**Outcome:** **Scan → Action Center → assign → mark done** works end-to-end.

---

### 2026-09-27 — Phase 7: Visibility tracking + white-label reports

**Goal:** Track prompts over time and share branded reports.

**What we did:**
- Tracked prompts: seed brand-aware defaults, add custom, soft-delete; plan prompt limits.
- Snapshots: “Record check” writes scores (MVP estimate); history chart + per-prompt sparks.
- Reports: generate snapshot of analysis/actions/prompts into `Report.config` + `liveLinkToken`.
- Public page `/r/[token]` with agency logo/name/colors, print/Save PDF.

**Key files:** `lib/default-prompts.ts`, `app/api/clients/[id]/prompts/route.ts`, `app/api/prompts/[id]/route.ts`, `app/api/clients/[id]/snapshots/route.ts`, `app/api/clients/[id]/reports/route.ts`, `app/r/[token]/page.tsx`, `app/dashboard/clients/[id]/visibility-reports.tsx`

**Outcome:** Prompts + checks + live shareable report link.

---

### 2026-09-28 — Phase 8: Team, billing & super admin

**Goal:** Commercial layer and platform operator tools.

**What we did:**
- **Team:** invite API (owner-only), seat limits, Settings UI for members/pending invites + invite URL.
- **Billing:** Stripe Checkout by plan slug, Customer Portal, webhook (subscription lifecycle → Agency/Subscription rows), usage meter helper + soft-limit flags on Settings.
- **Super Admin `/admin`:** metrics, list agencies, create agency+owner, suspend/activate, impersonate (activity-logged; session `agencyId` update for 1h intent).
- Middleware: protect `/api/admin`, allow public `/api/billing/webhook` and `/r/*`.
- Dashboard: Settings link; pure SUPER_ADMIN without agency → redirect `/admin`.

**Key files:** `lib/stripe.ts`, `lib/usage.ts`, `app/api/team/invites/route.ts`, `app/api/billing/**`, `app/api/admin/**`, `app/dashboard/settings/page.tsx`, `app/admin/page.tsx`, `middleware.ts`, `package.json` (stripe)

**Outcome:** Invites + usage UI work offline; Stripe works when keys set; super admin can operate tenants.

---

### 2026-09-28 — Docs pass (this update)

**Goal:** Owner required fully detailed HISTORY/README/FILEMAP and agent rules that forbid thin “phase done” logs.

**What we did:** Rewrote HISTORY (this file), expanded README architecture, created `docs/FILEMAP.md`, updated AGENTS.md documentation duties.

---

## Deploy reminder

(Fill when infra is live: host, DB, env secrets, Stripe webhook endpoint, domains.)
