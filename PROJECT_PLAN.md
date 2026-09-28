# AEO Command — PROJECT PLAN

> Repo: `zaydattique/aeo-tool`

## Boot

AGENTS.md → PROJECT_PLAN → HISTORY → docs/FILEMAP.md → docs/DEPLOY.md

---

## PHASE 0–10C — Done (MVP)

---

## PHASE 11 — Deferred value (queue, rescan, visibility, content)

**Status:** Done (2026-09-28)

**Deliverables:**
- Inngest durable scan queue + `/api/inngest` (fallback in-process)
- Weekly re-scan cron + client toggle (`rescanEnabled`, interval, `nextRescanAt`)
- Email: Resend helper + scan-complete notify + Monday digest cron
- Multi-engine visibility checks (`lib/visibility-check.ts`, Perplexity live optional)
- Case studies page `/case-studies`

**After deploy:** `npx prisma db push` for new Client columns; configure Inngest + Resend env (see `.env.example`).

---

## Optional later

- More engine APIs (ChatGPT/Bing) when keys available
- Server-side PDF
- Client view-only portal
