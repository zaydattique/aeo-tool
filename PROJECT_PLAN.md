# AEO Command — PROJECT PLAN

> Repo: `zaydattique/aeo-tool`

## Boot

AGENTS.md → PROJECT_PLAN → HISTORY → docs/FILEMAP.md → docs/DEPLOY.md

---

## PHASE 0–12 — Done

See HISTORY.md.

---

## PHASE 13 — Product value features

**Status:** 13.1 Done (2026-09-28). Next: 13.2

**Goal:** Features agencies pay more for, in delivery order.

| Step | Feature | Status |
|------|---------|--------|
| **13.1** | Client live portal `/p/[token]` + enable/rotate/disable | **Done** |
| **13.2** | Report PDF polish (print CSS + optional server PDF) | NEXT |
| **13.3** | Competitor prompts + share-of-answer | Queued |
| **13.4** | Live multi-engine checks (when keys) | Queued |
| **13.5** | Auto-draft richer Action fixes | Queued |

**13.1 deploy note:** `npx prisma db push` for `portalToken` / `portalEnabled`.

**Out of scope:** SEO rank-tracker clone, mobile apps, ranking guarantees.

---

## Optional later

- Portal password gate
- Custom domain for portal/report
- Public API / webhooks
