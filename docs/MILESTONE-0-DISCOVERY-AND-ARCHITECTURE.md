# Milestone 0 — Discovery & Architecture Report

**Project:** Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)
**Repository:** https://github.com/0xmingalaba/khanthman-openhands
**Report status:** DRAFT — awaiting product owner review and approval
**Prepared by:** OpenHands agent (AI), on behalf of the product owner
**Date:** 2026-11-16

> This report is the required Milestone 0 deliverable. **No substantial application
> code has been written.** The only code present is an unmodified `create-next-app`
> scaffold, created solely to verify that the recommended stack builds in this
> environment. All trading/financial logic is **deliberately not implemented** until
> the financial specification (Section 9) is approved.

---

## How to read this report

Every item is tagged with one of three statuses:

- **CONFIRMED** — explicitly required by the master build prompt.
- **RECOMMENDED** — my professional recommendation; needs your approval.
- **OPEN** — a decision that requires your input before work can proceed.

A consolidated decision register is in **Section 11**.

---

## 1. Repository verification

Verified before any work (commands run against the live clone):

| Check | Result |
| - | - |
| Remote `origin` fetch URL | `https://github.com/0xmingalaba/khanthman-openhands.git` — matches the canonical repo |
| Remote `origin` push URL | Same URL (push enabled) |
| Current branch | `main` (tracks `origin/main`) |
| Default branch on remote | `main` (`refs/remotes/origin/HEAD -> origin/main`) |
| History depth | Shallow clone (`git rev-parse --is-shallow-repository` → `true`) |
| Existing commits | Exactly one: `f6c7567 Initial commit` |
| Working tree at start | Clean, except the pre-existing `README.md` ("# khanthman-openhands / Prediction Market for Myanmar") |
| Other branches | None (only `main`) |

**Interpretation:** the repository is effectively empty — a single initial commit with a
two-line README. There is **no prior V1.0 source code, schema, or financial implementation
in this repository to inherit from.** The "build from scratch" requirement is therefore
naturally satisfied: there is nothing to migrate, reuse, or accidentally depend on. The
previous V1.0 work is referenced in the prompt as historical context only and is not present here.

### Work performed so far (and its justification)

To de-risk the architecture before you approve it, I created a stock Next.js scaffold
(`npx create-next-app`) and proved it builds:

```
Route (app)
┌ ○ /
└ ○ /_not-found
✓ Compiled successfully
```

I also proved the database recommendation works by running it in a scratch directory
(not in the repo): PGlite starts a real PostgreSQL engine and enforces transactional
integrity and constraints:

```
OK: check constraint blocked negative balance
PGlite version: PostgreSQL 18.6 (PGlite 0.5.16) on wasm32-unknown-emscripten
```

These two checks are the *only* code executed. The scaffold is plain `create-next-app`
output and contains **no product features**.

---

## 2. Product understanding

**CONFIRMED** — Khant Hman is a **prediction market** in the Polymarket style where users
trade **virtual YES/NO shares** about real-world events. Restating the rules I will hold
myself to, because they shape the whole design:

1. **Currency is MMK only.** Whole Myanmar Kyat. No Pya, no fractional MMK, no USD/USDT
   balances. Share quantities are **integer share counts**, not currency.
2. **Virtual credits only.** No deposits, withdrawals, payment processing, cash payouts,
   redemption, or KPay/WavePay. This must be disclosed prominently in the UI.
3. **No fabricated information.** No fake prices, volume, charts, activity, orders,
   executions, or resolution data presented as real. Development fixtures must be
   **clearly labelled as simulated**.
4. **No staff/admin dashboard** in this scope. The product is the ordinary user-facing app.
   (Design for future extensibility; do not build admin workflows now.)
5. **Original branding.** Khant Hman name, identity, and assets. Polymarket is a UX
   *reference*, not a source of artwork/trademarks/code.
6. **No version-based branding** ("V2.0" etc.).

### Core user journey (target)

