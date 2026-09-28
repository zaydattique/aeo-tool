# AEO Command — PROJECT PLAN

> Repo: `zaydattique/aeo-tool`

## Boot

AGENTS.md → PROJECT_PLAN → HISTORY → docs/FILEMAP.md → docs/DEPLOY.md

---

## PHASE 0–10C — Done (MVP)

MVP product + marketing cluster + deploy docs. See HISTORY for full detail.

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

## PHASE 12 — AEO + SEO 10/10 foundation (NEXT)

**Status:** In progress (planning + competitor intelligence + advanced method list shipped 2026-09-28)

**Goal:** Take the live marketing surface from “solid foundation (~7.5/10)” to measurable 10/10 AEO readiness and competitive SEO ranking potential once the subdomain is live. No local setup required from owner; work is code + content + structured data + authority playbook.

**Deliverables (ordered):**
1. Competitor map (agency-wise + retail-wise) and winning keyword inventory locked into docs
2. 100 advanced, non-basic methods (AEO + SEO) documented for execution
3. Expand existing marketing pages (edit in place: layout metadata, `/aeo`, guides, compare, home, product, pricing) with deeper entity clarity, answer-first blocks, denser FAQ schema, sameAs, Speakable where useful
4. Strengthen `public/llms.txt` and `/ai` as the canonical AI ingestion surface
5. Add OG image + Twitter image + WebSite/Organization graph completeness on layout
6. Internal linking cluster between `/aeo` ↔ guides ↔ compare ↔ product ↔ pricing
7. Post-deploy checklist: Search Console, sitemap, crawler allowlist verification, citation monitoring prompts

**Out of scope for Phase 12:** building a separate blog app, new micro-sites, or parallel SEO tool pages that duplicate existing guides.

**NEXT after Phase 12:** optional Phase 13 content depth (more guides only if PROJECT_PLAN opens it) or production queue hardening.

---

## Optional later

- More engine APIs (ChatGPT/Bing) when keys available
- Server-side PDF
- Client view-only portal
