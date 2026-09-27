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

## PHASE 0–5 — Done (2026-09-27)

Foundation → Scaffold → Schema → Auth → Clients/Scans → Real crawl + AI

---

## PHASE 6 — Action Center (Core Product)

**Status:** Done (2026-09-27)

**Goal:** Generate and manage the prioritized Action Center — the main value of AEO Command.

**Deliverables completed:**
- Scan worker creates `Action` rows from analysis issues on completion
- Soft-deletes previous open actions for client so Action Center stays current
- `GET /api/actions` with filters (clientId, status, priority, category)
- `PATCH /api/actions/[id]` — status, assign, complete tracking
- `GET /api/team/members` — for assignment dropdown
- Action Center UI: filters, status dropdown, assign to teammate, copy suggested text
- Integrated into client detail page

**Acceptance met:** After a scan, Action Center shows prioritized actions that can be assigned, status-tracked, and marked done.

---

## PHASE 7 — Visibility Tracking + Reports

**Status:** Open ← **NEXT**

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
| 4     | Client Management + Scan Queue    | Done        |
| 5     | Real Crawl + AI Analysis          | Done        |
| 6     | Action Center (Core Product)      | Done        |
| 7     | Visibility Tracking + Reports     | Open ← NEXT |
| 8     | Team, Billing & Super Admin       | Open        |
| 9     | Marketing + Security + Polish     | Open        |

**Order is strict:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
