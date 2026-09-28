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
| AI crawlers | robots.ts allows marketing paths + `/llms.txt`; dashboard/admin/api stay disallowed |

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
