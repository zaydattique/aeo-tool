# AEO Command — HISTORY

> Repo: `zaydattique/aeo-tool` · Updated **2026-09-28**

---

## Gotchas

| Topic | Detail |
|-------|--------|
| Inngest | Without keys, scans fall back to in-process |
| Portal | `prisma db push` for `portalToken` / `portalEnabled` |
| PDF | Requires `npm install` for `pdfkit`; no Chromium needed |
| Site URL | Set public HTTPS env on host |

---

### 2026-09-28 — Phase 13.2: Report & portal PDF download

**Goal**

Agencies and clients need a one-click PDF without relying only on the browser print dialog. Deliver server-generated PDFs for frozen reports and live portal snapshots, plus professional print CSS when users still prefer Print.

**What we did**

1. **`lib/report-pdf.ts`** — PDFKit builder: agency/client header, score, summary, dimension scores, strengths/weaknesses, actions, prompts, footer. Multi-page with simple overflow handling.
2. **`GET /api/reports/[token]/pdf`** — Public by live report token; returns `application/pdf` attachment.
3. **`GET /api/portal/[token]/pdf`** — Public when portal enabled; builds PDF from **live** DB state (same data as `/p/[token]`).
4. **UI** — Download PDF + Print on both `/r/[token]` and `/p/[token]` toolbars.
5. **Print CSS** — Hide chrome, page margins, avoid breaking action blocks mid-page, color-adjust exact.
6. **Deps** — `pdfkit` + `@types/pdfkit` in package.json.

**Key files**

- `lib/report-pdf.ts`
- `app/api/reports/[token]/pdf/route.ts`
- `app/api/portal/[token]/pdf/route.ts`
- `app/r/[token]/page.tsx`, `app/p/[token]/page.tsx`
- `package.json`

**Outcome / acceptance**

- Open report or portal → **Download PDF** saves a real `.pdf` file.
- Print still works for branded browser output.
- No Puppeteer/Chromium on the server.

**What is still missing / deferred**

- Storing `Report.pdfUrl` to object storage (optional later)
- Logo embedding in PDF (text agency name for now; remote image fetch can be added carefully)
- Phase 13.3 competitor prompts + SOV

**Gotchas**

- Run `npm install` after pull so pdfkit is present before hitting PDF routes.
- PDF is text-layout based; complex CSS branding is intentionally simplified for reliability.

---

### 2026-09-28 — Phase 13.1: Client live portal

Persistent `/p/[token]` read-only live view; enable/rotate/disable; schema portal fields. Distinct from frozen `/r/[token]` reports.

---

### 2026-09-28 — Phase 12: AEO/SEO 10/10 in-repo

Dynamic OG, densified marketing, FAQ schema, AI robots, layout graph.

---

### 2026-09-28 — Phase 11: Queue, rescan, visibility

Inngest, Resend, multi-engine heuristics, case studies.

---

Deploy: **docs/DEPLOY.md**.
