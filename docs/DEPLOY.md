# Threezero AEO Deployment and Launch Runbook

This document is the deployment source of truth for staging, owner testing, and public launch.

## 1. Deployment milestones

### Phase 15: private production-like staging

This is the first hosted environment intended for serious owner testing.

It must use:

- production build
- production-like PostgreSQL
- Redis where distributed controls require it
- real provider adapters with controlled/test credentials as appropriate
- durable job configuration
- HTTPS
- real authentication flow
- real email configuration where safe
- monitoring and logs
- backups
- realistic seeded data

It must remain private and must not be presented as the finished public product.

The purpose is to discover real workflow, data, UX, mobile, accessibility, security, provider, performance, and cost problems before final launch work.

### Phase 16: public production

Public launch happens only after:

- owner testing on Phase 15 staging
- all P0/P1 issues are closed
- final UI/UX rebuild
- accessibility certification
- final PDF template integration
- security regression
- tenant isolation regression
- cost controls
- backups and restore verification
- monitoring
- production smoke tests
- SEO/AEO/GEO validation
- legal pages
- rollback procedure

## 2. Infrastructure

Preferred architecture:

**CDN/WAF -> load balancer/edge -> Next.js application -> Redis + PostgreSQL + durable workers + external providers**

Application rate limiting is not DDoS immunity. Use edge/WAF controls and protect the origin.

Do not expose provider secrets to the browser.

## 3. Required production configuration

At minimum, production requires correctly configured values for:

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- NEXT_PUBLIC_APP_URL

Depending on enabled features:

- Redis credentials
- durable job/inngest credentials
- AI provider credentials
- Firecrawl
- Resend
- Stripe
- object/media storage

Use infrastructure secret management where available.

Never commit .env, .env.local, provider keys, webhook secrets, database credentials, or MFA secrets.

## 4. Database

Before deployment:

1. generate Prisma client
2. validate Prisma schema
3. validate migrations
4. back up the database
5. deploy migrations using the documented production mechanism
6. run health checks
7. verify indexes and constraints
8. verify tenant data boundaries

Do not use destructive schema operations against production.

## 5. Redis

Production Redis is required for distributed controls where the current application contract says so.

Verify:

- distributed rate limits
- provider concurrency
- cache/single-flight
- queue coordination where applicable
- failure behavior

A Redis outage must not silently turn production distributed controls into unsafe per-process behavior.

## 6. Background work

Prefer durable background jobs for long-running scans, AI visibility collection, crawl work, reports, and scheduled tasks.

Verify:

- job admission
- retry behavior
- idempotency
- stale-job recovery
- provider timeout handling
- concurrency limits
- queue backlog visibility

A web request must not be the only place where critical long-running work exists.

## 7. Email

Before public launch:

- verified sending domain
- SPF
- DKIM
- DMARC
- configured from address
- reply-to
- test delivery
- bounce/suppression handling
- template verification

Do not leave development/test sender identities as production defaults.

## 8. Stripe

If billing is enabled:

1. configure production keys in the secret manager
2. configure webhook endpoint
3. verify webhook signature validation
4. test checkout and subscription lifecycle
5. verify plan/usage limits
6. verify cancellation behavior
7. verify failed payment behavior
8. verify billing events are tenant-safe

Do not expose secret Stripe keys to client code.

## 9. Phase 15 owner testing checklist

The owner must personally exercise:

- login
- signup
- MFA
- sessions
- Super Admin
- agency creation
- client creation
- URL submission
- scan
- AI visibility
- citations
- competitor analysis
- technical audit
- Action Center
- assignments
- rechecks
- notifications
- reports
- client portal
- provider configuration
- email
- chatbot
- billing/test checkout
- mobile navigation
- mobile analytics
- keyboard navigation
- screen-reader-critical flows

Record every defect. Fix the source of the problem rather than layering a temporary patch.

## 10. Final launch smoke test

Immediately before public launch:

1. application health endpoint returns expected success
2. login works
3. MFA works for privileged roles
4. session revoke works
5. tenant isolation checks pass
6. create client works
7. scan admission works
8. scan worker completes
9. AI visibility collection works
10. citations render
11. Action Center works
12. report snapshot generates
13. client portal authorization works
14. email test works
15. billing webhook verification works if enabled
16. notification delivery works
17. Super Admin can inspect operational health
18. public marketing pages load
19. robots/sitemap/llms.txt are correct
20. legal pages load
21. monitoring receives expected events
22. backup exists
23. restore procedure has been tested
24. rollback procedure is documented

## 11. Launch gate

Public production launch is approved only after Phase 16 launch certification.

No one should use "live" to mean public production before this gate.

The Phase 15 staging environment is the deliberate early-live checkpoint for owner testing.
