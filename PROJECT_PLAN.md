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

---

## PHASE 1 — Project Scaffold & Tech Decision Lock

**Status:** Done (2026-09-27)

---

## PHASE 2 — Core Database Schema (Multi-Tenant)

**Status:** Done (2026-09-27)

---

## PHASE 3 — Auth + Agency Onboarding

**Status:** Done (2026-09-27)

**Goal:** Complete authentication flows and first-time agency setup.

**Deliverables completed:**
- NextAuth JWT config with credentials provider (`lib/auth.ts`)
- Session types with agencyId, role, onboardingCompleted (`types/next-auth.d.ts`)
- Signup API: creates Agency + AGENCY_OWNER user, assigns starter plan, 14-day trial
- Login page + credentials sign-in
- Forgot password + reset password (token-based)
- Accept team invite API + page
- Onboarding wizard (agency name + logo URL) + API
- Middleware: protects /dashboard, /admin, /onboarding; redirects incomplete onboarding
- Dashboard placeholder showing session context
- SessionProvider in root layout
- Homepage CTAs to signup/login
- Schema: passwordResetToken/Expires on User, onboardingCompleted on Agency
- bcryptjs for password hashing

**Acceptance met:** Signup → login → onboarding → dashboard flow is complete. Roles and agency isolation in session. Invite accept path ready.

---

## PHASE 4 — Client Management + Scan Queue

**Status:** Open ← **NEXT**

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

---

## PHASE 6 — Action Center (Core Product)

**Status:** Open

---

## PHASE 7 — Visibility Tracking + Reports

**Status:** Open

---

## PHASE 8 — Team, Billing & Super Admin

**Status:** Open

---

## PHASE 9 — Marketing Site + Security Hardening + Polish

**Status:** Open

---

## Phase Index

| Phase | Name                              | Status      |
|-------|-----------------------------------|-------------|
| 0     | Foundation & Agent Rules          | Done        |
| 1     | Project Scaffold & Tech Lock      | Done        |
| 2     | Core Database Schema              | Done        |
| 3     | Auth + Agency Onboarding          | Done        |
| 4     | Client Management + Scan Queue    | Open ← NEXT |
| 5     | Real Crawl + AI Analysis          | Open        |
| 6     | Action Center (Core Product)      | Open        |
| 7     | Visibility Tracking + Reports     | Open        |
| 8     | Team, Billing & Super Admin       | Open        |
| 9     | Marketing + Security + Polish     | Open        |

**Order is strict:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