Discover → open a market → understand the question and resolution rules → review
outcomes/prices/charts → buy or sell YES/NO → manage positions and open orders → track
portfolio and activity → follow resolution and settlement.

---

## 3. UX research findings (Polymarket)

**Source:** Polymarket's public documentation, fetched directly on 2026-11-16 from
`https://docs.polymarket.com/*` (markdown endpoints) and the live homepage
`https://polymarket.com`. This is a behavioural/UX study for reference only; no
Polymarket code, artwork, or trademarks will be copied.

### 3.1 Information architecture (navigation)

The live homepage navigation bar (extracted from the served HTML) is:

> Trending · Combos · Perps · Breaking · New · Live · Politics · Sports · Crypto ·
> Esports · Iran · Finance · Geopolitics · Tech · Elections · Culture · Economy ·
> Weather · Mentions · Art · More

And the homepage is organised into sections headed **"Featured markets"**, followed by
more market groupings. Each market card shows a title, a resolution date, one or more
outcome rows with a **percentage probability** and a price bar, and a **volume figure**
(e.g. `$3M Vol · 2 more`).

**Takeaways for Khant Hman:**
- A **compact top nav** with a small set of *status* tabs (Trending / New / Live) plus a
  scrollable set of **category** tabs, with a **"More"** overflow.
- Home = **Featured** row + **category-grouped** rows of compact cards.
- Cards carry: title, end date, outcome label(s) + probability + coloured bar, volume,
  and a "+N more" affordance for multi-outcome events.

### 3.2 Markets & events model

Per the docs (*Markets & Events*): an **event** is the question/topic shown to users;
each **market** is a resolvable **binary** condition with **Yes and No** outcomes. A
multi-outcome question (e.g. "Who will win?") is modelled as **one event containing
several binary markets**. Mutually exclusive groups are linked as a "negative-risk group".

### 3.3 Prices are probabilities

Per *Prices & Orderbook*: every share is priced between `$0.00` and `$1.00`, and **the
price directly represents the market's implied probability**. The displayed price is the
**midpoint of the bid-ask spread**, except when the spread is wider than `$0.10`, in which
case the **last traded price** is shown.

**Takeaway:** Khant Hman must adopt the same mental model, expressed in MMK: a YES share
priced `0.60` means 60% implied probability and pays out a fixed amount if correct.

### 3.4 Order book & trading

Per *Prices & Orderbook* and *Order Lifecycle*:
- **Central Limit Order Book (CLOB)**; prices emerge from supply and demand, not from the
  platform. Bids (buy) and asks (sell); the **spread** is the gap between best bid and ask.
- **Market orders** execute immediately at the best price; **limit orders** rest on the
  book and may **partially fill**.
- All orders are technically limit orders; a "market order" is a limit order priced to
  execute immediately.
- Order types: **GTC, GTD, FOK, FAK**, plus **post-only**.
- Order statuses: `live`, `matched`, `delayed`, `unmatched`. Trade statuses:
  `MATCHED → MINED → CONFIRMED` (with `RETRYING`/`FAILED`).
- **Maker vs taker**: price improvement benefits the taker.
- **Max order size** = balance − Σ(open order size − filled). Order size is limited by
  available balance minus amounts reserved by open orders.
- **Cancellation**: only the unfilled portion of a partially-filled order can be cancelled.

### 3.5 Split / Merge / Redeem

Per *Positions & Tokens*:
- **Split**: `1 unit of collateral → 1 Yes + 1 No`.
- **Merge**: `1 Yes + 1 No → 1 unit of collateral` (requires equal amounts).
- **Redeem** after resolution: winning shares pay out; losing shares pay `0`.
- A complete Yes/No set is backed by `1 unit` of collateral.

**Takeaway:** this is the exact mechanism behind the required **Split/Merge** feature.
In MMK terms, a complete YES/NO set is backed by a fixed MMK collateral amount.

### 3.6 Trading constraints

Per *Market Details*:
- A **minimum price increment (tick size)** — orders must be multiples of it
  (`0.1`, `0.01`, `0.005`, `0.0025`, `0.001`, `0.0001`).
