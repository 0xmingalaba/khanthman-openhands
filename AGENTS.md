<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)

Polymarket-inspired prediction market for Myanmar. **MMK only, whole Kyat, virtual credits
only** (no deposits, withdrawals, payments, cash payouts, redemption, or external transfers; only
**internal virtual-credit settlement** between ledger accounts). No fabricated data — dev fixtures must be
labelled SIMULATED. No admin dashboard. Original branding (Polymarket is a UX reference only).

### Build status
- **Milestone 1 (Application foundation) is IN PROGRESS** on branch `milestone-1-foundation`
  (worktree `/tmp/m1-foundation`), cut from the scaffold-bearing `milestone-0-discovery-architecture`
  (`bb498b3`). It carries the accepted Rev 12.6 docs verbatim. Milestone 0 documentation has been
  accepted as the planning baseline and M1 was authorised by the owner.
- **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.**
- Trading code is **gated** on approval of `docs/FINANCIAL-SPECIFICATION.md`.
- M1 ships **presentation and preferences only**: app shell, EN/MY i18n, light/dark design system, and a
  **non-financial** DB foundation (categories / app_settings only). **No** ledger, balances, orders,
  trades, positions, or settlements. Home renders an **honest empty state** (no fabricated data).
- M1 verification evidence: `docs/verification/m1/` (README + captured logs for typecheck, lint, vitest,
  build, playwright).

### Roadmap (owner-approved M0–M6 — do not renumber; no M7+)
- **M0** Discovery and architecture (this deliverable). · **M1** Application foundation (design system,
  navigation, localization, themes, database, migrations, tests). · **M2** Authentication and sessions
  (auth, sessions, preferences, development fixtures). · **M3** Market experience (homepage, discovery,
  search, categories, market details). · **M4** Financial specification and trading (**financial spec
  approved first**, then ledger + trading). · **M5** Portfolio and account (portfolio, positions,
  orders, history, account settings). · **M6** Security and release readiness (security, responsive,
  accessibility, financial integrity, regression, release readiness).
- **Ledger and trading live inside M4**, strictly behind financial-specification approval. See the
  architecture report **§3.3** for the full table and gates.
- **Reproducible verification** lives in `docs/verification/rev9/` (scripts + README + captured
  output) and is **published on the review branch `review/m0-documents-2026-11-16`** (byte-identical to
  the working branch; source commits `a8bbb06` → `bb498b3`). It is **verification, not application
  code**; do not import it. Run:
  `node docs/verification/rev9/rev9.mjs` (no deps; **136 tests, 253 assertions**; Section 4 covers C2/S1) and
  `node docs/verification/rev9/rev9-pglite.mjs` (needs `@electric-sql/pglite@0.5.16`).
  Three levels: scratch (single-process) / PGlite (single-connection) / real PostgreSQL multi-session
  (**NOT PERFORMED**). None is application-level financial validation.
- Accounting model (Rev 9): three **independently balanced domains** — MMK, Share, Claim-unit.
  Single-domain journals; no domain balances against another; committed atomically together.
- Unique economic events **E1–E9** (Rev 9 fixed the duplicated Rev-8 `E3`):
  E1 mispayment, E2 recognition, E3 collection, E4 realization, E5 write-off, E6 issuance,
  E7 reopening, E8 internal virtual-credit settlement, E9 retirement.
- Receivable lifecycle: recognize (`CorrectionReceivable D / PendingCorrectionClaim C`) ->
  collect (`UserAvailable:Bob D / CorrectionReceivable:Bob C`) -> realize
  (`PendingCorrectionClaim D / SettlementCorrection C`). Only **realized** funding backs units.
- **Issuance (E6) is ATOMIC with realization (E4) and reopening (E7)** — this is the Rev-9 fix:
  the Rev-8 E7 credited `SettlementCorrection` without reopening units (broke C1) and did not clear
  `PendingCorrectionClaim` (double-counted). Issuance cancels the outstanding claim
  (receivable and/or write-off loss), so `pending + corr` never exceeds the correction amount and a
  later collection cannot re-fund it. **The cancel order is F28 and is NOT APPROVED**: financial spec
  6.4a states two alternatives — Alt A (loss-first, the proposed recommendation) and Alt B
  (recv-first) — and selects neither.
- Write-off: owner-approved only, `CorrectionWriteOffLoss:M D / CorrectionReceivable:Bob C`
  (debit-normal loss). Unapproved write-off is rejected.
- C1 backing = `CollateralBucket + SettlementPayable + SettlementCorrection
  (+ CorrectionPayableMarket under Option A) = payout_per_share x ClaimUnitsRemaining`.
  `PendingCorrectionClaim` and `CorrectionReceivable` are **EXCLUDED** from C1.
  (`payout_per_share` is the fixed per-unit entitlement constant used by C1; the movement of E8 is
  **internal virtual-credit settlement**, never a cash payout.)
- Non-redeemable virtual credits; NO `Cash` asset; `CreditsIssued` contra-equity.
- Issuance to fund a correction remains an **OWNER DECISION (F14)**; not implemented.
- Verification labels: VERIFIED (scratch) / VERIFIED (PGlite) / VERIFIED (real PostgreSQL) /
  DOCUMENTED / RECOMMENDED / PROPOSED / OPEN / OWNER DECISION / NOT VERIFIED. **Real PostgreSQL
  multi-session concurrency remains unverified.** Do not mark designs VERIFIED without executed
  evidence. A passing scratch model does not prove the specification is correct.
- Recommended stack: Next.js App Router + TS + Tailwind + PostgreSQL/PGlite + Drizzle +
  Zod + Vitest/Playwright + key-based `en`/`my` i18n.
