# AEO Command — Production deploy

> Phase 10C. Read before first production launch.

## 1. Choose a host

| Host | Fit | Notes |
|------|-----|--------|
| **Railway / Render / Fly** (Node long-running) | **Best today** | In-process scan worker can finish crawl+AI without serverless timeout |
| **Vercel** | OK for marketing + light scans | Heavy Firecrawl/Claude jobs may hit function time limits; migrate to Inngest first (see `docs/QUEUE_AND_JOBS.md`) |

**Recommendation:** Railway (or similar) for `app` until scans run on a durable queue; marketing can stay on same app or split later.

## 2. Database

1. Provision **PostgreSQL** (Neon, Supabase, Railway Postgres).
2. Set `DATABASE_URL` with SSL if required (`?sslmode=require`).
3. From CI or a one-off shell:

```bash
npx prisma generate
npx prisma db push
# or: npx prisma migrate deploy  (once you add formal migrations)
npm run db:seed
```

## 3. Environment checklist (production)

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `NEXTAUTH_SECRET` | Yes | Long random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | **Public HTTPS origin**, e.g. `https://app.threezero.agency` |
| `NEXT_PUBLIC_APP_URL` | Strongly recommended | Same public origin (canonical links, sitemap, invites) |
| `ANTHROPIC_API_KEY` | Recommended | Real AI analysis |
| `FIRECRAWL_API_KEY` | Recommended | Better crawl quality |
| `STRIPE_SECRET_KEY` | If billing | Live or test key |
| `STRIPE_WEBHOOK_SECRET` | If billing | From Stripe webhook endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | If you add client-side Stripe later |
| `SEED_SUPER_ADMIN_EMAIL` | Seed only | Used by `db:seed` |
| `SEED_SUPER_ADMIN_PASSWORD` | Seed only | Min 12 chars; **unset after seed** in long-lived env if possible |
| `SEED_SUPER_ADMIN_NAME` | Optional | Defaults to "Super Admin" |

Never commit `.env` / `.env.local`. Rotate any secret that was pasted into chat.

## 4. Super Admin

**Preferred (seed):**

```bash
export SEED_SUPER_ADMIN_EMAIL="you@threezero.agency"
export SEED_SUPER_ADMIN_PASSWORD="a-long-random-password"
export SEED_SUPER_ADMIN_NAME="Zayd"
npm run db:seed
```

Login → `/admin` (role `SUPER_ADMIN`, `agencyId` null until impersonation).

**Manual SQL alternative** (hash must be bcrypt cost 12):

```sql
-- Generate hash offline with: node -e "require('bcryptjs').hash('YOUR_PASSWORD',12).then(console.log)"
INSERT INTO "User" (id, email, "passwordHash", "fullName", role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'you@threezero.agency',
  '$2a$12$REPLACE_WITH_BCRYPT_HASH',
  'Super Admin',
  'SUPER_ADMIN',
  NOW(),
  NOW(),
  NOW()
);
```

(Exact column names follow Prisma’s mapped PostgreSQL names — verify with `\d "User"` in psql if this fails.)

## 5. Stripe webhook

1. Stripe Dashboard → Webhooks → endpoint  
   `https://YOUR_DOMAIN/api/billing/webhook`
2. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 6. Post-deploy smoke test

1. `GET /api/health` → 200  
2. Marketing: `/`, `/pricing`, `/aeo`, `/guides`, `/llms.txt`, `/sitemap.xml`  
3. Signup → onboarding → add client → start scan → Action Center has tasks  
4. Generate report → open `/r/{token}`  
5. Super admin login → `/admin` lists agencies  
6. (Optional) Stripe test checkout  

## 7. SEO / AEO after go-live

1. Google Search Console → property = production domain → submit `sitemap.xml`  
2. Confirm `/robots.txt` and `/llms.txt` reachable  
3. Set DNS for `threezero.agency` / `app.threezero.agency` as planned  
4. Content cluster already in repo — promote guides for backlinks  

## 8. Known production limits (until queue migrates)

- Scans run **in-process**; deploy/restart can interrupt active jobs  
- Multi-instance rate limits are **per process** (in-memory)  
- Prefer single long-running Node instance for scan reliability  
- Full migration path: `docs/QUEUE_AND_JOBS.md`  
