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

# Product Strategy V2 - AI Search Visibility Operating System

**Effective:** 2026-10-07

This is the current product direction. It supersedes older positioning that framed Threezero AEO primarily as an agency SEO/AEO dashboard.

## Product definition

**Threezero AEO is an AI Search Visibility Operating System.**

It measures, explains, and improves how a business is discovered, understood, cited, recommended, and represented across traditional search, Google Search, Google AI Overviews, Google AI Mode, Search Console generative-AI reporting where available, Googlebot crawl/render/indexability signals, relevant Google crawler/fetcher signals, local search, third-party authority/citations, ChatGPT, Perplexity, Gemini, Claude, Microsoft Copilot, and future engines through versioned adapters.

**Terminology rule:** Googlebot is a crawler/fetcher, not an AI answer engine. Googlebot crawlability, rendering, access, and indexability must be measured separately from AI Overview and AI Mode visibility. Google-Extended is a robots.txt product token for Gemini-related training/grounding controls and is not a Google Search ranking signal. Never collapse these systems into a fake single "AI ranking" metric.

## Core promise

> **Why are we not being discovered, cited, recommended, or trusted, and what should we do next?**

Canonical loop:

**Discover -> Crawl -> Measure -> Compare -> Explain -> Diagnose -> Prioritize -> Draft -> Assign -> Implement -> Recheck -> Verify -> Measure Impact -> Report -> Repeat**

Core moat:

**Visibility -> Evidence -> Diagnosis -> Action -> Verification**

We are not building a cheaper Surfer. We are building a broader operational system that connects visibility data to evidence, decisions, execution, and verification while maintaining healthy gross margins.

## Product principles

1. Value before volume. Give decisions and actions, not a wall of metrics.
2. AI is an interface and execution layer, not a decorative chat box.
3. Customer-data answers must use real platform tools and cite underlying observations.
4. Brand knowledge is persistent, permissioned, source-aware, editable, and auditable.
5. Every expensive operation has server-enforced admission control and cost accounting.
6. Caching, deterministic analysis, batching, model routing, quotas, concurrency, and provider budgets are first-class architecture.
7. Single-business owners and agencies are first-class customers.
8. Dashboard, Chrome extension, API, MCP, coding agents, and AI assistant are access surfaces over the same canonical services.
9. Never create duplicate crawler, analytics, report, action, provider, chat, or billing systems.
10. Never claim ranking/citation guarantees. Every observation carries provenance, timestamp, methodology, confidence, and state.
11. A non-SEO expert must be able to ask a plain-language question and receive an actionable answer.
12. Profitability is a release requirement, not a later finance exercise.

## Product pillars

### 1. Visibility Data Engine

Unify technical SEO, crawlability, indexability, Googlebot behavior, Google Search performance, AI Overviews, AI Mode, AI answer visibility, citations, local visibility, content, competitors, entities, authority, and business attribution where integrations permit.

### 2. Brand Intelligence Vault

Every business/client gets a canonical editable vault containing company identity, legal/company names, products, services, locations, service areas, people/authors, categories, industry, pricing/offers, hours, guarantees, policies, certifications, awards, positioning, USPs, audiences, brand voice, terminology, forbidden claims/words, competitors, facts, evidence sources, citations, reviews, social profiles, business profiles, source freshness, confidence, and claim-to-evidence relationships.

Classify facts as verified, customer-provided, observed, inferred, disputed/contradictory, or stale. Important facts must be traceable to source and collection time.

For agencies:

**Agency -> Client -> Brand Vault**

For direct customers:

**Business Workspace -> Brand Vault**

### 3. AI Evidence Engine

For each AI result or claim, determine what was said, whether the business was mentioned/recommended, citations and cited pages/domains, competitor evidence, authority gaps, missing/contradictory/stale facts, likely win/loss causes, confidence, and sample size.

The system should answer:

> "Why did the AI recommend them instead of us?"

### 4. Action Engine

Turn findings into prioritized actions, exact implementation steps, suggested copy/schema where appropriate, content briefs, citation opportunities, local tasks, assignments, deadlines, rechecks, expected impact, and verified outcomes. Every action remains linked to its finding and verification history.

### 5. AI Operating Assistant

