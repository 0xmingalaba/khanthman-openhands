# Milestone 0 — Discovery & Architecture Report (Revision 2)

**Project:** Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)
**Repository:** https://github.com/0xmingalaba/khanthman-openhands
**Status:** DRAFT (Revision 2) — **awaiting product-owner review**
**Supersedes:** Revision 1 (2026-11-16)
**Companion document:** `docs/FINANCIAL-SPECIFICATION.md`
**Milestone:** still Milestone 0 — planning only. **No product features, no auth, no trading,
no migrations have been implemented.**

Tags used throughout:

- **VERIFIED** — confirmed by a command run or a primary source.
- **RECOMMENDED** — my professional recommendation; needs approval.
- **OPEN** — needs your input.
- **OWNER DECISION** — a product/financial choice only you can make.

> **What changed in Revision 2.** This revision responds to the owner's review. It adds:
> a full collateral/accounting model with ten worked examples and a backing proof
> (Financial Spec Part A); a corrected treatment of YES/NO pricing that does **not** assume
> `YES + NO = 100` (Part B); an integer-safe price-precision comparison (Part C); a worked
> multi-level market-order example (Part D); and a complete resolution/settlement
> specification (Part E). Here in the architecture report it adds: PGlite suitability and
> PostgreSQL production compatibility; ledger projections vs ledger-derived balances; locking
> and concurrency; closure/cancellation races; authentication and production email recovery;
> migration recovery; and constraint/invariant testing. The first PR is broken into small,
> independently reviewable PRs.

---

## 1. Repository and Git verification (VERIFIED)

Run against the live local clone on 2026-11-16. **No secrets, tokens, or credential contents
are included.**

| Item | Value |
| - | - |
| Current branch | `milestone-0-discovery-architecture` |
| Current commit hash | `babc73152262d7cbdd04300563dccdd175a18522` (`babc731`) |
| Commits ahead of `main` | **2** (`main` is at `f6c7567`; `git rev-list --left-right --count main...HEAD` → `0 2`) |
| Commits behind `main` | 0 |
| Working-tree status | **clean** ("nothing to commit") |
| Remote | `origin` = `https://github.com/0xmingalaba/khanthman-openhands.git` (plain URL, no embedded credentials) |
| Other branches | only `main` and `milestone-0-discovery-architecture` |
| Stashes / tags | none |
| Clone depth | **shallow** (`git rev-parse --is-shallow-repository` → `true`); history is "grafted" at `f6c7567` |

### 1.1 Files changed in each commit

**Commit `1b185f4`** — "docs: Milestone 0 discovery & architecture report" (19 files, +7,902 / −2):

```
.gitignore                                        (added)
AGENTS.md                                         (added)
README.md                                         (modified)
docs/FINANCIAL-SPECIFICATION.md                   (added)
docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md    (added)
eslint.config.mjs  next.config.ts  package.json  package-lock.json  tsconfig.json   (added)
public/{file,globe,next,vercel,window}.svg        (added)
src/app/{favicon.ico,globals.css,layout.tsx,page.tsx}   (added)
```

**Commit `babc731`** — "docs: record Milestone 0 status and GitHub push blocker in AGENTS.md"
(1 file, +24): `AGENTS.md` (appended a project section and the push-blocker note).

### 1.2 Specific questions you asked

- **Is the `create-next-app` scaffold committed?** **VERIFIED: yes.** All 19 scaffold files
  (config, `public/*.svg`, `src/app/*`, `package.json`, `package-lock.json`) are tracked. It is
  **stock, unmodified** `create-next-app` output (e.g. `src/app/page.tsx` still renders the
  Next.js starter page; `layout.tsx` still uses Geist fonts and the title "Create Next App").
- **Was AGENTS.md added or modified?** **VERIFIED: added** in `1b185f4` (the `next dev`-generated
  rules block), then **modified** in `babc731` (project notes + push-blocker note appended).
