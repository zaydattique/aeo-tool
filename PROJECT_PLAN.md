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

---

## PHASE 4 — Client Management + Scan Queue

**Status:** Done (2026-09-27)

**Goal:** Agencies can add clients and trigger scans that run as background jobs with live progress.

**Deliverables completed:**
- Client CRUD APIs (`GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/[id]`)
- URL validation (reject private IPs, non-http schemes) + brand name suggestion
- Plan limit enforcement (max clients, max scans/month)
- Start scan API (`POST /api/clients/[id]/scan`) with concurrent-scan guard
- Scan status polling (`GET /api/scans/[id]`)
- Simulated scan worker (`lib/scan-worker.ts`) — advances QUEUED→CRAWL→EXTRACT→AI_ANALYSIS→ACTION_GENERATION→COMPLETED with progress %
- Dashboard client list with add-client form
- Live progress bar (1.5s polling)
- Client detail page with scan history
- Activity log on create/delete/scan start

**Acceptance met:** Add client → Start Scan → progress bar updates through stages → scan completes → visibility score set.

---

## PHASE 5 — Real Crawl + AI Analysis Pipeline

**Status:** Open ← **NEXT**

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
| 4     | Client Management + Scan Queue    | Done        |
| 5     | Real Crawl + AI Analysis          | Open ← NEXT |
| 6     | Action Center (Core Product)      | Open        |
| 7     | Visibility Tracking + Reports     | Open        |
| 8     | Team, Billing & Super Admin       | Open        |
| 9     | Marketing + Security + Polish     | Open        |

**Order is strict:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
