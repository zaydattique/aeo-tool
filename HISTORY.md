# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Inngest | Without `INNGEST_EVENT_KEY` / dev server, scans fall back to in-process |
| Re-scan cron | Only runs when Inngest is connected; toggle still saves schedule in DB |
| Email | Without `RESEND_API_KEY`, emails log to console |
| Visibility | Perplexity live if `PERPLEXITY_API_KEY`; else multi-engine heuristics |
| Schema | `Client.rescanEnabled` / `rescanIntervalDays` / `nextRescanAt` — run `db push` |
| Site URL | Set `NEXT_PUBLIC_APP_URL` + `NEXTAUTH_URL` to real HTTPS subdomain before launch |
| AI crawlers | robots allows marketing paths for GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, anthropic-ai, CCBot |
| OG images | Dynamic routes `/opengraph-image` and `/twitter-image` — do not require static `public/og.png` |

---

### 2026-09-28 — Phase 12 final: 10/10 in-repo AEO/SEO surface

**Goal**

Owner required a 10/10 score. Prior ships left gaps: missing static og.png, thin guide bodies, no home/pricing page-level metadata, incomplete FAQ schema on secondary guides. This ship closes every remaining in-repo gap so the only blockers are host DNS and off-site authority.

**What we did**

1. **Dynamic social images** — Added `app/opengraph-image.tsx` and `app/twitter-image.tsx` (Next.js `ImageResponse`, 1200×630). Updated `app/layout.tsx` to reference `/opengraph-image` in Open Graph, Twitter, and JSON-LD logo/image fields so deploy no longer depends on a missing `public/og.png` binary.
2. **Home metadata** — `app/page.tsx` now exports full Metadata (title, description, keywords, canonical).
3. **Pricing metadata** — `app/pricing/layout.tsx` added solely for Metadata on the existing client pricing page (no duplicate pricing UI).
4. **Guide densify** — ChatGPT citations, Perplexity visibility, and AEO checklist expanded with answer-first leads, more FAQs, Article/FAQ JSON-LD where appropriate, canonicals, and internal links.
5. **FILEMAP** — Documented opengraph-image, twitter-image, pricing layout, inngest, email, visibility-check paths.
6. **PROJECT_PLAN** — Phase 12 marked Done in repo; owner post-deploy items listed explicitly.

**Key files**

- `app/opengraph-image.tsx`, `app/twitter-image.tsx`
- `app/layout.tsx`
- `app/page.tsx`, `app/pricing/layout.tsx`
- `app/guides/chatgpt-citations/page.tsx`, `app/guides/perplexity-visibility/page.tsx`, `app/guides/aeo-checklist/page.tsx`
- `docs/FILEMAP.md`, `PROJECT_PLAN.md`, `HISTORY.md`

**Outcome / acceptance**

- After deploy with correct public URL env, `/opengraph-image` returns a PNG; layout metadata and JSON-LD point at it.
- Every major marketing URL has page-level metadata and citable FAQ or article structure where intended.
- In-repo AEO/SEO checklist items from Phase 12 are complete.

**What is still missing / deferred (cannot be code)**

- DNS + HTTPS subdomain and env vars on VPS
- Google Search Console property + sitemap submit
- Real citation monitoring against live prompts
- Third-party corroboration (reviews, roundups, backlinks)

**Gotchas**

- Edge runtime OG images need a host that supports Next.js ImageResponse (standard on Node hosts used for this app).
- Do not reintroduce a hard dependency on `public/og.png` unless the binary is actually committed.

---

### 2026-09-28 — Phase 12 execution: marketing densify + competitor edge

**Goal:** Denser answer-first copy, expanded FAQ schema, honest competitor positioning, internal link cluster.

**What we did:** Expanded `/aeo`, `/product`, `/compare/aeo-tools` with FAQs, three-way comparison table, competitor-aware positioning (free checkers vs visibility trackers vs AEO Command), internal links. Prior foundation (layout graph, robots AI bots, llms.txt, /ai, nav cluster) retained.

**Key files:** `app/aeo/page.tsx`, `app/product/page.tsx`, `app/compare/aeo-tools/page.tsx`

**Outcome:** Core commercial pages are citation-ready and differentiated.

**Missing then:** OG binary, secondary guide densify, home/pricing metadata — closed in Phase 12 final above.

---

### 2026-09-28 — Phase 12 kickoff: competitor intel + 100 methods + governance

**Goal:** Path from ~7.5/10 to 10/10 foundation; full-detail HISTORY/README rules; no parallel files.

**What we did:** AGENTS.md documentation rules; PROJECT_PLAN Phase 12; competitor map (agency + retail); 100 advanced methods for owner; README architecture expansion.

**Key files:** `AGENTS.md`, `PROJECT_PLAN.md`, `HISTORY.md`, `README.md`

**Outcome:** Agents must write full HISTORY; owner has method + competitor inventory.

---

### 2026-09-28 — Phase 11: Queue, rescan, visibility, case studies

**Goal:** Durable jobs, weekly re-scan + email, stronger visibility, case studies content.

**What we did:** Inngest scan/run + crons; Resend email helper; Client rescan fields + toggle; multi-engine visibility; `/case-studies`.

**Key files:** `lib/inngest/*`, `lib/email.ts`, `lib/visibility-check.ts`, `prisma/schema.prisma`, `components/client-rescan-toggle.tsx`, `app/case-studies/page.tsx`

**Outcome:** Production can run durable scans when Inngest configured.

**Gotchas:** Without Inngest keys, scans stay in-process.

---

Phases 0–10C summarized in prior commits. Deploy: **docs/DEPLOY.md**.
