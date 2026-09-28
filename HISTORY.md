# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Inngest | Without `INNGEST_EVENT_KEY` / dev server, scans fall back to in-process |
| Re-scan cron | Only runs when Inngest is connected; toggle still saves schedule in DB |
| Email | Without `RESEND_API_KEY`, emails log to console |
| Visibility | Perplexity live if `PERPLEXITY_API_KEY`; else multi-engine heuristics |
| Schema | `Client.rescanEnabled` / `rescanIntervalDays` / `nextRescanAt` — run `db push` |

---

### 2026-09-28 — Phase 11: Queue, rescan, visibility, case studies

**Goal:** Ship everything previously deferred: durable jobs, weekly re-scan + email, stronger visibility, more content.

**What we did:**

1. **Inngest** — `lib/inngest/client.ts`, `functions.ts` (`scan/run` with retries + owner email, hourly re-scan cron, Monday digest), `app/api/inngest/route.ts`. `enqueueScan` sends Inngest event when configured.
2. **Email** — `lib/email.ts` Resend + console fallback; templates for scan complete + weekly digest.
3. **Re-scan** — Prisma Client fields; PATCH API; `ClientRescanToggle` on client detail; cron respects plan scan limits.
4. **Visibility** — `lib/visibility-check.ts` multi-engine results; optional live Perplexity; snapshots store engine breakdown in `sources`.
5. **Content** — `/case-studies` with three agency-style stories.
6. **Deps** — `inngest`, `resend` in package.json; env example updated.

**Key files:** `lib/inngest/*`, `lib/email.ts`, `lib/visibility-check.ts`, `lib/scan-worker.ts`, `prisma/schema.prisma`, `components/client-rescan-toggle.tsx`, `app/case-studies/page.tsx`, `app/api/inngest/route.ts`

**Outcome:** Production can run durable scans and schedules via Inngest; product value denser offline with heuristics.

---

Phases 0–10C summarized in prior commits. Deploy: **docs/DEPLOY.md** + Inngest sync to `/api/inngest`.
