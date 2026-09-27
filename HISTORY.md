# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Last updated: **2026-09-28**

## Gotchas

- Scans: optional `FIRECRAWL_API_KEY` + `ANTHROPIC_API_KEY`
- Billing: requires `STRIPE_SECRET_KEY` + webhook secret; without keys checkout returns 503
- Super admin users need `role: SUPER_ADMIN` and typically null `agencyId` until impersonation
- Visibility snapshots are MVP estimates (not live multi-engine checks)

## Chronology

| Date | What |
|------|------|
| 2026-09-27 | Phases 0–7 (Grok) — foundation through reports |
| 2026-09-28 | **Phase 8 (Grok)** — Team invites, Stripe checkout/portal/webhook, usage metering, Super Admin panel (list/create/suspend/impersonate) |
