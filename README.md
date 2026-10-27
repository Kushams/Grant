# National Empowerment Network (NEN) — platform prototype

An independent opportunity-access and empowerment platform prototype: visitors discover **fictional demonstration** opportunities, applicants register, apply and track progress, and staff review applications, record decisions, create award records and schedule/record disbursements — all with persisted local data, server-side authorization and an append-only audit trail.

> **This is a prototype.** Every opportunity is fictional and labelled **DEMO — NOT A LIVE FUNDING OPPORTUNITY**. **No money moves, and no email/SMS is ever sent.** National Empowerment Network is not a government agency, and no partner, funder, legal entity, address or policy has been invented — anything unconfirmed renders as "Details to be confirmed".

## Quick start

```bash
# Prerequisites: Node.js >= 20.19 (tested on 22) and npm. No other services needed.
npm install                    # also runs `prisma generate`
cp .env.example .env           # local-only settings (never commit .env)
npx prisma migrate deploy      # create dev.db from the migrations   (or: npm run db:migrate)
npm run db:seed                # load fictional demo data (idempotent; see "Reset")
npm run dev                    # http://localhost:3000
```

Open **http://localhost:3000**. On `/login` a *local demo helper* (hidden in production) signs you in as any seeded demo account with one click.

### Demo accounts (all fictional; reserved `.test` domain)

Password for every seeded account = `DEMO_SEED_PASSWORD` from `.env` (default **`Demo-Passw0rd!`**, local use only, stored only as a bcrypt hash).

| Role | Email | Notes |
|---|---|---|
| Administrator | `admin@demo.nen.test` | Everything: opportunities, assignments, decisions, awards, exports, audit, users |
| Reviewer | `reviewer1@demo.nen.test`, `reviewer2@demo.nen.test` | Only applications assigned to them; notes, info/revision requests, recommendations |
| Individual applicant | `individual1@demo.nen.test` … `individual4@demo.nen.test` | `individual1` has a partly-filled draft and saved opportunities |
| Organization applicant | `org1@demo.nen.test` (co-op), `org2@demo.nen.test` (farmers; part-paid award), `org3@demo.nen.test` (youth foundation; award with an overdue and an on-hold instalment) | |

The seed pushes data through the real services, so the demo set covers drafts, submitted, under review, information requested, revision requested, recommended, approved (with and without an award), declined, withdrawn, partially disbursed, and scheduled-with-overdue records.

### Suggested demo walk-through

1. Visitor: `/opportunities` → search/filter → an opportunity page (DEMO labels, "Details to be confirmed" states, no-fee statement).
2. Register (or sign in as `individual3`) → complete profile → *Start application* → six-step wizard → save a draft, leave, resume → submit → reference like `NEN-DEMO-2026-ABC234`.
3. Admin → *Applications* → assign a reviewer. Reviewer → move to review, add a note, recommend.
4. Admin → *Final decision* (approval is only possible after a recommendation) → *Awards & payments* → create award → schedule instalments (over-allocation is rejected) → record statuses (manual-record acknowledgement required).
5. Applicant → the application page shows timeline, decision message, award and instalments — never internal notes.
6. Admin → *Audit log* and *CSV exports*.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |
| Unit + integration + component tests (Vitest) | `npm test` |
| Browser tests (Playwright) | `npm run test:e2e` |
| Production build / start | `npm run build` · `npm start` |
| Create/apply migrations (dev) | `npm run db:migrate` |
| Apply migrations (deploy) | `npm run db:deploy` |
| Seed demo data | `npm run db:seed` |
| **Reset** the local database and re-seed | `npm run db:reset` (deletes the local SQLite file, re-applies migrations, re-seeds; refuses in production or for non-SQLite URLs) |

`npm test` builds its own throw-away SQLite database from the real migrations (`tests/.tmp`). `npm run test:e2e` builds the app and serves it on port 3100 with an isolated, freshly seeded database (`e2e/.tmp`); it never touches `dev.db`. Playwright uses the browser in `PLAYWRIGHT_BROWSERS_PATH`; if you have none, run `npx playwright install chromium` once.

### Troubleshooting

