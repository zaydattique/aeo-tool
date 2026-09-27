# AEO Command — FILEMAP

> Repo: `zaydattique/aeo-tool` · Last updated: **2026-09-28**

---

## Governance

`AGENTS.md` · `PROJECT_PLAN.md` · `HISTORY.md` · `README.md` · `docs/FILEMAP.md` · `.cursorrules` · `.env.example` · `middleware.ts` · `prisma/schema.prisma` · `prisma/seed.ts` · `public/llms.txt`

---

## Library (`lib/`)

`prisma.ts` · `auth.ts` · `session.ts` · `utils.ts` · `url.ts` · `crawl.ts` · `ai-analysis.ts` · `scan-worker.ts` · `default-prompts.ts` · `stripe.ts` · `usage.ts` · `rate-limit.ts`

---

## Marketing / content cluster

| Path | Role |
|------|------|
| `components/marketing-nav.tsx` | Nav + footer |
| `app/page.tsx` | Home |
| `app/product/page.tsx` | Product |
| `app/pricing/page.tsx` | Pricing PK/INT |
| `app/aeo/page.tsx` | What is AEO |
| `app/guides/page.tsx` | Guides hub |
| `app/guides/aeo-checklist/page.tsx` | Checklist guide |
| `app/guides/chatgpt-citations/page.tsx` | ChatGPT guide |
| `app/guides/perplexity-visibility/page.tsx` | Perplexity guide |
| `app/compare/aeo-tools/page.tsx` | vs free checkers |
| `app/ai/page.tsx` | AI assistant summary |
| `app/robots.ts` · `app/sitemap.ts` | Crawl control |

---

## App product UI

`app/layout.tsx` · `app/(auth)/*` · `app/onboarding` · `app/dashboard/*` · `app/admin` · `app/r/[token]` · `components/providers.tsx`

---

## API (prefix `app/api/`)

Auth: `auth/[...nextauth]`, `auth/signup`, `forgot-password`, `reset-password`, `accept-invite`, `onboarding`, `health`  
Clients/scans: `clients`, `clients/[id]`, `clients/[id]/scan`, `scans/[id]`  
Actions: `actions`, `actions/[id]`  
Visibility: `clients/[id]/prompts`, `prompts/[id]`, `snapshots`, `reports`  
Team/billing: `team/members`, `team/invites`, `billing/usage|checkout|portal|webhook`  
Admin: `admin/agencies`, `admin/agencies/[id]`, `admin/impersonate`

---

## When you add code

Update this FILEMAP + HISTORY.md in the same ship.
