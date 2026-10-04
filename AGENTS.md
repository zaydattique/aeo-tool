# AGENTS.md - every AI

Repo: `zaydattique/aeo-tool`
Product target identity: **Threezero AEO**
Descriptor: **AI Search Visibility and Answer Engine Optimization Platform**
Parent brand: **threezero.agency**

## Boot before any edit

1. Read [PROJECT_PLAN.md](./PROJECT_PLAN.md). It is the only ordered product execution plan.
2. Read [HISTORY.md](./HISTORY.md) to understand what already exists and why.
3. Read this file.
4. Read [docs/FILEMAP.md](./docs/FILEMAP.md) before changing major paths.
5. Read [README.md](./README.md) for architecture and deployment behavior.

Do not invent a second todo list. PROJECT_PLAN.md controls sequence.

## Execution model

The old 20-minute session model is retired.

Work is organized into coherent phases. A phase may require multiple implementation commits and multiple verification cycles. Do not split tightly related backend, frontend, data, API, UI, UX, security, QA, or documentation work into arbitrary micro-sessions.

Do not start the next phase until the current phase acceptance criteria are actually satisfied, unless the owner explicitly changes the order.

## CRITICAL FILE RULES

- Never push placeholders, stubs, TODOs, FIXME markers, truncated files, or fake implementations.
- Every pushed file must contain complete real content.
- Search before creating a file.
- Prefer editing an existing source of truth over creating a parallel file.
- Never maintain two competing implementations of the same concern.
- Fix the original source of truth instead of adding a later override.
- Do not solve a CSS problem by adding an unnecessary higher-specificity override when the original rule should be corrected.
- Do not create duplicate API routes, duplicate configuration stores, duplicate analytics definitions, duplicate branding systems, or duplicate content systems.

## SECURITY RULES

- Never skip agencyId isolation on business data.
- Never trust a client-supplied agencyId.
- Never expose passwords, session tokens, reset tokens, API keys, provider secrets, or MFA secrets.
- Expensive operations require authentication, authorization, quota, rate, timeout, concurrency, response-size, retry, and cost controls appropriate to their risk.
- Never treat application rate limiting as DDoS immunity.
- Preserve SSRF controls when changing crawl or URL-fetch behavior.
- Re-test cross-tenant access after changing any identifier-based route.
- Never present heuristic AI visibility as a real provider statement.
- Keep live, cached, and estimated observations distinguishable.

## PRODUCT AND UI RULES

- The target product name is Threezero AEO unless the owner changes it through the project plan.
- The parent brand is threezero.agency.
- The final marketing footer must contain a form of "Backed by threezero.agency".
- Product and marketing company information must become Super Admin editable rather than remaining hardcoded.
- Marketing media must become admin-managed rather than hardcoded page assets.
- Major marketing headings, navigation labels, pricing, CTAs, legal links, company information, and SEO metadata must be admin-editable.
- Do not add generic guidance paragraphs to UI. Use clear labels, meaningful actions, state information, concise explanations, and useful contextual content.
- Accessibility is mandatory, with WCAG 2.2 AA as the target.
- Important notifications must have a visible representation and must not depend on audio alone.
- Product pricing is dollar-based and must not become Pakistan-specific.

## ENGINEERING QUALITY

- No code may be overwritten by a later competing implementation merely to make the newer code win.
- Remove obsolete rules after the canonical implementation is proven.
- Do not add a new file when an existing file is the correct owner.
- Do not claim a feature is complete because a helper exists. Prove the end-to-end workflow.
- Do not claim 100k-user scalability without a controlled benchmark.
- Do not claim DDoS immunity.
- Do not publish unsupported marketing claims.
- Do not represent heuristic visibility as real AI output.
- Do not use em dash characters in project documentation or product copy.

## DOCUMENTATION RULES

After every meaningful ship, update the relevant existing documentation.

HISTORY.md entries must explain:
1. date and phase,
2. goal and acceptance criteria,
3. concrete implementation,
4. changed files,
5. verification,
6. remaining/deferred work,
7. gotchas.

README.md remains the architecture source of truth.

docs/FILEMAP.md must include every new important route, library, component, schema area, and configuration surface.

PROJECT_PLAN.md remains the only ordered execution plan and must identify the current phase.

## OWNER-ONLY BOUNDARIES

Do not claim DNS, hosting, production secrets, live Stripe configuration, irreversible deletion, or other owner-controlled external infrastructure is complete without owner confirmation.

Do not invent credentials.

When the plan requires an owner decision about pricing, role model, legal policy, or irreversible data behavior, surface the decision before implementing the irreversible portion.

## NEVER

- Never merge an unverified security branch.
- Never leave obsolete code underneath a working override.
- Never hardcode company identity into a page that should be admin-managed.
- Never create duplicate implementations for the same purpose.
- Never skip exact acceptance criteria in PROJECT_PLAN.md.
