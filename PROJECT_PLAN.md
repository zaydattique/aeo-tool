# AEO Command — PROJECT PLAN (single list)

> **Only to-do file.** Repo: `zaydattique/aeo-tool`

## Boot every session

1. AGENTS.md → 2. This file → 3. HISTORY.md → 4. docs/FILEMAP.md

---

## PHASE 0–8 — Done

Foundation through Team, Billing & Super Admin (see HISTORY.md for full detail).

---

## PHASE 9 — Marketing foundation + Security polish

**Status:** Done (2026-09-28)

**Deliverables completed:**
- Marketing nav/footer; home, /product, /pricing (PK/INT toggle), /aeo guide
- SEO: metadata, OG, SoftwareApplication JSON-LD, FAQ + Article schema on /aeo
- robots.ts, sitemap.ts, public/llms.txt
- Rate limits: signup (IP), scan start (per agency); plan scan limits retained
- Soft limits already on team/usage; burst protection added

**Acceptance met:** Public marketing site crawlable; AEO education page live; expensive routes rate-limited.

---

## PHASE 10 — Rank-first content + product strength

**Status:** Open ← **NEXT**

**Goal:** Own “AEO tools / Answer Engine Optimization” in search *and* AI suggestions; deepen product value beyond MVP.

**Exact deliverables (sized for one solid agent pass each when split):**

### 10A — Content cluster (ranking)
- Comparison page: AEO Command vs free AEO checkers
- Guide pages: ChatGPT citations, Perplexity visibility, AEO checklist for agencies
- Internal linking from home/product/pricing into cluster
- Expand llms.txt + optional `/ai` summary page for assistants

### 10B — Product strength
- Stronger Action Center defaults (better issue→task mapping)
- Email notification stubs or weekly re-scan schedule design
- Dashboard UX polish closer to agency-grade UI
- Document durable queue migration path (Inngest/BullMQ) in HISTORY

### 10C — Deploy readiness notes
- Production env checklist in README
- Super-admin seed script or documented SQL

**Acceptance:** Clear path to rank for primary AEO queries; product feels denser than scan-only MVP.

---

## Phase Index

| Phase | Status |
|-------|--------|
| 0–8 | Done |
| 9 Marketing + security | Done |
| 10 Rank-first content + product strength | Open ← NEXT |
