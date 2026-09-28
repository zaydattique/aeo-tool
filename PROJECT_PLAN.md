# AEO Command — PROJECT PLAN (single list)

> **Only to-do file.** Repo: `zaydattique/aeo-tool`

## Boot every session

1. AGENTS.md → 2. This file → 3. HISTORY.md → 4. docs/FILEMAP.md → 5. docs/DEPLOY.md if shipping

---

## PHASE 0–10C — Done (MVP roadmap)

| Block | Status |
|-------|--------|
| 0–8 Product core (auth → reports → team/billing/admin) | Done |
| 9 Marketing foundation + rate limits | Done |
| 10A Content cluster (guides, compare, /ai) | Done |
| 10B Product strength (action-mapper, UX, queue design) | Done |
| **10C Deploy readiness** | **Done (2026-09-28)** |

### 10C deliverables completed

- `docs/DEPLOY.md` — host choice, env checklist, Stripe, smoke tests, SEO go-live
- Super admin via seed env (`SEED_SUPER_ADMIN_*`) + SQL notes in DEPLOY.md
- `.env.example` production-oriented
- README production section + status updated

---

## Optional next (not scheduled — pick intentionally)

- Implement durable scan queue (Inngest/BullMQ) per `docs/QUEUE_AND_JOBS.md`
- Weekly re-scan + email notifications
- Live multi-engine visibility checks
- Server-side PDF
- More ranking content / case studies
- Split marketing domain vs `app.` subdomain DNS

When starting new work: add a **new numbered phase** here with Goal + acceptance — do not invent parallel todo files.