* **`Cannot find module '@/generated/prisma/client'`** → run `npx prisma generate` (output is gitignored; it normally runs on `npm install`).
* **Seed says "Demo data already present"** → intentional; run `npm run db:reset`.
* **Cannot sign in after `npm start`** → production mode sets `Secure` cookies. Chromium/Firefox accept them on `http://localhost`; otherwise set `SESSION_COOKIE_SECURE=false` locally. The one-click demo helper is disabled when `NODE_ENV=production`; use the password.
* **"Too many failed attempts"** → the in-memory limiter allows 6 failures / 15 min per email+IP; restart the server to clear it.
* **`next dev` rewrites `AGENTS.md`** → Next.js 16 maintains that file; commit it or ignore the diff.
* **Port in use** → `npm run dev -- -p 3001`.
* **`npm install` peer-dependency errors** → `.npmrc` sets `legacy-peer-deps=true` (a transitive optional peer of `@hookform/resolvers` conflicts); keep it.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Prisma 7 + SQLite (`better-sqlite3` driver adapter) · Zod 4 · React Hook Form (+ Zod resolver) · bcryptjs · lucide-react · Vitest + React Testing Library · Playwright.
UI primitives are hand-written accessible components in `src/components/ui` (an "equivalent accessible component system" rather than shadcn/ui, to avoid a runtime dependency); fonts are the system stack (no network font fetch).

```
prisma/            schema, migrations (incl. append-only triggers), seed
src/config/        organization facts (null = unconfirmed) + navigation
src/lib/           pure business logic (money, status machine, permissions, eligibility, CSV, references…)
src/lib/services/  DB-backed services: opportunities, applications, review, awards, support, notifications, audit, exports, stats, users
src/lib/validation Zod schemas
src/app/           pages, route handlers, server actions (src/app/actions)
src/components/    ui primitives, layout, dashboard, application wizard, admin forms
tests/ · e2e/      Vitest suites · Playwright journeys
```

## Design notes

* **Home hero:** full-height "liquid glass" hero over a looping background video (`src/components/home/`). The video is decorative (muted, `aria-hidden`), paused for `prefers-reduced-motion`, with a dark scrim to keep text contrast. The video URL is an external asset (`BG_VIDEO` in `hero-video.tsx`) — host your own copy before launch.
* **Font:** Geist, self-hosted through the `geist` package (no runtime Google Fonts request).
* Patterns adapted from the World Bridge Meridian site: scroll `Reveal`, eyebrow `SectionHeading`, `Accordion`, `Breadcrumbs`, favicon and a prototype-wide `robots.txt` that blocks indexing.
* Screenshots of the main screens are in `docs/screenshots/`.

## Static preview (GitHub Pages)

GitHub Pages can only host static files, and this app needs a Node server and database, so the hosted preview is a **read-only snapshot of the public pages** (forms, sign-in, dashboards and staff screens are disabled with a banner). Regenerate it with `npm run preview:snapshot` (output in `preview-site/`, served under the `/Grant/` base path) and publish that folder to the `gh-pages` branch. For the full working app, run it locally as described above.

## What is genuinely implemented

* **Public site:** home, opportunity directory (server-side search, 8 filters, 4 sorts, pagination, empty/invalid-filter handling, loading skeleton), opportunity detail pages, About, How it works, Eligibility, FAQ, a working contact form (stored in an in-app support queue), and draft Privacy/Terms/Accessibility/Fraud-prevention pages.
* **Auth:** registration (applicant roles only), login, logout, DB-backed sessions (random token, only its SHA-256 stored, `httpOnly` + `SameSite=Lax` cookie, `Secure` in production), bcrypt hashing, login rate limiting; deactivation revokes sessions.
* **Authorization:** one permission matrix (`src/lib/permissions.ts`) enforced **inside every service** (not just in the UI), plus page guards. Applicant records are scoped by ownership / explicit organization membership; reviewers see only assigned applications; IDs from the browser are always re-checked against the session and DB (IDOR cases are unit-, integration- and e2e-tested).
* **Applications:** six-step wizard (applicant type → profile → programme questions → project/purpose → supporting info → review & unticked consent), drafts and resume, server-side validation by question type, eligibility + window + duplicate prevention (DB unique key, race-tested), unique references, information/revision requests, withdrawal, resubmission.
* **Workflow:** explicit status transition map per role; reviewer *recommendations* are separate from administrator *final decisions*; timeline with actor/time/reason; reviewer assignment history; internal notes hidden from applicants (explicit `select`s, tested).
* **Awards & disbursements:** award stored separately from the decision; integer-minor-unit money; controlled currency list; instalment schedule that cannot exceed the award, visible unscheduled balance, overdue/hold/cancelled flags, manual-record acknowledgement for "paid" states, locked after payment, append-only history with before/after values, derived application status, applicant-safe views, totals computed from rows.
* **Admin:** overview with computed stats and a status chart, opportunity CRUD/publish/unpublish/archive with a dynamic question builder, LIVE-verification checklist, review queue (search/filter/sort/paginate), support inbox (internal notes vs public replies), audit log, user/role management, configuration checklist, safe CSV exports.
* **Audit:** all sensitive actions write to `AuditLog`; DB triggers make `AuditLog`, `ApplicationStatusEvent` and `DisbursementEvent` reject UPDATE/DELETE.
* **Notifications:** persistent, in-app, unread counts, mark read / all read, behind a `NotificationChannel` abstraction (`src/lib/services/notifications.ts`).

