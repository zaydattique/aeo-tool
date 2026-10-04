# Threezero AEO - MASTER PROJECT PLAN

Repo: `zaydattique/aeo-tool`

**Working product name:** Threezero AEO  
**Descriptor:** AI Search Visibility and Answer Engine Optimization Platform  
**Parent brand:** threezero.agency

Recommended SEO identity: use **Threezero AEO** as the product name, while titles and descriptions can naturally target phrases such as "AI Search Visibility Platform", "AEO software", "AI visibility tracking", and "Answer Engine Optimization". Footer attribution must say **Backed by threezero.agency**. All identity values must become Super Admin editable.

This is the single ordered execution plan. The old 20-minute session model is retired. Each phase is a coherent workstream containing its backend, database, frontend, UI, UX, security, QA, documentation, and verification work. Related work stays together. We do not split a feature into arbitrary micro-sessions just to create more phase numbers.

---

# 0. EXECUTION CONTRACT

## 0.1 Definition of complete

A phase is complete only when the real user workflow works end to end. Code existing in a helper, schema, or unused component is not completion.

For every phase, implementation must cover the relevant database model and constraints, server behavior, API validation and authorization, frontend integration, UI states, UX flow, accessibility, failure handling, tests, documentation, and deployment implications.

Every phase must have explicit acceptance tests. "Run tests" is not an acceptance criterion. The plan must say what is tested, with which role, input, route, state, expected response, expected database result, and expected UI result.

## 0.2 Engineering rules

1. Search the repository before creating a file. Extend the existing owner of a concern when possible.
2. Never solve a problem by adding a later CSS rule, duplicate validation branch, duplicate API route, duplicate configuration object, or duplicate component when the original implementation should be fixed.
3. Remove obsolete code after a refactor is proven. Do not leave the old implementation underneath a new override.
4. No hardcoded company identity, pricing, contact information, legal identity, marketing copy, major marketing headings, or business media once the relevant Super Admin configuration exists.
5. All media related to marketing, blog, product branding, case studies, client branding, reports, and PDFs must come through the appropriate managed media/content path. Do not hardcode arbitrary business assets into page components.
6. No passwords, reusable tokens, API keys, provider secrets, or MFA secrets may be exposed in Super Admin.
7. Every business query must enforce tenant isolation. Never trust a client-supplied agency identifier.
8. Expensive work must have the appropriate authentication, authorization, quota, rate, timeout, concurrency, response-size, retry, and cost controls.
9. Application rate limiting is not DDoS immunity. DDoS resilience requires edge/WAF/origin protection plus application controls.
10. Never represent a heuristic visibility result as a real statement made by an AI provider. Live, cached live, and estimated results must be distinguishable.
11. Do not claim 100k-user scalability without a controlled benchmark. "Designed for" and "tested at" are different claims.
12. Do not add generic guidance paragraphs to UI. Use concise labels, useful state information, meaningful actions, and contextual explanations.
13. Accessibility is mandatory. Target WCAG 2.2 AA, including blind, low-vision, deaf, and hard-of-hearing users.
14. Product pricing is dollar-based. Do not add region-specific currency or Pakistan-specific product logic.
15. No em dash characters in project documentation or product copy. Use commas, parentheses, colons, or normal hyphens.
16. Documentation must be updated in the same ship when architecture, routes, schema, configuration, or user-facing behavior changes.

## 0.3 Standard verification

Run the relevant combination of:

`npm ci`  
`npx prisma generate`  
`npx prisma validate`  
`npx tsc --noEmit`  
`npm test`  
`npm run build`  
targeted Vitest and integration suites  
browser E2E tests once established  
accessibility tests  
security regression tests  
database migration tests on clean and representative databases  
load/concurrency tests where the phase changes workload behavior.

Every phase must also verify that no duplicate implementation, dead code, hardcoded business value, or obsolete override was introduced.

## 0.4 Ordered strategy

Build in this order:

1. Security and production gate.
2. Identity, authorization, sessions, and Super Admin.
3. Configuration, providers, email, secrets, cost, and observability.
4. Analytics and canonical data foundation.
5. AI visibility, prompts, citations, competitors, and engines.
6. Crawl, SEO, AEO, GEO, entity, and technical intelligence.
7. Action Center and agency execution.
8. Product dashboard and complete UX system.
9. Client portal and reporting architecture.
10. Accessibility across the whole application.
11. QA, regression, security, performance, and release engineering.
12. Pricing, packaging, margin controls, and billing.
13. Marketing-site chatbot and exact cost accounting.
14. Blog and topical authority content.
15. Final marketing site, brand, SEO, AEO, GEO, conversion, and legal pages.
16. Production edge, backups, observability, disaster recovery, and scale validation.
17. Enterprise capabilities.
18. Owner-supplied PDF template integration.
19. Launch certification.

