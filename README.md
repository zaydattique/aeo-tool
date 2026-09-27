# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** SaaS for agencies.

**Product promise:** paste a client URL → full scan → prioritized **Action Center** with exact steps → assign & track → **white-label** live report.

| Doc | Purpose |
|-----|---------|
| **[AGENTS.md](./AGENTS.md)** | Rules every AI must follow |
| **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** | Ordered phases / next work only |
| **[HISTORY.md](./HISTORY.md)** | Detailed what/why/files per ship |
| **[docs/FILEMAP.md](./docs/FILEMAP.md)** | Where every important path lives |

**Repo:** https://github.com/zaydattique/aeo-tool  
**Status:** Phases **0–8 complete**. Next: Phase 9 (marketing site + security polish).

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

### Backend

| Layer | Choice | Notes |
|-------|--------|--------|
| Runtime | Next.js 15 App Router | UI + API in one deployable |
| Language | TypeScript | Strict types; Zod on write APIs |
| DB | PostgreSQL + Prisma | Multi-tenant; soft deletes (`deletedAt`) |
| Auth | NextAuth v4, **JWT** strategy | Credentials + bcrypt; session embeds `agencyId`, `role`, onboarding flag |
| Isolation | `agencyId` on every business table | `requireAgency()` on tenant APIs |
| Scans | In-process worker (`setImmediate`) | Stages: CRAWL → EXTRACT → AI_ANALYSIS → ACTION_GENERATION → COMPLETED |
| Crawl | Firecrawl API **or** basic `fetch` | Signal extraction always runs |
| AI | Anthropic Claude **or** heuristic scorer | Structured scores + issues |
| Billing | Stripe Checkout + Portal + webhook | Optional until keys set |
| Audit | `ActivityLog` | Signup, scan, actions, invites, admin, billing |

### Frontend

| Area | Path | Role |
|------|------|------|
| Marketing shell | `app/page.tsx` | Landing CTAs |
| Auth | `app/(auth)/*` | Login, signup, password, invite accept |
| Onboarding | `app/onboarding` | Agency name / logo URL |
| Dashboard | `app/dashboard` | Client list, add client, start scan |
| Client workspace | `app/dashboard/clients/[id]` | Analysis, Action Center, visibility, reports, scan history |
| Settings | `app/dashboard/settings` | Team invites, usage, plan subscribe |
| Super Admin | `app/admin` | Agencies, suspend, impersonate |
| Public report | `app/r/[token]` | White-label, print/PDF |

UI is mostly server components + targeted client components (`"use client"`) for forms, polling, and Action Center.

### Multi-tenant rules

1. Never query clients/scans/actions/prompts/reports without `agencyId` from session.
2. Super admins may have `agencyId: null` until they **impersonate** (session update).
3. Suspended/cancelled agencies cannot log in (non–super-admin).

### Core user flows

1. **Signup** → creates `Agency` (trial) + `AGENCY_OWNER` → login → **onboarding** → dashboard.  
2. **Add client** → validate URL → **Start scan** → poll progress → analysis + **Action** rows.  
3. **Action Center** → filter, assign teammate, status, copy suggested fix.  
4. **Visibility** → seed/custom prompts → Record check → chart.  
5. **Report** → generate → open `/r/{token}` → Print / Save PDF.  
6. **Settings** → invite team; subscribe via Stripe when configured.  
7. **Super Admin** → create/suspend agencies; impersonate into tenant dashboard.

---

## Local development

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
# Required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
# Optional: FIRECRAWL_API_KEY, ANTHROPIC_API_KEY, STRIPE_*
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Landing |
| /signup · /login | Auth |
| /dashboard | Clients |
| /dashboard/settings | Team + billing |
| /admin | Super admin only |
| /api/health | Health check |

Seed creates **six plans** (Starter/Growth/Agency × PK/INT). Create a super-admin user in DB manually if needed (`role = SUPER_ADMIN`).

---

## Environment variables

See `.env.example`. Summary:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL |
| `NEXTAUTH_SECRET` | Yes | JWT signing |
| `NEXTAUTH_URL` | Yes | Auth callbacks / invite links |
| `FIRECRAWL_API_KEY` | No | Better crawl |
| `ANTHROPIC_API_KEY` | No | Claude AEO analysis |
| `STRIPE_SECRET_KEY` | No* | Checkout / portal |
| `STRIPE_WEBHOOK_SECRET` | No* | Webhook verify |
| `NEXT_PUBLIC_APP_URL` | No | Canonical app URL |

\*Required only for live billing.

---

## API map (high level)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | Public | Create agency + owner |
| * | `/api/auth/[...nextauth]` | Public | NextAuth |
| POST | `/api/auth/forgot-password` · `reset-password` | Public | Password reset |
| POST | `/api/auth/accept-invite` | Public | Join via invite token |
| POST | `/api/onboarding` | Session | Complete onboarding |
| GET/POST | `/api/clients` | Agency | List / create clients |
| GET/PATCH/DELETE | `/api/clients/[id]` | Agency | Client CRUD |
| POST | `/api/clients/[id]/scan` | Agency | Enqueue scan |
| GET | `/api/scans/[id]` | Agency | Progress poll |
| GET | `/api/actions` | Agency | Action Center list |
| PATCH | `/api/actions/[id]` | Agency | Status / assign |
| GET/POST | `/api/clients/[id]/prompts` | Agency | Tracked prompts |
| GET/POST | `/api/clients/[id]/snapshots` | Agency | Visibility checks |
| GET/POST | `/api/clients/[id]/reports` | Agency | Generate reports |
| GET/POST | `/api/team/invites` | Owner | Team invites |
| GET | `/api/team/members` | Agency | Assign dropdown |
| GET | `/api/billing/usage` | Agency | Usage + plans |
| POST | `/api/billing/checkout` · `portal` | Owner | Stripe |
| POST | `/api/billing/webhook` | Stripe sig | Subscription events |
| GET/POST | `/api/admin/agencies` | Super admin | List / create |
| PATCH | `/api/admin/agencies/[id]` | Super admin | Suspend / activate |
| POST | `/api/admin/impersonate` | Super admin | Enter tenant context |

Full path index: **[docs/FILEMAP.md](./docs/FILEMAP.md)**.

---

## Tech stack (locked)

Next.js 15 · React 19 · TypeScript · Tailwind · Prisma 6 · PostgreSQL · NextAuth 4 · bcryptjs · Zod · Stripe (optional) · Firecrawl/Anthropic (optional)

---

## License

UNLICENSED — private Threezero Agency software.
