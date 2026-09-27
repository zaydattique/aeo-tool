# AEO Command — HISTORY (operational memory)

> **Read before changing code.** Detailed log of what was built, why, and files changed.  
> Repo: `zaydattique/aeo-tool` · Last updated: **2026-09-28**  
> [AGENTS.md](./AGENTS.md) · [README.md](./README.md) · [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [docs/FILEMAP.md](./docs/FILEMAP.md)

---

## How agents must use this file

After every phase: **Goal** · **What we did** · **Key files** · **Outcome** · **Gotchas**. Never only “Phase X complete.”

---

## Product identity (stable)

**AEO Command** — multi-tenant AEO SaaS for agencies.  
Core loop: URL → scan → Action Center → visibility → white-label report.  
Roles: `SUPER_ADMIN` | `AGENCY_OWNER` | `AGENCY_MEMBER`.  
Language with owner: English / Urdu / Roman Urdu.

---

## Open gotchas (current)

| Topic | Detail |
|-------|--------|
| Scan quality | Needs Firecrawl + Anthropic keys for production quality; heuristics work offline |
| Scan worker | In-process `setImmediate` — not durable; plan Inngest/BullMQ (Phase 10B notes) |
| Visibility | MVP score variance — not live multi-engine checks |
| Reports PDF | Browser print only |
| Stripe | Keys required or checkout 503 |
| Rate limits | In-memory per instance |
| Ranking | Content cluster shipped (10A); still needs **live domain, Search Console, backlinks, time** |

---

## Chronology (summary of 0–9)

Phases 0–8 built foundation through team/billing/admin. Phase 9 shipped marketing home/product/pricing/aeo + rate limits. Full older entries retained in git history of this file if needed; condensed here for length.

**0–2:** Agent rules, Next.js scaffold, Prisma multi-tenant schema + plan seed.  
**3–4:** Auth/onboarding, clients, scan queue UI.  
**5–6:** Real crawl/AI, Action Center.  
**7–8:** Visibility/reports, team/Stripe/super admin.  
**9:** Marketing foundation, SEO meta, llms.txt, rate limits.

---

### 2026-09-28 — Phase 9: Marketing foundation + security

**Goal:** Public marketing surface + abuse limits.  
**Key files:** `app/page.tsx`, `/product`, `/pricing`, `/aeo`, `lib/rate-limit.ts`, robots/sitemap/llms.txt.  
**Outcome:** Crawlable marketing + limited signup/scan bursts.

---

### 2026-09-28 — Phase 10A: Rank-first content cluster

**Goal:** Build a topical cluster targeting queries like “AEO tools”, “what is AEO”, “ChatGPT citations”, “Perplexity visibility”, “AEO checklist” — with internal links and machine-readable entry points so search engines *and* AI assistants can cite accurate product facts.

**What we did:**
- **Guides hub** `/guides` listing all educational URLs
- **Comparison** `/compare/aeo-tools` — free checkers vs AEO Command table + FAQ schema (targets “AEO tools” intent)
- **Guides:**
  - `/guides/aeo-checklist` — six-section agency delivery checklist
  - `/guides/chatgpt-citations` — levers + honest non-guarantee FAQ
  - `/guides/perplexity-visibility` — source-shaped pages + related links
- **`/ai`** — plain factual summary page for assistants
- Expanded **`public/llms.txt`** with full URL list and product facts
- **Sitemap + robots** updated for guides/compare/ai
- **Nav/footer** internal links (Guides, Compare, Learn column, Machines column)

**Key files:**
- `app/guides/page.tsx`
- `app/guides/aeo-checklist/page.tsx`
- `app/guides/chatgpt-citations/page.tsx`
- `app/guides/perplexity-visibility/page.tsx`
- `app/compare/aeo-tools/page.tsx`
- `app/ai/page.tsx`
- `components/marketing-nav.tsx`
- `public/llms.txt`, `app/sitemap.ts`, `app/robots.ts`

**Outcome / acceptance:**
- Interlinked content cluster live in repo
- Comparison page targets commercial “AEO tools” queries
- Assistants have `/ai` + `/llms.txt` canonical facts

**Gotchas:**
- Content alone does not rank — deploy to production domain, submit sitemap, earn links
- Do not promise guaranteed ChatGPT/Perplexity citations in sales copy (guides already say this)

---

## Deploy reminder

Postgres · `NEXTAUTH_URL` HTTPS · secrets · Stripe webhook · Search Console sitemap · verify `/llms.txt` and `/ai`.