Marketing is intentionally late. The product must stabilize before the public site is finalized so marketing never describes an older version of the product.

---

# 1. PHASE 0 - SECURITY CONSOLIDATION AND PRODUCTION GATE

**Status: COMPLETE**

**Goal:** Reconcile the existing P0 hardening into one verified baseline and close the remaining production security gaps before major feature work.

## Implementation

### 1.1 Reconcile P0-T before merge
Inspect the complete P0-T diff against current `main`. Do not merge it because the PR is mergeable. Fix the known TypeScript failures first, including missing shared request/body helper imports in the action redraft, billing checkout, client portal, and client route files. Then rerun the full P0-T suite rather than assuming import fixes are sufficient.

### 1.2 Establish one API security pipeline
Audit representative routes across authentication, agency resources, scans, visibility, actions, reports, PDFs, billing, invites, public tokens, and admin. Refactor shared helpers so the canonical order is authentication -> role authorization -> tenant context -> rate/abuse control -> request body limit -> schema validation -> quota admission -> business operation -> audit event.

### 1.3 Complete the tenant IDOR matrix
Create Agency A and Agency B fixtures. For every identifier-based route, attempt reads and writes across clients, scans, actions, prompts, visibility snapshots, jobs, reports, portal data, PDFs, team members, billing, and exports. Record the expected 403 or 404 contract. Any successful cross-tenant operation blocks the phase.

### 1.4 Harden authentication abuse
Use IP, email, IP+email, and global dimensions for login and recovery. Add progressive delay and short throttling. Keep credential errors generic. Preserve hashed one-time reset tokens and invite expiration. Increase the password baseline and add breached-password screening if safely implementable.

### 1.5 Require MFA for privileged roles
SUPER_ADMIN and AGENCY_OWNER must support mandatory TOTP plus recovery codes. Design WebAuthn/passkeys as the next high-assurance method. Privileged actions must not proceed when required MFA is incomplete.

### 1.6 Add layered DDoS protection
Document and implement CDN/WAF, origin protection, edge rate limits, bot controls, application distributed limits, provider limits, and monitoring. Do not claim immunity from volumetric attacks.

## Exact verification

1. Clean install, Prisma generation/validation, TypeScript, unit tests, build, and all P0 workflows pass.
2. P0-T has zero type errors and every security regression test passes.
3. Agency A cannot read or mutate Agency B data through any tested identifier.
4. Concurrent scan admission cannot create two active scans for one client.
5. Redis outage fails closed where production requires distributed protection.
6. Provider concurrency cannot exceed global, provider, or agency limits.
7. SSRF tests still block private, loopback, metadata, CGNAT, IPv4-mapped private addresses, malicious redirects, credentials, and disallowed ports.
8. Login, signup, reset, invite, PDF, report, redraft, scan, and visibility abuse tests return the intended throttled result.
9. Privileged login without required MFA is blocked.
10. No secrets are returned by API or admin responses.
11. Only after every gate is green may P0-T be merged.

---

# 2. PHASE 1 - IDENTITY, SESSIONS, AUTHORIZATION, AND SUPER ADMIN

**Status: IN PROGRESS**

**Goal:** Make security and administration observable and controllable instead of scattered across routes.

## Implementation

Build a canonical session/security record that can represent user, agency, role, session ID, issued time, expiry, last activity, IP, user agent, MFA state, revocation, and impersonation state.

Build user session management so users can see and revoke their own sessions. Super Admin can inspect security metadata for agencies without seeing passwords or reusable tokens.

Record successful and failed logins, logout, session creation/revocation, password changes, reset events, MFA enrollment/recovery, suspicious authentication events, and impersonation.

Harden impersonation with short expiry, visible banners, explicit authorization, audit records, and no privilege escalation.

Build the Super Admin control plane for agencies, users, sessions, security events, subscriptions, plans, usage, providers, email, chatbot spend, system health, queue health, content, branding, media, pricing, legal content, and audit logs.

## Exact verification

