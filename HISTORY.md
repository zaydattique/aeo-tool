# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Sessions | PROJECT_PLAN Phase 14+ uses **~20 min sessions** (`14.S1` …). One session per ship when possible |
| Host | Phases 0–13 are GitHub-complete; **live product starts at Phase 14 (owner)** |
| Schema | `db push` when first deploying (portal, competitors, prompt kind) |
| PDF | `pdfkit` on `npm install` |
| Live engines | Optional keys; heuristic fallback always |

---

### 2026-09-28 — Plan restructure: Phase 14–18 as 20-minute sessions

**Goal**

Owner asked for new phases wherever work remains, broken into **~20 minute sessions** so agents and humans can ship incrementally without multi-hour ambiguous “phases.”

**What we did**

Replaced the open-ended “optional later” tail with ordered phases:

- **Phase 14** — Go live (mostly owner: DNS, DB, host, env, smoke, Search Console, optional keys). Eight sessions 14.S1–S8.
- **Phase 15** — First pilot polish (post-scan UX, empty states, report/portal tweaks, SOV on report, competitors on create). 15.S1–S8.
- **Phase 16** — Agency ops (CSV exports, bulk status, prompt packs, single recheck, archive→portal off). 16.S1–S8.
- **Phase 17** — Trust/cost (live engine caps, public rate limits, legal microcopy, health/backup docs). 17.S1–S8.
- **Phase 18** — Growth marketing surfaces aligned to Phase 13 product. 18.S1–S8.
- **Phase 19+** — Optional only when owner opens (password portal, custom domain, API, etc.).

Documented agent rules: one session at a time, HISTORY per session, prefer edit-existing, owner-only steps not faked.

**Key files**

- `PROJECT_PLAN.md` — full session tables  
- `HISTORY.md` — this entry  
- `AGENTS.md` — session discipline pointer

**Outcome / acceptance**

- **NEXT** is explicitly `14.S1` (owner DNS).  
- After production smoke (`14.S6`), code sessions may start at `15.S1`.  
- No parallel todo lists; PROJECT_PLAN remains sole ordered queue.

**What is still missing / deferred**

- Actual execution of 14.S1+ (not done in this doc-only ship).  
- Phase 19+ not scheduled.

**Gotchas**

- Do not mark 14.Sx Done without owner confirmation on DNS/host.  
- Do not bundle five sessions into one PR “because they’re small.”

---

### 2026-09-28 — Phase 13.5: Richer Action drafts

Templates + enrich mapper + `/api/actions/[id]/redraft` + Action Center **Enrich draft**.

---

### 2026-09-28 — Phase 13.4: Live multi-engine

Perplexity, OpenAI, Gemini, Claude when keyed; status UI.

---

### 2026-09-28 — Phase 13.3: Competitors + SOV

---

### 2026-09-28 — Phase 13.2: PDF

---

### 2026-09-28 — Phase 13.1: Client portal

---

### 2026-09-28 — Phase 12: AEO/SEO foundation

---

Deploy reference: **docs/DEPLOY.md**.
