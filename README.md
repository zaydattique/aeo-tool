# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** platform for agencies.

Paste a client URL → full scan → prioritized Action Center with exact steps → assign → track → white-label report.

| | |
|--|--|
| **Repo** | https://github.com/zaydattique/aeo-tool |
| **Marketing** | threezero.agency (planned) |
| **App** | app.threezero.agency (planned) |
| **Super Admin** | admin.threezero.agency (planned) |
| **AI entry** | **[AGENTS.md](./AGENTS.md)** — every AI / Grok must read this first |
| **Roadmap** | [PROJECT_PLAN.md](./PROJECT_PLAN.md) |
| **History** | [HISTORY.md](./HISTORY.md) |

---

## AI / Grok bootstrap (mandatory)

**Any Grok, Cursor, or other AI** working on this repo must do this before coding:

1. Open **[AGENTS.md](./AGENTS.md)** (non-negotiables + source-of-truth map)  
2. Open **[HISTORY.md](./HISTORY.md)** (what already shipped + incidents)  
3. Open **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** (next open phase only)  
4. Use this README for stack and current status  

**Owner paste when starting a new Grok chat:**

```text
Repo: zaydattique/aeo-tool
Mandatory: read AGENTS.md, then HISTORY.md, then PROJECT_PLAN.md, then do my task.
Repo files win over chat memory.
Never push placeholders or incomplete files.
Language: English / Urdu / Roman Urdu only.
Task: <write task here>
```

---

## Current Situation (2026-09-27)

- **Phase 0 Done** — Agent rules, history, project plan, README, .cursorrules, .gitignore.
- **Phase 1 Done** — Full project scaffold + tech stack locked.
- **Next: Phase 2** — Complete multi-tenant Prisma schema.

### What exists now
- Next.js 15 App Router + TypeScript + Tailwind
- Prisma skeleton (Agency + User models)
- `/api/health` endpoint
- Simple landing page
- All config files ready for `npm install && npm run dev`

### What does NOT exist yet
- Full database schema (Phase 2)
- Auth / onboarding (Phase 3)
- Client management or scans (Phase 4+)
- Action Center, reports, billing, etc.

---

## Locked Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui (ready) |
| Database | PostgreSQL (Neon) + Prisma |
| Auth | NextAuth.js (Auth.js) |
| Jobs | Inngest (preferred) |
| AI | Anthropic Claude (primary) |
| Crawl | Firecrawl |
| Payments | Stripe |
| Hosting | Vercel |

---

## Local Development (after Phase 1)

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
# Fill DATABASE_URL and NEXTAUTH_SECRET
npm install
npx prisma generate
npm run dev
```

Health check: http://localhost:3000/api/health

---

## Product Promise

Strict multi-tenant isolation. Every business table carries `agencyId`.  
Roles: `super_admin` | `agency_owner` | `agency_member`.  
Core workflow is the only thing that matters: **URL → Action Center → Report**.

---

## License

UNLICENSED — private Threezero Agency software.