- A **minimum order size** (minimum notional; smaller orders are rejected).
- Fees: a **taker fee** exists on some markets, calculated as
  `fee = C × feeRate × p × (1 − p)` where `C` = shares and `p` = price; **makers are never
  charged**; **geopolitical/world-events markets are fee-free** on Polymarket.

### 3.7 Market status & lifecycle

Per *Market Details*: `active`, `closed`, `acceptingOrders`, `archived`, `negRisk`,
`restricted`, plus `startDate`/`endDate`. A market may exist before its order book opens
and stay discoverable after it closes.

### 3.8 Resolution

Per *Resolution*: each market has **pre-defined resolution rules** specifying the
**resolution source**, the **end date**, and **edge cases**. Polymarket resolves via the
UMA optimistic oracle (propose → challenge → vote). Markets can resolve 50/50 in rare
"Unknown" cases, in which each share redeems for half.

**Takeaway:** even in a virtual-credit product, every market must display **clear
resolution rules, a resolution source, and key dates**, and the UI must warn users to read
the rules before trading.

### 3.9 Responsiveness & theming

Polymarket is a dense, information-rich, light-first interface with a carefully designed
dark mode. The master prompt's design direction (Section 4) matches this closely.

---

## 4. Recommended architecture (RECOMMENDED)

### 4.1 Stack

| Layer | Recommendation | Why |
| - | - | - |
| Framework | **Next.js (App Router) + React + strict TypeScript** | Preferred by the prompt; server-side APIs + React UI in one deployable. |
| Styling | **Tailwind CSS** + a small design-token layer | Maintainable, matches the compact Polymarket aesthetic, supports light/dark. |
| Database | **PostgreSQL**; **PGlite** for local dev & tests | Prompt's preference. PGlite is a WASM build of real Postgres, so local/test and production share one SQL dialect. **Verified working here (PostgreSQL 18.6).** |
| DB access | **Drizzle ORM + drizzle-kit** with **versioned SQL migrations** | Typed schema, plain-SQL migrations (auditable), no hidden magic. |
| Auth | **Owned email + password auth** with secure server-side sessions | See 4.4. No third-party identity dependency. |
| Money math | **Integer MMK** (whole Kyat) + integer share counts; a small money module with explicit invariants | Prompt requires whole MMK and integer shares; avoids float errors. |
| Validation | **Zod** schemas shared by API and forms | One source of truth for input validation. |
| Tests | **Vitest** (unit/integration) + **Playwright** (E2E) | Matches the prompt's test matrix. |
| i18n | **Key-based localization** (`en`, `my`) with a typed dictionary | Prompt forbids scattered hardcoded translations. |
| Fonts | **Noto Sans Myanmar** (UI) with correct Burmese line-height/rendering | Correct Burmese rendering. Package availability verified on npm. |

**All of the above are RECOMMENDED.** No infrastructure beyond a single Next.js app plus a
Postgres database is proposed — no queue, no cache, no microservices, no paid services.

### 4.2 Application layers (modular, separable)

```
src/
  app/                    # Next.js routes (pages + API route handlers) — thin
  components/             # reusable UI (design system)
  features/               # feature UI: discovery, market, trading, portfolio, account
  server/
    auth/                 # registration, login, sessions, CSRF, rate limiting
    market/               # market domain: query, status, resolution records
    trading/              # orders, matching, fills (GATED — not built until approved)
    positions/            # positions & balances (GATED)
    ledger/               # append-only double-entry ledger (GATED)
    db/                   # connection, schema, migrations
    lib/                  # money, idempotency, audit, errors
  i18n/                   # dictionaries + locale helpers
  styles/                 # design tokens, theme
tests/
  unit/ integration/ e2e/
docs/                     # this report + the financial specification
```

Rule: **UI never computes authoritative balances/prices.** All financial values come from
server-side services. Route handlers are thin; domain logic lives in `server/*`.

### 4.3 Domain model (conceptual)

