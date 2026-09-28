# AEO Command

Multi-tenant **Answer Engine Optimization (AEO / GEO)** SaaS for agencies.

**Product promise:** paste a client URL → full scan → prioritized **Action Center** with exact steps → assign & track → **white-label** live report.

| Doc | Purpose |
|-----|---------|
| **[AGENTS.md](./AGENTS.md)** | Rules every AI must follow (full-detail HISTORY/README mandatory) |
| **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** | Ordered phases / next work |
| **[HISTORY.md](./HISTORY.md)** | Detailed what/why/files/outcome/missing per ship |
| **[docs/FILEMAP.md](./docs/FILEMAP.md)** | Path index |
| **[docs/DEPLOY.md](./docs/DEPLOY.md)** | **Production deploy checklist** |
| **[docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md)** | Scan queue migration + weekly re-scan design |

**Repo:** https://github.com/zaydattique/aeo-tool  
**Status:** Phases **0–11 complete**. **Phase 12 (NEXT):** AEO + SEO 10/10 foundation — competitor map locked, 100 advanced methods inventoried, governance hardened for full-detail docs. Live ranking requires subdomain host + Search Console + continued in-place content/schema expansion on existing marketing pages.

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
                  └─────────────┘               │ + Inngest   │               └─────────────────┘
                                                └─────────────┘
```

Scans prefer **Inngest** durable functions when `INNGEST_EVENT_KEY` is set; otherwise they fall back to **in-process** (`setImmediate`). Prefer a long-running Node host (Railway/Render) until the queue is fully relied upon — details in [docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md) and [docs/DEPLOY.md](./docs/DEPLOY.md).

### Backend layers

| Layer | Choice | Role |
|-------|--------|------|
| Runtime | Next.js 15 App Router | UI + API route handlers in one deploy unit |
| DB | PostgreSQL + Prisma 6 | Multi-tenant `agencyId` on every business table; soft deletes where needed |
| Auth | NextAuth JWT + bcrypt | Session carries role + agency; middleware guards product routes |
| Scans | Crawl → AI analysis → Action mapper | Firecrawl/Claude optional; results become assignable Action Center tasks |
| Jobs | Inngest (optional) | Durable `scan/run`, hourly re-scan cron, Monday digest |
| Email | Resend (optional) | Scan-complete + weekly digest; console fallback without key |
| Billing | Stripe Checkout + webhook | Optional until keys set; plan limits gate expensive ops |
| Visibility | Multi-engine heuristics + optional Perplexity live | Stored on snapshots for trend reporting |

### Frontend surface map

**Marketing (public, indexable):** `/`, `/product`, `/pricing`, `/aeo`, `/guides`, `/guides/aeo-checklist`, `/guides/chatgpt-citations`, `/guides/perplexity-visibility`, `/compare/aeo-tools`, `/case-studies`, `/ai`, `/llms.txt` (static), robots + sitemap generators.

**Auth:** `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/invite/[token]`.

**Product (authenticated, multi-tenant):** `/onboarding`, `/dashboard/*` (clients, scans, actions, settings, team, billing).

**Public report:** `/r/[token]` white-label live report.

**Super admin:** `/admin` (agency list, impersonate).

### Core flows

1. Signup → onboarding (agency profile) → create client → paste URL → run scan  
2. Scan produces findings → Action Center prioritizes and suggests fixes → assign to team members → track status  
3. Visibility prompts tracked over time (heuristics or live Perplexity)  
4. Share white-label report link with client  
5. Settings: team invites, billing portal, re-scan schedule  
6. Super admin: manage agencies, impersonate for support

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

**Note for this owner:** local setup is optional; production target is VPS + main-domain subdomain. Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the real HTTPS subdomain before launch so metadata, canonicals, sitemap, and robots resolve correctly.

---

## Production deploy (summary)

Full checklist: **[docs/DEPLOY.md](./docs/DEPLOY.md)**.

1. Postgres + set env (`DATABASE_URL`, `NEXTAUTH_SECRET`, **HTTPS** `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`)
2. `prisma db push` + `db:seed` (plans + optional SUPER_ADMIN)
3. Prefer **Railway/Render** over pure Vercel for long scans until Inngest is primary
4. Stripe webhook → `/api/billing/webhook` if billing
5. Inngest sync → `/api/inngest` if durable jobs desired
6. Smoke test: health, signup, scan, report, `/admin`
7. Search Console → submit sitemap; verify `/llms.txt` and AI crawler access on marketing paths

---

## Environment variables

See [`.env.example`](./.env.example).

**Required:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`  
**Strongly recommended for launch:** `NEXT_PUBLIC_APP_URL` (exact public HTTPS origin used in metadata/sitemap/OG)  
**Optional:** Anthropic, Firecrawl, Stripe, Resend, Inngest, Perplexity, seed super-admin vars.

---

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind · Prisma 6 · PostgreSQL · NextAuth 4 · Zod · Stripe / Firecrawl / Anthropic / Inngest / Resend (optional)

---

## Goals achieved vs remaining

**Achieved (Phases 0–11):** multi-tenant core, scan → Action Center, white-label reports, team invites, billing hooks, admin/impersonate, marketing cluster (`/aeo`, guides, compare, case studies, `/ai`, `llms.txt`), robots/sitemap, durable job path via Inngest, re-scan + email, multi-engine visibility.

**Remaining for 10/10 AEO+SEO (Phase 12):** live subdomain + correct public URL env; denser answer-first content and nested schema on existing marketing pages; full Organization `sameAs` + OG images; internal linking cluster; post-host Search Console + citation monitoring; earned third-party corroboration (reviews, roundups, Wikipedia/Wikidata where appropriate).

---

## License

UNLICENSED — private Threezero Agency software.
