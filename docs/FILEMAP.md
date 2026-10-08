# Threezero AEO - FILEMAP

Last updated: 2026-10-07

This is an index of important paths. It is not a second roadmap. The ordered work sequence remains PROJECT_PLAN.md.

## Core security and platform libraries

- lib/auth.ts: NextAuth authentication, privileged MFA enforcement, session creation/revocation, authentication events.
- lib/session.ts: persistent session validation and last-active handling.
- lib/mfa.ts: TOTP setup/verification and recovery-code handling.
- lib/security-events.ts: security event recording.
- lib/rate-limit.ts: application rate limiting.
- lib/safe-fetch.ts: SSRF-safe bounded fetching.
- lib/visibility-check.ts: live AI engine visibility checks.
- lib/visibility-cache.ts: provider result caching/single-flight.
- lib/visibility-concurrency.ts: distributed provider concurrency controls.
- lib/visibility-config.ts: visibility limits and timeout configuration.
- lib/scan-worker.ts: scan execution.
- lib/crawl.ts: crawl orchestration.
- lib/action-mapper.ts: scan findings to Action Center actions.
- lib/action-draft-templates.ts: action draft templates.
- lib/report-pdf.ts: report PDF generation path, to be integrated with the final owner-supplied PDF design in Phase 16.
- lib/sov.ts: share-of-voice calculations.
- lib/ai-analysis.ts: AI analysis.

## Phase 1 authentication and admin APIs

- app/api/auth/sessions/route.ts: current user's persistent session list and revocation.
- app/api/auth/mfa/setup/route.ts: MFA setup challenge.
- app/api/auth/mfa/confirm/route.ts: MFA confirmation.
- app/api/admin/sessions/route.ts: Super Admin session inspection.
- app/api/admin/security-events/route.ts: Super Admin security event inspection.
- app/api/admin/users/route.ts: Super Admin user directory.

## Existing important APIs

- app/api/actions/[id]/redraft/route.ts
- app/api/clients/[id]/competitors/route.ts
- app/api/clients/[id]/portal/route.ts
- app/api/clients/[id]/snapshots/route.ts
- app/api/clients/[id]/scan/route.ts
- app/api/reports/[token]/pdf/route.ts
- app/api/portal/[token]/pdf/route.ts
- app/api/visibility/status/route.ts
- app/api/auth/signup/route.ts
- app/api/auth/forgot-password/route.ts
- app/api/auth/reset-password/route.ts

## Product UI

- app/layout.tsx: application shell and persistent impersonation banner.
- app/not-found.tsx: safe accessible 404 boundary.
- app/error.tsx: safe application error boundary.
- app/global-error.tsx: safe global error boundary.
- app/settings/page.tsx: user settings and session controls.
- app/admin/page.tsx: Super Admin control plane.
- components/impersonation-banner.tsx: visible impersonation state.

Existing product UI includes the dashboard, Action Center, visibility reports, client portal controls, public report, and portal surfaces. Future UI work must extend the existing component owners rather than creating duplicate implementations.

## Tests

- lib/__tests__/mfa.test.ts
- lib/__tests__/phase1-security-contracts.test.ts
- lib/__tests__/visibility-hardening.test.ts
- lib/__tests__/url-and-safe-fetch.test.ts
- vitest.config.ts

## Workflows

- .github/workflows/phase1-identity-admin.yml
- .github/workflows/phase2-security-boundary.yml
- .github/workflows/p0c-provider-concurrency.yml
- .github/workflows/p0e-queue-admission.yml
- related P0 security workflows

## Configuration

- prisma/schema.prisma: canonical database schema.
- .env.example: environment contract.
- next.config.ts: application/security configuration.
- package.json: scripts and dependency contract.

## Documentation

- PROJECT_PLAN.md: single ordered execution plan and current project memory.
- HISTORY.md: detailed historical ship record.
- AGENTS.md: implementation and documentation rules.
- README.md: architecture and product overview.
- docs/DEPLOY.md: staging and public launch runbook.
- docs/QUEUE_AND_JOBS.md: queue and worker architecture.
- docs/UI_REFERENCE.md: final dashboard visual and accessibility reference.

## Future architecture ownership

Future analytics, provider, crawler, action, notification, reporting, marketing CMS, media, chatbot, and Super Admin additions must be indexed here when they become real code.

Do not add placeholder paths for features that have not been implemented.


## Phase 2 security additions

- `lib/capability-tokens.ts` - random generation and SHA-256 hashing for public capability tokens.
- `prisma/migrations/20261007010000_hash_public_capability_tokens/migration.sql` - hashes existing portal, report, and invite capability tokens during schema migration.
- `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` - safe accessible error boundaries.
- `.github/workflows/phase2-security-boundary.yml` - Phase 2 security verification gate.


## Phase 4 AI visibility additions

- `lib/visibility-normalization.ts` - canonical normalization, citation extraction, prompt intent classification, share-of-voice, and volatility.
- `lib/visibility-check.ts` - live provider checks, caching, timeout, and heuristic fallback inputs.
- `lib/visibility-job.ts` - durable visibility execution and normalized evidence persistence.
- `app/api/clients/[id]/visibility/evidence/route.ts` - tenant-scoped cursor-paginated engine evidence API.
- `prisma/schema.prisma` - AIResponse, CitationEvidence, and PromptEngineObservation models.
- `prisma/migrations/20261008020000_phase4_ai_visibility_evidence/migration.sql` - Phase 4 evidence tables, indexes, foreign keys, and mutation guards.
- `lib/__tests__/phase4-visibility-normalization.test.ts` - deterministic Phase 4 normalization and scoring contracts.