- **User** (account) — 1:1 **Preferences** (locale, theme, timezone).
- **Session** — server-side session records for auth.
- **Category** — market taxonomy.
- **Event** — a question/topic; groups one or more **Markets**.
- **Market** — a resolvable binary condition with two **Outcomes** (YES/NO), a status,
  dates, description, **resolution rules**, and **resolution source(s)**.
- **Outcome** — label, and a reference to its tradable share instrument.
- **Order** — side (buy/sell), outcome, type (limit/market), price, quantity, filled
  quantity, status, timestamps, expiry.
- **Trade** (fill) — links a maker and taker order, price, quantity, timestamp.
- **Position** — per user/outcome share balance + cost basis.
- **Balance / Account** — user MMK balances: available and reserved.
- **LedgerAccount / Journal / Entry** — append-only double-entry records.
- **IdempotencyKey** — dedupe of mutating requests.
- **AuditLog** — append-only record of sensitive mutations.
- **ResolutionRecord** — recorded outcome + source + time for a resolved market.

### 4.4 Authentication (RECOMMENDED: email + password)

**Options considered:**

| Option | Pros | Cons | Verdict |
| - | - | - | - |
| Phone-only | Familiar in Myanmar; SMS is common | Requires an SMS gateway (cost, delivery reliability, SIM-farm abuse, no email recovery); no free path in dev | **Reject for MVP** |
| Email-only | No SMS cost; standard reset flow; easy to test | Some Myanmar users prefer phone | **Recommended** |
| Combined | Flexible | More surface area, more edge cases, more to secure | Defer |

**Recommendation:** **email + password for the MVP**, with a documented path to add phone
later. Specifics: strong password hashing (Argon2id or scrypt), **HttpOnly + Secure +
SameSite session cookies**, **server-side session validation** on every protected route,
**CSRF protection** for state-changing requests, **rate limiting** on auth endpoints, and a
**secure, expiring, single-use password-reset token** (reset links shown in the UI only in
development; no email provider required for the MVP — see OPEN items).

> **OPEN:** Is an email-only MVP acceptable, or is phone-based login a hard requirement?
> If phone is required, we need an SMS provider decision (cost + compliance).

### 4.5 Design system (RECOMMENDED)

- **Light-first**, white/near-white background; **carefully designed dark mode** with a
  user toggle (persisted in preferences).
- Compact typography scale, restrained accent colours, subtle separators — no heavy card
  backgrounds, no gradients, no gratuitous animation.
- A small token set: colour (bg/surface/text/muted/border/accent/positive/negative),
  spacing scale, radii, type scale, shadows (minimal).
- Reusable primitives: Button, Input, Select, Tabs, Badge, Table, Dialog, Tooltip, Toast,
  Skeleton, EmptyState, PriceBar, OutcomeRow, MarketCard, OrderBook, TradePanel.
- **Both themes must be verified** across charts, forms, menus, tables, dialogs.
- Burmese requires extra **line-height** and careful font fallback; the UI must not clip
  stacked diacritics.

### 4.6 Localization (RECOMMENDED)

- Two locales: **`en`** and **`my`**.
- **Key-based dictionary** (e.g. `market.buy`, `orderbook.bids`), typed so missing keys are
  compile errors.
- Locale switch in the header and in preferences; default follows the user preference,
  then browser, then English.
- **Burmese terminology is an OPEN item.** Financial terms must be reviewed by a fluent
  speaker; I will propose a glossary (see the Financial Specification appendix) but will not
  ship machine-translated financial terms as final.

---

## 5. Database design (RECOMMENDED)

PostgreSQL. Key integrity rules baked into the schema (not just application code):

- **Money is `BIGINT` whole MMK.** `CHECK (amount_mmk >= 0)` on balances and reservations so
  a negative balance is impossible at the storage layer (verified working in PGlite).
- **Share quantities are `BIGINT`** with `CHECK (qty >= 0)`.
- **Prices are integer ticks** (e.g. price in 1/100 of a unit, range `1..99`), never floats,
  so "prices are probabilities" and the YES+NO = 1 relationship are exact.
