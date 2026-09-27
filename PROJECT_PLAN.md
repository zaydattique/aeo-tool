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

---

## PHASE 5 — Real Crawl + AI Analysis Pipeline

**Status:** Done (2026-09-27)

**Goal:** Real website crawl + AI analysis that produces useful structured output.

**Deliverables completed:**
- `lib/crawl.ts` — Firecrawl API primary, basic fetch fallback; extracts title, meta, headings, schema, links, word count, llms.txt, OG, etc.
- `lib/ai-analysis.ts` — Claude structured AEO analysis primary, heuristic fallback; returns visibilityScore, dimension scores, strengths/weaknesses, prioritized issues
- `lib/scan-worker.ts` rewritten — real CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED
- Stores `rawCrawlData` + `aiAnalysis` (with actionDrafts for Phase 6) on Scan
- Cost tracking fields: provider, model, inputTokens, outputTokens, durationMs
- Client detail page shows analysis summary, scores, strengths/weaknesses, issues list
- Works without API keys (heuristic mode) for local dev

**Acceptance met:** Scanning a public website produces meaningful AEO analysis stored on the scan.

---

## PHASE 6 — Action Center (Core Product)

**Status:** Open ← **NEXT**

**Goal:** Generate and manage the prioritized Action Center — the main value of AEO Command.

**Exact deliverables:**
- Persist actionDrafts from scan into Action rows
- Action Center UI with filters (priority, category, status)
- Status dropdown, assign to team member, mark done
- Suggested text copy button
- Action history

**Acceptance:** After a real scan, Action Center shows useful, prioritized, actionable items that can be assigned and tracked.

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
| 5     | Real Crawl + AI Analysis          | Done        |
| 6     | Action Center (Core Product)      | Open ← NEXT |
| 7     | Visibility Tracking + Reports     | Open        |
| 8     | Team, Billing & Super Admin       | Open        |
| 9     | Marketing + Security + Polish     | Open        |

**Order is strict:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
