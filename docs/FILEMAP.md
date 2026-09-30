# AEO Command — FILEMAP

> Last updated: **2026-09-30**

## Lib (product core)

`action-mapper.ts` · **`action-draft-templates.ts`** · `ai-analysis.ts` · `visibility-check.ts` · `sov.ts` · `default-prompts.ts` · `report-pdf.ts` · `scan-worker.ts` · `crawl.ts` · **`safe-fetch.ts`** · `url.ts` · `rate-limit.ts` · `auth.ts` · `inngest/*`

## Lib tests

`lib/__tests__/url-and-safe-fetch.test.ts` · `vitest.config.ts`

## API

`actions/[id]/redraft` · `clients/[id]/competitors` · `clients/[id]/portal` · `clients/[id]/snapshots` · `clients/[id]/scan` · `reports/[token]/pdf` · `portal/[token]/pdf` · `visibility/status` · `auth/signup` · `auth/forgot-password` · `auth/reset-password`

## UI

`action-center.tsx` (Enrich draft) · `visibility-reports.tsx` · `client-portal-toggle.tsx` · `/r/[token]` · `/p/[token]`

## Config

`next.config.ts` (security headers) · `package.json` (`npm test` → vitest)