- **Ledger is append-only**: entries are never updated or deleted; balances are derived or
  maintained with a guarded update inside the same transaction as the journal.
- **Uniqueness**: one row per (user, outcome) position; one row per idempotency key; unique
  slugs for events/markets.
- **Foreign keys** with explicit `ON DELETE` behaviour; no orphaned financial rows.
- **Indexes** on the hot paths: market status/category/end-date, order book
  (market, outcome, side, price), user orders, user trades, ledger account/time.
- **Transaction boundaries**: every financial mutation is a single DB transaction covering
  balance change + reservation + ledger entries + audit row, so a failure leaves **no
  partial financial state**.

Entity list: users, user_preferences, sessions, categories, events, markets, outcomes,
market_sources, resolution_records, orders, trades, positions, balances (or accounts),
ledger_accounts, ledger_journals, ledger_entries, idempotency_keys, audit_logs.

> Detailed column-level DDL will be produced in Milestone 1 as versioned migrations, after
> the financial specification (Section 9) fixes the exact unit definitions.

---

## 6. Page & component inventory (CONFIRMED scope)

| Page | Route (proposed) | Key content |
| - | - | - |
| Home | `/` | Branding, nav, featured markets, trending, new, categories, search, compact listings |
| Discovery | `/markets` | Search, categories, status filter, sort, empty/loading/no-results states |
| Market detail | `/market/[slug]` | Question, category, status, YES/NO, price/probability, chart + timeframes, trading UI, order book, description, resolution rules + source, key dates, activity |
| Portfolio | `/portfolio` | Balances (total/available/reserved), positions (qty, avg entry), open orders + cancel, trade history, transaction history |
| Account | `/account` | Profile, preferences (language, theme), security/recovery |
| Auth | `/login`, `/register`, `/reset` | Register, login, logout, reset |
| Static | `/about`, `/terms`, `/disclaimer` | Virtual-credit disclosure, rules, legal |

Component inventory (design system + domain): see 4.5. Trading panel is a single component
with four modes (**1-Tap, Market, Limit, Split/Merge**), described in the financial spec.

---

## 7. Security strategy (RECOMMENDED)

- **Passwords:** Argon2id (preferred) or scrypt; per-user salt; password strength policy.
- **Sessions:** random high-entropy tokens stored server-side; cookie `HttpOnly`,
  `Secure`, `SameSite=Lax`; rotation on login; server-side expiry/revocation.
- **Authorization:** every protected route/handler checks the session **server-side**; the
  client is never trusted for identity, balances, prices, or calculations.
- **CSRF:** double-submit token / same-site cookie strategy for all state-changing calls.
- **Rate limiting:** per-IP and per-account on auth, order placement, and other mutations.
- **Input validation:** Zod at every boundary; reject unknown fields.
- **Output safety:** React auto-escaping; no `dangerouslySetInnerHTML` on user content.
- **Account recovery:** expiring, single-use, hashed reset tokens; no account enumeration.
- **Secrets:** environment variables only; `.env*` git-ignored; no secrets in the repo.
- **Audit logging:** append-only `audit_logs` for sensitive actions (auth, orders, ledger).
- **Idempotency & concurrency:** idempotency keys on mutations; row locks / guarded updates
  to prevent double-spend, oversell, duplicate execution, and bad reservation release.
- **Disclosure:** a clear, persistent statement that credits are **virtual, non-depositable,
  non-withdrawable, non-redeemable**, with no monetary value.

---

## 8. Testing strategy (RECOMMENDED)

| Level | Tool | Covers |
| - | - | - |
| Unit | Vitest | money math, price ticks, matching rules, quote expiry, validation, i18n keys |
| Integration | Vitest + PGlite | auth, sessions, authorization, market retrieval, order placement, matching & partial fills, cancellation, reservation/release, positions, split/merge, ledger, idempotency, concurrency, audit |
| E2E | Playwright | navigation, search, filters, market details, trading UI, portfolio, locale switch, theme switch, responsive layouts, accessibility |
| Static | `tsc --noEmit`, ESLint, `next build` | typecheck, lint, production build |
| Migration | dedicated test | migrations apply cleanly from empty DB and are repeatable |

