# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** platform for agencies.

Paste a client URL → full scan → prioritized Action Center with exact steps → assign → track → white-label report.

| | |
|--|--|
| **Repo** | https://github.com/zaydattique/aeo-tool |
| **AI entry** | **[AGENTS.md](./AGENTS.md)** |
| **Roadmap** | [PROJECT_PLAN.md](./PROJECT_PLAN.md) |
| **History** | [HISTORY.md](./HISTORY.md) |

---

## Current Situation (2026-09-27)

- **Phase 0–5 Done**
- **Next: Phase 6** — Action Center (core product)

### What works now
- Auth, onboarding, multi-tenant isolation
- Client CRUD + plan limits
- **Real scan pipeline:** crawl → extract signals → AI analysis → store results
- Firecrawl (optional) + Claude (optional); heuristic fallback without keys
- Client detail: visibility score, dimension scores, strengths/weaknesses, prioritized issues

### Optional API keys for production quality
```
FIRECRAWL_API_KEY=...   # better crawl
ANTHROPIC_API_KEY=...   # Claude AEO analysis
```
Without keys, scans still complete using basic fetch + heuristics.

---

## Local Development

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
# Set DATABASE_URL, NEXTAUTH_SECRET
# Optionally: FIRECRAWL_API_KEY, ANTHROPIC_API_KEY
npm install
npx prisma generate && npx prisma db push && npm run db:seed
npm run dev
```

---

## License

UNLICENSED — private Threezero Agency software.