## What is simulated / deliberately not implemented

| Area | Status |
|---|---|
| Payments | **None.** No checkout, no card/bank/wallet fields, no provider. "Paid — manually recorded" is a staff-entered record labelled unverified everywhere. Application fees are disabled and there is no fee-amount field; the UI says "Any applicable charges, if any, will be stated in the verified programme terms before you proceed." |
| Email / SMS / push | **Never sent.** In-app only; the contact form and notifications say so. |
| File uploads | Not implemented (Step 5 explains). Required-document lists are informational. If added later: validate type/size/name, store outside `public/`, serve through an authorized route. |
| Password reset / email verification | Not implemented (needs a real, configured email provider). |
| Organization members | The model supports memberships; the app creates one OWNER per organization. Inviting members is not implemented. |
| Rate limiting | In-memory (resets on restart, per instance). Production needs a shared store. |
| Application reference format | `NEN-DEMO-2026-XXXXXX` uses a **random** unambiguous suffix (collision-safe via a UNIQUE index + retry) instead of a sequential counter, which races under concurrency. |
| Amount ceiling | Prisma `Int` limits a single amount to 2,000,000,000 minor units (enforced in `src/lib/money.ts`). |
| Forms need JavaScript | Action forms submit via `onSubmit` so React 19 does not wipe user input after a server-side validation error. Search/filter forms are plain GET and work without JS. |

## Data-model notes and trade-offs

* SQLite has no enums/arrays: statuses are validated strings (constants + Zod); list fields (applicant types, regions, criteria, FAQ…) are JSON text. Eligibility "rules" therefore live as columns on `Opportunity` rather than a separate rule table; questions are a real table (`OpportunityQuestion`).
* Answers store a copy of the question label/section so editing a programme never corrupts submitted history.
* `Application.activeKey` is a nullable UNIQUE column that gives database-level "one application per applicant per programme" (freed only on withdrawal).
* Financial, audit and history rows use `Restrict` foreign keys — nothing cascades away; opportunities are archived, never deleted.
* **Moving to production:** switch the Prisma `datasource` to PostgreSQL, replace the `better-sqlite3` adapter in `src/lib/db.ts`, reproduce the append-only guards as Postgres triggers/permissions, move rate limiting to shared infrastructure, add session cleanup, backups and monitoring.

## Configuration of unconfirmed facts

Organization identity lives in `src/config/organization.ts`. Everything not yet verified is `null` and listed in **Admin → Configuration** as "To be confirmed" (legal entity, registration number, address, official contacts, NGO/funding partners, coverage, fee policy, payment process, approved policies, branding). A DEMO opportunity can only become LIVE through the dedicated **verification** action (all readiness items complete + a typed note + confirmation, recorded with who/when); a normal edit can never change classification, and editing material facts of a verified LIVE opportunity voids its verification and unpublishes it.

## Test status (as last run in this repository)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` (Vitest) | **106 passed** — unit suites (money, CSV injection, status machine, permissions, references, eligibility, award maths, validation/open-redirect guard), integration suites on a real migrated SQLite DB (auth/sessions/rate-limit, opportunities & search, full application/review workflow, access control, awards/disbursements/exports/audit, support/notifications/users), and React Testing Library component tests |
| `npm run test:e2e` (Playwright, Chromium) | **9 passed** — browse/filter, register→draft→resume→submit, admin queue & assignment, reviewer scope, decision→award→instalment, applicant view without internal data, unauthorized access, exports/audit, mobile layout |
| `npm run build` | succeeds |

Not done: a formal accessibility audit (axe / manual screen-reader pass), load/performance testing, cross-browser runs beyond Chromium, Windows testing.

## Before any real programme or public launch

1. Supply and verify the facts in **Admin → Configuration** (legal entity, contacts, partners, coverage). Confirm partnerships in writing before naming anyone.
2. Have legal/compliance approve Privacy, Terms, Accessibility and Fraud-prevention text; add the privacy contact, retention periods and governing law.
3. Decide the fee policy with compliance. Current stance: **no applicant fees, nothing requested upfront**. Do not enable payment collection casually.
4. Design the real disbursement process (bank integration, dual authorization, reconciliation) — this app only records.
5. Replace SQLite and in-memory rate limiting; add email verification, password reset, MFA for staff, backups, monitoring, a CSP review and an independent security test.
6. Decide on uploads/verification documents, a data-protection impact assessment, and retention/deletion.
7. Run an accessibility audit and fix findings; replace the typographic mark with approved branding.
8. Remove demo accounts/seed data; never reuse demo credentials; set strong secrets and HTTPS-only cookies.
9. Review every demo opportunity — none may be published as real.
