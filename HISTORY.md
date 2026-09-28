# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Schema | `db push` for portal + competitors + prompt kind/targetName |
| PDF | `npm install` for pdfkit |
| Live engines | Without keys, checks are heuristic-only; UI shows live vs heuristic badges |
| AI Overviews | No public API — always heuristic row |
| Cost | Each Record check can call up to 4 live APIs × N prompts — watch quotas |

---

### 2026-09-28 — Phase 13.4: Live multi-engine visibility

**Goal**

Move beyond Perplexity-only live checks. Parallel live providers where keys exist; honest heuristic fallback; agency-visible status of which engines are live.

**What we did**

1. **`lib/visibility-check.ts`** — Parallel live callers:
   - Perplexity (`PERPLEXITY_API_KEY`)
   - OpenAI → engine `chatgpt` (`OPENAI_API_KEY`)
   - Gemini (`GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`)
   - Claude (`ANTHROPIC_API_KEY`)
   - `ai_overviews` remains heuristic-only
2. Shared mention scoring + competitor-aware adjustments; `liveEngineCount` + method `live` | `live+heuristic` | `heuristic`.
3. **`getLiveEngineCapabilities()`** + **`GET /api/visibility/status`** (agency auth, no secrets).
4. Snapshots store `liveEngineCount`; Record check response includes `maxLiveEngines`.
5. Visibility UI engine strip (live/heuristic badges) + post-check feedback.
6. `.env.example` documents all visibility keys and optional model overrides.

**Key files**

- `lib/visibility-check.ts`
- `app/api/visibility/status/route.ts`
- `app/api/clients/[id]/snapshots/route.ts`
- `app/dashboard/clients/[id]/visibility-reports.tsx`
- `.env.example`

**Outcome / acceptance**

- With zero keys: checks still work (heuristic), badges show heuristic.
- With any key: that engine row is `live: true` on snapshot sources; UI reflects configured engines.
- Failures on one provider do not block others or the snapshot write.

**Missing / deferred**

- Official Google AI Overviews / Bing Copilot consumer APIs (not generally available)
- Rate limiting / credit metering per live call (usage meter can be extended later)
- Phase 13.5 auto-draft Action fixes

**Gotchas**

- Live checks cost tokens; prefer fewer prompts or staged checks on large client lists.
- Model names may need host-specific overrides via `*_VISIBILITY_MODEL` env vars.

---

### 2026-09-28 — Phase 13.3: Competitors + SOV

Client.competitors, prompt kinds, vs-prompt seeds, sov.ts, UI SOV panel.

---

### 2026-09-28 — Phase 13.2: PDF

PDFKit downloads for report + portal; print CSS.

---

### 2026-09-28 — Phase 13.1: Client portal

`/p/[token]` live read-only portal.

---

Deploy: **docs/DEPLOY.md**.