Create fixtures for SUPER_ADMIN, AGENCY_OWNER, and AGENCY_MEMBER. Verify navigation and API access for each role. Revoke a session and confirm the session immediately fails. Expire impersonation and confirm reuse fails. Confirm impersonation is visible everywhere in the product. Confirm audit records include actor, target, agency, timestamp, IP, and user agent. Confirm passwords, API keys, tokens, and MFA secrets never appear in admin responses.

---

# 3. PHASE 2 - CONFIGURATION, PROVIDERS, EMAIL, SECRETS, COST, AND OBSERVABILITY

**Goal:** Build one operational control plane instead of relying on scattered environment variables and hidden configuration.

## Implementation

Create one configuration architecture covering application settings, feature flags, providers, email, billing, branding/content, chatbot, analytics, and limits.

Super Admin provider management must cover OpenAI, Anthropic, Perplexity, Gemini, Firecrawl, and future engines. Each provider needs connection state, active state, model, timeout, concurrency, cost budget, request limits, last test, last error, masked credential metadata, rotation, and usage.

Secrets must use a proper secret manager where available. If encrypted database storage is required, encrypt at rest, never return plaintext, separate secret metadata from ciphertext, and audit changes.

Build email configuration with provider, from name/address, reply-to, domain verification, test send, delivery state, bounce/suppression state, and usage. Production must use a verified domain with SPF, DKIM, and DMARC.

Normalize every paid provider operation into a usage record containing provider, model, operation, agency, client, actor, request ID, usage units, calculated cost, success/failure, cache state, retry count, and timestamp.

Build a Super Admin cost dashboard showing spend by provider, model, agency, client, feature, day, and month, plus projected spend, cost per operation, and margin estimates.

## Exact verification

Configure a test provider from Super Admin, test it, rotate it, disable it, and confirm the old credential is no longer used. Verify no API response contains the secret. Send a test email and verify delivery state. Simulate provider usage and reconcile admin totals against raw usage records. Trigger a provider budget limit and verify the call is rejected before the paid provider is contacted.

---

# 4. PHASE 3 - CANONICAL ANALYTICS AND DATA FOUNDATION

**Goal:** Support the requested 50+ analytics through one metric architecture instead of independent dashboard calculations.

## Metric registry

Define one source of truth for metric name, slug, category, formula, data source, time window, aggregation, confidence, live/estimated state, engine eligibility, required inputs, display format, and methodology.

Support these categories:

**AI visibility:** AI Visibility Score, Mention Rate, Citation Rate, Recommendation Rate, Brand Inclusion Rate, Competitor Inclusion Rate, Share of Voice, Average AI Position, Winning Prompt Rate, Losing Prompt Rate, Prompt Volatility, Engine Visibility, Country Visibility, Language Visibility, Product Visibility.

**Citation intelligence:** Total Citations, Unique Cited Domains, Citation Frequency, Citation Authority, Citation Freshness, Citation Page Distribution, Competitor Citation Overlap, Citation Gap, Influential Sources, Missing Authority Sources.

**AI answer intelligence:** Sentiment, Recommendation Sentiment, Accuracy, Brand Positioning, Product Positioning, Competitor Positioning, Mention Context, Hallucination Risk, Missing Facts, Wrong Facts.

**Technical intelligence:** Crawlability, AI Crawlability, Indexability, Structured Data Health, Entity Clarity, Content Completeness, Topical Coverage, Internal Linking, Schema Coverage, llms.txt readiness.

**Business attribution:** AI Referral Traffic, AI Leads, AI-Assisted Conversions, AI Revenue, Visibility-to-Traffic Correlation.

Historical observations must be timestamped so changing today's result never rewrites historical values.

## Exact verification

Seed deterministic fixture data. Independently calculate at least 20 metrics and compare every result. Query historical data across large fixture sets and confirm bounded results, correct indexes, and stable ordering. Run migration validation on a clean database and a representative database.

---

# 5. PHASE 4 - AI VISIBILITY, PROMPTS, ENGINES, CITATIONS, AND COMPETITORS

**Goal:** Make AI visibility the core intelligence engine rather than a basic score widget.

## Implementation

Build prompt discovery and grouping for brand, category, transactional, local, comparison, problem, product, competitor, and buyer-intent prompts.

Track each prompt across supported engines. Store live responses, normalized answers, source data, timestamps, model metadata, confidence, and status. Keep heuristic estimates clearly separate.

Build citation intelligence around source URL, domain, page title, cited position, frequency, first/last seen, competitor overlap, page type, authority/freshness signals, and citation gaps.

