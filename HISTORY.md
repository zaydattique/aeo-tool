# AEO Command — HISTORY (for humans and other AIs)

> **Read this before changing code.** This is the operational memory of the product.  
> Repo: `zaydattique/aeo-tool`  
> Last updated: **2026-09-27**  
> Related: [AGENTS.md](./AGENTS.md) · [README.md](./README.md) · [PROJECT_PLAN.md](./PROJECT_PLAN.md)

---

## Product identity (stable)

**AEO Command** — multi-tenant AEO/GEO platform for agencies.  
Core: URL → scan → Action Center → report.  
Isolation via `agencyId`. Roles: super_admin | agency_owner | agency_member.

Language with owner: **English, Urdu, or Roman Urdu only**.

---

## Open incidents / gotchas

- Scans work without API keys (heuristic). Set `FIRECRAWL_API_KEY` + `ANTHROPIC_API_KEY` for production quality.
- New scan soft-deletes previous open (TODO/IN_PROGRESS) actions for that client so Action Center reflects latest recommendations.

---

## Chronology (append)

| Date | What |
|------|------|
| 2026-09-27 | **Phase 0–5 (Grok)** — Foundation through real crawl + AI analysis. |
| 2026-09-27 | **Phase 6 complete (Grok)** — Action Center. Scan worker creates Action rows. APIs: list/filter actions, update status/assign. UI: filters, status dropdown, team assign, copy suggested text. Client detail page integrates Action Center. |

---

## Deploy reminder

(To be filled after infrastructure is live)
