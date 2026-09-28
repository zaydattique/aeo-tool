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

## PHASE 12 — AEO + SEO 10/10 foundation

**Status:** Code/content complete (2026-09-28). **Blocked only on owner host + post-deploy.**

**Goal:** Take the marketing surface to measurable 10/10 AEO readiness and competitive SEO potential once the subdomain is live.

**Deliverables completed in repo:**
1. Competitor map (agency + retail) and winning keyword inventory — done
2. 100 advanced AEO/SEO methods — done (owner conversation + HISTORY)
3. Expand existing marketing pages (`/aeo`, `/product`, `/compare/aeo-tools`, home, guides hub, layout graph, robots AI bots, nav/footer cluster) — done in place
4. Strengthen `public/llms.txt` and `/ai` — done
5. OG/Twitter paths + WebSite/Organization/SoftwareApplication `@graph` on layout — done (ensure `public/og.png` binary on host)
6. Internal linking cluster — done
7. Post-deploy checklist — **owner** after DNS: Search Console, sitemap submit, crawler log check, citation prompt set

**Out of scope (unchanged):** separate blog app, parallel SEO micro-pages.

**NEXT:** Owner hosts subdomain with correct `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL`, adds `public/og.png`, runs Search Console. Optional Phase 13 only if opened for more guide depth or engine APIs.

---

## Optional later

- More engine APIs (ChatGPT/Bing) when keys available
- Server-side PDF
- Client view-only portal
- Further densify individual guide bodies