Build competitor intelligence showing who appears with the client, which prompts competitors win, which sources they own, where the client is absent, and where competitive movement occurs.

Every score must expose sample size, prompt count, engines, time range, weighting, confidence, live/estimated state, and collection time.

## Exact verification

Use deterministic provider fixtures and live provider tests separately. Prove a cached response does not consume provider capacity. Prove provider timeout is bounded. Prove fallback is labeled estimated. Prove historical snapshots are immutable. Prove Agency B cannot access Agency A prompt history or citations.

---

# 6. PHASE 5 - CRAWL, SEO, AEO, GEO, ENTITY, AND TECHNICAL INTELLIGENCE

**Goal:** Make the audit deep enough to truthfully sell AI Search Readiness rather than a shallow page scan.

## Implementation

Audit the existing crawler first and preserve SSRF controls. Add bounded page count, crawl time, per-page timeout, response bytes, redirect count, concurrency, domain scope, and queue backlog.

Normalize titles, descriptions, headings, canonicals, robots directives, indexability, structured data, internal/external links, image metadata, duplicate patterns, status codes, sitemaps, broken links, page types, and content depth.

Add AI readiness analysis for AI crawler access, entity consistency, Organization/LocalBusiness/Product schema, author/publisher signals, factual completeness, topical coverage, question-answer coverage, citation-worthiness, freshness, and llms.txt where relevant.

Add local/GEO signals where the client has a local footprint without turning the product into a generic rank tracker.

## Exact verification

Use controlled fixture sites covering valid/invalid canonicals, malformed schema, redirects, blocked crawling, broken links, slow pages, oversized responses, private-IP redirects, malformed sitemaps, and missing entity data. Verify deterministic findings and bounded resource use. Run a multi-page staging crawl and record page count, duration, concurrency, memory/response bounds, and database writes.

---

# 7. PHASE 6 - ACTION CENTER AND AGENCY EXECUTION LOOP

**Goal:** Turn every finding into measurable work.

## Implementation

Use one lifecycle:

**finding -> impact -> recommendation -> implementation detail -> draft -> assignment -> implementation -> recheck -> result -> historical impact**

Actions need title, severity, category, affected URL, evidence, why it matters, exact steps, suggested content/code where useful, expected impact, effort, owner, status, verification method, and last result.

Add filtering, sorting, bulk assignment, bulk status, client filtering, priority filtering, exports, completion notes, and rechecks without creating separate action systems.

## Exact verification

Create one finding fixture and run the entire lifecycle from scan result to assigned work to completed work to recheck. Verify every state transition, permission, audit event, database record, client dashboard update, and historical result. Archive the client and verify no action leaks after archival.

---

# 8. PHASE 7 - DASHBOARD, DESIGN SYSTEM, UI, AND UX REBUILD

**Goal:** Make the product understandable without requiring users to already understand AEO.

## Implementation

Audit existing UI before adding components. Consolidate duplicate buttons, cards, modals, tables, tabs, badges, forms, alerts, loading states, empty states, typography, spacing, and responsive rules. Fix originals rather than adding overrides.

The dashboard must answer quickly:
- How visible are my clients?
- What changed?
- Who is losing?
- Who is gaining?
- Which citations matter?
- What are the three highest-value actions?
- What is waiting on my team?
- What data collection failed?

The client workspace should combine overview, visibility, prompts, citations, competitors, technical audit, actions, reports, portal, and history.

Onboarding should be URL-first and fast: agency -> client URL -> detected identity -> confirmation -> audit -> meaningful result -> prioritized action.

Every major flow needs intentional loading, empty, partial, timeout, provider unavailable, permission, quota, stale, retry, completed, and archived states.

## Exact verification

Browser-test desktop and mobile, empty and populated accounts, slow network, API failures, role changes, and quota exhaustion. Run keyboard-only navigation and visual review. Verify a new user can reach the first meaningful result without external explanation.

---

# 9. PHASE 8 - CLIENT PORTAL, REPORTING, AND PDF DATA ARCHITECTURE

**Goal:** Make the client-facing experience polished while separating report data from final PDF presentation.

## Implementation

Create one canonical report snapshot containing reporting period, visibility, citations, competitors, technical findings, actions, completed work, trends, methodology, and branding.

Make the live report and portal consume that canonical data. Keep internal agency operations out of the client portal.

Build PDF data structures, page sections, assets, charts, typography tokens, and rendering abstractions now, but do not finalize the visual PDF template until the owner supplies it.

## Exact verification