- **Any unexpected generated files?** **VERIFIED: no unexpected *tracked* files.** The only
  generated artifacts present are `.next/`, `node_modules/`, and `next-env.d.ts`, all correctly
  **git-ignored** (shown by `git status --porcelain --ignored` as `!!`). There are **zero**
  untracked non-ignored files.

### 1.3 Push status — not assumed

**VERIFIED: the two local commits have NOT been pushed.** `origin/main` is still at `f6c7567`
and no remote branch `milestone-0-discovery-architecture` exists. Per your instruction I have
**not pushed** and will not push without authorization. (Revision 1 recorded that all available
credentials are read-only integration tokens; that remains true and I am **not** asking you to
paste a PAT into chat — see Section 9 for options.)

---

## 2. Product understanding (CONFIRMED)

Unchanged from Revision 1. Khant Hman is a Polymarket-style prediction market where users trade
**virtual YES/NO shares** about real-world events. Hard rules: **MMK only, whole Kyat**;
**virtual credits only** (no deposit/withdraw/payment/payout/redeem); **no fabricated data**
(fixtures labelled SIMULATED); **no admin dashboard**; **original branding**; **no version-based
naming**.

---

## 3. UX research (VERIFIED against primary sources)

Fetched 2026-11-16 from `docs.polymarket.com` (markdown) and `polymarket.com` (live HTML). This
is behavioural/UX study only; no Polymarket code, artwork, or trademarks will be used.

Key verified facts used in the design:

- **Homepage nav (live):** Trending · Combos · Perps · Breaking · New · Live · Politics · Sports
  · Crypto · Esports · Iran · Finance · Geopolitics · Tech · Elections · Culture · Economy ·
  Weather · Mentions · Art · More. Sections include **"Featured markets"**; cards show title,
  end date, outcome + probability + bar, volume, and "+N more".
