# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** platform for agencies.

Paste a client URL → full scan → **Action Center** with exact steps → assign → track → white-label report.

| | |
|--|--|
| **Repo** | https://github.com/zaydattique/aeo-tool |
| **AI entry** | **[AGENTS.md](./AGENTS.md)** |
| **Roadmap** | [PROJECT_PLAN.md](./PROJECT_PLAN.md) |
| **History** | [HISTORY.md](./HISTORY.md) |

---

## Current Situation (2026-09-27)

- **Phase 0–6 Done** (including core Action Center)
- **Next: Phase 7** — Visibility Tracking + Reports

### Core flow that works
1. Signup / login / onboarding
2. Add client URL
3. Start scan → crawl + AI analysis
4. **Action Center** — prioritized actions, assign, status, copy fix text

Optional keys: `FIRECRAWL_API_KEY`, `ANTHROPIC_API_KEY` (heuristics work without them).

---

## Local Development

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
npm install
npx prisma generate && npx prisma db push && npm run db:seed
npm run dev
```

---

## License

UNLICENSED — private Threezero Agency software.