Generate the same report through live HTML and report data and compare every metric. Test client branding, long text, missing metrics, many citations, many competitors, multiple pages, public tokens, and cross-tenant access. Verify the PDF and portal always use the same source values.

---

# 10. PHASE 9 - ACCESSIBILITY FOR BLIND, LOW-VISION, DEAF, AND HARD-OF-HEARING USERS

**Goal:** Make accessibility part of the product, not a final compliance label.

## Implementation

Use semantic landmarks, correct heading hierarchy, accessible form labels, predictable focus order, visible focus, keyboard operation, screen-reader announcements, accessible tables, accessible charts, modal focus management, tab semantics, and meaningful errors.

Every chart must have a textual equivalent. Icon-only buttons need accessible names. Decorative images must not pollute the accessibility tree.

Important events such as scan completion, errors, notifications, security events, billing states, and chat events must never depend on sound alone. If video/audio is added later, captions and transcripts are mandatory.

Target WCAG 2.2 AA and test with keyboard only, NVDA, VoiceOver, zoom, reduced motion, high contrast, and text scaling.

## Exact verification

Run automated accessibility checks on every major route. Manually navigate login, onboarding, dashboard, client workspace, Action Center, visibility, reports, portal, admin, pricing, and chatbot using keyboard and a screen reader. A core task that requires a mouse or color-only interpretation blocks completion.

---

# 11. PHASE 10 - QA, E2E, SECURITY REGRESSION, AND RELEASE ENGINEERING

**Goal:** Replace individual confidence with a repeatable release system.

## Implementation

Build a test pyramid covering unit, integration, API, browser E2E, accessibility, visual regression, load, concurrency, and security.

Automate signup, login, MFA, onboarding, client creation, scan, failed scan, visibility, action assignment/completion, report, portal, billing, invites, session revocation, admin impersonation, provider configuration, email test, chatbot, and marketing conversion flows.

Security tests must include IDOR, broken access control, SSRF, CSRF/session issues, body abuse, brute force, credential stuffing, invite abuse, reset abuse, public token enumeration, webhook forgery/replay, race conditions, duplicate queue events, provider cost amplification, and prompt injection boundaries around external website content.

Create one canonical required CI gate containing install, Prisma generation/validation, typecheck, unit/integration tests, security tests, build, critical E2E, and dependency vulnerability checks.

## Exact verification

Run the complete gate on a clean database and a realistic seeded database. Force representative failures and verify the correct UI and API behavior. A failed required job blocks release.

---

# 12. PHASE 11 - PRICING, PACKAGING, PROFITABILITY, AND BILLING

**Goal:** Be competitive while protecting margin.

## Implementation

Benchmark current competitors including Otterly, Peec AI, Profound, Semrush AI Visibility, Scrunch, Ahrefs Brand Radar, AthenaHQ, and newly relevant tools. Record price, prompts, engines, citation intelligence, competitors, projects/clients, seats, reports, white label, API, enterprise features, and major differentiators with source date.

Use the current working commercial direction as a starting point, not a final decision:
- Starter: $49/month
- Growth: $129/month
- Agency: $299/month

Final pricing must be selected after provider-cost modeling.

Build a margin simulator using clients, scans, prompts, live checks, provider cost, crawl cost, seats, reports, portal usage, storage, support burden, and worst-case usage.

Build billing UI showing plan, included usage, used usage, remaining usage, renewal, invoices, payment state, upgrade/downgrade, cancellation, and overage policy.

The server-side plan model is authoritative. Frontend display must never be able to bypass a limit.

## Exact verification

Simulate low, normal, and maximum plan usage. Calculate real provider cost from usage records and compare revenue to gross margin. Attempt direct API limit bypasses and confirm server-side enforcement. Confirm plan changes affect the same canonical entitlement service everywhere.

---

# 13. PHASE 12 - MARKETING CHATBOT AND EXACT AI SPEND ACCOUNTING

**Goal:** Add the marketing-site AI assistant with a hard $0.05 target budget per unique visitor and complete cost visibility.

## Implementation

Create a privacy-conscious pseudonymous visitor identifier and server-side budget ledger. The chatbot must have public abuse limits, prompt/response bounds, provider timeout, global budget, per-user budget, and atomic cost admission.

Before every paid call, reserve enough budget for the bounded request. Concurrent requests for one visitor must not overspend the hard budget.

Track visitor, conversation, provider, model, input/output usage where available, calculated cost, total spend, budget state, request count, and timestamps.