- PGlite VERIFIED for local/test (logic + constraints); real PostgreSQL needed for concurrency tests.
- First PR recommended: design tokens + app shell only (see architecture report Section 8).

### Commands
- `npm run dev` / `npm run build` / `npm run start`
- `npm run typecheck` (`tsc --noEmit`) / `npm run lint` (`eslint .`)
- `npm test` (vitest run) / `npm run test:e2e` (playwright) / `npm run db:generate` (drizzle-kit)

### Milestone 1 architecture (branch `milestone-1-foundation`)
- Next.js 16 App Router with **Cache Components** (`cacheComponents: true`). The root layout reads
  cookies for theme/locale, so it sets `export const instant = false` (blocking route). The home route
  is therefore dynamic (`ƒ`), which is intended.
- **`"use client"` is required** on every module that calls React hooks or `useTranslate` — providers
  (`src/i18n/locale-provider.tsx`, `src/lib/theme-provider.tsx`), state components
  (`src/components/states/async-states.tsx`), and all shell components. Missing it fails the build with
  "importing a module that depends on `useState` into a React Server Component".
- i18n is **key-based** with `en` as the source of truth; `my` must mirror the key set exactly (enforced
  by `tests/unit/i18n.test.ts`). `Dictionary` widens the `as const` literals to `string`.
- Theme/locale preferences are **cookie-driven** (`kh_theme`, `kh_locale`) so SSR is deterministic;
  `writeCookie` in `src/lib/preferences.ts` is the only cookie writer (React Compiler lint forbids
  inline global mutation in components).
- DB layer: `src/server/db/{schema,client,config,migrate}.ts`. `createDatabase` returns a
  driver-agnostic `DatabaseHandle` with `db` (Drizzle), `exec` (multi-statement script), and `close`.
  Migrations live in `src/server/db/migrations/*.sql`, use `IF NOT EXISTS` guards, and run via `exec`
  because Drizzle's `execute` wraps a **single** prepared statement.
- Tests: unit in `tests/unit/` (Vitest + jsdom, config `vitest.config.mts`); e2e in `e2e/`
  (Playwright, config `playwright.config.ts`, port 3210, chromium + mobile projects). Run e2e against a
  **fresh build** — `next start` serves the previous build, so rebuild before `test:e2e`.
- Design tokens live in `src/app/globals.css` (jade primary, gold accent, `[data-theme="dark"]`),
  exposed to Tailwind via `@theme inline`. Use `kh-container` / `kh-my` utilities.

### Git access and publication status
- Repo: https://github.com/0xmingalaba/khanthman-openhands (default branch `main`, shallow clone).
- **Read access — verified** (`git ls-remote` works; remote refs visible).
- **Write access — verified for the credentials in use.** The documentation review branch
  **`review/m0-documents-2026-11-16`** was **successfully published** as a **new, non-`main` branch** and
  independently re-fetched to confirm it matches. Write access is established by this **non-destructive
  publication** — **never** by writing to `main` or force-pushing.
- **Review-branch publication history (verified against the live remote on 2026-11-16; publication-time
  snapshots — the review branch is mutable and its head may advance with later revisions):**
  - **Initial review publication:** `a6bf123e2cd6f71ce6626a47c920c84f2fc770aa` (`a6bf123`) — Revision 12
    documents published for independent review.
  - **Revision 12.2 publication:** `b2437c8459380353d67b394d4bf8f0905f976c57` (`b2437c8`).
  - **Revision 12.3 publication:** `7bca12dbbb5dc355a54fe2cc0dcb976e3eb56a47` (`7bca12d`).
  - **Revision 12.4 publication:** `67251addbab0c3bf19ac553b585b086a117ac893` (`67251ad`) — at this
    publication the branch was **4 commits ahead / 0 behind** the original `main` baseline.
  - **Original `main` baseline:** `f6c756701a49e2bd6c2574ae2d2bd498c22b3fc9` (`f6c7567`) — unchanged.
  - `a6bf123` is the **initial publication only**; it is **not** a claim about the live branch head.
    All rows above are **publication-time snapshots**; the review branch head is mutable and may advance.
- **`origin/main` — unchanged** (`f6c7567`); nothing merged; the working branch
  `milestone-0-discovery-architecture` is **separate** from the review branch and does **not** exist
  remotely.
- **Historical report (dated 2026-11-16, working-branch context; NOT current, superseded):** an earlier
  session reported `git push` failing with **HTTP 403** ("Permission ... denied"), with the credential
  helper and `$GITHUB_TOKEN` resolving to a **read-only** GitHub App / integration token. Retained
  **only** as a dated, branch-scoped historical record; it no longer describes the current state.
- Policy: **do not push to `main`**; use a feature/review branch.

### Dependency status (Milestone 1 branch — do not overstate)
- **Declared in `package.json` (M1):** runtime `next`, `react`, `react-dom`, `drizzle-orm`,
  `@electric-sql/pglite`, `pg`, `zod`; dev `@playwright/test`, `@tailwindcss/turbopack`,
  `@testing-library/*`, `@types/node` (^24), `@types/pg`, `@types/react`, `@types/react-dom`,
  `@vitejs/plugin-react`, `drizzle-kit`, `eslint`, `eslint-config-next`, `jsdom`, `tailwindcss`,
  `typescript`, `vitest`.
- **Installed and verified on `milestone-1-foundation`:** all gates pass — `npm run typecheck`,
  `npm run lint`, `npm test` (28 unit tests), `npm run build`, `npm run test:e2e` (22 e2e tests).
- **`@types/node` was bumped to `^24`** to resolve a Vitest peer conflict (runtime is Node 24).
- The **`milestone-0-discovery-architecture`** dependency description above (nothing installed) is a
  **dated snapshot of that branch only** and no longer describes this branch.
