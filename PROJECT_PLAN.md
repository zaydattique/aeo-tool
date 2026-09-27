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

## PHASE 0–6 — Done (2026-09-27)

Foundation → Scaffold → Schema → Auth → Clients/Scans → Crawl+AI → Action Center

---

## PHASE 7 — Visibility Tracking + Reports

**Status:** Done (2026-09-27)

**Goal:** Track visibility over time and produce white-label reports.

**Deliverables completed:**
- Tracked prompts API (list, create, seed defaults, delete)
- Default prompt templates per brand/location
- Visibility snapshots API (record check + history)
- Score-over-time chart + mini sparks per prompt
- Report generator with agency branding in config
- Live link token → public page `/r/[token]`
- Print / Save PDF via browser print stylesheet
- White-label header (agency name/logo/brand colors)

**Acceptance met:** Agency can track prompts, record checks, see history graph, and share a branded live report.

---

## PHASE 8 — Team, Billing & Super Admin

**Status:** Open ← **NEXT**

**Goal:** Complete commercial layer and super admin plane.

**Exact deliverables:**
- Team invites + role management
- Stripe Checkout + Customer Portal + webhooks
- Usage metering + soft limit warnings
- Super Admin: agency list, create/suspend, impersonate (logged + time-boxed), global metrics
- Activity log on all sensitive actions

**Acceptance:** Self-serve billing works end-to-end. Super admin can fully manage agencies.

---

## PHASE 9 — Marketing Site + Security Hardening + Polish

**Status:** Open

---

## Phase Index

| Phase | Name                              | Status      |
|-------|-----------------------------------|-------------|
| 0–6   | Foundation through Action Center  | Done        |
| 7     | Visibility Tracking + Reports     | Done        |
| 8     | Team, Billing & Super Admin       | Open ← NEXT |
| 9     | Marketing + Security + Polish     | Open        |

**Order is strict:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