Super Admin must show unique visitors, conversations, messages, provider calls, failures, spend, spend per visitor, spend by model, spend by day, landing page, and conversion attribution where available.

The chatbot must be keyboard accessible, screen-reader accessible, visibly loading, visibly failed, resettable, and able to provide a clear human contact path.

## Exact verification

Use deterministic cost fixtures. Prove a visitor cannot exceed the configured $0.05 budget under sequential or concurrent requests. Prove a new visitor gets a separate budget. Prove provider failures do not create false spend. Reconcile admin totals against individual usage records. Verify public chatbot traffic cannot access authenticated client data.

---

# 14. PHASE 13 - BLOG, GUIDES, AND TOPICAL AUTHORITY CONTENT SYSTEM

**Goal:** Build useful content that follows search quality principles instead of producing thin SEO pages.

## Implementation

Use the existing marketing content structure where possible. Each article must support title, slug, excerpt, author, author bio, publication/update dates, featured media, category, tags, canonical, related content, sources where needed, structured data, social metadata, and publication state.

Build substantial content around real search intent, original explanations, practical examples, expert review, source attribution, updated facts, useful visuals, and internal linking.

Use answer-first structures for important AEO topics: direct answers, definitions, questions, comparisons, examples, summaries, sources, and related questions.

Super Admin must edit titles, headings, body, authors, media, metadata, canonical, schema fields, internal links, categories, and publication state.

## Exact verification

Validate each article for canonical, metadata, structured data, indexability, internal links, mobile layout, accessibility, source support, duplicate title/meta, broken media, accidental noindex, and sitemap inclusion. Reject content that exists only to capture a keyword without substantive value.

---

# 15. PHASE 14 - FINAL MARKETING PAGE, BRAND, SEO, AEO, GEO, UX, CONVERSION, AND LEGAL

**Goal:** Build the public website after the product is stable.

## 15.1 Brand migration

Replace AEO Command with the approved product identity. Recommended default is **Threezero AEO**, descriptor **AI Search Visibility Platform**, footer attribution **Backed by threezero.agency**.

All of these must be editable through Super Admin so future naming decisions do not require code changes.

## 15.2 Marketing CMS

Super Admin must control:
- site name and descriptor,
- navigation,
- hero headline and subheadline,
- major section headings,
- CTAs,
- feature copy,
- pricing,
- FAQs,
- comparisons,
- testimonials,
- case studies,
- trust statements,
- footer,
- company identity,
- social links,
- legal links,
- contact details,
- announcement bar,
- SEO title/description,
- OG metadata,
- structured data facts,
- media.

No production marketing page should retain hardcoded company-specific values after this phase.

## 15.3 Homepage UX

The homepage must explain:
1. What the product is.
2. Who it serves.
3. The problem.
4. AI visibility measurement.
5. Citation and competitor intelligence.
6. The intelligence-to-action workflow.
7. Agency workflow.
8. Differentiation.
9. Product workflow.
10. Honest measurable outcomes.
11. Pricing.
12. Security.
13. Data handling.
14. Live versus estimated methodology.
15. The next conversion action.

Use strong outcome-led hierarchy, product previews, proof, mechanism, workflow, objections, comparison, FAQ, and clear CTAs. Do not use generic filler guidance.

Use the requested bot.threezero.agency experience as inspiration when it is accessible, but do not copy content. The design should feel like the same parent-brand ecosystem.

## 15.4 SEO protection

Before modifying public routes, record URLs and existing metadata. Preserve useful URLs. If a URL changes, create deliberate redirects and update canonical, sitemap, internal links, and metadata.

Protect:
- titles,
- descriptions,
- canonicals,
- sitemap,
- robots,
- internal links,
- semantic headings,
- alt text,
- image performance,
- Organization,
- SoftwareApplication where appropriate,
- Product/Offer where appropriate,
- BreadcrumbList,
- Article,
- WebSite,
- Open Graph,
- social metadata.

Structured data must match visible content.

## 15.5 AEO/GEO

Make the site easy for answer engines to understand through:
- answer-first sections,
- definitions,
- clear product facts,
- feature facts,
- pricing facts,
- comparison pages,
- use cases,
- methodology,
- author information,
- source-backed claims,
- llms.txt,
- clean crawlability,
- entity relationships.

Do not publish fake statistics or make unsupported ranking promises.

## 15.6 Legal

Marketing must include appropriate:
- Privacy Policy,
- Terms of Service,
- Cookie Policy,
- Acceptable Use Policy,
- data processing/privacy information where applicable,
- refund/cancellation policy,
- AI usage disclosure,
- security/contact page,
- accessibility statement.