**Financial invariants tested explicitly:** no negative balances; no duplicate execution;
no double spending; no overselling; no incorrect reservation release; failed transactions
leave no partial financial change; every financial mutation is auditable.

**Reporting rule:** the final QA report will list every command run and its result, and will
explicitly name any **skipped** test and the reason. A green `next build` alone will never be
presented as proof of readiness.

---

## 9. Financial specification (DRAFT for approval — CONFIRMED as a gate)

The prompt requires a complete financial specification **approved before any executable
trading is built.** I have drafted it as a **separate document** so it can be reviewed on
its own:

> **See `docs/FINANCIAL-SPECIFICATION.md`.**

It defines all 20 required topics (collateral units, share units, price range, payout,
YES/NO relationship, minimums, rounding, fees, reservation, escrow, matching, market-order
execution, slippage & quote expiry, partial fills, order expiry/cancellation, split/merge
conversion, status restrictions, resolution, settlement, and ledger invariants) — each with
**my recommendation plus alternatives and trade-offs**, and each awaiting your decision.

**No financial execution code will be written until you approve that document.**

---

## 10. Risks, dependencies, open questions

| # | Item | Type | Mitigation / note |
| - | - | - | - |
| R1 | Myanmar financial terminology quality | Risk | Propose a glossary; require fluent-speaker review before release. |
| R2 | Burmese font rendering (stacked diacritics) | Risk | Use Noto Sans Myanmar with tested line-height; visual QA at all breakpoints. |
| R3 | Matching-engine correctness (partial fills, concurrency) | Risk | Deterministic price-time priority; DB transactions + locks; exhaustive invariant tests. |
| R4 | "No fabricated data" rule vs. demo needs | Risk | Fixtures are labelled **SIMULATED** everywhere; seed data never masquerades as live. |
| R5 | Scope creep into admin/ops | Risk | Explicitly out of scope; keep extension points only. |
| R6 | Real-money temptation | Risk | Hard architectural separation; disclosure; no payment code paths at all. |
| D1 | Email delivery for reset (no provider yet) | Dependency | MVP shows reset in dev; production email provider is an OPEN decision. |
| D2 | Hosting/DB target for production | Dependency | Not chosen; MVP targets local PGlite/Postgres. |
| O1 | Email-only vs phone auth | OPEN | See 4.4. |
| O2 | New-user credit grant (10,000 MMK) | OPEN | Only if onboarding rules are defined and approved. |
| O3 | Fee model (none vs. taker fee) | OPEN | See financial spec. |
| O4 | Burmese glossary sign-off | OPEN | Needs a fluent reviewer. |
| O5 | Multi-outcome (event with several markets) in MVP | OPEN | Binary-only MVP recommended; multi-outcome later. |

---

## 11. Owner decision register

Please review and mark each: **Approved / Change / Reject**.

### CONFIRMED (from the prompt — no action needed)
- MMK-only, whole Kyat; virtual credits only; no fabrication; no admin dashboard; original
  branding; no version-based naming; the four trading modes; the page set; the test matrix.

### RECOMMENDED (need your approval)
| ID | Recommendation |
| - | - |
| RC1 | Stack: Next.js App Router + TS + Tailwind + PostgreSQL/PGlite + Drizzle + Zod + Vitest/Playwright. |
| RC2 | Auth: **email + password** for MVP (phone deferred). |
| RC3 | Money as integer MMK; prices as integer ticks; shares as integers (no floats). |
| RC4 | Append-only double-entry ledger; balances via guarded transactional updates. |
| RC5 | Binary YES/NO markets only for MVP; multi-outcome events later. |
| RC6 | Fixtures clearly labelled **SIMULATED**; deterministic and idempotent seeds. |
| RC7 | Light-first design with a real, tested dark mode; key-based `en`/`my` i18n. |
| RC8 | Full financial spec must be approved before any trading code (gate). |

