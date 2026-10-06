# Threezero AEO - Master Product Execution Plan

Repository: `zaydattique/aeo-tool`

Product name: **Threezero AEO**  
Descriptor: **AI Search Visibility Platform**  
Parent brand: **threezero.agency**  
Required footer attribution: **Backed by threezero.agency**

This file is the single ordered execution plan and project memory for the product. Do not rely on chat history as the source of truth. When a decision, requirement, architecture rule, workflow, verification result, or important UI decision changes, update this file in the same ship.

## 0. Non-negotiable execution contract

### 0.1 Branch and merge workflow

Every phase is implemented on a new branch created from the latest verified `main`.

Required sequence:

1. Inspect the current `main` and the current phase status.
2. Create a new phase branch from the exact current `main` commit.
3. Implement the complete cohesive workstream.
4. Run the exact phase verification gates.
5. Open a pull request.
6. Report exactly what changed, how it was implemented, what was verified, what remains, and any known risks.
7. Wait for the owner's explicit approval to merge.
8. Merge only after approval and after confirming the PR head/checks have not changed unexpectedly.
9. Verify the merged result on `main`.
10. Start the next phase from the newly verified `main`.

Never work directly on `main` for phase implementation.

A phase is not complete because code exists. It is complete only when its real workflow works end to end and the exact acceptance criteria pass.

### 0.2 Live testing strategy

The product will not be developed blindly until the end.

There are two launch milestones:

**Hosted product validation:** after **Phase 15**, deploy a private production-like staging environment and let the owner use the real application end to end. This is the first point where the product should be considered "live for owner testing".

**Public production launch:** after **Phase 16**, only after the final UI/UX rebuild, accessibility, PDF integration, release certification, backups, monitoring, and launch gates are complete.

The Phase 15 environment must be production-like, but it must not be presented to customers as the finished public product. It should use real build artifacts and realistic integrations while keeping unfinished functionality clearly out of public reach.

The goal is to discover product problems while there is still time to correct architecture and workflows, rather than discovering them after the entire roadmap is finished.

### 0.3 Engineering rules

1. Search the repository before creating a file.
2. Extend the existing owner of a concern whenever possible.
3. Never create duplicate APIs, analytics models, configuration stores, branding systems, media systems, components, or CSS systems.
4. Fix the original source of truth. Do not add a later CSS rule or duplicate implementation just to override broken code.
5. Remove obsolete code after a refactor is verified.
6. Never hardcode company identity, pricing, contact information, legal identity, major marketing copy, or business media when the relevant Super Admin configuration exists.
7. All marketing/product media that belongs in the product must be managed through the appropriate Admin/Super Admin media system.
8. Never expose passwords, session tokens, reset tokens, API keys, provider secrets, or MFA secrets.
9. Every business query must enforce tenant isolation. Never trust a client-supplied agency ID.
10. Expensive operations require appropriate authentication, authorization, quotas, rate limits, timeouts, concurrency controls, response-size limits, retries, and cost controls.
11. Application rate limiting is not DDoS protection. Real DDoS resilience requires edge/WAF/origin protection as well.
12. Never represent a heuristic visibility result as a real AI-provider statement. Live, cached, estimated, and heuristic states must be explicit.
13. Do not claim 100k-user scalability until controlled load and concurrency benchmarks exist.
14. Pricing is dollar-based. Do not add Pakistan-specific currency or product pricing logic.
15. Do not use em dash characters in project documentation or product copy.
16. Accessibility targets WCAG 2.2 AA and includes blind, low-vision, deaf, hard-of-hearing, keyboard-only, reduced-motion, and assistive-technology users.
17. Documentation is part of the implementation. Update PROJECT_PLAN.md, HISTORY.md, README.md, FILEMAP.md, deployment documentation, and any directly affected documentation in the same ship.
18. Do not claim owner-only infrastructure is complete without owner confirmation.
19. Do not mark a phase complete merely because CI passes. CI is necessary, not sufficient.

### 0.4 Standard verification baseline

Use the relevant combination of:

- Prisma generate
- Prisma validate
- TypeScript
- unit tests
- integration tests
- production build
- database migration validation
- security regression tests
- tenant isolation tests
- browser E2E
- accessibility tests
- load and concurrency tests
- provider failure tests
- queue failure tests
- cost accounting reconciliation
- mobile and responsive browser testing
- deployment smoke tests

Every phase must also check for duplicate implementations, obsolete overrides, dead code, hardcoded business values, and undocumented behavior.

---

# 1. Phase 0 - Security and Production Hardening

**Status: COMPLETE**

Goal: establish the security and reliability baseline before feature expansion.

Scope includes the verified P0 security work, tenant isolation, SSRF-safe crawling, distributed rate limits, provider concurrency, queue admission, crawl resource limits, public authentication abuse controls, provider/network cost isolation, database/query hardening, idempotency, usage settlement, and related regression tests.

Acceptance requires:

- cross-tenant IDOR matrix passes
- privileged authorization is server-side
- SSRF and redirect protections remain intact
- production rate limiting fails closed where required
- provider concurrency is bounded globally, by provider, and by agency
- active scan admission is race-safe
- crawl and provider resources are bounded
- usage settlement is retry-safe
- secrets are not returned
- TypeScript, tests, build, and security workflows pass

---

# 2. Phase 1 - Identity, Sessions, Authorization, and Super Admin Control Plane

**Status: IN PROGRESS**

Goal: make identity, sessions, security events, and privileged administration observable and controllable.

Implemented on branch `phase1-identity-sessions-super-admin` and currently awaiting explicit merge approval.

Scope:

- persistent and revocable user sessions
- user session inspection and revocation
- Super Admin session inspection
- security event recording
- Super Admin user directory
- MFA setup and confirmation
- encrypted TOTP secrets
- hashed one-time recovery codes
- privileged-role MFA enforcement
- authentication event logging
- session revocation on signout and password reset
- secure impersonation banner and expiry
- password baseline of at least 12 characters
- removal of passwordHash/session token leakage from responses
- Super Admin security/user/session UI
- CI and regression tests

Phase 1 verification already achieved on the branch:

- Prisma generate passed
- Prisma validate passed
- TypeScript passed
- full test suite passed
- production build passed
- 16/16 P0 regression workflows passed
- Phase 1 security contract tests passed
- known CI issues were fixed instead of bypassed

Known non-blocking finding:

- dependency installation currently reports existing dependency-tree vulnerabilities. These require a dedicated dependency/security review and must not be "fixed" blindly with force upgrades.

Merge gate:

- owner must explicitly approve merge
- after merge, verify the merged commit on main
- only then begin Phase 2

---

# 3. Phase 2 - Provider, Email, Secrets, Cost, and Operational Control Plane

Goal: eliminate scattered provider configuration and make external-service behavior visible and controllable.

Providers:

- OpenAI
- Anthropic
- Perplexity
- Gemini
- Firecrawl
- Resend
- Stripe
- Redis
- Inngest
- future providers through the same adapter contract

Each provider needs:

- enabled/disabled state
- connection test
- active model
- timeout
- concurrency
- rate limits
- budget
- last successful test
- last error
- usage
- estimated cost
- masked credential metadata
- rotation/audit history

Secrets must never be returned to the browser. Prefer infrastructure secret management for global credentials. Encrypted database storage may support future BYOK without exposing ciphertext or plaintext through normal APIs.

Email control plane:

- provider
- verified sending domain
- from name/address
- reply-to
- test send
- templates
- preview
- delivery state
- bounce/suppression state
- usage and cost

Operational observability:

- provider calls today/month
- provider failures
- 429s
- timeouts
- Redis failures
- queue backlog
- scan duration
- provider latency
- AI spend
- cost by agency/client/feature

Exact verification:

1. Configure, test, disable, and rotate a test provider.
2. Prove disabled credentials are not used.
3. Prove secrets never appear in API or UI responses.
4. Send a test email and verify the delivery lifecycle.
5. Reconcile raw provider usage with Super Admin totals.
6. Trigger a budget and prove paid calls are rejected before dispatch.
7. Verify provider outage and timeout behavior.

---

# 4. Phase 3 - Canonical Analytics and Data Foundation

