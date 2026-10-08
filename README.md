# Threezero AEO

**Threezero AEO** is an agency-focused **AI Search Visibility Platform** for measuring how brands appear in AI answers, understanding citations and competitors, finding technical and content gaps, turning findings into assigned work, rechecking the result, and proving impact.

Parent brand: **threezero.agency**  
Required product attribution: **Backed by threezero.agency**

## Product loop

**Discover -> Crawl -> Measure -> Compare -> Explain -> Prioritize -> Draft -> Assign -> Implement -> Recheck -> Measure Impact -> Report -> Repeat**

The product is being built as one connected operating system, not as a collection of disconnected SEO/AEO dashboards.

## Current execution status

The repository follows the 16-phase master plan in [PROJECT_PLAN.md](./PROJECT_PLAN.md).

- Phase 0: security and production hardening, complete and merged
- Phase 1: identity, sessions, authorization, and Super Admin control plane, complete and merged to `main` as `152908bc6ca3a368733fc80538e5e5a095e3e8dc`
- Phase 2: security boundary hardening is complete and merged to `main` as `2727736114e5be331b53321ccd7de8459b1252c5`
- Phases 3-16: planned
- Hosted owner testing: after Phase 15
- Public production launch: after Phase 16
- Final UI/UX rebuild: intentionally last, Phase 16

Do not use older roadmap text in this README or other docs as the current phase status. [PROJECT_PLAN.md](./PROJECT_PLAN.md) is the ordered source of truth.

## Development and merge workflow

Every phase is implemented on a new branch from the latest verified `main`.

**Implement -> verify -> open PR -> report exact changes and verification -> wait for explicit owner approval -> merge -> verify main -> next branch**

No phase work is performed directly on `main`.

A phase is not complete merely because code compiles. The phase acceptance criteria must prove the real workflow, including security, authorization, data integrity, UI states, failure behavior, tests, and documentation.

## Live testing strategy

The owner does not want to wait until the entire roadmap is finished to discover product problems.

After **Phase 15**, the product will be deployed to a private production-like staging environment for real owner testing. This is the first "live enough to use" checkpoint.

After the owner testing cycle, Phase 16 performs the final UI/UX rebuild, accessibility work, PDF template integration, and launch certification. **Public production launch happens only after Phase 16.**

## Architecture

```
Browser
  |
  v
CDN / WAF / Edge protection
  |
  v
Next.js application and API
  |
  +--> PostgreSQL / Prisma
  +--> Redis
  +--> durable job / worker system
  +--> crawl workers
  +--> AI provider adapters
  +--> report generation
  +--> email
  +--> billing
  +--> managed media/content
```

The application remains multi-tenant. Business queries must enforce tenant isolation server-side.

### Backend

| Layer | Current direction |
|---|---|
| Runtime | Next.js App Router |
| UI | React + Tailwind |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth with persistent/revocable session records |
| Background work | Inngest/durable jobs plus controlled worker paths |
| Cache and distributed controls | Redis |
| Crawling | SSRF-safe bounded fetch plus Firecrawl where enabled |
| AI visibility | Provider adapter layer with cache, single-flight, concurrency, timeout, and cost controls |
| Billing | Stripe |
| Email | Resend or configured provider |
| Reports | Canonical report snapshot, final PDF template integrated later |

## Security and trust rules

- Never trust a client-supplied tenant identifier.
- Never expose passwords, session tokens, reset tokens, API keys, provider secrets, or MFA secrets.
- Expensive work requires authentication, authorization, quotas, rate limits, timeouts, concurrency limits, response limits, retries, and cost controls.
- Application rate limiting is not DDoS immunity.
- Preserve SSRF protections for every crawl/fetch change.
- Live, cached, estimated, and heuristic AI observations must remain distinguishable.
- Do not claim 100k-user scalability until controlled benchmarks exist.
- Pricing is dollar-based.
- Do not introduce duplicate implementations or layered CSS overrides.

## Analytics target

The analytics architecture is designed around 50+ canonical metrics across:

- AI visibility
- citations
- AI answer quality and positioning
- competitors
- crawlability
- indexability
- structured data
- entity clarity
- content completeness
- topical coverage
- internal linking
- schema
- AI readiness
- AI referral traffic
- AI leads
- AI-assisted conversions
- AI revenue
- visibility-to-business correlation

See Phase 3 and Phase 4 in [PROJECT_PLAN.md](./PROJECT_PLAN.md).

## Accessibility target

The final product targets **WCAG 2.2 AA** and must support blind, low-vision, deaf, hard-of-hearing, keyboard-only, reduced-motion, and assistive-technology users.

Important analytics cannot depend on visual charts alone. Important notifications cannot depend on sound alone.

