# AGENTS.md — every AI

Repo: `zaydattique/aeo-tool`  
Product: **AEO Command** (Answer Engine Optimization platform for agencies)

## Boot (before any edit)

1. **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** — **only** ordered to-do (do everything in sequence)
2. **[HISTORY.md](./HISTORY.md)** — full detail of what exists; do not redo completed work
3. **This file**
4. **[docs/FILEMAP.md](./docs/FILEMAP.md)** — paths to touch
5. **[README.md](./README.md)** — architecture and how the system fits together

**No other todo lists.** If an old docs file lists features, ignore it — PROJECT_PLAN wins.

---

## CRITICAL FILE RULES (NO EXCEPTIONS)

- **NEVER** push placeholders, stubs, TODOs, partial files, or strings like `SEE_FILE` / `PLACEHOLDER` / `SEE_ARTIFACTS` / `TODO` / `FIXME`.
- Every file push **MUST** contain the **COMPLETE real content** — not a path reference, not a comment, not a truncated half.
- Before any GitHub push: verify the body has **no** placeholder / TODO / FIXME / SEE_FILE strings.
- If file is **>10KB** → split into multiple smaller **verified** pushes **OR** use git from local. Do not invent partial content.
- If any file becomes empty or corrupt → **STOP and ask human**.
- Critical paths (never tiny): schema, scan worker, Action Center, auth middleware, report generator, crawl/AI libs.
- **Prefer edit existing files** over creating new ones when the same concern can be solved by extending an existing page, component, lib, or doc. Do not create parallel files for the same topic (e.g. two competing SEO guides).

---

## DOCUMENTATION RULES (MANDATORY AFTER EVERY SHIP) — OWNER STRENGTHENED 2026-09-28

Owner requirement: docs must explain **what was built**, **why**, **how it works**, **what remains**, and **how to verify** — never one-liners.

### HISTORY.md — after every phase or meaningful ship

Append a section that includes **all** of the following in full prose (not bullets alone):

1. **Date + phase/name**
2. **Goal** — the exact problem this ship solved and the success criteria that were set before work began
3. **What we did** — concrete behaviors: every API route changed, every UI surface, every data-model field, every external integration, every content page. Name the user-visible outcome.
4. **Key files** — paths created or substantially changed, with a one-sentence role for each
5. **Outcome / acceptance** — how a human or the next agent can verify the ship works (commands, URLs, expected UI states)
6. **What is still missing / deferred** — explicit list of related work that was intentionally left out and why
7. **Gotchas** — anything the next agent will trip on (env vars, migrations, race conditions, plan limits)

**Forbidden:** one-liners like “Phase 6 complete (Grok)” with no substance. HISTORY entries must be long enough that a new agent can reconstruct intent without reading the code.

### README.md — must stay the single source of truth for architecture

README **must** contain, in full detail:

- Product identity and promise
- Current architecture diagram (text) and every major layer (runtime, DB, auth, scans, billing, email, jobs)
- Frontend surface map (marketing routes, product UI, public report, admin)
- Core user flows end-to-end
- Local development steps and production deploy summary
- Environment variables (required vs optional) with purpose of each
- Tech stack versions and why each was chosen
- Goals achieved to date and goals remaining
- License / ownership note

After any structural change (new major area: billing, admin, reports, queue, AEO content cluster), update the corresponding README sections in the **same** ship — not only a phase bullet.

### docs/FILEMAP.md — keep accurate

- When you add a **new** important path (`lib/*`, `app/api/*`, major page), **add a row** to FILEMAP in the same ship.
- Do not leave orphan routes undocumented.

### PROJECT_PLAN.md

- Mark phase Done with a short **deliverables completed** list (can be tighter than HISTORY).
- Point **NEXT** at the single open phase.
- Never invent parallel phase numbers outside this file.

---

## Working with owner

- Do all code Grok can do; **ask owner** only for: production secrets, Stripe live keys, DNS, domain setup, irreversible data deletes, pricing model changes.
- **Ask before** changing business logic, pricing model, permission/role model, or deleting user data paths.
- After ship: **detailed HISTORY** + mark PROJECT_PLAN + update FILEMAP/README when structure changed.
- Language with owner: **English, Urdu, or Roman Urdu only**.

---

## Never

- Placeholder / stub / incomplete critical files
- Thin HISTORY that only says a phase is done
- Thin README that only lists tech names without explaining architecture and flows
- Blind restore over newer main
- Commit `.env` / private keys / secrets
- Skip `agencyId` isolation on any business table or query
- Ship expensive ops (scans, AI, reports) without plan limits / rate awareness where already established
- Create a new file when editing an existing one solves the same need

---

## Product identity (stable)

AEO Command is a **multi-tenant SaaS** for agencies:

- Paste client URL → full scan → prioritized Action Center with exact steps → assign → track → white-label report.
- Strict multi-tenant isolation (`agencyId` everywhere).
- Roles: `SUPER_ADMIN` | `AGENCY_OWNER` | `AGENCY_MEMBER`.
- Domains: threezero.agency (marketing), app.threezero.agency (app), admin.threezero.agency (super admin).