Goal: support 50+ analytics from one metric architecture instead of unrelated dashboard calculations.

Canonical metric registry must contain:

- metric slug
- category
- formula
- source
- aggregation
- time window
- confidence
- live/cached/estimated state
- engine applicability
- required inputs
- display format
- methodology version

Analytics categories:

### AI visibility
AI Visibility Score, Mention Rate, Citation Rate, Recommendation Rate, Brand Inclusion Rate, Competitor Inclusion Rate, Share of Voice, Average AI Position, Winning Prompt Rate, Losing Prompt Rate, Prompt Volatility, Engine Visibility, Country Visibility, Language Visibility, Product Visibility.

### Citation intelligence
Total Citations, Unique Cited Domains, Citation Frequency, Citation Authority, Citation Freshness, Citation Page Distribution, Competitor Citation Overlap, Citation Gap, Influential Sources, Missing Authority Sources.

### AI answer intelligence
Sentiment, Recommendation Sentiment, Accuracy, Brand Positioning, Product Positioning, Competitor Positioning, Mention Context, Hallucination Risk, Missing Facts, Wrong Facts.

### Technical intelligence
Crawlability, AI Crawlability, Indexability, Structured Data Health, Entity Clarity, Content Completeness, Topical Coverage, Internal Linking, Schema Coverage, llms.txt Readiness.

### Business attribution
AI Referral Traffic, AI Leads, AI-Assisted Conversions, AI Revenue, Visibility-to-Traffic Correlation.

Historical observations must be immutable snapshots.

Exact verification:

- deterministic fixtures
- independent metric calculations
- at least 20 metric reconciliation tests
- historical query tests
- index and pagination tests
- migration tests on clean and representative databases
- no duplicate metric formulas

---

# 5. Phase 4 - AI Visibility, Prompts, Citations, Engines, and Competitors

Goal: make AI visibility the product intelligence core.

Scope:

- prompt discovery and clustering
- brand/category/transactional/local/comparison/problem/product/competitor/buyer-intent prompts
- multi-engine tracking
- live response storage
- normalized answer representation
- citation extraction
- cited page/domain history
- competitor inclusion
- competitor citation overlap
- share of voice
- prompt winners/losers
- answer positioning
- volatility
- engine/country/language segmentation
- confidence and sample size
- live versus cached versus estimated state
- transparent scoring methodology

Exact verification:

- deterministic provider fixtures
- separate live-provider tests
- cache hit proves no provider call
- timeout proves bounded request lifetime
- fallback proves estimated labeling
- historical snapshots cannot be rewritten
- tenant isolation across prompt/citation history
- provider failures do not corrupt unrelated prompt results

---

# 6. Phase 5 - Deep Crawler and Technical SEO/AEO/GEO Intelligence

Goal: make the audit deep enough to identify why a site is weak in search and AI systems.

Scope:

- bounded crawl depth/page count/time
- response-byte limits
- redirect validation
- status codes
- titles
- meta descriptions
- headings
- canonicals
- robots
- indexability
- structured data
- internal/external links
- broken links
- sitemap analysis
- page type classification
- duplicate patterns
- content depth
- entity consistency
- Organization/LocalBusiness/Product signals
- author/publisher signals
- factual completeness
- topical coverage
- question-answer coverage
- citation-worthiness
- freshness
- AI crawler access
- llms.txt readiness where relevant
- local/GEO signals

Exact verification uses controlled fixture sites covering broken, slow, oversized, redirected, blocked, malformed, private-IP, duplicate, and schema-deficient cases.

---

# 7. Phase 6 - Execution Loop and Action Center

Goal: turn findings into measurable agency work.

Canonical lifecycle:

**finding -> impact -> recommendation -> draft -> assign -> implement -> recheck -> result -> historical impact**

Actions include:

- severity
- category
- affected URL
- evidence
- explanation
- exact implementation steps
- suggested copy/code where appropriate
- expected impact
- effort
- owner
- status
- verification method
- latest result

Support filtering, sorting, client filters, priority, bulk assignment, bulk status, exports, rechecks, history, and audit events without creating parallel action systems.

Exact verification runs one finding through the complete lifecycle and proves permissions, state transitions, audit records, recheck behavior, historical impact, and client visibility.

