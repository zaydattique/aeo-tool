# AEO Command — PROJECT PLAN (single list)

> **Only to-do file.** No parallel backlogs. Phase = one focused AI session (15–20 min of real work).  
> Repo: `zaydattique/aeo-tool`  

## Boot every session (mandatory)

1. [AGENTS.md](./AGENTS.md) — rules / never-do  
2. **This file** — next open phase only  
3. [HISTORY.md](./HISTORY.md) — skip completed; note open incidents  
4. [docs/FILEMAP.md](./docs/FILEMAP.md) — which paths to touch (create when needed)  

After every ship: **append HISTORY.md with detail** + mark phase/items Done here.  
Ask owner before: business logic, pricing model, permission model, irreversible deletes.  

---

## PHASE 0 — Foundation & Agent Rules

**Status:** Done (2026-09-27)

**Goal:** Make the empty repo agent-ready so every future AI follows the same strict rules.

**Deliverables completed:**
- AGENTS.md (strict rules: no placeholders, complete files only, size checks, chunk large files)
- HISTORY.md (starting chronology)
- PROJECT_PLAN.md (this file)
- README.md
- .cursorrules
- .gitignore

---

## PHASE 1 — Project Scaffold & Tech Decision Lock

**Status:** In Progress

**Goal:** Lock the tech stack and create the production skeleton that everything else will build on. No feature code yet — pure foundation that compiles and runs.

**Exact deliverables (all must be complete real files):**

1. **Tech stack lock (document in README + here):**
   - Frontend + App: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
   - Database: PostgreSQL (Neon recommended) + Prisma ORM
   - Auth: NextAuth.js (Auth.js) with credentials + magic link support
   - Background jobs: Inngest (preferred) or BullMQ + Redis
   - AI: Anthropic Claude (primary) + OpenAI fallback, server-side only
   - Crawl: Firecrawl API (primary) or Playwright worker
   - PDF: Puppeteer or PDFShift
   - Payments: Stripe
   - Hosting target: Vercel (app) + separate worker if needed
   - Multi-tenant: every business model has `agencyId` (UUID)

2. **Repository structure:**
   ```
   /
   ├── app/                    # Next.js App Router
   │   ├── (auth)/
   │   ├── (dashboard)/
   │   ├── (admin)/
   │   ├── api/
   │   └── layout.tsx
   ├── components/
   ├── lib/
   │   ├── prisma.ts
   │   ├── auth.ts
   │   └── utils.ts
   ├── prisma/
   │   └── schema.prisma      # skeleton only in this phase
   ├── public/
   ├── docs/
   ├── .env.example
   ├── package.json
   ├── tsconfig.json
   ├── tailwind.config.ts
   ├── next.config.ts
   └── README.md (updated)
   ```

3. **Core files that must exist and work:**
   - package.json with correct dependencies
   - tsconfig.json
   - next.config.ts
   - tailwind.config.ts + postcss
   - prisma/schema.prisma (minimal skeleton with Agency + User models only)
   - lib/prisma.ts (singleton client)
   - app/layout.tsx + app/page.tsx (simple landing)
   - app/api/health/route.ts (returns { status: "ok", version, timestamp })
   - .env.example with all required variable names documented
   - Basic .gitignore (already exists)

4. **Acceptance criteria (must all pass):**
   - `npm install` succeeds
   - `npx prisma generate` succeeds
   - `npm run dev` starts without error
   - `GET /api/health` returns 200 with JSON
   - No placeholder strings anywhere
   - TypeScript compiles cleanly

**Out of scope for this phase:** Full schema, auth UI, client management, scans, any business logic.

**After completion:** Mark this phase Done, append detailed entry to HISTORY.md, move to Phase 2.

---

## PHASE 2 — Core Database Schema (Multi-Tenant)

**Status:** Open

**Goal:** Implement the complete production Prisma schema matching the blueprint with proper indexes, soft deletes, and agency isolation.

**Exact deliverables:**
- Full prisma/schema.prisma covering:
  - Agency, User, Client, Scan, Action, TrackedPrompt, VisibilitySnapshot, Report, TeamInvite, ActivityLog, Plan, Subscription, UsageMeter
- Every business table has `agencyId` (UUID, required)
- Soft deletes (`deletedAt DateTime?`)
- Proper indexes: `@@index([agencyId])`, partial where possible, unique constraints scoped correctly
- Enum types for status, role, priority, etc.
- Seed script (`prisma/seed.ts`) that creates the three plans for Pakistan + International pricing
- Migration generated and documented