This is a platform agent with controlled tools, not a generic chatbot.

It must support requests such as:

- "Why aren't we appearing for emergency plumber searches?"
- "Audit our homepage for AI search."
- "Show our biggest citation gaps."
- "Compare us with our top competitors."
- "What changed in our AI visibility?"
- "Check whether Google can crawl our service pages."
- "Find the five highest-impact fixes."
- "Explain this metric."
- "Create an implementation plan."
- "Re-run the audit after changes."
- "What did the last crawl discover?"

Canonical assistant tools include crawl page/site, retrieve crawl findings, AI visibility, citations, competitors, brand facts, Search Console data, local/business data, historical comparisons, recommendations, action creation/update, rechecks, methodology explanations, and report generation.

The assistant must enforce the same tenant permissions, quotas, budgets, audit logging, provenance, and rate limits as the normal UI.

### 6. Chrome Extension and Live Research

Build a Threezero AEO Chrome extension over the same backend services.

Core workflows:

- analyze current page
- live page crawl
- technical SEO
- AI readiness
- entities/schema
- citations
- competitor pages
- Google Search result pages
- AI Overview/AI Mode observations where technically observable
- compare observed results against the workspace
- send page/query for deeper analysis
- open the matching dashboard finding

The extension must never implement a second crawler or analytics engine. Live results must be labeled as live/observed and not presented as universal personalized search truth.

### 7. Open Platform and Agent Connectivity

Build toward:

- REST API
- scoped API keys/service accounts
- webhooks
- MCP
- CLI where useful
- coding-agent integrations
- GitHub
- WordPress
- Shopify
- Webflow
- Google Search Console
- Google Analytics
- Google Business Profile where API permissions allow
- automation platforms
- future adapters

MCP/API responses must be machine-readable and suitable for coding agents. A coding agent can audit a site, inspect findings, implement approved changes, request a re-audit, compare before/after, and report verified improvement.

Threezero must never silently modify production code or external systems. Writes require explicit authorization and appropriate scopes.

## Customer segments

### Single-business owners and internal teams

They should not need an SEO expert or agency.

Workflow:

**Connect business -> tell Threezero what you want -> automatic discovery -> explain -> prioritized fixes -> monitor -> verify**

Plans should emphasize guided onboarding, one/small number of businesses, Brand Intelligence, website crawl, Google/Search visibility, AI visibility, citations, local visibility, competitor tracking, AI assistant, extension, recommendations, monitoring, and simple reporting.

### Agencies and consultants

Agency plans must be genuinely multi-client and operational, with:

- multiple client workspaces
- strict client isolation
- client brand vaults
- agency templates/playbooks
- bulk scans/actions
- scheduled monitoring
- team roles and permissions
- assignments
- client portal
- branded/white-label reporting where licensed
- agency health dashboard
- client health overview
- profitability/cost view
- API
- MCP
- webhooks
- automation
- audit history
- client quotas
- agency-wide budgets
- reusable prompts/playbooks
- consolidated reporting

Agency pricing must not simply multiply a business plan by client count. It prices operational value, automation, collaboration, and scale.

## Packaging and profitability

Pricing is not final until actual provider and infrastructure economics are measured.

The packaging architecture must support:

- single-business entry plan
- advanced single-business/pro plan
- agency plan
- agency scale plan
- enterprise/custom

Every paid plan has explicit included usage and server-enforced fair-use limits. No accidental unlimited expensive AI operations.

All pricing is dollar-denominated. No Pakistan-specific pricing.

Earlier working figures of $49 / $129 / $299 remain historical hypotheses only. They are not final pricing.

For every plan/feature calculate:

**Revenue - payment cost - provider cost - crawl cost - compute - storage - email - queue/cache - support allocation = contribution margin**

Super Admin must eventually expose revenue, provider/infrastructure spend, cost per workspace/client/crawl/AI action/prompt/report/extension action, gross margin, contribution margin, worst-case usage, forecast spend, and margin by plan, agency, feature, and provider.

Before final pricing, run normal, high-usage, and adversarial usage simulations.

## Controlled AI economics

Canonical flow:

**User/Agent -> authorization -> quota admission -> cache/deterministic check -> job admission -> provider/model routing -> provider call -> normalized result -> usage ledger -> cost reconciliation -> cache -> response**