---

# 8. Phase 7 - Notifications, Preferences, and Product Communication

Goal: make the product proactively useful without making accessibility or notification behavior dependent on sound.

Notification categories:

- AI visibility
- technical
- actions
- security
- billing
- system

User controls:

- in-app
- email
- optional browser notifications
- optional sound
- frequency
- category
- severity

Notifications require:

- unread state
- history
- deep link
- accessible announcement where appropriate
- visible status
- deduplication
- retry behavior
- auditability

Super Admin controls platform-wide notification defaults and operational notification policy.

Exact verification:

- notification creation
- unread/read transitions
- preference enforcement
- deduplication
- email delivery state
- accessible live-region behavior
- no critical information conveyed only by sound
- notification history remains tenant-safe

---

# 9. Phase 8 - Client Portal, Reporting, and Canonical Report Architecture

Goal: make client-facing reporting reliable while separating report data from final visual PDF design.

Build one canonical report snapshot containing:

- reporting period
- visibility metrics
- citation metrics
- engine breakdown
- competitor comparison
- technical findings
- actions
- completed work
- historical movement
- evidence
- methodology
- confidence
- generated timestamp

Client portal must expose only the client's permitted data.

Build the report data architecture now. Do not create a second PDF system later.

Exact verification:

- snapshot immutability
- tenant isolation
- portal token authorization
- report consistency
- historical period comparison
- revoked access behavior
- export data matches canonical snapshot

---

# 10. Phase 9 - QA, Regression, Reliability, and Release Engineering

Goal: stop regressions from accumulating while the product becomes larger.

CI gate:

1. install
2. Prisma generate
3. Prisma validate
4. TypeScript
5. lint where configured
6. unit tests
7. integration tests
8. security tests
9. production build
10. migration validation
11. E2E critical flows
12. accessibility checks
13. dependency/security checks
14. artifact and release checks

Critical E2E:

signup -> onboarding -> client -> scan -> visibility -> action -> assignment -> recheck -> report -> portal

Security E2E:

IDOR, privilege escalation, session manipulation, CSRF where applicable, SSRF, reset-token abuse, invite replay, rate-limit bypass, oversized requests/responses, malicious redirects, provider abuse.

Exact verification requires a green production build and reproducible CI artifact, not just local success.

---

# 11. Phase 10 - Scalability, Performance, and 100K-User Architecture

Goal: prove the architecture under controlled load.

Target architecture:

**CDN/WAF -> load balancer -> web/API -> Redis -> queues/workers -> crawl/AI/report workers -> PostgreSQL + object storage**

Measure:

- p50
- p95
- p99
- request concurrency
- queue depth
- provider concurrency
- database saturation
- Redis saturation
- worker saturation
- crawl duration
- AI latency
- error rates
- cost per workload

Run controlled stages at 100, 1,000, 10,000, and 100,000-user-equivalent workloads as appropriate.

Do not call the product "100k-user scalable" until the evidence exists.

Also document backups, restore tests, database recovery, queue recovery, Redis failure behavior, provider failure behavior, and origin protection.

---

# 12. Phase 11 - Pricing, Packaging, Billing, and Profitability

Goal: create commercially sustainable pricing without exposing the business to uncontrolled provider costs.

Working pricing direction for analysis only:

- Starter: $49
- Growth: $129
- Agency: $299
- Enterprise: custom

These are not final until cost simulation and competitive validation are complete.

Model:

- provider cost
- crawl cost
- AI tokens
- citations/visibility checks
- report generation
- storage
- email
- Redis
- queue infrastructure
- support overhead
- expected gross margin
- worst-case usage
- fair-use limits
- overage behavior

Super Admin must see cost and margin by plan, agency, client, feature, provider, and period.

No Pakistan-specific pricing logic.

---

# 13. Phase 12 - Marketing-Site AI Chatbot and Exact Spend Control

Goal: create a useful marketing chatbot with a server-enforced budget target of **$0.05 API usage per unique visitor**.

This is an actual server-side spend control, not a front-end display.

Track:

