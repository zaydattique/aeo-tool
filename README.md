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

- **Phase 0–3 Done**
- **Next: Phase 4** — Client Management + Scan Queue

### What works now
- Signup → creates agency + owner (14-day trial)
- Login / logout
- Forgot + reset password
- Accept team invite
- Onboarding wizard (name + logo URL)
- Protected dashboard with session context (agencyId, role)
- Middleware enforces auth + onboarding gate

### What does NOT exist yet
- Client CRUD / scans (Phase 4)
- Real crawl + AI (Phase 5)
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
- Health: http://localhost:3000/api/health  
- Signup: http://localhost:3000/signup  

---

## Locked Tech Stack

Next.js 15 · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth (JWT) · bcryptjs · Zod

---

## License

UNLICENSED — private Threezero Agency software.
