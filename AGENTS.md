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

---

## DOCUMENTATION RULES (MANDATORY AFTER EVERY SHIP)

Owner requirement: docs must explain **what was built**, not only that a phase number is done.

### HISTORY.md — after every phase or meaningful ship

Append a section that includes **all** of:

1. **Date + phase/name**
2. **Goal** — what problem this ship solved
3. **What we did** — concrete behaviors (APIs, UI, data model changes)
4. **Key files** — paths created or substantially changed
5. **Outcome / acceptance** — how to verify it works
6. **Gotchas** — anything the next agent will trip on

**Forbidden:** one-liners like “Phase 6 complete (Grok)” with no substance.

### README.md — keep accurate

- Must describe **current architecture** (backend + frontend), core flows, env vars, and how to run.
- After structural changes (new major area: billing, admin, reports), update the architecture / API / flow sections — not only the “Current phase” bullet.

### docs/FILEMAP.md — keep accurate

- When you add a **new** important path (`lib/*`, `app/api/*`, major page), **add a row** to FILEMAP in the same ship.
- Do not leave orphan routes undocumented.

### PROJECT_PLAN.md

- Mark phase Done with a short **deliverables completed** list (can be tighter than HISTORY).
- Point **NEXT** at the single open phase.

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
- Blind restore over newer main
- Commit `.env` / private keys / secrets
- Skip `agencyId` isolation on any business table or query
- Ship expensive ops (scans, AI, reports) without plan limits / rate awareness where already established

---

## Product identity (stable)

AEO Command is a **multi-tenant SaaS** for agencies:

- Paste client URL → full scan → prioritized Action Center with exact steps → assign → track → white-label report.
- Strict multi-tenant isolation (`agencyId` everywhere).
- Roles: `SUPER_ADMIN` | `AGENCY_OWNER` | `AGENCY_MEMBER`.
- Domains: threezero.agency (marketing), app.threezero.agency (app), admin.threezero.agency (super admin).
