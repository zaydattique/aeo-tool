# AEO Command — HISTORY (operational memory)

> Repo: `zaydattique/aeo-tool` · Last updated: **2026-09-28**  
> [AGENTS.md](./AGENTS.md) · [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [docs/FILEMAP.md](./docs/FILEMAP.md) · [docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md)

After every phase append: **Goal** · **What we did** · **Key files** · **Outcome** · **Gotchas**.

---

## Product identity

Multi-tenant AEO SaaS for agencies: URL → scan → Action Center → visibility → white-label report.

---

## Open gotchas

| Topic | Detail |
|-------|--------|
| Scan worker | Still in-process `setImmediate` — see QUEUE_AND_JOBS.md for Inngest/BullMQ path |
| API keys | Firecrawl + Anthropic optional; heuristics offline |
| Visibility | MVP estimates, not live engine checks |
| Ranking | Content cluster live; needs domain + links |
| Weekly re-scan | Designed only — not implemented in schema/UI yet |

---

## Chronology (recent detail)

### Phases 0–9 + 10A (summary)

Foundation through marketing + rank content cluster (guides, compare, /ai, llms.txt). Full narrative in prior commits of this file.

---

### 2026-09-28 — Phase 10B: Product strength

**Goal:** Make the Action Center and dashboard feel like agency delivery software — better task quality from scans, clearer UX, and a written path off the fragile in-process queue. Document weekly re-scan/email so implementation is not invented later under pressure.

**What we did:**

1. **`lib/action-mapper.ts`**
   - Sort issues: HIGH first, then lower effort (quick wins)
   - Dedupe by normalized title
   - Expand `suggestedFix` into ordered **steps** (list lines, sentences, or default 3-step implement/verify/close)
   - Cap at **15** actions so the Center stays actionable

2. **`lib/scan-worker.ts`**
   - Uses `mapIssuesToActionDrafts` instead of 1:1 issue→single-step draft
   - Comment points to queue migration doc

3. **Action Center UI**
   - Completion **progress bar**
   - Quick chips: All / To-do / In progress / High priority / Done
   - Expandable **steps** list per action
   - High-priority open count in header

4. **Dashboard client list**
   - Stronger empty state + primary CTA
   - Score color (green/amber/red)
   - “Open” primary button styling; helper copy on add form

5. **`docs/QUEUE_AND_JOBS.md`**
   - Current enqueue behavior and limits
   - Inngest vs BullMQ migration steps + acceptance checklist
   - Weekly re-scan data model proposal, cron flow, email matrix
   - Deploy guidance: prefer long-running Node for heavy scans

**Key files:**
- `lib/action-mapper.ts` (new)
- `lib/scan-worker.ts`
- `app/dashboard/clients/[id]/action-center.tsx`
- `app/dashboard/client-list.tsx`
- `docs/QUEUE_AND_JOBS.md` (new)

**Outcome:** New scans produce richer multi-step actions; Action Center is easier to triage; queue/re-scan design is documented for a future implementation phase.

**Gotchas:** Existing Action rows from old scans are unchanged until a **new scan** runs. Weekly re-scan is **not** coded yet — only design.

---

## Deploy reminder

Postgres · NEXTAUTH_URL HTTPS · secrets · Stripe webhook · Search Console · prefer non-serverless for long scans until queue migrated.