- unique visitor identity
- first seen
- last seen
- daily usage
- monthly usage
- total usage
- provider
- model
- input tokens
- output tokens
- estimated cost
- actual reconciled cost where available
- page/source
- conversation count
- errors
- budget rejection
- fallback behavior

Before an expensive provider call, atomically check budget admission. Reconcile actual usage after the call. Protect the endpoint against scripted abuse.

When the budget is exhausted, use a controlled fallback rather than silently exceeding the limit.

Super Admin sees chatbot spend, unique users, cost per visitor, total cost, provider/model breakdown, rejected requests, and projected spend.

Exact verification includes concurrent budget tests proving two requests cannot bypass the per-user limit.

---

# 14. Phase 13 - Blog, Knowledge, and Marketing Content System

Goal: build substantive content that supports search visibility without thin or repetitive AI content.

Build:

- blog/editorial system
- author profiles
- source references
- publication and updated dates
- topical clusters
- internal linking
- related content
- FAQ sections where useful
- structured data
- canonical URLs
- metadata
- Open Graph
- sitemap inclusion
- editorial status
- draft/review/publish workflow
- Super Admin editing
- admin-managed media

Content must provide real information and avoid mass-produced thin pages.

Legal content must include the appropriate:

- privacy policy
- terms
- cookie policy
- acceptable use
- refund/cancellation policy where applicable
- accessibility statement
- security information
- DPA/subprocessor information where required for enterprise

---

# 15. Phase 14 - Final Marketing Website, SEO/AEO/GEO, Conversion, and Legal

Goal: build the strongest public-facing website only after the product is mature enough that marketing accurately describes it.

Marketing must include:

- product explanation
- workflow
- AI visibility
- citations
- competitors
- agency workflow
- technical intelligence
- Action Center
- reporting
- trust/security
- pricing
- comparison
- methodology
- FAQ
- blog/content discovery
- conversion paths
- legal pages
- accessibility

SEO/AEO/GEO requirements:

- clean canonical URLs
- metadata
- structured data
- entity signals
- Organization and product information
- internal links
- answer-first sections
- crawlable HTML
- robots
- sitemap
- llms.txt where useful
- AI crawler access
- Core Web Vitals
- no misleading claims
- no hidden content tricks
- no thin doorway pages

Major headings, company information, pricing, CTAs, media, legal links, and marketing content must be Super Admin editable.

Exact verification includes Google-oriented technical checks, structured-data validation, crawlability, AI-agent readability, mobile performance, accessibility, and content integrity.

---


# Search Visibility Launch Standard

The public website must not go live with a partially configured SEO, AEO, or GEO foundation.

The goal is not to promise instant rankings. No legitimate implementation can guarantee ranking "everywhere" immediately because search and AI systems decide crawling, indexing, ranking, citation, and answer inclusion independently. The product requirement is stronger and more precise: **when the site becomes public, there must be no known technical, structural, accessibility, discoverability, entity, content, or AI-crawl foundation defect that we could reasonably have prevented.**

Google's current documentation emphasizes Search Essentials, crawlability, indexability, structured data, useful content, and page experience. Google also makes clear that good technical signals do not guarantee top rankings. citeturn0search0turn0search2turn0search7

Bing's current guidance similarly connects SEO fundamentals with eligibility for traditional search, Copilot, grounding, and AI citations, and recommends crawlable internal links, accurate XML sitemaps, and IndexNow for change discovery. citeturn0search3turn0search4turn0search10

## Required pre-publication foundation

### Technical SEO

Before public launch:

- one canonical production domain
- HTTPS everywhere
- correct HTTP status codes
- no accidental staging/indexable URLs
- no duplicate host variants
- correct canonical tags
- correct redirect map
- no redirect chains or loops
- clean URL architecture
- crawlable internal links
- XML sitemap index or sitemap set as appropriate
- sitemap contains only intended canonical indexable URLs
- accurate sitemap lastmod values where applicable
- robots.txt is intentional and tested
- no accidental noindex/nofollow
- correct pagination behavior where applicable
- correct hreflang only where genuinely needed
- 404 and 410 behavior is intentional
- soft-404 risks checked
- JavaScript rendering does not hide critical content
- important content exists in crawlable HTML
- structured data is valid, relevant, and consistent with visible content
- Open Graph and social metadata are complete
- favicons and site identity are complete
- image dimensions, alt text, lazy loading, and modern formats are correct
- Core Web Vitals and mobile page experience are tested
- security headers and HTTPS are verified
- no mixed content
- no broken internal links
- no orphaned public pages that are intended to rank
- no accidental duplicate content
- no thin doorway or programmatic spam pages

