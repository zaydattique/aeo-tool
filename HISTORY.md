# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Schema | `db push` for portal + `competitors` + `TrackedPrompt.kind` / `targetName` |
| PDF | `npm install` for pdfkit |
| SOV | Relative scores on tracked prompts — not a live SERP guarantee |
| Live engines | Perplexity only when `PERPLEXITY_API_KEY`; else heuristics |

---

### 2026-09-28 — Phase 13.3: Competitor prompts + share-of-answer

**Goal**

Agencies need competitor context in visibility work: named rivals, vs-style prompts, and a simple share-of-answer view for QBRs — without claiming impossible engine ranks.

**What we did**

1. **Schema** — `Client.competitors String[]`; `TrackedPrompt.kind` (`brand` | `category` | `competitor`); `TrackedPrompt.targetName` for rival brand.
2. **Seeds** — `getDefaultPromptSeeds` + `getCompetitorPromptSeeds` (vs / is-better prompts per competitor).
3. **API** — `GET/PUT /api/clients/[id]/competitors` with optional `seedPrompts`; prompts GET returns `sov`; snapshots pass kind + targetName into visibility check.
4. **`lib/sov.ts`** — Client vs competitor avg scores → share %; breakdown by competitor name.
5. **`lib/visibility-check.ts`** — Competitor-aware heuristics + live Perplexity brand/competitor mention flags stored on snapshot sources.
6. **UI** — Competitors editor, SOV cards, kind badges on prompt list.

**Key files**

- `prisma/schema.prisma`
- `lib/default-prompts.ts`, `lib/sov.ts`, `lib/visibility-check.ts`
- `app/api/clients/[id]/competitors/route.ts`
- `app/api/clients/[id]/prompts/route.ts`, `snapshots/route.ts`
- `app/dashboard/clients/[id]/visibility-reports.tsx`

**Outcome / acceptance**

- Add competitor → auto seed vs-prompts (plan limit aware).
- Record check → SOV panel shows client vs competitor share when both sides have scores.
- Prompt list shows kind badges (brand / category / competitor).

**Missing / deferred**

- 13.4 deeper live multi-engine APIs
- SOV on white-label report PDF (can include later)
- Historical SOV trend chart

**Gotchas**

- Existing prompts without `kind` default to brand in SOV math.
- SOV is relative to tracked set, not global market share.

---

### 2026-09-28 — Phase 13.2: PDF download

PDFKit server PDFs for `/api/reports/[token]/pdf` and `/api/portal/[token]/pdf`; print CSS polish.

---

### 2026-09-28 — Phase 13.1: Client live portal

`/p/[token]` read-only live progress; enable/rotate/disable.

---

### 2026-09-28 — Phase 12: AEO/SEO foundation

Dynamic OG, densified marketing, FAQ schema, AI robots.

---

Deploy: **docs/DEPLOY.md**.
