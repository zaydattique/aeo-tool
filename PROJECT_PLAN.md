# AEO Command — PROJECT PLAN (single list)

> **Only to-do file.** Repo: `zaydattique/aeo-tool`

## Boot every session

1. AGENTS.md → 2. This file → 3. HISTORY.md → 4. docs/FILEMAP.md

---

## PHASE 0–9 + 10A — Done

See HISTORY.md.

---

## PHASE 10B — Product strength

**Status:** Done (2026-09-28)

**Deliverables completed:**
- `lib/action-mapper.ts` — priority/effort sort, dedupe, multi-step expansion, max 15 actions
- Scan worker uses mapper for Action rows
- Action Center UX: progress bar, quick filter chips, expandable steps
- Dashboard client list: stronger empty state, score colors, Open CTA
- `docs/QUEUE_AND_JOBS.md` — durable queue (Inngest/BullMQ) + weekly re-scan + email design

---

## PHASE 10C — Deploy readiness

**Status:** Open ← **NEXT**

- Production env checklist in README
- Super-admin seed script or documented SQL
- Final deploy notes (Vercel vs Railway for scans)

---

## Phase Index

| Phase | Status |
|-------|--------|
| 0–9 | Done |
| 10A Content cluster | Done |
| 10B Product strength | Done |
| 10C Deploy readiness | Open ← NEXT |