Google recommends validating structured data, confirming pages are accessible to crawlers, and submitting a sitemap through Search Console. citeturn0search6

### AEO and AI-search foundation

The public website must make the company, product, capabilities, facts, and answers easy for retrieval systems to understand.

Required:

- clear entity identity for Threezero AEO
- consistent organization/company information
- consistent product identity
- explicit product category and purpose
- authoritative About page
- clear contact and company information
- clear authorship where editorial content exists
- source/evidence references where appropriate
- answer-first sections on important informational pages
- concise definitions followed by substantive detail
- question-led headings where they match genuine search intent
- tables and structured lists where they improve machine and human comprehension
- factual claims supported by evidence where appropriate
- consistent terminology across pages
- no contradictory product/pricing/company facts
- strong internal topical relationships
- meaningful FAQ content where genuinely useful
- visible methodology pages for important product claims
- transparent explanation of how visibility metrics are calculated
- crawlable public documentation where appropriate
- AI crawler access intentionally configured
- no accidental blocking of legitimate search/AI crawlers
- no misleading AI-generated claims
- no fabricated testimonials, metrics, citations, customers, or results

The site must not depend on llms.txt as a magic ranking mechanism. It can be maintained as an additional machine-readable resource where useful, but normal crawlability, indexability, content quality, internal linking, authority, and entity clarity remain foundational.

Bing's current AI Performance documentation specifically measures page citations in AI-generated answers and recommends intent alignment, depth, clarity, evidence, freshness, and consistency across formats. citeturn0search10

### GEO foundation

"GEO" here means making the public entity and content understandable and discoverable across geographic and location-sensitive search contexts, not stuffing city names into pages.

Where relevant to the actual business:

- consistent business name
- consistent legal/company identity
- consistent address and contact data
- consistent service/product descriptions
- region and market information
- organization/entity structured data
- location information where legitimate
- localized pages only where there is real unique value
- no doorway location pages
- language and locale signals are consistent
- regional content is genuinely useful
- external authority signals are pursued through legitimate relationships and mentions
- business profiles and third-party listings are kept consistent where applicable

### Content foundation

Before launch, every important public page must have:

- one clear search intent
- one clear primary topic
- unique title
- unique meta description where appropriate
- one clear primary heading
- logical heading hierarchy
- useful body content
- meaningful internal links
- relevant related pages
- appropriate structured data
- author/date/update information where applicable
- original value beyond generic AI-generated summaries
- no keyword stuffing
- no duplicate template copy
- no placeholder text
- no dead CTA
- no fake statistics
- no unsupported ranking claims

The marketing site must be built to satisfy people first. Search optimization is the technical and structural layer around useful content, not a replacement for it.

### Search-engine readiness

Before public launch, establish and verify the relevant official webmaster properties:

- Google Search Console
- Bing Webmaster Tools
- analytics and consent configuration as legally appropriate
- sitemap submission
- indexing diagnostics
- crawl diagnostics
- Core Web Vitals monitoring
- manual-action/security monitoring

Where supported and appropriate, IndexNow should be implemented for changed URLs. IndexNow accelerates notification to participating search engines, but does not guarantee crawling, indexing, or ranking. citeturn0search4turn0search8

### Search and AI launch audit

The release candidate must be tested as an external crawler would see it.

Run:

1. unauthenticated crawl of the public site
2. canonical extraction for every indexable page
3. robots.txt validation
4. sitemap validation
5. status-code validation
6. redirect-chain detection
7. duplicate-title and duplicate-description detection
8. heading and content extraction
9. structured-data extraction and validation
10. internal-link graph analysis
11. orphan-page detection
12. broken-link detection
13. image and media accessibility checks
14. mobile rendering checks
15. Core Web Vitals checks
16. JavaScript-rendered content comparison
17. AI crawler access checks
18. entity consistency checks
19. content quality and duplication review
20. Search Console URL Inspection checks on representative pages
21. Bing Webmaster indexing checks
22. IndexNow delivery verification where enabled
23. production sitemap submission
24. production robots verification
25. final noindex/staging-domain sweep

