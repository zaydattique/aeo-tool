# AEO Command — FILEMAP

> Where things live. Update this file when you add a major path.  
> Repo: `zaydattique/aeo-tool` · Last updated: **2026-09-28**

---

## Root / governance

| Path | Role |
|------|------|
| `AGENTS.md` | Mandatory AI rules |
| `PROJECT_PLAN.md` | Ordered phases only |
| `HISTORY.md` | Detailed ship log |
| `README.md` | Architecture + how to run |
| `docs/FILEMAP.md` | This file |
| `.cursorrules` | Editor/agent short rules |
| `.env.example` | Env documentation |
| `.gitignore` | Ignores |
| `package.json` | Dependencies & scripts |
| `middleware.ts` | Auth gates, admin, public webhook/report |
| `prisma/schema.prisma` | Full DB schema |
| `prisma/seed.ts` | Plans seed |

---

## Library (`lib/`)

| Path | Role |
|------|------|
| `lib/prisma.ts` | Prisma singleton |
| `lib/auth.ts` | NextAuth options (credentials JWT) |
| `lib/session.ts` | `requireAuth` / `requireAgency` |
| `lib/utils.ts` | `cn()` helper |
| `lib/url.ts` | Website URL validation |
| `lib/crawl.ts` | Firecrawl + basic crawl + signals |
| `lib/ai-analysis.ts` | Claude + heuristic AEO analysis |
| `lib/scan-worker.ts` | Scan pipeline + Action row creation |
| `lib/default-prompts.ts` | Default tracked prompts |
| `lib/stripe.ts` | Stripe client |
| `lib/usage.ts` | Usage meter + soft limits |

---

## Types

| Path | Role |
|------|------|
| `types/next-auth.d.ts` | Session/JWT extensions |

---

## App — pages

| Path | Role |
|------|------|
| `app/layout.tsx` | Root layout + SessionProvider |
| `app/globals.css` | Global styles |
| `app/page.tsx` | Landing |
| `app/(auth)/login/page.tsx` | Login |
| `app/(auth)/signup/page.tsx` | Signup |
| `app/(auth)/forgot-password/page.tsx` | Forgot password |
| `app/(auth)/reset-password/page.tsx` | Reset password |
| `app/(auth)/invite/[token]/page.tsx` | Accept invite |
| `app/onboarding/page.tsx` | Agency onboarding |
| `app/dashboard/page.tsx` | Client list shell |
| `app/dashboard/client-list.tsx` | Clients UI + scan progress |
| `app/dashboard/clients/[id]/page.tsx` | Client workspace |
| `app/dashboard/clients/[id]/client-actions.tsx` | Start scan control |
| `app/dashboard/clients/[id]/action-center.tsx` | Action Center UI |
| `app/dashboard/clients/[id]/visibility-reports.tsx` | Prompts, chart, reports |
| `app/dashboard/settings/page.tsx` | Team + billing + usage |
| `app/admin/page.tsx` | Super admin |
| `app/r/[token]/page.tsx` | Public white-label report |
| `components/providers.tsx` | SessionProvider wrapper |

---

## App — API routes

### Auth & onboarding

| Path | Methods |
|------|---------|
| `app/api/auth/[...nextauth]/route.ts` | GET, POST |
| `app/api/auth/signup/route.ts` | POST |
| `app/api/auth/forgot-password/route.ts` | POST |
| `app/api/auth/reset-password/route.ts` | POST |
| `app/api/auth/accept-invite/route.ts` | POST |
| `app/api/onboarding/route.ts` | POST |
| `app/api/health/route.ts` | GET |

### Clients & scans

| Path | Methods |
|------|---------|
| `app/api/clients/route.ts` | GET, POST |
| `app/api/clients/[id]/route.ts` | GET, PATCH, DELETE |
| `app/api/clients/[id]/scan/route.ts` | POST |
| `app/api/scans/[id]/route.ts` | GET |

### Actions

| Path | Methods |
|------|---------|
| `app/api/actions/route.ts` | GET |
| `app/api/actions/[id]/route.ts` | PATCH |

### Visibility & reports

| Path | Methods |
|------|---------|
| `app/api/clients/[id]/prompts/route.ts` | GET, POST |
| `app/api/prompts/[id]/route.ts` | DELETE |
| `app/api/clients/[id]/snapshots/route.ts` | GET, POST |
| `app/api/clients/[id]/reports/route.ts` | GET, POST |

### Team & billing

| Path | Methods |
|------|---------|
| `app/api/team/members/route.ts` | GET |
| `app/api/team/invites/route.ts` | GET, POST |
| `app/api/billing/usage/route.ts` | GET |
| `app/api/billing/checkout/route.ts` | POST |
| `app/api/billing/portal/route.ts` | POST |
| `app/api/billing/webhook/route.ts` | POST (Stripe) |

### Super admin

| Path | Methods |
|------|---------|
| `app/api/admin/agencies/route.ts` | GET, POST |
| `app/api/admin/agencies/[id]/route.ts` | PATCH |
| `app/api/admin/impersonate/route.ts` | POST |

---

## Prisma models (quick)

`Plan` · `Agency` · `User` · `Client` · `Scan` · `Action` · `TrackedPrompt` · `VisibilitySnapshot` · `Report` · `TeamInvite` · `ActivityLog` · `Subscription` · `UsageMeter`

All tenant business tables use **`agencyId`** (except global `Plan`). Soft delete via **`deletedAt`** where applicable.

---

## When you add code

1. Put shared logic in `lib/`.
2. Put HTTP in `app/api/.../route.ts`.
3. Put UI under `app/` with clear folders.
4. Update **this FILEMAP** and **HISTORY.md** in the same ship.
