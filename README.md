# AEO Command

Multi-tenant AEO platform for agencies: scan → Action Center → visibility → white-label report.

| | |
|--|--|
| **Repo** | https://github.com/zaydattique/aeo-tool |
| **AI entry** | [AGENTS.md](./AGENTS.md) |
| **Roadmap** | [PROJECT_PLAN.md](./PROJECT_PLAN.md) |

## Status (2026-09-28)

**Phases 0–8 done.** Next: Phase 9 (marketing + security polish).

Includes: auth, clients, scans, Action Center, visibility/reports, team invites, Stripe billing APIs, Super Admin (`/admin`).

## Env

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
# optional
FIRECRAWL_API_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

```bash
npm install && npx prisma db push && npm run db:seed && npm run dev
```