Legal content must be editable by Super Admin and changes must be audited.

## Exact verification

Run Lighthouse desktop/mobile, Core Web Vitals review, schema validation, rich-result checks where applicable, sitemap/robots checks, full internal-link crawl, broken-link crawl, image optimization, accessibility, AI crawler access, metadata uniqueness, noindex/canonical checks, and visible-content/schema consistency.

Then change the product name, hero heading, company name, logo, CTA, price, and footer in Super Admin and verify the live marketing page changes without code deployment. This test is mandatory.

---

# 16. PHASE 15 - COMPETITOR COMPARISON AND SALES ENABLEMENT

**Goal:** Turn competitive research into a truthful sales system.

Build comparison pages and internal sales material covering major competitors, prompt capacity, engines, citations, competitors, reporting, white label, API, enterprise features, and pricing.

The core differentiation should be the closed loop:

**measure AI visibility -> explain why -> find citation/entity/content gaps -> create the fix -> assign -> implement -> recheck -> measure impact -> report**

Do not compete only on prompt count.

Build or improve:
- comparison page,
- feature matrix,
- agency workflow page,
- methodology page,
- security page,
- ROI explanation,
- case studies,
- sample report,
- pricing calculator,
- objection FAQ.

## Exact verification

Every competitor claim must have a source and review date. Never state that a competitor lacks a feature unless verified. Every sales claim must match the real product behavior.

---

# 17. PHASE 16 - EDGE, OBSERVABILITY, BACKUPS, DISASTER RECOVERY, AND SCALE

**Goal:** Prove production behavior under growth and failure.

Implement and verify CDN, WAF, origin protection, TLS, HSTS, edge rate limits, bot controls, admin protection, and health endpoint policy.

Monitor request latency, API errors, database latency, queue backlog, provider latency/errors/cost, crawl failures, scan failures, authentication abuse, Redis errors, email failures, billing webhooks, chatbot spend, and resource saturation.

Document database backup frequency, retention, restore procedure, media backup, secret recovery, migration recovery, and incident ownership. Perform an actual restore drill in non-production.

For the 100k-user goal, benchmark authenticated concurrency, login bursts, dashboard reads, client queries, visibility jobs, scans, worker backlog, Redis, database pools, provider concurrency, chatbot traffic, report generation, and public reports.

Record infrastructure, dataset size, workload, concurrency, p50, p95, p99, error rate, queue wait, database saturation, Redis saturation, provider throttling, and cost. Do not call the system 100k-user ready without this evidence.

## Exact verification

Run staged load tests, capture metrics, identify bottlenecks, implement mitigations, and repeat. Store benchmark results in HISTORY and deployment documentation.

---

# 18. PHASE 17 - ENTERPRISE CAPABILITIES

**Goal:** Add enterprise functionality after core stability.

Scope:
- SSO/SAML,
- SCIM,
- WebAuthn/passkeys,
- advanced audit export,
- API keys,
- public API,
- webhooks,
- custom domains,
- agency data retention,
- BYOK,
- advanced roles,
- approval workflows,
- export/deletion workflows,
- enterprise security documentation.

## Exact verification

Every enterprise feature requires authorization tests, tenant isolation tests, audit tests, failure tests, migration tests, backward compatibility tests, and documentation.

---

# 19. PHASE 18 - FINAL PDF TEMPLATE INTEGRATION

**Goal:** Apply the owner-provided PDF template only after report data, portal UX, analytics, branding, and content are stable.

First map every template element to canonical report data, configurable branding, managed media, charts, typography, and page sections.

Modify the existing report generator rather than creating a competing generator. If it is structurally incapable of the design, refactor the existing generator.

Test short and long content, missing metrics, many citations, many competitors, long client names, multiple pages, different branding, no logo, custom logo, and unusual characters. Compare the final PDF to the supplied design at print scale and compare every value to the live report.

---

# 20. PHASE 19 - LAUNCH CERTIFICATION

The final product is launchable only when:

**Security:** no known critical/high tenant, auth, SSRF, secret, webhook, or cost-amplification issue.

**Product:** onboarding -> scan -> visibility -> actions -> recheck -> report -> portal works.

**UX:** a new agency can reach a useful result without external explanation.

**Accessibility:** core workflows meet the WCAG 2.2 AA target through automated and manual review.

**AI integrity:** live, cached, and estimated data are clearly differentiated.

