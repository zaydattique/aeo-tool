# AEO Command — HISTORY (for humans and other AIs)

> **Read this before changing code.** This is the operational memory of the product.  
> Repo: `zaydattique/aeo-tool`  
> Last updated: **2026-09-27**  
> Related: [AGENTS.md](./AGENTS.md) · [README.md](./README.md) · [PROJECT_PLAN.md](./PROJECT_PLAN.md)

---

## How to use this file

- **Other AIs:** Do not invent phases that contradict PROJECT_PLAN. Check open incidents before new features.
- **Humans:** Append dated entries. Never delete history; mark items superseded.

---

## Product identity (stable)

**AEO Command** is a multi-tenant SaaS platform for agencies that perform Answer Engine Optimization (AEO / GEO).

Core promise: paste client URL → prioritized Action Center with exact steps → assign → track → white-label report.

Strict multi-tenant isolation (`agencyId` on every business table). Roles: super_admin | agency_owner | agency_member.

Language with owner: **English, Urdu, or Roman Urdu only**.

---

## Open incidents / gotchas

None yet.

**Note:** Scans work without API keys (heuristic mode). Set `FIRECRAWL_API_KEY` and `ANTHROPIC_API_KEY` for production-quality crawl + Claude analysis.

---

## Chronology (append)

| Date | What |
|------|------|
| 2026-09-27 | **Phase 0 complete (Grok)** — Repo initialized. |
| 2026-09-27 | **Phase 1 complete (Grok)** — Next.js 15 scaffold. |
| 2026-09-27 | **Phase 2 complete (Grok)** — Full multi-tenant Prisma schema + seed. |
| 2026-09-27 | **Phase 3 complete (Grok)** — Auth + onboarding. |
| 2026-09-27 | **Phase 4 complete (Grok)** — Client CRUD + simulated scan queue + dashboard. |
| 2026-09-27 | **Phase 5 complete (Grok)** — Real crawl (`lib/crawl.ts`: Firecrawl + basic fallback) + AI analysis (`lib/ai-analysis.ts`: Claude + heuristic). Scan worker stores rawCrawlData + aiAnalysis with scores/issues/actionDrafts. Client detail shows full analysis UI. |

---

## Deploy reminder

(To be filled after infrastructure is live)