Track workspace, agency, client, user, feature, action/tool, provider, model, request type, prompt class, input/output tokens, provider latency, estimated/reconciled cost, quota/budget consumed, cache hit/miss, retries, and failure reason.

Controls must include:

- per-user/client/agency/plan quotas
- provider and feature budgets
- atomic pre-dispatch budget reservation
- concurrency and request rate limits
- token/output limits
- crawl/page/response limits
- timeouts
- retry budgets
- circuit breakers
- cache TTL
- duplicate request coalescing
- deterministic analysis before LLM calls
- model routing by task complexity
- graceful fallback
- abuse detection

No front-end-only quota is acceptable.

## AI assistant quotas

Each paid plan receives an AI assistant allowance appropriate to its economics. Dimensions can include conversations, tool calls, deep research, page audits, crawl-triggered actions, competitor analyses, and report generation.

Exact numbers must come from cost modeling, not copied from competitors.

When exhausted, explain the limit, use cached/deterministic information where possible, and never silently exceed budget.

## Canonical analytics

Support 50+ analytics through one metric registry, not 50 separate systems.

### Search and technical

Crawlability, Googlebot accessibility, indexability, indexed-page coverage, canonical health, robots health, sitemap health, crawl errors, response performance, Core Web Vitals, internal linking, structured data health, entity clarity.

### Google Search

Impressions, clicks, CTR, average position, query visibility, page visibility, Search Console generative-AI performance where available, AI Overview visibility, AI Mode visibility, branded/non-branded segmentation, query intent segmentation.

### AI visibility

AI Visibility Score, Mention Rate, Recommendation Rate, Citation Rate, Share of Voice, Competitor Win Rate, Answer Position, Prompt Coverage, Prompt Volatility, Engine Visibility, country/language visibility, product/service visibility, Brand Accuracy, Sentiment, Source Authority.

### Citation intelligence

Total Citations, Unique Cited Domains, Citation Frequency, Citation Freshness, Citation Authority, Cited Page Distribution, Competitor Citation Overlap, Citation Gap, Missing Authority Sources, Influential Sources, Source Concentration, Source Diversity.

### Content/entity

Topical Coverage, Entity Coverage, Content Completeness, Question Coverage, Content Freshness, Citation Readiness, Factual Support, Contradiction Count, Unsupported Claim Count, Entity Relationship Strength.

### Business impact

Organic Traffic, AI Referral Traffic, Leads, Conversions, AI-Assisted Conversions where attribution permits, Revenue, Visibility-to-Traffic Relationship, Visibility-to-Conversion Relationship.

Every metric defines source, formula, freshness, confidence, methodology version, and observed/calculated/cached/estimated/heuristic state.

## Engine and crawler coverage contract

Versioned adapters are mandatory.

### Google/Search

- Google Search
- Googlebot crawl/render/indexability signals
- Google AI Overviews
- Google AI Mode
- Search Console generative-AI reporting where available
- Google Search result features
- Google-Extended policy/control signals where observable
- relevant Google crawlers/fetchers where documented and measurable

### AI/search engines

- ChatGPT
- Perplexity
- Gemini
- Claude
- Microsoft Copilot
- future engines/providers

Do not claim direct access to a private ranking/citation system when unavailable.

Each adapter declares what is directly observed, API-sourced, browser-observed, inferred, unavailable, sampling method, refresh cadence, confidence, and limitations.

## Cross-surface parity

Dashboard, AI assistant, extension, API, MCP, and integrations must call the same canonical backend services. No feature may have a second implementation just because it is exposed through another surface.

## Agent security

AI and agent actions obey tenant isolation, role permissions, client/workspace scope, API/MCP scope, rate limits, quotas, budget admission, audit logging, and explicit write authorization. Read operations follow role permissions. Write operations support explicit approval mode.

## Competitive strategy

Compete on capability and usefulness, not price.

Benchmark Surfer, Semrush, Ahrefs, Profound, Otterly, Peec, SearchAtlas, and material emerging platforms across traditional SEO depth, technical crawl depth, AI visibility, citations, entities, local SEO, brand knowledge, agentic workflows, extension, API, MCP, integrations, action/verification, agency operations, business-owner usability, accessibility, mobile UX, provenance, pricing, and unit economics.

