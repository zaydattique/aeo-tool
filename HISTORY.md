# AEO Command — HISTORY (operational memory)

> Repo: `zaydattique/aeo-tool` · Last updated: **2026-09-28**  
> [AGENTS.md](./AGENTS.md) · [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [docs/DEPLOY.md](./docs/DEPLOY.md) · [docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md)

---

## Open gotchas

| Topic | Detail |
|-------|--------|
| Scan worker | In-process until queue implemented — prefer Railway-class host |
| Rate limits | In-memory per instance |
| Visibility | MVP estimates |
| Weekly re-scan | Design only in QUEUE_AND_JOBS.md |
| Super admin seed | Only if `SEED_SUPER_ADMIN_EMAIL` + `PASSWORD` (≥12 chars) set during `db:seed` |

---

## Chronology (high level)

**0–8:** Schema, auth, clients, real scan, Action Center, visibility/reports, team/Stripe/admin.  
**9:** Marketing pages, SEO meta, llms.txt, rate limits.  
**10A:** Guides cluster, compare page, /ai.  
**10B:** action-mapper, Action Center UX, QUEUE_AND_JOBS.md.  

---

### 2026-09-28 — Phase 10C: Deploy readiness

**Goal:** Make first production deploy repeatable without tribal knowledge — env vars, host choice for scans, super-admin bootstrap, post-deploy checks.

**What we did:**

1. **`docs/DEPLOY.md`**
   - Railway/Render vs Vercel tradeoff for in-process scans
   - Full production env table
   - Stripe webhook setup
   - Smoke-test checklist
   - Search Console / llms.txt go-live steps
   - Known limits until queue migrates

2. **`prisma/seed.ts`**
   - Optional SUPER_ADMIN upsert from:
     - `SEED_SUPER_ADMIN_EMAIL`
     - `SEED_SUPER_ADMIN_PASSWORD` (min 12)
     - `SEED_SUPER_ADMIN_NAME` (optional)
   - `agencyId: null`, role `SUPER_ADMIN`

3. **`.env.example`** — production notes + seed vars documented

4. **`README.md`** — status 0–10C, links DEPLOY + QUEUE docs, production summary, seed super-admin example

5. **PROJECT_PLAN** — MVP roadmap closed; optional future work listed without fake phases

**Key files:** `docs/DEPLOY.md`, `prisma/seed.ts`, `.env.example`, `README.md`, `PROJECT_PLAN.md`

**Outcome:** Owner can deploy with a written checklist; super admin no longer requires ad-hoc SQL only.

**Gotchas:** Unset seed password from long-lived host env after first seed if the platform keeps env vars forever. Column names in manual SQL may differ — prefer seed path.

---

## Deploy reminder

Follow **docs/DEPLOY.md** end-to-end. Do not skip HTTPS `NEXTAUTH_URL`.
