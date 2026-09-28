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
| Site URL | Marketing metadata and sitemap fall back to `threezero.agency` if `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` unset — must set real HTTPS subdomain before launch |
| AI crawlers | robots.ts allows marketing paths + `/llms.txt` for GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, anthropic-ai, CCBot; dashboard/admin/api stay disallowed |
| OG image | Layout references `/og.png` — ensure `public/og.png` exists on deploy (1200×630) |

---

### 2026-09-28 — Phase 12 execution: marketing densify + competitor edge on existing pages

**Goal**

Owner asked to finish remaining Phase 12 work and push competitive edge without local setup and without creating parallel files. Success criteria: denser answer-first copy, expanded FAQ schema, honest competitor positioning (free checkers vs visibility trackers vs AEO Command), internal link cluster across marketing surfaces, and documentation updated with full ship detail.

**What we did**

1. **`/aeo` expanded** — Answer-first definition in the lead; new sections on the shift from blue links, AEO vs SEO, AEO and GEO, agency delivery, and product mapping; FAQs expanded to seven items including “best AEO tool for agencies” and “how AI decides what to cite”; Article JSON-LD given datePublished/dateModified and Organization author/publisher URLs; internal links to checklist, ChatGPT guide, compare, product, pricing.
2. **`/product` expanded** — Entity sentence naming Threezero Agency; feature copy stresses delivery vs free checkers; FAQ block with FAQPage schema; links into `/aeo`, checklist, pricing.
3. **`/compare/aeo-tools` expanded** — Four-column table (Capability / Free checkers / Visibility trackers / AEO Command); honest positioning of Peec AI, Profound, LLM Pulse, Otterly, Rankability, Semrush/Ahrefs as trackers; FAQs covering best agency tool, free checkers, named competitor class, and commercial keyword themes; internal links to product, checklist, `/aeo`.
4. **Already present from prior Phase 12 foundation (not re-broken)** — Root layout `@graph` (Organization + WebSite + SoftwareApplication), OG/Twitter image paths, robots AI-bot allow rules, marketing nav + footer cluster, strengthened `llms.txt` and `/ai`, denser home cluster links.
5. **No new parallel pages** — All changes edited existing routes only.

**Key files**

- `app/aeo/page.tsx` — denser guide + FAQ/Article schema
- `app/product/page.tsx` — product edge + FAQ schema
- `app/compare/aeo-tools/page.tsx` — three-way comparison + competitor-aware FAQs
- `HISTORY.md` / `PROJECT_PLAN.md` — this ship record

**Outcome / acceptance**

- `/aeo`, `/product`, `/compare/aeo-tools` each lead with a citable definition and expose FAQ JSON-LD matching visible questions.
- Compare page can be cited for “AEO tool for agencies” vs free checker vs tracker distinction.
- Internal links connect hub and spokes without orphan marketing URLs.

**What is still missing / deferred**

- Owner must host subdomain and set `NEXT_PUBLIC_APP_URL` + `NEXTAUTH_URL` to real HTTPS.
- `public/og.png` binary must exist at 1200×630 on the host (path already referenced).
- Search Console verification, sitemap submit, and live citation prompt monitoring only after DNS.
- Optional further densify of individual guide bodies (`chatgpt-citations`, `perplexity-visibility`) if Phase 13 opens.
- Earned third-party corroboration (G2, roundups, backlinks) is off-site work, not code.

**Gotchas**

- Pricing page remains a client component; metadata stays on other routes and layout defaults. Do not convert pricing to a broken hybrid without a server layout if metadata is required later.
- Named competitors are descriptive, not affiliation claims; keep “not affiliated” language on `/ai` and `llms.txt`.
- Never invent a second SEO markdown file; methods stay in conversation + HISTORY.

---

### 2026-09-28 — Phase 12 kickoff: AEO/SEO 10/10 foundation (competitor intel + advanced method set + governance hardening)

**Goal**

Owner required a measurable path from the current ~7.5/10 AEO/SEO readiness to a 10/10 foundation that can compete with live agency AEO platforms once the product is hosted on a main-domain subdomain. Success criteria set before work: (1) competitors mapped by agency vs retail focus with the keywords they actually win on, (2) one hundred non-basic, modern methods that real operators use to earn AI citations and search rankings in 2026, (3) AGENTS.md and HISTORY/README rules upgraded so every future ship carries full architectural and outcome detail instead of one-liners, (4) no unnecessary new files — only edit existing governance and marketing surfaces.

**What we did**

