# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** platform for agencies.

Paste a client URL → full scan → prioritized Action Center with exact steps → assign → track → white-label report.

| | |
|--|--|
| **Repo** | https://github.com/zaydattique/aeo-tool |
| **AI entry** | **[AGENTS.md](./AGENTS.md)** — every AI must read this first |
| **Roadmap** | [PROJECT_PLAN.md](./PROJECT_PLAN.md) |
| **History** | [HISTORY.md](./HISTORY.md) |

---

## AI / Grok bootstrap (mandatory)

```text
Repo: zaydattique/aeo-tool
Mandatory: read AGENTS.md, then HISTORY.md, then PROJECT_PLAN.md, then do my task.
Never push placeholders or incomplete files.
Language: English / Urdu / Roman Urdu only.
Task: <write task here>
```

---

## Current Situation (2026-09-27)

- **Phase 0–4 Done**
- **Next: Phase 5** — Real Crawl + AI Analysis

### What works now
- Auth: signup, login, forgot/reset password, team invite, onboarding
- Client CRUD with URL validation + plan limits
- Start scan → live progress bar through stages → complete
- Simulated analysis sets a visibility score (real AI in Phase 5)
- Client detail + scan history

### What does NOT exist yet
- Real website crawl + Claude analysis (Phase 5)
- Action Center (Phase 6)
- Reports, billing, super admin, etc.

---

## Local Development

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
# Set DATABASE_URL and NEXTAUTH_SECRET
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

- App: http://localhost:3000  
- Dashboard: http://localhost:3000/dashboard  

---

## License

UNLICENSED — private Threezero Agency software.