## Final dashboard direction

The owner supplied a dashboard reference on 2026-10-05. The final dashboard must closely reproduce that reference's composition and visual language:

- dark premium SaaS shell
- sidebar
- top search and controls
- KPI cards
- large analytics visualization
- citation performance
- top cited pages
- competitor gap
- recent AI mentions
- dense but organized analytics
- rounded cards
- subtle depth
- premium data visualization

The final product also uses the owner's requested **claymorphism** direction and is **mobile-first**.

The final dashboard rebuild is deliberately Phase 16, after the product's data and workflows have been proven. See [docs/UI_REFERENCE.md](./docs/UI_REFERENCE.md).

## Admin-managed content and media

Company identity, pricing, major marketing copy, marketing headings, legal links, and product/media content must become editable through Super Admin where the architecture calls for it.

Business media must not be hardcoded into product pages when it belongs in the managed media system.

## Documentation map

| Document | Purpose |
|---|---|
| [PROJECT_PLAN.md](./PROJECT_PLAN.md) | Single ordered 16-phase execution plan and current project decisions |
| [HISTORY.md](./HISTORY.md) | Detailed historical implementation record |
| [AGENTS.md](./AGENTS.md) | Rules for every implementation agent |
| [docs/FILEMAP.md](./docs/FILEMAP.md) | Important code and route index |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Deployment, staging, and production launch gates |
| [docs/SEARCH_FOUNDATION.md](./docs/SEARCH_FOUNDATION.md) | Mandatory SEO, AEO, and GEO public-launch foundation checklist |
| [docs/UI_REFERENCE.md](./docs/UI_REFERENCE.md) | Final dashboard visual and UX requirements |
| [docs/QUEUE_AND_JOBS.md](./docs/QUEUE_AND_JOBS.md) | Queue and worker architecture |

## Local development

```bash
git clone https://github.com/zaydattique/aeo-tool.git
cd aeo-tool
cp .env.example .env.local
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Use a strong local `NEXTAUTH_SECRET`. Never commit environment files or secrets.

## Search visibility principle

The public website must launch with a complete, tested SEO/AEO/GEO foundation. This means no known preventable crawlability, indexability, canonical, structured-data, entity, content, AI-crawler, mobile, accessibility, or discoverability defects. This improves eligibility and discoverability but does not guarantee rankings or AI citations.

See [docs/SEARCH_FOUNDATION.md](./docs/SEARCH_FOUNDATION.md) and the Search Visibility Launch Standard in [PROJECT_PLAN.md](./PROJECT_PLAN.md).

## Production principle

Production is not the first place where the owner should discover whether the product works.

The first real owner testing environment is the private production-like staging deployment after Phase 15. Public production comes only after Phase 16 launch certification.

## License

UNLICENSED. Private Threezero Agency software.


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

Phase 4 AI visibility evidence is implemented on `phase4-ai-visibility-intelligence` and its PR verification is green.

- Normalized engine answers are stored separately from aggregate visibility snapshots.
- Citation URLs and domains have structured historical records.
- Engine observations preserve live, cached, and estimated state plus confidence and methodology version.
- Prompt intent, recommendation detection, answer position, competitor inclusion, share of voice, and volatility have deterministic contracts.
- Visibility evidence is exposed through a tenant-scoped paginated API.
- Phase 4 evidence tables block in-place updates at the database level.
- PR CI passed Prisma generate, Prisma validate, clean PostgreSQL migration deployment, TypeScript, all tests, and production build.

**Status: PR VERIFIED, awaiting explicit merge approval.** The product remains pre-launch.

## Phase 5 implementation checkpoint

Phase 5 is implemented and CI-certified on `phase5-deep-crawler-technical-intelligence`.

- bounded same-origin deep crawl with page, depth, response-size and time controls
- SSRF-safe fetch and redirect validation
- robots.txt and sitemap analysis
- llms.txt readiness signal
- status/error and broken internal-link detection
- titles, descriptions, headings, canonicals and indexability
- structured data and entity signals
- Organization, LocalBusiness, Product, author and publisher signals
- content depth, question-answer coverage, citation-worthiness and freshness signals
- duplicate-content patterns and page-type classification
- immutable-in-run crawl evidence persisted by tenant
- tenant-scoped crawl history API
- controlled fixture coverage for blocked, broken, malformed and external-link cases

Verification run `37751297315` passed Prisma generate, Prisma validate, clean PostgreSQL migration deployment, TypeScript, all 93 tests, and production build.

**Phase 5 status: VERIFIED, PR #33 ready for merge.** The application remains pre-launch; this certification means the Phase 5 implementation passed the current production-readiness gates, not that the product is live.