1. **Governance hardening** — AGENTS.md rewritten so HISTORY entries must include Goal, What we did, Key files, Outcome/acceptance, What is still missing, and Gotchas in full prose. README is required to hold complete architecture, flows, env purpose, goals achieved, and goals remaining. Explicit rule added: prefer editing existing files; never create parallel files for the same topic.
2. **PROJECT_PLAN** — Phase 12 opened as the single NEXT phase with ordered deliverables (competitor map → 100 methods → in-place content/schema expansion → OG/Twitter completeness → internal cluster → post-deploy checklist). Explicitly out of scope: new blog app or duplicate SEO micro-pages.
3. **Competitor intelligence** — Agency-side platforms researched and locked for targeting: Peec AI, Rankability, Profound, Scrunch AI, LLM Pulse, SE Ranking AI Search, Search Atlas, Otterly.ai, Mentions, SolCrys, Topify, Geneo, Frizerly, MaxAEO, RadarKit, AI Rank Lab. Retail / single-brand / suite side: Writesonic GEO, AthenaHQ, Prefer, HubSpot AEO, Semrush AI Visibility Toolkit, Ahrefs Brand Radar, AirOps. Winning keyword clusters extracted (white-label AEO report, multi-client AEO tool, AI visibility tracking for agencies, ChatGPT citation tracker, GEO software white label, etc.).
4. **Method inventory** — One hundred advanced methods compiled covering entity graphs, nested JSON-LD @graph, answer-first chunking, third-party corroboration, AI-crawler allowlists, citation monitoring loops, topical authority clusters, earned media for AI training surfaces, and modern technical signals. Methods are execution-ready after subdomain is live; they are not basic “add meta title” advice.
5. **No product-code breakage** — This ship is documentation and planning only. Existing scan worker, Action Center, auth, billing, and multi-tenant isolation are untouched.

**Key files**

- `AGENTS.md` — documentation rules expanded; edit-existing preference formalized
- `PROJECT_PLAN.md` — Phase 12 defined as NEXT
- `HISTORY.md` — this entry
- `README.md` — architecture and goals expanded in same commit wave

**Outcome / acceptance**

- Any new agent reading AGENTS.md must produce HISTORY entries with all seven required sections.
- PROJECT_PLAN shows Phase 12 as NEXT with clear deliverables and out-of-scope.
- Owner has a competitor list and a 100-method playbook usable the day the subdomain goes live.

**What is still missing / deferred**

- Live subdomain not yet set by owner (DNS + `NEXT_PUBLIC_APP_URL` + `NEXTAUTH_URL`).
- In-page content density upgrades on `/aeo`, guides, compare, home, product, pricing (to be done by editing those existing files, not new ones).
- OG/Twitter images and full Organization `sameAs` graph still to be completed on layout.
- Search Console verification and first citation monitoring prompts only possible after host.

**Gotchas**

- Do not invent a second “SEO playbook” markdown file; keep methods and competitor notes in HISTORY / owner conversation / Phase 12 execution on existing marketing pages.
- When editing marketing pages, preserve existing FAQ and Article JSON-LD patterns already on `/aeo` and extend them rather than replacing.
- Never weaken `agencyId` isolation or ship scan cost increases without plan limits.

---

### 2026-09-28 — Phase 11: Queue, rescan, visibility, case studies

**Goal:** Ship everything previously deferred: durable jobs, weekly re-scan + email, stronger visibility, more content.

**What we did:**

1. **Inngest** — `lib/inngest/client.ts`, `functions.ts` (`scan/run` with retries + owner email, hourly re-scan cron, Monday digest), `app/api/inngest/route.ts`. `enqueueScan` sends Inngest event when configured.
2. **Email** — `lib/email.ts` Resend + console fallback; templates for scan complete + weekly digest.
3. **Re-scan** — Prisma Client fields; PATCH API; `ClientRescanToggle` on client detail; cron respects plan scan limits.
4. **Visibility** — `lib/visibility-check.ts` multi-engine results; optional live Perplexity; snapshots store engine breakdown in `sources`.
5. **Content** — `/case-studies` with three agency-style stories.
6. **Deps** — `inngest`, `resend` in package.json; env example updated.

**Key files:** `lib/inngest/*`, `lib/email.ts`, `lib/visibility-check.ts`, `lib/scan-worker.ts`, `prisma/schema.prisma`, `components/client-rescan-toggle.tsx`, `app/case-studies/page.tsx`, `app/api/inngest/route.ts`

**Outcome:** Production can run durable scans and schedules via Inngest; product value denser offline with heuristics.

**What is still missing / deferred:** ChatGPT/Bing live engine keys when available; server-side PDF; client view-only portal.

**Gotchas:** Inngest required for durable queue; without keys scans stay in-process.

---

Phases 0–10C summarized in prior commits. Deploy: **docs/DEPLOY.md** + Inngest sync to `/api/inngest`.
