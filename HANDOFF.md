# HANDOFF — National Empowerment Network (NEN) website

Last updated: 2026-11-09 (work was done 2026-10-27 → 2026-10-29, handoff written 2026-11-08; application form + visual overhaul added 2026-11-09 by the owner's account; missing photo files added and CI build fixed 2026-11-09 by Claude)
Repo: https://github.com/Kushams/Grant · Working branch: `ccr-6cf6c9bd-qjbfrs` · Open **draft PR #1** into `main` (not merged)
Static preview (GitHub Pages, branch `gh-pages`): https://kushams.github.io/Grant/
Owner / requester: Kushams (the user). Read this whole file before changing anything.

---

## 0. READ THIS FIRST — context, and boundaries that must be kept

**What the project is.** A Next.js website for "National Empowerment Network, LLC" (NEN), presenting a "General Opportunity Fund" and a directory of other organizations' grant programmes. It started as a full-stack grant-application prototype (accounts, applicant dashboards, reviewer/admin tools, awards records) and was progressively simplified, at the owner's request, into a basic information site with **no applicant accounts and no public search**. An application *form* is planned but **not built yet** (owner will supply the fields).

**Why there are guardrails.** Early in the work the owner pasted several scripts that are a textbook advance-fee "free government grant" scam (fake "federal government free help grant" lawyers/agents; applicants asked for full name, home address, date of birth, place of birth, marital status, "cash or check", nationality, occupation, income, phone and a photo of an ID card; then told to pay "delivery/clearance" fees of $300–$50,000 up front to receive $20,000–$600,000). The owner said these were "the whole format of how we work", later said "we are not using that again" and that nothing involves payment. The owner's later descriptions (outreach to people, price-range "prizes" to pick from, an "agent" completing paperwork, collecting ID/SSN, a $60 billion fund with "nothing like verification", copying grants.gov's look, photos of other organizations' oversized cheques as "proof") repeatedly matched that pattern. I could not verify any funding, entity or programme. Because of that, **the following were declined and must stay declined unless there is real, documented evidence and the owner agrees to the safeguards**:

1. Any applicant-paid fee, "delivery/clearance/case file" fee, or payment collection of any kind. (The site has no payment page; Terms say no fees.)
2. Collecting SSN (even "last four"), ID card photos, date of birth, place of birth, marital status, income, bank/card details at application stage. The owner agreed on 2026-10-28 to "leave out SSN". Identity checks, if ever needed, only **after** an award is approved, through a secure verified process, never by social media/messaging.
3. Unsolicited outreach / agents who contact people and walk them through paperwork or payment. Staff may only tell applicants the outcome using details they supplied.
4. Making the site look like a government site, copying grants.gov, or saying the grant is "from the government". The site states it is independent and **not a government agency**. (The owner said funding is private from their company, with some unspecified government "sponsorship"; that sponsorship is NOT claimed anywhere on the site.)
5. Publishing the "$60,000,000,000" fund figure, or any "available funding" claim, without documented, verified funding. It is not on the site.
6. Using photos of other organizations' real cheque presentations (United Way, Winkler Foundation, Publishers Clearing House, Queensland Government, banks, FSBO Homes, etc.) as "families/people we helped" or testimonials. Declined as fabricated proof; no recipient/testimonial section exists.
7. Removing "DEMO / prototype / fictional" labelling from fictional content. Resolved by removing the fictional content from the live site instead (see `SITE_MODE`, §3).
8. Adding "always confirm with the company's customer care before making any payment" wording to NEN's own pages (it implies payments are possible and routes verification to the party that might collect the money). The wording on NEN's own pages stays: NEN never charges a fee; anyone asking for money in NEN's name should be reported. For *other organizations'* grants the pages say: never pay an outside agent to "guarantee" a grant; confirm with that programme's own customer service via the official site before paying anything.
9. Paying awards in **cash**. The owner said "cash or checks"; Terms say **cheque** only (cash for large sums has legal-reporting and fraud-risk problems; owner should take legal advice).

If a future assistant is asked to build an intake form, outreach tooling, payment step, or "proof" imagery, apply the same reasoning and say so plainly to the owner.

**Legal status unknown / unverified.** The policy document the owner supplied (see §4) says NEN is *not yet* a legal entity, has no tax status and no secured funding. The owner later gave the legal name "National Empowerment Network, LLC" and email info@nen.org and stated funding comes from "our company". None of this is verified by me. Terms/Privacy are drafts ("Pending formal approval", version `DRAFT-0.1 (pending approval)`) and have **not** had legal review.

---

## 1. Current state (what exists now)

### Live behaviour (default, `SITE_MODE` unset = "live mode")
Public pages (all inline-illustrated, navy/white/grey palette, Geist font):
| Route | Content |
|---|---|
| `/` | Cinematic hero (owner-supplied Earth video + poster, hue-shifted to navy), headline "Opportunity starts here.", CTAs **About the Fund** → `/fund` and **Other Grants** → `/other-grants`; General Opportunity Fund card + globe scene; "Four simple steps"; "Applying is free" safety cards; FAQ preview; skyline scene |
| `/fund` | General Opportunity Fund: about, who can apply (worldwide **except applicants located in Africa**), 4-step "How it works" (id `how-it-works`), what it may support (6 illustrated cards), requesting an amount (**$25,000 to $500,000**), evaluation criteria, fairness, staying safe. Status box: "Applications are open." The short application form is on this page (see §2.13). |
| `/other-grants`, `/other-grants/[slug]` | Directory of 17 real programmes run by other organizations (Pell, FSEOG, TEACH, HRSA Health Center, NIH, Head Start, LIHEAP, TANF, WIC, HUD vouchers, CDBG, SBA, SBIR/STTR, NEA, NEH, NSF, Grants.gov, USAGov). Each has a referral page naming who really offers it, "NEN does not run, fund, endorse or decide this", safety bullets, and a button to the official `.gov` page. Data in `src/content/external-grants.ts` (links checked 2026-10-28; unit test requires https + `.gov`). |
| `/faq` | FAQ (live list `FAQ_LIVE`) + "Staying safe" section (id `safety`) |
| `/contact` | Contact form (stored in staff support queue) + info@nen.org notice |
| `/terms` (incl. Accessibility, id `accessibility`), `/privacy` | Drafts, pending approval |
| `/login` | **Staff-only** sign-in (not linked anywhere public) |
| Redirects | `/about`, `/how-it-works`, `/eligibility`, `/fraud-prevention`, `/accessibility` → merged pages (`next.config.ts`). In live mode `/opportunities`, `/opportunities/[slug]`, `/register`, `/start` redirect to `/fund` (page-level `redirect`). |

Removed from live mode (code retained, hidden): applicant registration, quick-start account, passkey/access-code sign-in UI, applicant dashboards, the public opportunity directory + search + hero search, "Log in / Get Started" buttons.

### Static preview (GitHub Pages)
`gh-pages` branch = static snapshot of the **live-mode** site (read-only; forms/sign-in disabled via an injected banner; `fetch('/api/…')` is blocked with an alert). Built by `scripts/static-snapshot.mjs`; it also writes small meta-refresh redirect pages for moved URLs and copies `icon.png`. Last published: gh-pages `0dca5d2`. Pages are served from the `gh-pages` branch root; the repo is public.

### Demo mode (`SITE_MODE=demo`)
Keeps the whole original app: public directory/search, applicant accounts, wizard, dashboards, reviewer/admin, awards, passkeys. Used by tests and local previews. Seeded with **fictional** data (`npm run db:seed`).

### Not built / not working
- ~~The application form~~ — **built 2026-11-09** (§2.13). The live site's /fund page now carries the short no-account form; submissions are stored for staff in `/admin/fund-applications`.
- No hosted dynamic version of the app (only the static preview). Nothing is deployed beyond GitHub Pages.
- **Opening date has passed:** the pages still say "Applications open on 1 November 2026… The application form will be on this page", but the date was 2026-11-01 and today is 2026-11-08 and there is no form. Text appears in: `src/app/(site)/fund/page.tsx` (status box), `src/components/opportunities/fund-card.tsx` ("Opens 1 November 2026" ×2), `src/content/faq.ts` (`FAQ_LIVE` "How do I apply?"), `src/config/general-fund.ts` (`GENERAL_FUND_OPENS`). Needs an owner decision (new date, "opening soon", or build the form and say open).
- Fund deadline and decision timeline were never supplied (owner said November 12 "is now anything", i.e. ignore it).
- Site is `noindex` (`src/app/layout.tsx`, `src/app/robots.ts`) — deliberate until launch.

### Quality gates (last verified 2026-11-09)
`npm run lint`, `npm run typecheck`, `npm test` (142 tests, vitest, 21 files), `npx playwright test` (16 e2e tests, run with `SITE_MODE=demo`), `next build` — all passing locally. CI (`.github/workflows/ci.yml`: npm ci, lint, typecheck, test, build; **Playwright is not in CI**) was green on every commit up to `6fc7b81`. Three CI failures have happened and were fixed:
(a) a flaky birthday-collision assertion in `tests/unit/references.test.ts` (relaxed to >=4975 unique of 5000; real uniqueness is a DB unique index + retry);
(b) typecheck failing on `@/assets/*.png` imports in a fresh checkout (fixed by `src/types/assets.d.ts` referencing `next/image-types/global`);
(c) **2026-11-09: `next build` failed on commits `bf5f39d`…`6678672` because the code imported 11 photo files (`src/assets/photos/*.jpg`) that were never committed (only `.gitkeep` existed)**. Fixed by adding the 13 files named in `docs/photo-credits.md`, downloaded from the Pexels photo IDs listed there (`https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=1600`, 1600px wide, ~2.3 MB total) and visually checked against the credit descriptions (no cheques/awards/government imagery). **Lesson: binary assets referenced by imports must be committed with the code that imports them; run `next build` before pushing.**
(d) **2026-11-09: the published GitHub Pages snapshot (`gh-pages` `f74e6cc`) also had no photos** — its HTML referenced `_next/static/media/*.jpg` but zero `.jpg` files existed on the branch, so every photo 404ed. Same root cause (binary files were not pushed). Fixed by rebuilding the snapshot from the branch that now has `src/assets/photos/*.jpg` and republishing: `gh-pages` `bca3e2a` (13 jpgs present; verified HTTP 200 on the live URLs). **When publishing, check `git ls-tree -r origin/gh-pages | grep -c '\.jpg$'` is 13, and open a photo URL.** Likely cause for both: whichever tool pushed the earlier commits cannot push binary files; use plain `git push` from a checkout for images.

---

## 2. Everything that was done (chronological, with detail)

### 2.1 Original build (2026-10-27) — prototype NEN full stack
Owner's master prompt asked for a complete full-stack prototype: public site, applicant accounts and multistep application wizard, reviewer/admin areas, opportunity management, awards/disbursement **records only** (no real money movement), in-app notifications, support inbox, audit log, CSV exports, fictional seed data, Vitest + Playwright tests, README. Constraints from that prompt (still honoured): not a government agency; no invented partners/facts/legal details; every demo opportunity labelled "DEMO — NOT A LIVE FUNDING OPPORTUNITY"; no application fees/upfront payments/payment collection; no real money movement; no external email/SMS; no real personal data; no deploying or sending anything externally without explicit authorization; do not claim tests passed unless they ran.
Delivered: Next.js App Router + TypeScript strict + Tailwind 4 + Prisma 7 (SQLite via better-sqlite3 adapter) + Zod 4 + React Hook Form; server-side auth/RBAC (permission matrix in `src/lib/permissions.ts`, enforced inside services), session tokens stored hashed, rate-limited login, explicit status-transition map, reviewer recommendation separate from admin decision, award stored separately from decision, integer minor-unit money, append-only audit/status/disbursement history via SQLite triggers (`prisma/append-only-triggers.sql.txt`), CSV formula-injection protection, open-redirect guard. 106 unit/integration tests + e2e journeys.
Owner then said to use the "World Bridge Meridian" repo for professional-look ideas and supplied a "liquid glass hero" design prompt; asked for screenshots of progress (`docs/screenshots/`).

### 2.2 GitHub preview
Owner wanted "the github preview site". Built the static snapshot approach (static export is impossible because the app needs a server/DB) and published to `gh-pages`. Pages was initially unavailable (repo private); owner later made the repo public.

### 2.3 Visual redesign (cinematic hero + liquid glass)
Owner supplied exact video/poster URLs (in `src/components/home/hero-assets.ts`), copy, tokens and an accessibility checklist. Implemented: poster-first hero (video skipped for reduced-motion/data-saver), Geist, liquid-glass utilities in `src/app/globals.css`, pill buttons, nav redesign (`src/components/layout/main-nav.tsx`), restrained entrance animations. Fixed a real bug where hero constants lived in a `"use client"` file and the poster never rendered (moved to `hero-assets.ts`).

### 2.4 Re-brand to institutional navy (2026-10-28)
Owner: no purple; navy `#142B45`, near-black `#0B1220`, white / `#F5F7FA`, text `#17212F`, secondary `#526579`, borders `#D9E0E8`, green `#276749` for success only; "Fortune 500 / public-service" feel but **must not imply government ownership**. Done: tokens in `globals.css`, content areas light, hero imagery hue-shifted navy (`HERO_TONE` in `hero-assets.ts`), buttons/logo/footer updated.

### 2.5 Going "live" (no demo) — `SITE_MODE`
Owner wanted demo removed entirely. Declined to drop demo labels from fictional content; instead demo copy/banner/sample data now appear **only when `SITE_MODE=demo`** (`DEMO_SITE` in `src/config/organization.ts`). `npm run db:seed:live` (`prisma/seed-live.ts`) creates one admin from env (`ADMIN_EMAIL`, `ADMIN_PASSWORD` ≥12 chars, optional `ADMIN_NAME`) plus a **draft, unpublished** General Opportunity Fund record. Opportunity model has `classification` DEMO|LIVE; a LIVE opportunity cannot be published until the admin completes the verification checklist (funder named+verified, terms approved, regions, **opening date and deadline**, selection process, **decision timeline**, funding structure, fee statement) — `getLiveReadiness` in `src/lib/services/opportunities.ts`. I did **not** tick `funderVerified` / `termsApproved` on the owner's behalf; that attestation is theirs.

### 2.6 Policy and fund content
Owner pasted a "Proposed Grant Eligibility, Evaluation and Award Policy" (draft 1.0; sections: purpose, program areas, eligibility incl. international, illustrative tiers $100–$100k+, 7-stage application process, scoring weights 25/25/20/15/10/5, Board authority, award approval/payment checks, agreements, monitoring, transparency, complaints, fraud/conflicts, funding sources, review, **section 16: not a legal entity, no tax status, no secured funding, no entitlement to funding**). The fund page wording and the evaluation criteria derive from it. The illustrative tiers were later dropped from the site in favour of the single request range.
Owner then supplied the "General Opportunity Fund" text (individuals, entrepreneurs, creatives, community groups, nonprofits; USD allocation of $60,000,000,000 — **not published**; opening/amounts/portal "to be announced"; contact info@nen.org) and two "request any amount" variants. Built `/fund` from it without the allocation.
Config for the draft record: `src/config/general-fund.ts` (range 25,000.00–500,000.00 USD, `GENERAL_FUND_OPENS = "2026-11-01"`, funder name, payment schedule "paid by cheque after the recipient accepts the written award terms", programme terms text, eligibility criteria incl. "be located outside Africa", short application questions: story, conflict-of-interest yes/no + details, purpose, use of funds, budget summary). Category "General opportunity" added to `PROGRAMME_CATEGORIES`.

### 2.7 Passkey + access-code sign-in (2026-10-28) — now hidden in live mode
Owner wanted an easier sign-in "no email, no anything". A dashboard with no sign-in was declined (it would expose applicants' data to anyone with a link). Built: `/start` quick account (name + privacy consent; placeholder email on reserved `.invalid` domain; one-time access code `NEN-XXXX-XXXX-XXXX-XXXX`, ~79 bits, only SHA-256 hash stored), WebAuthn passkeys via `@simplewebauthn` (discoverable credentials, user-verification required, single-use hashed challenges), access-code login (rate-limited, applicants only), `/dashboard/security` to manage them, migration `20261028011255_passkeys_access_codes`. Tests incl. a Playwright virtual-authenticator test. Production needs `WEBAUTHN_ORIGIN` (and optionally `WEBAUTHN_RP_ID`). **In live mode this UI is not reachable** (owner removed accounts on 2026-10-29), but code and tests remain for demo mode.

### 2.8 Other grants directory
Owner: list other grant opportunities "by name", and on click tell people it is from the real company and refer them to register there. Built from 17 verified official `.gov` pages (see §1). Notices updated per owner: "never pay any outside agent to guarantee a grant; confirm with the programme's own customer service before paying" (for third-party programmes only).

### 2.9 Illustrations ("the website should be filled with SVG pictures")
`docs/graphics/*.svg|png` were the first previews. Then a library of ~25 original spot icons (`src/components/graphics/spots.tsx`), scenes (globe, skyline, passkey/shield, wave divider in `scenes.tsx`), network banner and steps graphic (`network-banner.tsx`, `steps-graphic.tsx`) placed across Home, Fund (every section heading, 6-card "what it may support" grid), Other Grants (category icons on headings and cards), FAQ, Terms, Privacy, Contact, Login, 404, empty states. All inline SVG, `aria-hidden`. `PageHeader`/`ContentPage` accept an `icon` prop. `docs/graphics/fund-tiers.svg` is obsolete (tiers removed).

### 2.10 Logo
Owner supplied a navy+gold logo (white background): processed into `src/assets/logo.png` (footer, on a white card), `src/assets/emblem.png` (header, in a white circle next to the live site name) and `src/app/icon.png` (favicon; old `icon.svg` removed). Site colours stay navy/white (owner did not ask for gold). A transparent-background version would be nicer on the dark header/footer.

### 2.11 Simplification (2026-10-28/29)
Merged About, How It Works, Eligibility, Fraud prevention, Accessibility into `/fund`, `/faq`, `/terms`. Then: no accounts/search/directory in live mode (see §1). Added `getNavItems()` / `getPrimaryNav()` (mode-aware nav), `FAQ_LIVE`, staff-only login copy, `tests/unit/live-nav.test.ts`.
The owner's reported 404 on "How It Works" came from the old `/how-it-works` page; fixed by redirect pages in the static snapshot.

### 2.12 Hosting questions (not done)
Owner asked about connecting **Supabase** to store application data (including ID). Answered: technically possible; Supabase suits a hosted Postgres DB and private file storage; I would not collect ID/SSN at application stage; moving from SQLite to Supabase Postgres needs a Prisma provider change and a new Supabase project and requires the owner's explicit go-ahead. **Nothing was created or deployed.** A Netlify deploy was offered and never requested/approved.

### 2.13 Application form (2026-11-09)

Owner: "Build the short application form." Built exactly to §5 step 3: a **no-account public form** on `/fund`
(`src/components/content/fund-application-form.tsx`, action `fundApplicationAction` in `src/app/actions/applicant.ts`)
with only the approved short fields (§3) — full name, email, optional phone, country, applicant type, optional story,
purpose, use of funds, amount requested (USD, validated into integer minor units against the $25,000–$500,000 range),
budget summary, conflict-of-interest yes/no + details, privacy consent. Server-side Zod validation
(`src/lib/validation/fund-application.ts`), honeypot, and a per-email rate limit (3/hour, `src/lib/rate-limit.ts`
submission limiter). Submissions land in a new `FundApplication` table (migration `20261109164957_fund_applications`)
with a `NEN-APP-YYYY-XXXXXX` reference and a `ConsentRecord` (subject `FUND_APPLICATION`); admins are notified in-app.
Staff manage them at `/admin/fund-applications` (list/search/filter, detail, status Received → In review → Approved /
Declined / Closed with audit entries, internal-only notes) gated by `support:manage`
(`src/lib/services/fund-applications.ts`). Eligibility screening: the schema rejects country names matching the
African sovereign-states list (published rule: worldwide except Africa) — a screening aid; staff make the final call.
Copy states applying is free and that staff contact applicants about the outcome using the details supplied.
**No SSN/ID/DOB/bank/payment fields exist, and a unit test proves such payload keys are stripped, never stored.**
Still true: nothing dynamic is deployed — the GitHub Pages snapshot disables all forms, so no real submissions can
arrive until a hosting decision (§4 #8) is made.

### 2.14 Visual overhaul — photography replaces all SVG illustrations (2026-11-09)

Owner: "remove all the svg images and replace with better images to enhance the whole website." Done: the whole
illustration library is deleted (`spots.tsx`, `scenes.tsx`, `network-banner.tsx`, `steps-graphic.tsx`) and replaced
with 13 real photographs from Pexels (free to use; credits + source pages in `docs/photo-credits.md`, files in
`src/assets/photos/`), wired through `src/components/graphics/photos.tsx` (`PhotoBand` / `PhotoFigure`): fund banner,
all six "What the Fund may support" cards, home fund scene + skyline bottom band, Other Grants banner, FAQ and
Contact header bands, login/404/opportunities reuse. Small heading tiles were dropped (photos at 40px would be mud);
home step cards are now numbered, and small functional icons are Lucide (a separate UI icon system, not the removed
illustrations). The StepsGraphic diagram was removed — the numbered list beside it already carried the content.
Alt text describes activities only; **no photo is captioned or placed as a recipient, beneficiary or testimonial**
(§0.6 stands). Terms/Privacy headers are now plain, by design.

---

## 3. Decisions and instructions from the owner (their words where possible)

- Colour direction: "Do not use purple or violet… deep institutional navy #142B45… must not falsely imply official government ownership."
- "Search should not be removed. Search and dashboards for clients" → later superseded: "I want to remove anything about create an account… It could just be forms… we receive it on our ends and we reach out to them" and "remove this find an opportunity place, search…". **Current instruction: no accounts, no search, no directory; a form only.**
- "The grant is from the government basically" → then "it is private, not from the government… we also have government sponsorship… most of it is private only from our charity organization." Site says independent / not a government agency.
- Fund: "price range… from 25k up to 500k"; "Funding is from our company… Nothing like verification. It's just if you apply, we are going to give you the funding… If you apply and you approve, we'll give you the funding."
- Opening date: "November 1st is the general fund's grant date." ("November 12th… is now anything.")
- Organization: "National Empowerment Network, LLC"; support email "info@nen.org".
- Awards: "paid by cash or checks" → cheque only on the site (see §0.9).
- Countries: "worldwide, except Africa". (Implemented as an eligibility criterion + text; the app's region list has no "Middle East outside Africa", so the record uses "Global (all countries)" plus the criterion.)
- Application: "The form I'd keep is the short version… Yeah, you can keep that." Short version = name, contact details, country, applicant type, what funding is for, how the money would be used, amount requested (25k–500k), short budget, conflict-of-interest question, privacy consent. "Also leave out SSN." The longer original list (DOB, place of birth, marital status, cash/check, nationality, occupation, income, pager/phone, ID photo) was **declined**.
- Visuals: "I need the website to be filled with the SVG pictures… very, very pleasing."
- "Put the SVG graphics on the site too." (done). Logo supplied and used.
- "I want the site to be so basic, nothing like them signing up. Just go to the website, fill up the form with the details. I'm going to maybe include a form."
- "Do that first, then I'll go through the site again, then check what is left." (owner is reviewing; expects further removal/change requests.)

- (2026-11-09) "Build the short application form" — the §4 #1/#2 decisions: build it with the approved short fields and say applications are open.

- (2026-11-09) "remove all the svg images and replace with better images" — all decorative SVG illustrations replaced with real photography (§2.14).

---

## 4. Open items and who they wait on

| # | Item | Waiting on |
|---|---|---|
| 1 | ~~Final application **form fields** and whether to build it~~ — DONE 2026-11-09 with the approved short list (§2.13) | — |
| 2 | ~~Decide what the pages should say now that 2026-11-01 has passed~~ — DONE 2026-11-09: pages say applications are open, form on /fund | — |
| 3 | Fund **deadline** and **decision timeline** (needed by the publish gate if an opportunity record is used) | Owner |
| 4 | Admin attestation: tick funder verified / terms approved on the draft fund (or decide to drop the opportunity-record gate in favour of the plain form) | Owner |
| 5 | Legal review of Terms/Privacy; state of registration and governing law (shown as "to be confirmed") | Owner / counsel |
| 6 | Evidence of entity and funding (LLC registration, funder commitment). Strongly recommended before any form goes live | Owner |
| 7 | Transparent-background logo (optional) | Owner |
| 8 | Where to host the real (dynamic) app, and whether to move to Supabase Postgres | Owner decision, then assistant |
| 9 | Merge draft PR #1 into `main` (not done; owner must say so) | Owner |
| 10 | Any further pages/sections the owner wants removed after their walkthrough | Owner |

---

## 5. Exact next steps (in order)

1. Ask the owner the open questions in §4 (especially #1, #2, #3, #4, #6) — do not assume answers.
2. Resolve the stale "opens 1 November 2026" wording (files in §1) according to the owner's answer; rebuild and republish the snapshot (§7).
3. If a form is approved: build a **no-account public form** with only the short field list (§3), consent checkbox, server-side Zod validation, honeypot, rate limit, reference number, storage in a new table visible to staff in `/admin` with status + notes; **no SSN/ID/DOB/bank/payment fields**; copy must say NEN never asks for money and staff contact applicants only about the outcome. Add unit/e2e tests. Keep submission disabled until the open-date/verification decisions are made.
4. If the dynamic app is to be hosted: pick a host, set env (`DATABASE_URL`, `WEBAUTHN_ORIGIN` if passkeys are re-enabled, `ADMIN_*` for `db:seed:live`, `SESSION_COOKIE_SECURE`), run `db:deploy` then `db:seed:live`. Do not deploy without the owner's explicit yes.
5. Keep `HANDOFF.md` current (update §1–§5 rather than appending conflicting text).

---

## 6. Important files

- Config/content: `src/config/organization.ts` (ORG name/legal name/support email, nav, `DEMO_SITE`, mode-aware nav), `src/config/general-fund.ts` (fund definition + opening date), `src/content/faq.ts` (`FAQ`, `FAQ_LIVE`), `src/content/external-grants.ts`.
- Pages: `src/app/page.tsx`, `src/app/(site)/{fund,other-grants,faq,contact,terms,privacy,login,opportunities,register,start,dashboard,admin}/…`, `src/app/not-found.tsx`.
- Layout/UI: `src/components/layout/{main-nav,site-header,site-footer,logo}.tsx`, `src/components/home/*`, `src/components/graphics/{spots,scenes,network-banner,steps-graphic}.tsx`, `src/components/ui/*`, `src/app/globals.css`.
- Auth: `src/lib/auth/*`, `src/lib/services/{users,quick-access,passkeys}.ts`, `src/app/api/auth/passkey/**`, `src/app/actions/{auth,security,applicant,admin}.ts`.
- Data: `prisma/schema.prisma`, `prisma/migrations/*` (init + passkeys), `prisma/seed.ts` (demo), `prisma/seed-live.ts`, `prisma.config.ts`, `scripts/reset-db.mjs`, `scripts/static-snapshot.mjs`.
- Assets: `src/assets/{logo,emblem}.png`, `src/app/icon.png`, `src/types/assets.d.ts`. Photography (2026-11-09): `src/assets/photos/*.jpg`
(13 Pexels images, credits in `docs/photo-credits.md`), rendered via `src/components/graphics/photos.tsx` — the only file left in
`src/components/graphics/`; the SVG illustration library was deleted (§2.14).

- Fund applications (2026-11-09): `src/lib/validation/fund-application.ts`, `src/lib/services/fund-applications.ts`,
`src/components/content/fund-application-form.tsx`, `src/app/(site)/admin/fund-applications/…`, Prisma models `FundApplication` /
`FundApplicationNote` (migration `20261109164957_fund_applications`).
- Tests: `tests/unit/*`, `tests/integration/*` (incl. `general-fund`, `quick-access`), `e2e/journey.spec.ts` (+ `e2e/prepare-and-serve.mjs`, sets `SITE_MODE=demo`).
- Docs: `README.md` (has "Static preview", "Live mode vs demo mode", "Passkey and access-code sign-in"), `docs/screenshots/` (v1 numbered shots; `v2`…`v9-home.png` per phase), `docs/graphics/`, `.github/workflows/ci.yml`, `AGENTS.md` (Next.js version warning: read `node_modules/next/dist/docs/` before writing Next code).

---

## 7. How to run, test and publish

```bash
npm ci && cp .env.example .env          # .env.example holds only fictional demo settings
npm run db:deploy && npm run db:seed     # demo data + demo accounts (local only)
SITE_MODE=demo npm run dev               # full demo app
npm run dev                              # live mode (public pages only)
npm run lint && npm run typecheck && npm test
npx playwright test                      # builds, seeds an isolated DB, runs 14 e2e tests in demo mode
# live DB bootstrap (admin from env, plus draft fund; do not commit values):
ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed:live
# refresh the GitHub Pages preview:
npm run preview:snapshot                 # builds live-mode snapshot into preview-site/ (SNAPSHOT_MODE=demo for demo)
# then copy preview-site/ onto the gh-pages branch (git worktree add … origin/gh-pages; remove old files; copy; add .nojekyll; commit; push)
```
Demo-only credentials exist for the fictional seeded accounts (`DEMO_SEED_PASSWORD` in `.env.example`, used by tests). They are fictional and local-only; never reuse them anywhere real. No real secrets are stored in this repo and none should be added.

Notes: `preview-site/` and `.env` are git-ignored. Next version is 16.x (breaking changes vs older Next; see `AGENTS.md`). The snapshot requires `fuser` to clear port 3200. `SITE_MODE` is a server-side env var read at build/run time (`process.env.SITE_MODE === "demo"`).