**Cost:** provider and chatbot spend is measurable by operation, agency, client, and visitor where applicable.

**Billing:** limits are enforced server-side and pricing is margin-aware.

**Marketing:** the public site accurately describes the real product, is editable through Super Admin, and passes SEO/AEO/GEO checks.

**Content:** blog and guide pages provide real value and do not rely on thin mass-generated content.

**Legal:** required legal pages exist and are linked.

**Operations:** monitoring, backups, restore, incident response, provider failure handling, and deployment procedures are documented.

**Scale:** tested capacity and known bottlenecks are documented honestly.

---

# 21. SUPER ADMIN MASTER REQUIREMENTS

The finished Super Admin must cover:

**Identity and security:** users, roles, MFA, sessions, login events, failed logins, reset events, invite events, impersonation, audit logs, security alerts.

**Agencies and clients:** agencies, users, clients, plan, usage, scans, visibility history, actions, reports, portal state.

**AI/infrastructure:** providers, models, credentials, tests, limits, budgets, latency, failures, cost.

**Email:** provider, sending identity, verification, delivery, bounces, suppressions, templates, tests, usage.

**Product analytics:** all metrics, active users, clients, scans, visibility checks, citations, actions, reports, portal activity, feature usage, churn indicators.

**Marketing CMS:** site identity, headings, copy, pricing, navigation, FAQs, comparison content, case studies, blog, authors, media, SEO metadata, structured data, social links, legal content, footer attribution, announcements, chatbot configuration.

**Commercial:** plans, dollar prices, limits, feature flags, cost, margin, discounts, trials, subscriptions, invoices, failed payments.

**Chatbot:** unique visitors, conversations, usage, provider cost, $0.05 budget status, failures, conversions.

**Operations:** queue, database, Redis, providers, email, billing webhooks, crawl health, build/deployment version, error rates.

---

# 22. DATA AND PRIVACY

Never store readable passwords. Never expose reusable tokens or secrets. Store only the minimum visitor information needed for chatbot budgeting and abuse prevention. Prefer pseudonymous identifiers. Define retention for security events, analytics, chat, crawl data, and reports. Implement deletion/export behavior. Do not use customer data for unrelated model training without a documented basis. Audit access to sensitive admin data.

---

# 23. MARKETING QUALITY BAR

The marketing site is a first-class acquisition asset.

Before every public-route change:
1. Record current URL and metadata.
2. Preserve useful URLs.
3. Add deliberate redirects when URLs change.
4. Recheck canonical.
5. Recheck sitemap.
6. Recheck internal links.
7. Recheck metadata.
8. Recheck structured data.
9. Recheck indexability.
10. Recheck AI crawler access.
11. Recheck performance.
12. Recheck accessibility.

Never delete a useful indexed page merely to simplify code.

---

# 24. CODEBASE HEALTH

During every phase, clean touched code:

- remove dead code,
- consolidate duplicate helpers,
- remove obsolete CSS overrides,
- remove duplicate API validation,
- remove dead feature flags,
- remove unreachable branches,
- update imports,
- preserve architecture unless measured evidence requires change.

Do not perform unrelated rewrites. If the feature being changed is structurally wrong, fix that source instead of layering a new implementation over it.

---

# 25. DOCUMENTATION

After every meaningful phase:
- update PROJECT_PLAN.md,
- append detailed HISTORY.md,
- update README.md for architecture changes,
- update docs/FILEMAP.md for important paths,
- update docs/DEPLOY.md for deployment changes,
- update environment documentation,
- record exact verification,
- record missing/deferred work,
- record gotchas.

Documentation must allow a new engineer to reconstruct intent without guessing.

---

# 26. CURRENT NEXT

**NEXT: PHASE 0**

The immediate task is to reconcile the outstanding P0-T security consolidation against current main, fix its known CI failures, run the complete security and regression gates, and merge only the exact verified head.

Do not jump to marketing. Product, security, analytics, UX, accessibility, pricing, chatbot accounting, content, and QA foundations come first.

---

# 27. FINISHED PRODUCT DEFINITION

The finished product is not merely an AEO scanner. It is an agency operating system for AI search visibility:

**discover -> crawl -> measure -> compare -> explain -> prioritize -> draft -> assign -> implement -> recheck -> measure impact -> report -> repeat**

The moat is the closed loop between intelligence and execution.

The core promise should be:

**Know when AI recommends your clients, understand why it does or does not, and know exactly what to do next.**
