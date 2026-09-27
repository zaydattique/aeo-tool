# AEO Command

Multi-tenant **Answer Engine Optimization** platform for agencies.

Paste URL → scan → **Action Center** → track visibility → white-label report.

| | |
|--|--|
| **Repo** | https://github.com/zaydattique/aeo-tool |
| **AI entry** | [AGENTS.md](./AGENTS.md) |
| **Roadmap** | [PROJECT_PLAN.md](./PROJECT_PLAN.md) |
| **History** | [HISTORY.md](./HISTORY.md) |

## Current (2026-09-27)

- **Phase 0–7 Done**
- **Next: Phase 8** — Team, Billing & Super Admin

Working: auth, clients, real scans, Action Center, visibility prompts/snapshots/chart, live white-label reports (`/r/[token]`).

## Local

```bash
cp .env.example .env.local   # DATABASE_URL, NEXTAUTH_SECRET
npm install && npx prisma db push && npm run db:seed && npm run dev
```
