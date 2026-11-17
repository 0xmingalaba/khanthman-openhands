# Milestone 1 verification (application foundation)

Reproducible verification for the **Milestone 1 foundation** of Khant Hman Prediction Market
(ခန့်မှန်း ဈေးကွက်): the Next.js App Router shell, the bilingual (EN/MY) localization layer, the
light/dark design system, and the **non-financial** database foundation.

> **Scope.** Milestone 1 ships presentation and preferences only. There is **no trading, no
> ledger, no balances, no orders, no settlements**, and **no fabricated market data**. The home
> page renders an honest empty state. The database schema contains **no financial tables**.

## Environment (as run)

- **Node.js v24.22.2**
- **Next.js 16.4.6** (App Router, Turbopack, Cache Components)
- **React 19.3.0**, **TypeScript 5.9.3** (strict)
- **Tailwind CSS 4.3.3**
- **Drizzle ORM 0.45.4**, **@electric-sql/pglite 0.5.16** (PostgreSQL 18.x WASM)
- **Vitest 5.1.0** (jsdom), **@testing-library/react 16.3.0**
- **Playwright 1.65.1** (Chromium)
- Linux

## Commands and results

Run all commands from the repository root after `npm install`.

| Gate | Command | Result |
| - | - | - |
| Type check | `npm run typecheck` | `TypeScript: no errors` (exit 0) |
| Lint | `npm run lint` | `ESLint: no problems` (exit 0) |
| Unit tests | `npm test` | `4 files, 28 tests passed` (exit 0) |
| Production build | `npm run build` | Compiled successfully; `/` and `/_not-found` server-rendered (exit 0) |
| End-to-end | `npm run test:e2e` | `22 passed` (Chromium + mobile viewports, exit 0) |

Captured output for each gate is committed next to this file:
`typecheck.log`, `lint.log`, `vitest.log`, `build.log`, `playwright.log`.

## What the unit tests cover (28)

- **i18n parity and integrity** — every locale has a dictionary; `en` and `my` have identical key
  sets; no empty strings; interpolation; missing-key fallback to the key.
- **Preference resolution** — locale and theme validation, deterministic defaults, `cn` helper.
- **UI primitives** — `Button` (default `type="button"`, explicit type, disabled), `Badge`,
  `StatusBadge`, `Card`, `ProbabilityBar`, `CategoryChip` (disabled state), `MarketCard` (renders
  supplied fields and the SIMULATED label), `StatePanel`.
- **Database foundation (PGlite)** — migrations apply and are recorded; re-running is a no-op;
  the non-financial tables exist; **no financial tables exist**; the unique slug constraint holds.

## What the end-to-end tests cover (22)

- **Shell** — header, disclosure banner, main and footer render; skip-to-content link present;
  English app name by default; home shows the honest empty state (no fabricated cards).
- **Locale** — switching to Burmese sets `lang="my"` and shows the Burmese app name; the choice
  survives a reload; switching back restores English.
- **Theme** — toggling sets `data-theme="dark"` and survives a reload.
- **Navigation** — primary nav marks Home as current; not-yet-built areas are disabled and are
  **not** links; an unknown route returns HTTP 404 and renders the not-found state.
- Both a **desktop** (1280×800) and a **mobile** (390×780) viewport are exercised.

## Verification levels (do not conflate)

1. **Unit tests (jsdom)** — component and pure-logic behaviour in a simulated DOM. No browser.
2. **Migration mechanism tests (PGlite)** — a **single-connection** PostgreSQL 18.x (WASM) engine.
   They verify that migrations apply, that tables exist, and that a unique constraint holds. They
   **cannot** reproduce multi-session concurrency.
3. **End-to-end tests (Playwright)** — a real Chromium browser against a production `next start`
   build, covering rendering, localization, theming, and routing.
4. **Real PostgreSQL multi-session tests — NONE PERFORMED.** The production database provider is
   an **open owner decision**; multi-session concurrency remains **unverified**.

## Not in scope (and therefore not verified here)

- Trading, pricing, matching, order books, portfolios, positions.
- Ledger, balances, journals, settlements, corrections, payouts.
- Real money, deposits, withdrawals, payment processing (all permanently out of scope).
- Staff/Admin dashboard (excluded from the current scope).
- Any real market data, prices, volume, or activity.