- **Markets & events:** an **event** is the question; each **market** is a **binary** condition
  with YES/NO outcomes; multi-outcome questions are one event containing several binary markets.
  (https://docs.polymarket.com/concepts/markets-events.md)
- **Prices are probabilities:** shares priced 0–1; displayed price is the **midpoint of the
  spread**, falling back to the last traded price when the spread is wide.
  (https://docs.polymarket.com/concepts/prices-orderbook.md)
- **Order book:** CLOB; bids/asks; spread; market vs limit; partial fills; all orders are limit
  orders. (same URL)
- **Split/Merge/Redeem:** split 1 collateral → 1 YES + 1 NO; merge the reverse; winners redeem.
  (https://docs.polymarket.com/concepts/positions-tokens.md)
- **Trading constraints:** minimum tick size; minimum order notional.
  (https://docs.polymarket.com/market-data/market-details.md)
- **Fees:** `fee = C × feeRate × p × (1 − p)`; makers fee-free; world-events fee-free.
  (https://docs.polymarket.com/trading/fees.md)
- **Resolution:** pre-defined rules with a source, end date, and edge cases.
  (https://docs.polymarket.com/concepts/resolution.md)

---

## 4. Architecture

### 4.1 Stack (RECOMMENDED)

Next.js (App Router) · React · strict TypeScript · Tailwind CSS · **PostgreSQL** (PGlite for
local/test) · **Drizzle ORM** with versioned SQL migrations · Zod · Vitest + Playwright ·
key-based `en`/`my` i18n · Noto Sans Myanmar.

**VERIFIED in this environment:** the Next.js scaffold builds (`✓ Compiled successfully`); the
Drizzle `pglite` driver resolves (`drizzle-orm/pglite` → `driver.js` present).

### 4.2 Is PGlite suitable for local development and integration testing? (VERIFIED)

**Yes, with clearly understood limits.** I tested PGlite directly (scratch dir, not the repo):

| Capability | Result |
| - | - |
| Engine | **PostgreSQL 18.6** (PGlite 0.5.16, wasm32) — VERIFIED |
| `BEGIN/COMMIT` transactions | works — VERIFIED |
| `CHECK (bal >= 0)` rejects negative | works — VERIFIED ("check constraint blocked negative balance") |
| `SELECT … FOR UPDATE` row locks | **supported** — VERIFIED |
| `pg_advisory_xact_lock(...)` | **supported** — VERIFIED |
| `BEGIN ISOLATION LEVEL SERIALIZABLE` | **supported** — VERIFIED |
| Two independent instances | independent — VERIFIED |

Official PGlite docs confirm the intended use: *"Unit and CI testing … perfect for unit tests
— you can have a unique fresh Postgres for each test"* and *"Local development … an alternative
to a full local Postgres."* (https://pglite.dev/docs/about)

**Limits to design around (RECOMMENDED):**
- PGlite is a **single-connection, single-process embedded** engine (no client/server sockets by
  default). It cannot, on its own, reproduce **true multi-connection concurrency** (two sessions
  racing on the same row). Therefore **concurrency behaviour must be tested against a real
  PostgreSQL server** (a container or a test instance), not PGlite alone. PGlite is used for
  fast unit/integration tests of *logic, constraints, and single-transaction atomicity*.
- Data lives in memory or a local directory; it is not a shared multi-writer database.

**Conclusion:** PGlite is **suitable for local dev and for integration tests of logic and
constraints**, and **must be paired with a real PostgreSQL server for concurrency tests**. This
is the split I recommend (Section 6).

### 4.3 PostgreSQL production compatibility (RECOMMENDED)

Because PGlite **is** PostgreSQL, the same SQL dialect, schema, constraints, and migrations run
in both. Production uses a standard PostgreSQL server (managed or self-hosted — OWNER DECISION
on target). Rules to keep the two aligned:
- Migrations are **plain SQL** applied by Drizzle-kit; the same files run in both.
- No PGlite-only extensions in production code paths; use core Postgres features only.
- A CI job runs the full migration + integration suite against **both** PGlite and a real
  PostgreSQL server, so dialect drift is caught early.

### 4.4 Ledger balance projections vs ledger-derived balances (RECOMMENDED)

**The question:** do we read a user's balance from a stored "balance" row (a *projection*), or
recompute it from the ledger each time (*derived*)?

| | Derived (sum the ledger) | Projection (stored balance row) |
| - | - | - |
| Correctness | Always consistent with history | Requires careful maintenance |
| Performance | Slower as history grows | Fast (single row read) |
| Concurrency | Naturally safe (append-only) | Needs locking on updates |
| Auditability | Excellent | Good, if reconciled |

**Recommendation:** use a **projection with a proof obligation**:
- The **ledger is the source of truth** (append-only).
- A **balance projection** row is maintained **inside the same transaction** as the ledger
  entries, guarded by row locks, so it can never drift from the ledger within a transaction.
- **Periodic reconciliation** recomputes balances from the ledger and alerts on any mismatch.
- Tests assert **projection == derived** after every operation class.

This gives fast reads and a ledger that remains authoritative and auditable. (This is also what
makes the "double-entry is not proof of collateralization" point testable — see the Financial
Spec Part A.6.)

### 4.5 Locking and concurrency (RECOMMENDED)

- **All financial mutations run in a single DB transaction** that takes row locks in a
  **consistent order** (e.g. by ascending account/market id) to avoid deadlocks.
- **Row locks** (`SELECT … FOR UPDATE`) on the balance rows, the order rows being matched, and
  the market row when needed.
- **Advisory locks** (`pg_advisory_xact_lock`) keyed by market for the matching loop, so two
  matching runs cannot interleave on the same book. (VERIFIED: advisory locks work in PGlite.)
- **Optimistic guards** where appropriate (`UPDATE … WHERE version = n`).
- **Idempotency keys** on every mutating endpoint to make retries safe.
- **Concurrency tests run against real PostgreSQL** (per 4.2), including two simultaneous
  buys competing for the same resting order and two simultaneous cancels.

### 4.6 Market closure and cancellation race conditions (RECOMMENDED)

A market can close (by time or by resolution) while orders are open. Races to handle:
1. **Fill vs close** — an order that is mid-match when the market closes. **Solution:** the
   matching transaction locks the market row and **re-checks market status**; if not
   `acceptingOrders`, it aborts the fill.
2. **Cancel vs fill** — a user cancels an order the same instant it fills. **Solution:** both
   paths lock the order row `FOR UPDATE`; whoever gets the lock first wins, and the other sees
   the new state (filled qty) and acts accordingly. Cancellation only releases the **unfilled**
   remainder.
3. **Close vs close** — the scheduled close and a resolution both trying to close the market.
   **Solution:** a **guarded state transition** (`UPDATE … WHERE status = 'open'`) so exactly
   one wins; the other is a no-op.
4. **Release vs release** — double release of a reservation. **Solution:** release is bounded by
   the unfilled quantity and the reservation row is updated under lock; a second release finds
   nothing to release.

### 4.7 Authentication and production email recovery (RECOMMENDED)

- **Auth model (RECOMMENDED):** email + password, Argon2id hashing, server-side sessions in
  `HttpOnly`+`Secure`+`SameSite` cookies, server-side session validation on every protected
  route, CSRF protection, and rate limiting. (Phone login deferred — OPEN.)
- **Account recovery, two modes:**
  - **Development:** reset tokens are surfaced in the UI/log so flows are testable **without an
    email provider**.
  - **Production:** requires a **transactional email provider** (OWNER DECISION). Design keeps
    the provider behind a small interface so the MVP can ship in dev mode and a provider can be
    added without changing the domain. Reset tokens are **single-use, short-lived, hashed at
    rest**, and the flow does not reveal whether an email exists.
- **OPEN:** which email provider, and whether phone/SMS is required.

### 4.8 Migration recovery strategy (RECOMMENDED)

- Migrations are **versioned, forward-only SQL** files, applied in order, each recorded in a
  migration table.
- Every migration is written to be **idempotent-safe** where possible and **transactional**
  (Postgres supports DDL in transactions), so a failed migration rolls back cleanly.
- **Recovery:** if a migration fails mid-deploy, the transaction rolls back and the previous
  version stays live; forward recovery is a **new** migration that corrects the issue (we do not
  hand-edit applied migrations).
- **Test:** a dedicated job applies **all migrations to an empty DB** and asserts the schema is
  valid; a second job applies them to a copy of a "populated" DB to catch ordering issues.
- **Backups/restore** procedure is defined before production (OWNER DECISION on provider).

### 4.9 Testing of database constraints and financial invariants (RECOMMENDED)

- **Constraint tests:** direct SQL attempts to violate `CHECK (bal >= 0)`, `CHECK (qty >= 0)`,
  `CHECK (price BETWEEN 1 AND 99)`, unique keys, and foreign keys — each **must fail**.
  (VERIFIED in principle: the negative-balance `CHECK` was rejected by PGlite.)
- **Invariant tests:** assert C1–C8 from the Financial Spec after every operation class; attempt
  to violate C1 (backing) and require failure.
- **Projection-vs-derived tests:** assert stored balances equal ledger-derived balances.
- **Concurrency tests:** run against **real PostgreSQL**, covering the races in 4.6.
- **Property-style tests:** randomized sequences of split/trade/merge/cancel/settle, asserting
  all invariants after every step.

### 4.10 Module map (RECOMMENDED, unchanged in spirit)

```
src/app/          routes (thin)          src/components/  design system
src/features/     feature UI            src/server/      domain services
  auth/ market/ trading/ positions/ ledger/ db/ lib/
src/i18n/         en, my dictionaries   tests/  unit/ integration/ e2e/
docs/             this report + financial spec
```

Rule: the UI is never authoritative for balances, prices, or calculations.

---

## 5. Database design (RECOMMENDED)

Entities: users, user_preferences, sessions, categories, events, markets, outcomes,
market_sources, resolution_records, orders, trades, positions, balances (projection),
ledger_accounts, ledger_journals, ledger_entries, idempotency_keys, audit_logs.

Integrity rules enforced at the storage layer (not just app code):
- Money `BIGINT` whole MMK with `CHECK (>= 0)`; shares `BIGINT` with `CHECK (>= 0)`; price
  `INT` with `CHECK (price BETWEEN 1 AND 99)`.
- Append-only ledger tables (no UPDATE/DELETE paths).
- Unique keys for (user, outcome) positions, idempotency keys, and (market, user) settlement
  payouts; unique slugs for events/markets.
- Foreign keys with explicit `ON DELETE` behaviour.
- Indexes on hot paths: market status/category/end date; order book (market, outcome, side,
  price); user orders/trades; ledger account/time.
- **Transaction boundary = one financial mutation** (balance + reservation + ledger + audit).

Column-level DDL is deferred to the migrations PRs, after the financial spec is approved.

---

## 6. Testing strategy (RECOMMENDED)

| Level | Tool | Runs against | Covers |
| - | - | - | - |
| Unit | Vitest | n/a | money math, ticks, quote/slippage logic, validation, i18n keys |
| Integration (logic/constraints) | Vitest + **PGlite** | PGlite | auth, sessions, market retrieval, order placement, matching logic, partial fills, reservation/release, positions, split/merge, ledger, idempotency, audit, constraint tests |
| Integration (concurrency) | Vitest + **real PostgreSQL** | Postgres server | row-lock races, closure/cancel races, simultaneous fills, double-spend attempts |
| Migration | dedicated | PGlite + Postgres | migrations apply cleanly to empty and populated DBs |
| E2E | Playwright | running app | navigation, search, filters, market details, trading UI, portfolio, locale/theme switch, responsive, accessibility |
| Static | `tsc --noEmit`, ESLint, `next build` | n/a | typecheck, lint, production build |

**Reporting rule:** the QA report lists every command and result and names any **skipped** test
and why. A green `next build` is never presented as proof of readiness.

---

## 7. Security strategy (RECOMMENDED)

Unchanged from Revision 1, plus: resolution authority is a **named, authenticated operator
action** (Financial Spec Part E); the ledger is **append-only**; and **collateralization is
asserted and reconciled**, not assumed from double-entry alone (Financial Spec Part A.6).
Passwords hashed (Argon2id); sessions server-side; CSRF; rate limiting; Zod validation at every
boundary; safe output; no account enumeration; secrets in env only; audit logging; idempotency
and concurrency protection.

---

## 8. First PR scope — revised (RECOMMENDED)

Revision 1 proposed one large "foundation" PR. Per your review, here is a sequence of **small,
independently reviewable PRs**, each with explicit scope, exclusions, acceptance criteria, and
tests. **None are created yet.**

### 8.1 Smallest sensible first PR — **PR-1: Design tokens + app shell (no data, no auth)**

**Why this first:** it is the least risky, most visible step, touches no financial code, and
establishes the design system everything else builds on. It can be reviewed purely on UX.

- **Scope (exact files):**
  - `src/styles/tokens.css` — colour/spacing/radii/type tokens for light + dark.
  - `src/app/globals.css` — Tailwind layers wired to tokens; Myanmar font variables.
  - `src/app/layout.tsx` — root layout: font setup (incl. Noto Sans Myanmar), theme attribute.
  - `src/components/` — first primitives: `Button`, `Input`, `Badge`, `Tabs`, `Container`.
  - `src/components/theme/ThemeToggle.tsx` — light/dark toggle (client).
  - `src/app/page.tsx` — a **static** placeholder home (brand name in EN + MY, disclosure).
  - `src/app/layout` metadata — title "Khant Hman Prediction Market / ခန့်မှန်း ဈေးကွက်".
- **Explicit exclusions:** no database, no auth, no markets, no trading, no i18n framework
  beyond a minimal placeholder, no fixtures.
- **Acceptance criteria:** builds and lints clean; light and dark both render; no horizontal
  overflow at 390/768/1366/1440 px; the virtual-credit disclosure is visible; Burmese text
  renders with correct line-height.
- **Automated tests:** a Vitest component test for `Button`/`Tabs`; a Playwright smoke test
  asserting the page loads, the theme toggle switches the theme, and no console errors.

### 8.2 Subsequent PRs (small, ordered)

| PR | Title | Scope | Key tests |
| - | - | - | - |
| **PR-2** | i18n foundation | Typed `en`/`my` dictionaries, locale provider, locale switch, Burmese glossary placeholder | key-parity test; locale-switch E2E |
| **PR-3** | Database foundation | Drizzle config, PGlite/Postgres connection, migration runner, **migration 0001** for non-financial tables (users, prefs, sessions, categories, events, markets, outcomes, sources) | migration test (empty + populated); constraint tests |
| **PR-4** | Auth | Register/login/logout, Argon2id, sessions, protected-route guard, CSRF, rate limit, dev-mode reset | auth integration tests; session/authorization tests; reset tests |
| **PR-5** | Market discovery + detail (read-only) | Home feed, categories, search, filters, market cards, market detail with outcomes/rules/sources/dates, empty/loading/no-results states, charts from **seeded** data | retrieval tests; discovery E2E; localization/theming E2E |
| **PR-6** | Dev fixtures | Deterministic, idempotent seed data labelled SIMULATED | seed idempotency test; "no duplicate on re-run" test |
| **PR-7+** | Trading (gated) | Order book, limit, market, 1-Tap, split/merge, ledger, positions, settlement — **only after the financial spec is approved** | full invariant + concurrency suites |

Each PR is merged only with owner approval; none is merged or deployed in this milestone.

---

## 9. Risk register (revised)

| # | Risk | Likelihood | Impact | Mitigation | Tag |
| - | - | - | - | - | - |
| R1 | Burmese financial terminology quality | Med | High | Glossary + fluent-speaker sign-off before release | OPEN (OP-B) |
| R2 | Burmese font rendering (stacked diacritics) | Med | Med | Noto Sans Myanmar, tested line-height, visual QA | RECOMMENDED |
| R3 | Matching correctness under concurrency | Med | High | Row/advisory locks, consistent lock order, real-Postgres concurrency tests | RECOMMENDED |
| R4 | "No fabricated data" vs demo needs | Med | High | Fixtures labelled SIMULATED everywhere; never shown as live | RECOMMENDED |
| R5 | Collateral not actually backed (ledger balanced but unbacked) | Low | Critical | C1 assertion + reconciliation + dedicated tests (Fin. Spec A.6) | RECOMMENDED |
| R6 | PGlite ≠ production concurrency behaviour | Med | Med | Concurrency tests on real Postgres; PGlite for logic/constraints | VERIFIED/ RECOMMENDED |
| R7 | Migration failure mid-deploy | Low | High | Transactional forward-only migrations; empty+populated DB tests; backups before prod | RECOMMENDED |
| R8 | Production email recovery unavailable | High | Med | Provider-abstracted; dev-mode reset; provider decision before prod | OPEN (OP-C) |
| R9 | Scope creep into admin/ops | Med | Med | Explicitly out of scope; extension points only | RECOMMENDED |
| R10 | Real-money temptation | Low | High | Hard separation; disclosure; no payment code paths | RECOMMENDED |
| R11 | Cross-outcome matching adds complexity | Med | Med | Defer to a separately reviewed feature | OPEN (OP-D) |
| R12 | Push blocked (read-only credentials) | High | Med | Owner grants write or provides PAT out-of-band; do not paste in chat | VERIFIED |

---

## 10. Owner decision register (revised)

### 10.1 Architecture / product

| ID | Decision | Recommended | Tag |
| - | - | - | - |
| AR1 | Stack (Next.js + TS + Tailwind + Postgres/PGlite + Drizzle + Zod + Vitest/Playwright) | Approve | RECOMMENDED |
| AR2 | Auth model | Email + password for MVP | OPEN (OP-A) |
| AR3 | Money model | Integer MMK; integer shares; integer price ticks | RECOMMENDED |
| AR4 | Ledger | Append-only double-entry + maintained projection + reconciliation | RECOMMENDED |
| AR5 | MVP market type | Binary YES/NO only; multi-outcome later | OPEN (OP-D) |
| AR6 | Fixtures | Deterministic, idempotent, labelled SIMULATED | RECOMMENDED |
| AR7 | i18n / theming | Key-based `en`/`my`; light-first with tested dark mode | RECOMMENDED |
| AR8 | First PR | **PR-1 (design tokens + app shell)** | RECOMMENDED |
| AR9 | Production DB target | Managed vs self-hosted Postgres | OPEN (OP-E) |
| AR10 | Email provider | Choose before production | OPEN (OP-C) |

### 10.2 Financial (see the Financial Spec Part F)

| ID | Decision | Recommended | Tag |
| - | - | - | - |
| F1 | Payout per winning share | 100 MMK | OWNER DECISION |
| F2 | Price grid | 1–99 MMK (1%) | OWNER DECISION |
| F3 | Minimum order notional | 100 MMK | OWNER DECISION |
| F4 | Fees | None | OWNER DECISION |
| F5 | Quote expiry / slippage | 10 s / 3% | RECOMMENDED |
| F6 | Order types | GTC + optional GTD | RECOMMENDED |
| F7 | Cross-outcome matching in MVP | Defer | OPEN |
| F8 | Market-order partial-fill policy | Fill available, return unspent | OPEN |
| F9 | Resolution authority | Named audited operator, no UI | RECOMMENDED |
| F10 | Pre-settlement dispute window | None (or 24 h) | OPEN |
| F11 | New-user credit | 10,000 MMK | OWNER DECISION |
| F12 | "To Win" display | Gross payout; profit separate | OWNER DECISION |

---

## 11. Unresolved technical questions (explicit)

| ID | Question |
| - | - |
| T1 | Exact integer price grid: 100 MMK payout/1% (recommended) vs 1,000/0.1% vs bps? (gates all arithmetic) |
| T2 | MVP without cross-outcome matching, or with it? |
| T3 | Market-order partial-fill policy: fill-available vs FOK? |
| T4 | Pre-settlement dispute window: none, or a hold period? |
| T5 | Which real-PostgreSQL environment will run concurrency tests in CI? |
| T6 | Production email provider and whether SMS is required? |
| T7 | Production DB hosting target and backup/restore procedure? |
| T8 | Maximum slippage tolerance and quote window (defaults 3% / 10 s)? |
| T9 | Do we seed a small set of "market-maker" fixtures so the book is not empty in dev? |
| T10 | Brand assets: does a logo exist, or should one be proposed? |

---

## 12. Milestone roadmap (unchanged)

| Milestone | Scope | Gate |
| - | - | - |
| **0 (this)** | Discovery & architecture (Rev 2) | **Your approval** |
| 1 | Foundation (design system, shell, i18n, DB, migrations, tests) | Approval of AR1–AR8 |
| 2 | Auth & data | Approval of AR2, AR10, OP-A, OP-C |
| 3 | Market experience | Approval of AR5 |
| 4 | Trading | **Financial spec approved** |
| 5 | Portfolio | Milestone 4 stable |
| 6 | QA & release readiness | All prior |

---

## 13. Stop condition

Per your instruction, this revision **stops here**. I have **not** started Milestone 1, added
features, implemented auth/trading, created migrations, modified financial logic, or pushed,
merged, or deployed. I await your review of these two revised documents.