### Hard launch gate

Public production is blocked if any of these exist:

- accidental noindex on an intended ranking page
- robots blocking intended crawlers
- wrong canonical domain
- sitemap containing staging, redirect, noncanonical, or broken URLs
- inaccessible important content
- broken production redirects
- serious structured-data errors on intended rich-result pages
- duplicate or contradictory company/product identity
- missing core metadata on important pages
- major mobile usability failure
- serious Core Web Vitals regression on core pages
- accidental private/authenticated pages exposed publicly
- placeholder or unfinished public content
- legal pages missing
- AI/search crawler access unintentionally blocked
- known critical accessibility failure
- unresolved P0/P1 SEO/AEO/GEO issue

A perfect technical score is not the same thing as ranking. The launch gate proves that we have removed preventable technical and structural barriers and supplied strong discovery, entity, content, and AI-search signals. Actual rankings and AI citations are then measured continuously after launch.

# 16. Phase 15 - Hosted Product Validation, Owner Testing, and Launch Readiness

**This is the first live testing checkpoint.**

Goal: stop developing blindly and let the owner use the actual product before the final UI rebuild and public launch.

Deploy a private production-like staging environment using the real production build path.

The owner must be able to test:

- signup/login
- MFA
- sessions
- Super Admin
- agency/client creation
- scans
- AI visibility
- citations
- competitors
- technical audits
- Action Center
- assignments
- rechecks
- notifications
- reports
- client portal
- billing flows in safe/test mode
- provider configuration
- email
- chatbot
- marketing pages
- mobile behavior
- accessibility-critical workflows

Create a structured owner test log covering:

- broken workflow
- confusing workflow
- incorrect data
- incorrect permission
- visual problem
- mobile problem
- accessibility problem
- performance problem
- security concern
- missing feature
- misleading copy
- unexpected cost
- provider failure
- notification problem

Every issue must be classified and fixed at the correct source of truth, not patched with a temporary override.

Phase 15 is not a public customer launch.

Exact verification:

- staging deployment succeeds from the documented release process
- production build is reproducible
- database migrations are tested
- health checks work
- backups exist
- restore drill passes
- logs and operational alerts work
- owner can complete the critical path
- no P0/P1 defects remain
- known P2/P3 issues are documented and consciously accepted
- security, accessibility, cost, and performance gates are green

Only after this checkpoint should the owner consider the product "live enough to try".

---

# 17. Phase 16 - FINAL UI/UX REBUILD, ACCESSIBILITY, PDF TEMPLATE, AND PUBLIC LAUNCH

**This is intentionally last.**

Goal: build the final product experience around the proven product rather than designing around assumptions.

## 16.1 Dashboard visual source of truth

The owner supplied a dashboard reference image on 2026-10-05. It is the required visual direction for the final dashboard.

The target is not a loose inspiration. Reproduce the reference's overall composition and visual language as closely as practical while replacing its content with real Threezero AEO data.

Reference characteristics:

- dark premium SaaS shell
- left navigation/sidebar
- top search
- date range control
- workspace switcher
- notification area
- user/account area
- four KPI cards across the top
- large citation performance visualization
- engine legend and trend visualization
- top cited pages panel
- competitor gap visualization
- recent AI mentions table
- dense but organized analytics
- rounded cards
- subtle depth
- restrained glow and chart treatment
- clear hierarchy
- premium dark surfaces
- readable data density

The final implementation must combine this reference with the already-required **claymorphism** direction.

Do not turn every element into a soft 3D blob. Data tables and dense analytics must remain high contrast, readable, and operational.

## 16.2 Mobile-first requirement

Design from the smallest supported viewport upward.

Do not build desktop first and shrink it.

Use the same canonical components across mobile, tablet, and desktop. Do not maintain separate duplicate dashboard implementations.