For every competitive feature record the user problem, competitive baseline, Threezero advantage, cost to serve, verification method, and plan/tier placement.

## Launch philosophy

Do not launch a thin dashboard and promise the rest later. The public minimum must support:

**Connect -> Understand -> Measure -> Explain -> Act -> Verify**

Marketing describes only functionality that actually works. No fabricated benchmarks, customers, testimonials, citations, or unsupported "better than X" claims.

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

**Status: COMPLETE and merged into main**

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

- MERGED into main as 152908bc6ca3a368733fc80538e5e5a095e3e8dc
- merged result verified before Phase 2 branch creation

---

# 3. Phase 2 - Provider, Email, Secrets, Cost, and Operational Control Plane

**Status: COMPLETE and merged to main.**

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
8. Prove atomic pre-dispatch budget reservation/enforcement under concurrent requests. A stored monthly budget without atomic admission is not complete.

---

# 4. Phase 3 - Canonical Analytics, Brand Intelligence, and Data Foundation

Status: IN IMPLEMENTATION on `phase3-canonical-analytics-data-foundation`.

Goal: support 50+ analytics from one metric architecture instead of unrelated dashboard calculations, while establishing the canonical Brand Intelligence Vault and evidence graph used by the dashboard, assistant, extension, API, and agents.

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

# 5. Phase 4 - AI Visibility, Google AI Experiences, Prompts, Citations, Engines, and Competitors

Goal: make AI visibility the product intelligence core across Google AI Overviews, Google AI Mode, ChatGPT, Perplexity, Gemini, Claude, Copilot, and future engines, while separately measuring Googlebot/crawl/indexability signals.

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

# 6. Phase 5 - Deep Crawler, Googlebot Intelligence, and Technical SEO/AEO/GEO

Goal: make the audit deep enough to identify why a site is weak in search and AI systems, including live crawl/render behavior and Google crawler/fetcher access signals where measurable.

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

# 7. Phase 6 - Execution Loop, AI Assistant, and Action Center

Goal: turn findings into measurable work for both single-business owners and agencies, with the AI assistant able to query canonical platform tools and create permitted actions.

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

# 8. Phase 7 - Notifications, Preferences, AI Quotas, and Product Communication

Goal: make the product proactively useful without making accessibility or notification behavior dependent on sound, while exposing controlled assistant quota state and usage events.

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

# 9. Phase 8 - Client Portal, Business Mode, Agency Operations, Reporting, and Canonical Report Architecture

Goal: make reporting and operations reliable for both direct business customers and multi-client agencies while separating report data from final visual PDF design.

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

# 10. Phase 9 - API, MCP, Chrome Extension, Integrations, QA, and Release Engineering

Goal: expose the same canonical services through API, MCP, Chrome extension, and integrations without duplicate business logic, while stopping regressions from accumulating.

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

# 11. Phase 10 - Scalability, Performance, Unit Economics, and 100K-User Architecture

Goal: prove the architecture under controlled load and prove that growth does not destroy gross margin.

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

# 12. Phase 11 - Pricing, Packaging, Billing, Quotas, and Profitability

Goal: create commercially sustainable pricing without exposing the business to uncontrolled provider costs.

Working pricing direction for analysis only:

- Single Business: entry plan
- Business Pro: advanced visibility/assistant/competitor capabilities
- Agency: multi-client operations, automation, client reporting
- Agency Scale: larger usage, API/MCP, advanced automation
- Enterprise: custom

Earlier working $49 / $129 / $299 figures remain historical hypotheses only. They are not final pricing.

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

Goal: create a useful marketing chatbot with a server-enforced budget target of **$0.05 API usage per unique visitor**, while keeping the in-product customer AI assistant on plan-specific quotas and the same centralized cost-control architecture.

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

# 14. Phase 13 - Knowledge, Content Intelligence, and Marketing Content System

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

# 15. Phase 14 - Final Marketing Website, SEO/AEO/GEO, Conversion, Competitive Positioning, and Legal

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

