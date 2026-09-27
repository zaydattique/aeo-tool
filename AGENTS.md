# AGENTS.md — every AI

Repo: `zaydattique/aeo-tool`
Product: **AEO Command** (Answer Engine Optimization platform for agencies)

## Boot (before any edit)

1. **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** — **only** ordered to-do (do everything in sequence)
2. **[HISTORY.md](./HISTORY.md)** — do not redo completed work
3. **This file**
4. **[docs/FILEMAP.md](./docs/FILEMAP.md)** — paths (create when needed)

**No other todo lists.** If an old docs file lists features, ignore it — PROJECT_PLAN wins.

## CRITICAL FILE RULES (NO EXCEPTIONS)

- **NEVER** push placeholders, stubs, TODOs, partial files, or strings like `SEE_FILE` / `PLACEHOLDER` / `SEE_ARTIFACTS` / `TODO` / `FIXME`.
- Every file push **MUST** contain the **COMPLETE real content** — not a path reference, not a comment, not a truncated half.
- Before any GitHub push: verify **file size matches local artifact** and the body has **no** `placeholder` / `TODO` / `FIXME` / `SEE_FILE` / `PLACEHOLDER_WILL` strings.
- If file is **>10KB** → split into multiple smaller **verified** pushes **OR** use git commit from local / owner machine. Do not invent partial content to "finish" a large push.
- If any file becomes empty or corrupt → **STOP and ask human**. Do not auto-recover with partial content.
- Always show `wc -c` (or `wc -l`) **+ first 5 and last 5 lines** after write, **before** pushing. If size looks wrong, do not push.
- Critical paths (never tiny): schema files, scan workers, Action Center components, auth middleware, report generators.

## Working with owner

- Do all code Grok can do; **ask owner** only for: production secrets, Stripe keys, DNS, domain setup, irreversible data deletes, pricing model changes.
- **Ask before** changing business logic, pricing model, permission/role model, or deleting user data paths.
- After ship: append HISTORY + mark step in PROJECT_PLAN.
- Language with owner: **English, Urdu, or Roman Urdu only**.

## Never

- Placeholder / stub / incomplete critical files
- Blind restore over newer main
- Commit `.env` / private keys / secrets
- Skip agency_id isolation on any business table or query
- Ship without rate limiting on expensive operations (scans, AI, reports)

## Product identity (stable)

AEO Command is a **multi-tenant SaaS** for agencies:
- Paste client URL → full scan → prioritized Action Center with exact steps → assign → track → white-label report.
- Strict multi-tenant isolation (`agency_id` everywhere).
- Roles: `super_admin` | `agency_owner` | `agency_member`.
- Domains: threezero.agency (marketing), app.threezero.agency (app), admin.threezero.agency (super admin).