Mobile must have deliberate information hierarchy, navigation, tables, filters, charts, notifications, forms, and action controls.

## 16.3 Accessibility

Target WCAG 2.2 AA.

Test:

- keyboard navigation
- focus order
- visible focus
- semantic headings
- labels and descriptions
- form errors
- screen readers
- NVDA
- JAWS where available
- VoiceOver
- TalkBack where available
- reduced motion
- high contrast
- touch target sizing
- accessible dialogs
- accessible tabs
- accessible menus
- accessible notifications
- accessible tables
- chart summaries
- underlying data tables for important charts

Blind users must be able to understand analytics without depending on visual charts.

Deaf and hard-of-hearing users must never lose critical information because it was delivered through sound.

## 16.4 Final report PDF

Use the canonical report architecture from Phase 9.

The owner will supply the final PDF visual template. Integrate that design into the existing report generator rather than creating a competing report pipeline.

## 16.5 Final launch certification

Before public production:

- all critical E2E paths pass
- security regression suite passes
- tenant isolation passes
- accessibility passes
- mobile tests pass
- production build passes
- migrations pass
- backup/restore verification passes
- provider cost controls pass
- chatbot budget enforcement passes
- notifications pass
- report and portal pass
- marketing SEO/AEO/GEO checks pass
- legal pages are present
- Super Admin configuration is complete
- company identity and media are not improperly hardcoded
- no known P0/P1 defects remain
- launch smoke tests pass
- monitoring and rollback procedure are documented

Only then is the application approved for public production launch.

---

# Cross-phase product architecture

The product moat is the complete loop:

**Discover -> Crawl -> Measure -> Compare -> Explain -> Prioritize -> Draft -> Assign -> Implement -> Recheck -> Measure Impact -> Report -> Repeat**

The product should not become a collection of disconnected SEO and AI dashboards.

## Core Super Admin domains

Super Admin eventually controls:

- agencies
- users
- roles
- sessions
- login/security events
- MFA state
- impersonation
- plans
- billing
- providers
- provider credentials metadata
- email
- usage
- cost
- chatbot spend
- jobs
- queues
- system health
- feature flags
- notifications
- analytics methodology
- branding
- company information
- pricing
- marketing CMS
- media
- blog
- legal
- reports
- audit logs

Sensitive secrets are never shown.

## Product data trust

Every externally sourced observation should carry enough metadata to explain:

- where it came from
- when it was collected
- which engine/model was used
- whether it was live, cached, estimated, or heuristic
- confidence/sample size
- methodology version where applicable

## Product UI principle

The product should answer in order:

1. What is happening?
2. What changed?
3. What should I do?
4. Why does it matter?
5. How do I fix it?
6. Did the fix work?

---

# Release checkpoints

### Checkpoint A
Phase 0 merged and verified.

### Checkpoint B
Phase 1 verified on its own branch and explicitly approved before merge.

### Checkpoint C
Each subsequent phase is independently verified and explicitly approved before merge.

### Checkpoint D
After Phase 15, owner testing happens on the hosted production-like environment.

### Checkpoint E
Phase 16 incorporates owner findings and performs the final UI/accessibility/PDF/launch work.

### Checkpoint F
Public production launch only after Phase 16 launch certification.

---

# Current status

- Phase 0: COMPLETE and merged.
- Phase 1: IMPLEMENTED and VERIFIED on `phase1-identity-sessions-super-admin`, awaiting explicit owner merge approval.
- Phase 2: NEXT after Phase 1 merge.
- Phases 3-16: planned, not implemented.
- Hosted owner testing: scheduled after Phase 15.
- Public production launch: after Phase 16.
- Final UI rebuild: intentionally Phase 16, last.
- Dashboard reference: owner-supplied reference from 2026-10-05, to be used as the final visual source of truth.
- PDF visual template: intentionally deferred until the owner supplies it.

## Documentation rule

If this plan conflicts with an older section of README, HISTORY, FILEMAP, DEPLOY, or another project document, the older document must be corrected. Do not preserve contradictory old roadmap claims merely because they exist in history. Historical entries should remain historical, while current status and current workflow must point to this plan.