### OPEN (need your decision)
| ID | Question |
| - | - |
| OP1 | Email-only MVP acceptable, or is phone login required? |
| OP2 | Approve a 10,000 MMK new-user virtual credit? If yes, define the onboarding rules. |
| OP3 | Fees: none, or a taker fee like Polymarket's? (See financial spec.) |
| OP4 | MVP scope: binary markets only, or include multi-outcome events? |
| OP5 | Preferred production hosting/DB target (affects deployment tasks later). |
| OP6 | Do you have a fluent Burmese reviewer for financial terminology? |
| OP7 | Brand assets: do you have a logo/mark, or should I propose an original one? |

---

## 12. Milestone roadmap

| Milestone | Scope | Gate |
| - | - | - |
| **0 (this report)** | Discovery & architecture | **Your approval** |
| **1 Foundation** | App foundation, design system, nav/layout, i18n, light/dark, DB access, migrations, reusable components, tests | Approval of RC1–RC4, RC7 |
| **2 Auth & data** | Register/login/logout, sessions, protected routes, preferences, dev fixtures | Approval of RC2, RC6, OP1, OP2 |
| **3 Market experience** | Home, discovery, search, categories, cards, market details, outcomes, charts, rules, activity | Approval of RC5 |
| **4 Trading** | Order book, limit, market, 1-Tap, split/merge, matching/fills, ledger, positions, settlement, cancellation, safeguards | **Financial spec approved (RC8)** |
| **5 Portfolio** | Portfolio, positions, balances, open orders, cancellation, history, settings, refinements | Milestone 4 stable |
| **6 QA & release readiness** | Responsive, light/dark, en/my, accessibility, security, DB integrity, financial invariants, concurrency, regression, E2E, readiness report | All prior |

---

## 13. Proposed first implementation PR (after your approval)

**Scope of the first PR (small, reviewable, no financial execution):**

1. Replace the default scaffold with the Khant Hman **design system**: tokens, light/dark
   theme, typography (incl. Myanmar font), core UI primitives.
2. **App shell**: header nav (status tabs + category tabs + search + locale/theme toggles),
   responsive layout, footer with the virtual-credit disclosure.
3. **Localization skeleton**: typed `en`/`my` dictionaries with a representative key set.
4. **Database foundation**: Drizzle config, connection (PGlite for dev/test), and the
   **first versioned migration** for the non-financial entities (users, preferences,
   sessions, categories, events, markets, outcomes, sources).
5. **Tests**: design-system unit tests, an i18n key-parity test, and a migration test that
   applies cleanly to an empty DB.
6. **Docs**: this report + the financial specification committed under `docs/`.

**Explicitly NOT in the first PR:** order book, matching, ledger, balances, split/merge,
or any executable trading. Those wait for financial-spec approval.

---

## 14. What I need from you to proceed

1. Review the **RECOMMENDED** items (RC1–RC8) and the **OPEN** questions (OP1–OP7).
2. Read and decide on **`docs/FINANCIAL-SPECIFICATION.md`** (Section 9) — this gates all
   trading work.
3. Approve (or amend) the **first PR scope** in Section 13.

Once you approve, I will proceed to Milestone 1 and open the first pull request.

---

*Sources for the UX research (fetched 2026-11-16):*
- https://docs.polymarket.com/polymarket-101.md
- https://docs.polymarket.com/concepts/markets-events.md
- https://docs.polymarket.com/concepts/prices-orderbook.md
- https://docs.polymarket.com/concepts/order-lifecycle.md
- https://docs.polymarket.com/concepts/positions-tokens.md
- https://docs.polymarket.com/concepts/resolution.md
- https://docs.polymarket.com/concepts/negative-risk.md
- https://docs.polymarket.com/market-data/market-details.md
- https://docs.polymarket.com/trading/fees.md
- https://polymarket.com (live homepage, for navigation/section structure)