Before public launch, establish and verify the relevant official webmaster properties and search/AI visibility data sources:

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
- Phase 1: COMPLETE, merged into main as 152908bc6ca3a368733fc80538e5e5a095e3e8dc.
- Phase 2: security boundary and provider operational control implementation merged into main. Final CI certification remains dependent on GitHub Actions runner availability.
- Phases 3-16: planned, with Product Strategy V2 governing their implementation.
- Product direction: AI Search Visibility Operating System, not a low-cost Surfer clone.
- Primary customer motions: single-business owner/internal team and agency/multi-client.
- Required access surfaces: dashboard, AI assistant, Chrome extension, API, MCP, coding-agent integrations, and integrations over canonical backend services.
- Required search/AI coverage: Google Search/Googlebot signals, Google AI Overviews, Google AI Mode, Search Console generative-AI reporting where available, ChatGPT, Perplexity, Gemini, Claude, Copilot, and future engines through adapters.
- Profitability: provider and infrastructure economics must be measured and controlled before final pricing is approved.
- Hosted owner testing: scheduled after Phase 15.
- Public production launch: after Phase 16.
- Final UI rebuild: intentionally Phase 16, last.
- Dashboard reference: owner-supplied reference from 2026-10-05, to be used as the final visual source of truth.
- PDF visual template: intentionally deferred until the owner supplies it.

## Documentation rule

If this plan conflicts with an older section of README, HISTORY, FILEMAP, DEPLOY, or another project document, the older document must be corrected. Do not preserve contradictory old roadmap claims merely because they exist in history. Historical entries should remain historical, while current status and current workflow must point to this plan.


---

## Phase 3 certification record


## Phase 3 certification

Phase 3 (canonical analytics and brand intelligence data foundation) is certified on the pre-launch branch after clean PostgreSQL migration deployment, TypeScript validation, the full test suite, and production build all passed.

- 50 canonical analytics metrics with methodology contracts
- Deterministic calculation and historical pagination contracts
- Tenant-scoped Brand Profile and Brand Evidence foundation
- Immutable metric observations
- Canonical Prisma baseline for fresh environments
- Clean-database `prisma migrate deploy` verification
- CI explicitly gates Prisma generate/validate, clean migration deployment, TypeScript, tests, and production build

Certification status: **PASS**. The application remains pre-launch; this certification means the Phase 3 code and database foundation are production-readiness gates, not that the product is already live.


## Phase 4 implementation checkpoint

Phase 4 implementation is complete on branch `phase4-ai-visibility-intelligence` and PR verification passed on clean PostgreSQL.

Implemented:

- normalized AI response records by engine and model
- structured citation evidence with URL/domain history
- immutable prompt-engine observations
- explicit LIVE, CACHED, and ESTIMATED state
- confidence and methodology metadata
- deterministic prompt intent classification
- recommendation and answer-position signals
- share-of-voice and volatility calculation contracts
- tenant-scoped cursor-paginated evidence API
- database update guards for Phase 4 evidence
- deterministic Phase 4 normalization tests

Verification run `37689877250` passed every gate: dependency installation, Prisma generate, Prisma validate, clean migration deployment, TypeScript, full test suite, and production build.

**Phase 4 status: PR VERIFIED, awaiting explicit merge approval.** Do not mark Phase 4 certified or begin Phase 5 from this branch until the PR is approved, merged, and the merged main branch is re-verified.

## Phase 5 certification checkpoint

Phase 5 - Deep Crawler, Googlebot Intelligence, and Technical SEO/AEO/GEO is implemented on `phase5-deep-crawler-technical-intelligence`.

Certified implementation includes bounded crawling, SSRF-safe fetch behavior, robots/sitemap/llms.txt signals, HTTP/redirect/error evidence, technical metadata, structured data, entity and local signals, content-depth/question/freshness/citation-worthiness signals, duplicate patterns, broken internal links, page classification, persisted crawl evidence, and tenant-safe crawl retrieval.

Controlled fixture tests cover blocked robots, broken pages, malformed JSON-LD, thin content, missing entity signals, and external-link containment. CI run `37751297315` passed every gate: Prisma generate, Prisma validate, clean PostgreSQL migration deployment, TypeScript, 93 tests, and production build.

**Phase 5 status: VERIFIED. PR #33 is ready for merge. Do not mark the phase merged/certified on main until PR #33 is explicitly merged and the merged main branch is re-verified.**