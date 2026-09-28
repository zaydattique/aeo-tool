# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Inngest | Without keys, scans fall back to in-process |
| Re-scan | Cron only when Inngest connected |
| Email | Without Resend, console fallback |
| Portal | Requires `npx prisma db push` for `Client.portalToken` / `portalEnabled` |
| Site URL | Set `NEXT_PUBLIC_APP_URL` + `NEXTAUTH_URL` on host |
| OG | Dynamic `/opengraph-image` — no static og.png required |

---

### 2026-09-28 — Phase 13.1: Client live portal

**Goal**

Ship the first product-value feature agencies pay for beyond monitoring: a **persistent read-only client portal** that always reflects live Action Center progress and visibility, distinct from the frozen `/r/[token]` report snapshot generated at a point in time.

**What we did**

1. **Schema** — `Client.portalToken` (unique, optional) and `Client.portalEnabled` (boolean). Token is a 24-byte hex secret; security is unguessable URL + noindex.
2. **API** — `GET/POST /api/clients/[id]/portal` with actions `enable`, `disable`, `rotate`. Scoped by `agencyId` and `canManageClients`. Activity log entries `client.portal.*`.
3. **Public page** — `app/p/[token]/page.tsx` loads live client + agency branding, visibility score, action counts (todo / in progress / done), action list (no edit controls), tracked prompts with latest scores, latest analysis summary/dimension scores. `robots: noindex`. Print / Save PDF via browser print CSS.
4. **Agency UI** — `components/client-portal-toggle.tsx` on client detail: enable, copy link, rotate, disable.
5. **PROJECT_PLAN** — Phase 13 locked with ordered deliverables; 13.1 starting/shipping first.

**Key files**

- `prisma/schema.prisma`
- `app/api/clients/[id]/portal/route.ts`
- `app/p/[token]/page.tsx`
- `components/client-portal-toggle.tsx`
- `app/dashboard/clients/[id]/page.tsx`
- `PROJECT_PLAN.md`, `docs/FILEMAP.md`, `HISTORY.md`

**Outcome / acceptance**

- After `prisma db push`, agency opens a client → Enable portal → Copy link → open `/p/{token}` without login → sees live progress.
- Disable hides portal (404). Rotate invalidates old token.
- Frozen reports at `/r/[token]` remain unchanged for point-in-time deliverables.

**What is still missing / deferred**

- Phase 13.2 PDF polish / server PDF
- 13.3 competitor prompts + SOV
- 13.4 live multi-engine APIs
- 13.5 auto-draft richer Action fixes
- Optional password on portal (not in 13.1)

**Gotchas**

- Must run `npx prisma db push` (or migrate) before portal API works against existing DBs.
- Portal is secret-link based; treat tokens like share links. Rotate if leaked.

---

### 2026-09-28 — Phase 12: AEO/SEO 10/10 in-repo surface

**Goal:** Maximum in-repo AEO/SEO readiness before host.

**What we did:** Dynamic OG/Twitter images; densified marketing pages; FAQ/Article schema; AI crawler robots; layout `@graph`; full-detail docs rules.

**Outcome:** In-repo foundation complete; live ranking needs DNS + Search Console + off-site authority.

---

### 2026-09-28 — Phase 11: Queue, rescan, visibility, case studies

Inngest durable scans, rescan fields, Resend email, multi-engine visibility heuristics, case studies page.

---

Phases 0–10C in prior commits. Deploy: **docs/DEPLOY.md**.
