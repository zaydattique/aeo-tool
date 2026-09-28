# Scan queue & background jobs — design notes

> Status: **design + current behavior documented** (Phase 10B). Not yet migrated off in-process worker.

## Current behavior (as of Phase 10B)

| Piece | Implementation |
|-------|----------------|
| Enqueue | `enqueueScan(scanId)` → `setImmediate(() => runScan(scanId))` in `lib/scan-worker.ts` |
| Execution | Same Node process as the Next.js server |
| Progress | Scan row `stage` + `progress` polled by UI |
| Failure | Scan `FAILED` + client `ERROR` |
| Rate limits | Plan monthly caps + in-memory burst limit on scan start |

### Limits of current approach

- Server restart / deploy **drops** in-flight scans
- Serverless (Vercel) may **timeout** long crawl+AI jobs
- No automatic retry, no dead-letter queue
- Horizontal scale does not share the in-memory rate limiter

## Recommended migration path

### Option A — Inngest (fits Next.js / Vercel)

1. Add `inngest` SDK and an Inngest client.
2. Replace `enqueueScan` with `inngest.send({ name: "scan/run", data: { scanId } })`.
3. Define function `scan/run` that calls existing `runScan(scanId)`.
4. Configure retries (e.g. 2) and concurrency per `agencyId`.
5. Keep Prisma status updates inside `runScan` so UI polling stays the same.

### Option B — BullMQ + Redis

1. Redis (Upstash or Railway).
2. Worker process separate from web (`npm run worker`).
3. Queue name `aeo-scans`; job data `{ scanId }`.
4. Same `runScan` body; web only enqueues.

### Acceptance for migration

- [ ] Scan survives web process restart
- [ ] Failed jobs retry with backoff
- [ ] UI still polls `/api/scans/[id]` unchanged
- [ ] Per-agency concurrency ≤ 2 simultaneous scans

## Weekly re-scan design (not implemented)

### Product intent

Agencies want clients re-scanned on a schedule so Action Center and visibility stay current without manual “Start scan” every week.

### Proposed data model (future migration)

```text
Client
  rescanEnabled      Boolean  default false
  rescanIntervalDays Int      default 7
  nextRescanAt       DateTime?
```

Or a `ClientSchedule` table if multiple job types appear (scan, visibility snapshot, report).

### Scheduler

- Cron (Inngest cron or external) every hour:
  1. Find clients where `rescanEnabled && nextRescanAt <= now() && deletedAt is null`
  2. Skip if agency status not ACTIVE/TRIAL or monthly scan limit reached
  3. Create Scan QUEUED + enqueue
  4. Set `nextRescanAt = now + interval`

### Email notifications (future)

| Event | Recipient | Content |
|-------|-----------|---------|
| Scan completed | Assignee owners | Link to client Action Center |
| Weekly digest | Agency owners | Clients scanned, open HIGH actions count |
| Limit warning | Owners | Soft limit 80% scans/clients |

Transport: Resend or Postmark; template IDs in env. Do not block scan completion on email failure.

### UI stub (future)

Client settings: toggle “Weekly re-scan”, show next run time, respect plan limits.

---

Until migration, production deploys should prefer **long-running Node** (Railway/Render) over pure serverless for heavy scans, or accept heuristic-only short scans on Vercel.
