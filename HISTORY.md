# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Schema | `db push` for portal, competitors, prompt kind/targetName |
| PDF | `npm install` for pdfkit |
| Live engines | Keys optional; without them checks are heuristic |
| Action drafts | Enrich uses templates always; AI redraft needs `ANTHROPIC_API_KEY` |

---

### 2026-09-28 — Phase 13.5: Richer Action Center drafts

**Goal**

Turn Action Center from short advice into **paste-ready implementation drafts** agencies can assign to juniors — schema JSON-LD, meta tags, llms.txt, content outlines — with optional AI redraft.

**What we did**

1. **`lib/action-draft-templates.ts`** — Category/title-aware templates (Organization/FAQ JSON-LD, title/meta/canonical/viewport/OG, H1, thin-content outline, llms.txt, alt text).
2. **`lib/action-mapper.ts`** — `enrichSuggestedFix` + `buildRichSteps` on every scan-generated action; `enrichActionFields` for single-action refresh; brand/URL context from scan worker.
3. **`lib/scan-worker.ts`** — Passes client brand/URL into mapper; suggestedText limit raised to 8000 for code blocks.
4. **`POST /api/actions/[id]/redraft`** — Optional Claude rewrite, then template enrichment; returns `method: ai|template`.
5. **Action Center UI** — **Enrich draft** button, preformatted suggested fix, expanded steps after redraft.

**Outcome**

- New scans get richer suggested fixes automatically.
- Existing actions can be enriched without a full re-scan.
- Works without AI keys (templates only).

**Deferred**

- Bulk enrich-all
- Storing draft version history

---

### 2026-09-28 — Phase 13.4: Live multi-engine visibility

Parallel live checks: Perplexity, OpenAI (chatgpt), Gemini, Claude when keys set; heuristics fill gaps; `/api/visibility/status` + UI engine badges.

---

### 2026-09-28 — Phase 13.3: Competitors + SOV

Client.competitors, prompt kinds, competitor seed prompts, SOV panel.

---

### 2026-09-28 — Phase 13.2: PDF

PDFKit downloads for report + portal; print CSS.

---

### 2026-09-28 — Phase 13.1: Client portal

`/p/[token]` live read-only progress.

---

Deploy: **docs/DEPLOY.md**.
