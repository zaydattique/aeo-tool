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

- Repo was empty (previous agent only created the blank repository).
- **Phase 0 complete**: Agent rules, history, project plan, and this README are in place.
- **Phase 1 is next**: Project scaffold + tech stack lock (Next.js 15 + Prisma + etc.).

No application code exists yet. Do not invent features ahead of the plan.

---

## Planned Tech Stack (Phase 1 will lock this)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon) + Prisma |
| Auth | NextAuth.js (Auth.js) |
| Jobs | Inngest (preferred) |
| AI | Anthropic Claude (primary) |
| Crawl | Firecrawl |
| Payments | Stripe |
| Hosting | Vercel |

---

## Product Promise

Strict multi-tenant isolation. Every business table carries `agencyId`.  
Roles: `super_admin` | `agency_owner` | `agency_member`.  
Core workflow is the only thing that matters: **URL → Action Center → Report**.

---

## License

UNLICENSED — private Threezero Agency software.
