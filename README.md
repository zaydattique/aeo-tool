# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** SaaS for agencies.

**Product promise:** paste a client URL → full scan → prioritized **Action Center** with exact steps → assign & track → **white-label** live report.

| Doc | Purpose |
|-----|---------|
| **[AGENTS.md](./AGENTS.md)** | Rules every AI must follow |
| **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** | Ordered phases / next work |
| **[HISTORY.md](./HISTORY.md)** | Detailed what/why/files per ship |
| **[docs/FILEMAP.md](./docs/FILEMAP.md)** | Path index |
| **[docs/DEPLOY.md](./docs/DEPLOY.md)** | **Production deploy checklist** |
| **[docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md)** | Scan queue migration + weekly re-scan design |

**Repo:** https://github.com/zaydattique/aeo-tool  
**Status:** Phases **0–10C complete** (MVP product + marketing cluster + deploy docs). Next work is optional: durable queue implementation, live visibility engines, more content.

---

## Architecture overview

```
┌─────────────┐     JWT session (NextAuth)      ┌──────────────────┐
│  Browser UI │ ◄──────────────────────────────► │  Next.js 15 App  │
│  Tailwind   │     /api/*  REST-style routes   │  Route Handlers  │
└─────────────┘                                 └────────┬─────────┘
                                                         │
                         ┌───────────────────────────────┼───────────────────────────────┐
                         ▼                               ▼                               ▼
                  ┌─────────────┐               ┌─────────────┐               ┌─────────────────┐
                  │   Prisma    │               │ Scan worker │               │ Stripe (opt)    │
                  │  PostgreSQL │               │ crawl + AI  │               │ Checkout/WH     │
                  └─────────────┘               └─────────────┘               └─────────────────┘
```

Scans currently run **in-process** (`setImmediate`). Prefer a long-running Node host until you migrate the queue — details in [docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md) and [docs/DEPLOY.md](./docs/DEPLOY.md).

### Backend

| Layer | Choice | Notes |
|-------|--------|--------|
| Runtime | Next.js 15 App Router | UI + API |
| DB | PostgreSQL + Prisma | Multi-tenant `agencyId`, soft deletes |
| Auth | NextAuth JWT + bcrypt | Session carries role + agency |
| Scans | Crawl → AI → Action mapper | Firecrawl/Claude optional |
| Billing | Stripe Checkout + webhook | Optional until keys set |

### Frontend

Marketing (`/`, `/product`, `/pricing`, `/aeo`, `/guides/*`, `/compare/aeo-tools`) · Auth · Dashboard · Action Center · Settings · Super Admin `/admin` · Public report `/r/[token]`

### Core flows

Signup → onboarding → clients → scan → Action Center → visibility → white-label report · Settings (team/billing) · Super admin manage/impersonate.

---

## Local development

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
# Set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Optional super admin on seed:

```bash
SEED_SUPER_ADMIN_EMAIL=you@example.com \
SEED_SUPER_ADMIN_PASSWORD=your-long-password \
npm run db:seed
```

Then open http://localhost:3000/admin after login.

---

## Production deploy (summary)

Full checklist: **[docs/DEPLOY.md](./docs/DEPLOY.md)**.

1. Postgres + set env (`DATABASE_URL`, `NEXTAUTH_SECRET`, **HTTPS** `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`)
2. `prisma db push` + `db:seed` (plans + optional SUPER_ADMIN)
3. Prefer **Railway/Render** over pure Vercel for long scans until Inngest/BullMQ
4. Stripe webhook → `/api/billing/webhook` if billing
5. Smoke test: health, signup, scan, report, `/admin`
6. Search Console → submit sitemap; verify `/llms.txt`

---

## Environment variables

See [`.env.example`](./.env.example). Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Optional: Anthropic, Firecrawl, Stripe, seed super-admin vars.

---

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind · Prisma 6 · PostgreSQL · NextAuth 4 · Zod · Stripe / Firecrawl / Anthropic (optional)

---

## License

UNLICENSED — private Threezero Agency software.