**Acceptance:** `npx prisma migrate dev` succeeds, seed runs, schema 100% matches the product blueprint.

---

## PHASE 3 — Auth + Agency Onboarding

**Status:** Open

**Goal:** Complete authentication flows and first-time agency setup.

**Exact deliverables:**
- NextAuth configuration (credentials + magic link)
- Signup / Login / Forgot password / Accept invite pages
- Roles: super_admin | agency_owner | agency_member
- Onboarding wizard (agency name + logo upload)
- Middleware that injects and enforces `agencyId` on every protected route
- Invite token system
- Session contains user + agency context

**Acceptance:** New user can sign up → create agency → complete onboarding → land on empty dashboard. Super admin path works.

---

## PHASE 4 — Client Management + Scan Queue

**Status:** Open

**Goal:** Agencies can add clients and trigger scans that run as background jobs with live progress.

**Exact deliverables:**
- Client CRUD (URL validation, brand name, keywords, location)
- Scan model with stages and progress
- Background job system (Inngest recommended)
- Rate limiting per plan
- Progress polling endpoint
- Dashboard client list + “Start Scan” button with live progress UI
- Simulated worker that advances stages (real crawl in Phase 5)

**Acceptance:** Add client → Start Scan → see progress bar update → scan reaches “completed”.

---

## PHASE 5 — Real Crawl + AI Analysis Pipeline

**Status:** Open

**Goal:** Real website crawl + AI analysis that produces useful structured output.

**Exact deliverables:**
- Firecrawl (or Playwright) integration
- Extract technical + content signals
- LLM analysis (Claude) that returns structured JSON
- Store raw_crawl_data + ai_analysis on Scan
- Error handling, retries, cost tracking
- Queue worker is production-ready

**Acceptance:** Scanning a real public website produces meaningful AI analysis stored on the scan.

---

## PHASE 6 — Action Center (Core Product)

**Status:** Open

**Goal:** Generate and manage the prioritized Action Center — the main value of AEO Command.

**Exact deliverables:**
- AI generates prioritized actions with title, why_it_matters, steps[], effort, category, suggested_text
- Action Center UI with filters (priority, category, status)
- Status dropdown, assign to team member, mark done
- Suggested text copy button
- Action history

**Acceptance:** After a real scan, Action Center shows useful, prioritized, actionable items that can be assigned and tracked.

---

## PHASE 7 — Visibility Tracking + Reports

**Status:** Open

**Goal:** Track visibility over time and produce white-label reports.

**Exact deliverables:**
- Tracked prompts (system defaults + custom)
- Visibility snapshots
- Score-over-time chart
- Report generator (sections, logo, colors)
- PDF generation + live link token
- White-label support from agency branding

**Acceptance:** Agency can track prompts, see history graph, and download a branded PDF report.

---

## PHASE 8 — Team, Billing & Super Admin

**Status:** Open

**Goal:** Complete commercial layer and super admin plane.

**Exact deliverables:**
- Team invites + role management
- Stripe Checkout + Customer Portal + webhooks
- Usage metering + soft limit warnings
- Super Admin: agency list, create/suspend, impersonate (logged + time-boxed), global metrics, feature flags
- Activity log on all sensitive actions

**Acceptance:** Self-serve billing works end-to-end. Super admin can fully manage agencies.

---

## PHASE 9 — Marketing Site + Security Hardening + Polish

**Status:** Open

**Goal:** Public marketing site + production security pass.

**Exact deliverables:**
- Marketing pages on threezero.agency (or /marketing route)
- Pricing page with Pakistan / International toggle
- Security: rate limits, input sanitization, audit logging, Cloudflare recommendations
- Soft limit enforcement
- Full end-to-end QA of the agency workflow

**Acceptance:** Product is ready for real paying agencies.

---

## Phase Index

| Phase | Name                              | Status      |
|-------|-----------------------------------|-------------|
| 0     | Foundation & Agent Rules          | Done        |
| 1     | Project Scaffold & Tech Lock      | In Progress |
| 2     | Core Database Schema              | Open        |
| 3     | Auth + Agency Onboarding          | Open        |
| 4     | Client Management + Scan Queue    | Open        |
| 5     | Real Crawl + AI Analysis          | Open        |
| 6     | Action Center (Core Product)      | Open        |
| 7     | Visibility Tracking + Reports     | Open        |
| 8     | Team, Billing & Super Admin       | Open        |
| 9     | Marketing + Security + Polish     | Open        |

**Order is strict:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
