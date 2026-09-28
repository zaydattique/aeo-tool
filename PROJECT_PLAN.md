# AEO Command — PROJECT PLAN

> Repo: `zaydattique/aeo-tool`  
> **Session rule:** Each **S** item is sized for ~**20 minutes** of focused work (agent or human). Do **one session at a time** in order. Mark the session Done in HISTORY when finished.

## Boot

AGENTS.md → **this file** → HISTORY → docs/FILEMAP.md → docs/DEPLOY.md

---

## PHASE 0–13 — Done

| Block | What |
|-------|------|
| 0–11 | Core SaaS: multi-tenant, scan, Action Center, billing hooks, jobs, visibility base |
| 12 | AEO/SEO marketing foundation (in-repo) |
| 13.1–13.5 | Portal, PDF, SOV, live engines, rich action drafts |

---

## PHASE 14 — Go live (owner + light agent assist)

**Status:** NEXT  
**Goal:** Public HTTPS app that runs scans and serves reports. Without this, product is GitHub-only.

| Session | ~20 min | Owner / Agent | Deliverable |
|---------|---------|---------------|-------------|
| **14.S1** | DNS + subdomain | **Owner** | `app.` (or chosen) subdomain points at host |
| **14.S2** | Provision Postgres | **Owner** | `DATABASE_URL` ready |
| **14.S3** | Host project + env shell | **Owner** | App service created; env placeholders set |
| **14.S4** | Secrets | **Owner** | `NEXTAUTH_SECRET`, real `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL` (HTTPS) |
| **14.S5** | Install + schema | **Owner** (or agent on VPS if access) | `npm i` · `prisma generate` · `db push` · `db:seed` |
| **14.S6** | Smoke test | **Owner** | `/api/health`, signup, 1 scan, `/r/{token}`, portal enable |
| **14.S7** | Search Console | **Owner** | Property + sitemap submit |
| **14.S8** | Optional API keys | **Owner** | Anthropic / Firecrawl / 1 visibility key — only if budget |

**Exit criteria:** One real scan completes on production URL; report link opens on phone.

**Agent note:** Do not invent DNS or paste secrets into chat. Point owner at `docs/DEPLOY.md`.

---

## PHASE 15 — First pilot polish (code, session-sized)

**Status:** Queued (start after 14.S6 at minimum)  
**Goal:** Make first agency pilot feel “retainer-ready” without new product categories.

| Session | ~20 min | Focus | Touch |
|---------|---------|-------|--------|
| **15.S1** | Post-scan UX | After scan lands on Action Center with HIGH filter default | `action-center.tsx` or client detail |
| **15.S2** | Empty states | Zero clients / zero actions / zero prompts copy + CTA | dashboard + visibility |
| **15.S3** | Report exec blurb | 2–3 sentence “what this means” on `/r` from analysis summary | `app/r/[token]/page.tsx` |
| **15.S4** | Portal progress bar | Visual % done from action counts | `app/p/[token]/page.tsx` |
| **15.S5** | SOV on report config | When generating report, embed latest SOV snapshot in `config` | reports API + `/r` |
| **15.S6** | Client create: competitors | Optional competitors field on add-client flow | client create UI + API |
| **15.S7** | Scan success toast path | Clear “View Action Center” after scan completes (poll UX) | client-actions / detail |
| **15.S8** | Methodology note | Short in-app “How scores work” link to `/aeo` or settings blurb | settings or help strip |

**Exit criteria:** Pilot user can go URL → scan → tasks → report → portal without asking you what to click.

---

## PHASE 16 — Agency ops features (code)

**Status:** Queued  
**Goal:** Day-to-day agency friction killers (still ~20 min each).

| Session | ~20 min | Focus |
|---------|---------|--------|
| **16.S1** | Actions CSV export | `GET` export open actions for client |
| **16.S2** | Done note optional | PATCH action accepts `completionNote` (store in metadata or field) |
| **16.S3** | Bulk status | Multi-select mark TODO→IN_PROGRESS (same client) |
| **16.S4** | Prompt pack seeds | Niche packs: local services / B2B SaaS (seed buttons) |
| **16.S5** | Single-prompt recheck | POST recheck one prompt id only |
| **16.S6** | Visibility CSV | Export latest scores per prompt |
| **16.S7** | Report date compare | List two reports; simple score delta on client page |
| **16.S8** | Portal disable on archive | Archiving client disables portal |

**Exit criteria:** Agency can run weekly ops without spreadsheets for actions/visibility.

---

## PHASE 17 — Trust, safety, cost control (code + owner)

**Status:** Queued  
**Goal:** Production hardness for paid use.

| Session | ~20 min | Focus |
|---------|---------|--------|
| **17.S1** | Live engine plan gate | Visibility live calls respect plan / monthly cap |
| **17.S2** | Public token rate limit | Rate-limit `/r`, `/p`, PDF routes |
| **17.S3** | Scan fail banner | Client detail shows last error clearly |
| **17.S4** | Legal microcopy | Report/portal footer: no ranking guarantees |
| **17.S5** | Retention note | Settings: data retention one-pager text |
| **17.S6** | Health deep | Health checks DB ping |
| **17.S7** | Staging checklist | `docs/DEPLOY.md` add staging → prod paragraph |
| **17.S8** | Backup reminder | DEPLOY.md Postgres backup bullet (owner) |

**Exit criteria:** Abuse and cost of live keys won’t surprise you on first 10 agencies.

---

## PHASE 18 — Growth surfaces (marketing code only)

**Status:** Queued  
**Goal:** In-repo GTM pages/docs — still edit-existing preference.

| Session | ~20 min | Focus |
|---------|---------|--------|
| **18.S1** | `/product` pilot CTA | Stronger “start trial” + workflow strip |
| **18.S2** | Vertical blurb | One section on home or product: local multi-location agencies |
| **18.S3** | Objection FAQ | Add 2 FAQs: vs SEMrush / “can’t rank ChatGPT” |
| **18.S4** | Changelog page or section | `/product` or existing doc link “What’s new” |
| **18.S5** | Compare honesty pass | Re-read `/compare/aeo-tools`; tighten one table row |
| **18.S6** | llms.txt refresh | Align with portal/PDF/SOV features |
| **18.S7** | `/ai` facts refresh | Same |
| **18.S8** | Case study disclaimer | Stronger methodology line on case studies |

**Exit criteria:** Marketing matches Phase 13 product reality.

---

## PHASE 19+ — Optional (do not start unless owner opens)

Each item below should be split into new 20‑min sessions **only when opened**:

- Portal password gate  
- Custom domain for `/r` and `/p`  
- Public API / webhooks  
- SOV charts on PDF  
- Slack digests  
- Official Bing/AI Overviews APIs if/when available  
- Full rank-tracker (default **reject** — out of identity)

---

## How to run a session (agents)

1. Read **NEXT** phase and the **first unchecked S#**.  
2. Only that session’s scope — no drive-by refactors.  
3. Prefer **edit existing files**.  
4. Ship → **HISTORY** full entry (goal, what, files, verify, missing, gotchas).  
5. Mark session Done in this table (Status column or strike through in HISTORY).  
6. Stop at ~20 min boundary; leave next S# for the following session.

**Owner-only sessions (14.x mostly):** agent prepares checklist text; does not claim DNS/host done.

---

## NEXT

**→ Phase 14 · Session 14.S1** (owner: DNS + subdomain)  
When 14.S6 is green, agents may open **15.S1** without waiting for 14.S7–S8.
