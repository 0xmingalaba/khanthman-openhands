# Milestone 0 — Discovery & Architecture Report (Revision 3)

**Project:** Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)
**Repository:** https://github.com/0xmingalaba/khanthman-openhands
**Status:** DRAFT (Revision 3) — **awaiting product-owner review**
**Supersedes:** Revision 2 (2026-11-16)
**Companion:** `docs/FINANCIAL-SPECIFICATION.md` (Revision 3)
**Milestone:** still Milestone 0 — planning only. **No product features, auth, trading, ledger,
matching, settlement, schema, or migrations have been implemented.**

### Verification labels used throughout

| Label | Meaning |
| - | - |
| **VERIFIED** | An actual command/test was run and output observed (evidence quoted). |
| **DOCUMENTED** | Supported by a primary technical document (URL given). |
| **RECOMMENDED** | My professional recommendation. |
| **PROPOSED** | A design not implemented and not tested. |
| **OPEN** | Needs further investigation or an owner decision. |
| **OWNER DECISION** | Needs explicit product-owner approval. |

> **Honesty statement.** No application, schema, migration, ledger service, matching engine, or
> settlement code has been written. The only VERIFIED items are the scratch experiments in the
> financial spec's Appendix V and the primary sources cited. Everything else is PROPOSED.

---

## 1. Repository and Git verification (VERIFIED)

Run against the live local clone on 2026-11-16. **No secrets, tokens, or credential contents
are included.**

| Item | Value |
| - | - |
| Current branch | `milestone-0-discovery-architecture` |
| Current commit hash | `30cfa08e3a260f780f391f88bea63be338bb34f6` (`30cfa08`) |
| Commits ahead of `main` | **3** (`git rev-list --left-right --count main...HEAD` → `0 3`) |
| Commits behind `main` | 0 |
| Working tree | **clean** (no staged, unstaged, or untracked non-ignored files) |
| Remote | `origin` = `https://github.com/0xmingalaba/khanthman-openhands.git` (plain URL) |
| Branches | only `main` and `milestone-0-discovery-architecture` |
| Stashes / tags | none |
| Clone depth | **shallow** (`git rev-parse --is-shallow-repository` → `true`) |

### 1.1 Files changed in each commit

| Commit | Title | Files |
| - | - | - |
| `f6c7567` | Initial commit (pre-existing) | `README.md` (2 lines) |
| `1b185f4` | Milestone 0 discovery & architecture report | 19 files (see below) |
| `babc731` | record status + push blocker in AGENTS.md | `AGENTS.md` (+24) |
| `30cfa08` | Milestone 0 revision 2 | `AGENTS.md`, both `docs/*.md` |

`1b185f4` file list: `.gitignore`, `AGENTS.md`, `README.md` (modified),
`docs/FINANCIAL-SPECIFICATION.md`, `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md`,
`eslint.config.mjs`, `next.config.ts`, `package.json`, `package-lock.json`, `tsconfig.json`,
`public/{file,globe,next,vercel,window}.svg`, `src/app/{favicon.ico,globals.css,layout.tsx,page.tsx}`.

### 1.2 Direct answers

- **Is the `create-next-app` scaffold committed?** **VERIFIED: yes** — all 19 scaffold files are
  tracked, and they are **stock/unmodified** (the starter `page.tsx` and `layout.tsx` are
  untouched).
- **Was `AGENTS.md` added or modified?** **VERIFIED: added** in `1b185f4` (the `next dev`
  generated rules block), then **modified** in `babc731` and `30cfa08` (project notes).
- **Unexpected generated files?** **VERIFIED: none tracked.** Only `.next/`, `node_modules/`,
  and `next-env.d.ts` exist and are **git-ignored**; there are **zero** untracked non-ignored
  files.

### 1.3 Push status — not assumed

**VERIFIED: the three local commits are NOT pushed.** `origin/main` is still `f6c7567` and no
remote branch `milestone-0-discovery-architecture` exists. Per instruction I have **not pushed**
and will not without authorization. I am **not** asking you to paste a PAT into chat; options
(if you later authorize a push) are to grant the integration `contents: write` or supply a
credential out-of-band.

---

## 2. Product understanding (CONFIRMED)

Khant Hman is a Polymarket-style prediction market where users trade **virtual YES/NO shares**
about real-world events. Hard rules: **MMK only, whole Kyat**; **virtual credits only** (no
deposit/withdraw/payment/payout/redeem); **no fabricated data** (fixtures labelled SIMULATED);
**no admin dashboard**; **original branding**; **no version-based naming**.

---

## 3. UX research (DOCUMENTED)

Fetched 2026-11-16 from `docs.polymarket.com` (markdown) and `polymarket.com` (live HTML). Used
only as behavioural/UX reference; no Polymarket code, artwork, or trademarks will be used.

- **Homepage nav (live):** Trending · Combos · Perps · Breaking · New · Live · Politics · Sports
  · Crypto · Esports · Iran · Finance · Geopolitics · Tech · Elections · Culture · Economy ·
  Weather · Mentions · Art · More. Section **"Featured markets"**; cards show title, end date,
  outcome + probability + bar, volume, "+N more".
- **Markets & events:** event = question; market = binary YES/NO condition; multi-outcome = one
  event with several binary markets. — `https://docs.polymarket.com/concepts/markets-events.md`
- **Prices are probabilities; displayed price = spread midpoint (or last trade if spread wide).**
  — `https://docs.polymarket.com/concepts/prices-orderbook.md`
- **Split/Merge/Redeem.** — `https://docs.polymarket.com/concepts/positions-tokens.md`
- **Trading constraints (tick size, min notional).**
  — `https://docs.polymarket.com/market-data/market-details.md`
- **Fees `= C × feeRate × p × (1−p)`; makers fee-free; world-events fee-free.**
  — `https://docs.polymarket.com/trading/fees.md`
- **Resolution rules with source, end date, edge cases.**
  — `https://docs.polymarket.com/concepts/resolution.md`

---

## 4. Architecture

### 4.1 Stack (RECOMMENDED)

Next.js (App Router) · React · strict TypeScript · Tailwind CSS · **PostgreSQL** (PGlite for
local/test) · **Drizzle ORM** with versioned SQL migrations · Zod · Vitest + Playwright ·
key-based `en`/`my` i18n · Noto Sans Myanmar.

**VERIFIED:** the Next.js scaffold builds (`✓ Compiled successfully`); `drizzle-orm/pglite`
resolves (driver present).

### 4.2 PGlite suitability (VERIFIED, with an explicit limit)

**VERIFIED** by direct scratch testing (not product code):

| Capability | Result |
| - | - |
| Engine | PostgreSQL 18.6 (PGlite 0.5.16, wasm32) |
| Transactions, `CHECK` constraints | work (negative balance rejected) |
| `SELECT … FOR UPDATE`, `pg_advisory_xact_lock`, `SERIALIZABLE` | supported **syntax** |

**DOCUMENTED:** PGlite is intended for *"Unit and CI testing … a unique fresh Postgres for each
test"* and *"Local development … an alternative to a full local Postgres."*
(`https://pglite.dev/docs/about`)

**Limit (explicit):** PGlite is a **single-connection, single-process embedded** engine. It
**cannot reproduce real multi-session contention**. Therefore **PGlite evidence is never
presented as proof of real PostgreSQL multi-session concurrency.** Concurrency is tested on a
**real PostgreSQL server** (PROPOSED, not done).

### 4.3 PostgreSQL production compatibility (RECOMMENDED)

Because PGlite **is** PostgreSQL, the same SQL dialect/schema/constraints/migrations run in both.
Production uses a standard PostgreSQL server (managed vs self-hosted — OWNER DECISION). CI runs
migrations + integration tests against **both** PGlite and a real PostgreSQL server.

### 4.4 Ledger projections vs derived balances (RECOMMENDED)

The **ledger is the source of truth** (append-only). A **balance projection** row is maintained
**inside the same transaction** as the ledger entries, guarded by row locks; **reconciliation**
recomputes balances from the ledger and alerts on drift; tests assert **projection == derived**.

### 4.5 Locking and concurrency (RECOMMENDED)

All financial mutations run in one DB transaction, taking row locks in a **consistent order**;
`SELECT … FOR UPDATE` on balance/order rows; `pg_advisory_xact_lock(market_id)` around matching;
optimistic guards (`WHERE version = n`) where apt; idempotency keys on every mutating endpoint.
**Concurrency tests run on real PostgreSQL** (PROPOSED).

### 4.6 Market closure and cancellation races (RECOMMENDED)

| Race | Solution |
| - | - |
| Fill vs close | matching transaction locks the market row and re-checks `acceptingOrders`; abort if closed |
| Cancel vs fill | both lock the order row `FOR UPDATE`; cancellation releases only the unfilled remainder |
| Close vs close | guarded state transition (`WHERE status='open'`) so exactly one wins |
| Release vs release | release bounded by unfilled qty, under lock; a second release is a no-op |

The full closure/settlement lifecycle (10 steps, two-phase settlement, resumable batch) is in
the financial spec Part 4.

### 4.7 Authentication and production email recovery (RECOMMENDED)

Email + password, Argon2id, server-side sessions in `HttpOnly`+`Secure`+`SameSite` cookies,
server-side session validation, CSRF, rate limiting. Recovery: **development** surfaces reset
tokens in the UI/log (no email provider needed); **production** requires a transactional email
provider behind a small interface (OWNER DECISION). Reset tokens are single-use, short-lived,
hashed at rest; no account enumeration. *(OPEN: provider choice; phone/SMS requirement.)*

### 4.8 Migration recovery strategy (RECOMMENDED)

Versioned **forward-only** SQL migrations applied in order, recorded in a migration table, run
transactionally (Postgres supports DDL in transactions) so a failed migration rolls back.
Recovery = a **new** migration that corrects the issue (never hand-edit applied migrations).
Tests: apply all migrations to an empty DB **and** to a populated DB. Backups/restore defined
before production (OWNER DECISION).

### 4.9 Testing of constraints and financial invariants (RECOMMENDED)

- **Constraint tests:** SQL attempts to violate `CHECK (>= 0)`, `CHECK (price BETWEEN 1 AND 99)`,
  unique keys, FKs — each **must fail**. **VERIFIED** in PGlite for the `CHECK` mechanism
  (Appendix V of the financial spec); **PROPOSED** for the real schema (does not exist yet).
- **Invariant tests:** assert C1/C2/C3 and M1 after every operation class; attempt to violate C1
  and require failure.
- **Projection-vs-derived tests.**
- **Concurrency tests:** on **real PostgreSQL** (PROPOSED), covering the races in 4.6.
- **Property-style tests:** randomized split/trade/merge/cancel/settle sequences asserting all
  invariants after every step.

### 4.10 Module map (RECOMMENDED)

```
src/app/ (thin routes)   src/components/ (design system)   src/features/ (feature UI)
src/server/{auth,market,trading,positions,ledger,db,lib}    src/i18n/ (en,my)
tests/{unit,integration,e2e}   docs/
```

The UI is never authoritative for balances, prices, or calculations.

---

## 5. Database design (RECOMMENDED / PROPOSED)

Entities (PROPOSED, no schema exists): users, user_preferences, sessions, categories, events,
markets, outcomes, market_sources, resolution_records, orders, trades, positions, balances
(projection), **ledger_accounts, ledger_journals, ledger_entries**, idempotency_keys,
audit_logs, **settlement_payouts (unique key per market/user/resolution_version)**.

Integrity at the storage layer (PROPOSED): integer MMK `BIGINT` with `CHECK (>= 0)`; shares
`BIGINT` with `CHECK (>= 0)`; price `INT` with `CHECK (price BETWEEN 1 AND 99)`; append-only
ledger tables; unique keys for positions, idempotency, and settlement payouts; unique slugs;
FKs with explicit `ON DELETE`; indexes on hot paths; **one financial mutation = one transaction**.

---

## 6. Testing strategy (RECOMMENDED)

| Level | Tool | Runs against | Covers |
| - | - | - | - |
| Unit | Vitest | n/a | money math, ticks, quote/slippage, validation, i18n keys |
| Integration (logic/constraints) | Vitest + **PGlite** | PGlite | auth, sessions, market retrieval, order placement, matching logic, partial fills, reservation/release, positions, split/merge, ledger, idempotency, audit, constraint tests |
| Integration (concurrency) | Vitest + **real PostgreSQL** | Postgres server | row-lock races, closure/cancel races, simultaneous fills, double-spend attempts |
| Migration | dedicated | PGlite + Postgres | migrations apply to empty and populated DBs |
| E2E | Playwright | running app | navigation, search, filters, market detail, trading UI, portfolio, locale/theme switch, responsive, accessibility |
| Static | `tsc --noEmit`, ESLint, `next build` | n/a | typecheck, lint, production build |

**Reporting rule:** the QA report lists every command and result and names any **skipped** test
and why. A green `next build` is never proof of readiness.

---

## 7. Security strategy (RECOMMENDED)

Password hashing (Argon2id); server-side sessions; CSRF; rate limiting; Zod validation at every
boundary; safe output; no account enumeration; secrets in env only; audit logging; idempotency
and concurrency protection; resolution as a **named, audited operator action** (financial spec
Part 4/7); **append-only ledger**; and **collateralization asserted and reconciled**, not assumed
from double-entry (financial spec Part 5).

---

## 8. First PR scope (RECOMMENDED — unchanged in structure from Rev 2)

The smallest sensible first PR remains **PR-1: design tokens + app shell** (no data, no auth),
followed by small, ordered PRs. Full specification (exact files, exclusions, acceptance
criteria, tests) is retained from Revision 2:

| PR | Title | Scope | Tests |
| - | - | - | - |
| **PR-1** | Design tokens + app shell | `src/styles/tokens.css`, `globals.css`, `layout.tsx`, primitives (`Button`,`Input`,`Badge`,`Tabs`,`Container`), `ThemeToggle`, static placeholder home (EN+MY + disclosure), metadata | Vitest component test; Playwright smoke (load, theme toggle, no console errors) |
| PR-2 | i18n foundation | typed `en`/`my` dictionaries, locale provider/switch | key-parity; locale-switch E2E |
| PR-3 | Database foundation | Drizzle config, connection, migration runner, migration 0001 (non-financial tables) | migration tests (empty + populated); constraint tests |
| PR-4 | Auth | register/login/logout, Argon2id, sessions, guard, CSRF, rate limit, dev reset | auth/session/authorization/reset tests |
| PR-5 | Market discovery + detail (read-only) | home feed, categories, search, filters, cards, detail, states | retrieval tests; discovery + theming/localization E2E |
| PR-6 | Dev fixtures | deterministic, idempotent, labelled SIMULATED | seed idempotency; no-duplicate test |
| PR-7+ | Trading (**gated**) | order book, limit, market, 1-Tap, split/merge, ledger, positions, settlement — **only after financial spec approval** | invariant + concurrency suites |

No PR is created, merged, or deployed in this milestone.

---

## 9. Risk register (Revision 3)

| # | Risk | Likelihood | Impact | Mitigation | Tag |
| - | - | - | - | - | - |
| R1 | Burmese financial terminology quality | Med | High | glossary + fluent-speaker sign-off before release | OPEN |
| R2 | Burmese font rendering (stacked diacritics) | Med | Med | Noto Sans Myanmar, tested line-height, visual QA | RECOMMENDED |
| R3 | Matching correctness under concurrency | Med | High | row/advisory locks, consistent lock order, real-Postgres concurrency tests | RECOMMENDED |
| R4 | "No fabricated data" vs demo needs | Med | High | fixtures labelled SIMULATED everywhere | RECOMMENDED |
| R5 | Collateral not actually backed | Low | Critical | C1 assertion + reconciliation + dedicated tests (spec Part 5) | RECOMMENDED |
| R6 | PGlite mistaken for proof of concurrency | Med | High | explicit limitation; concurrency tests on real Postgres | VERIFIED (limitation) |
| R7 | Migration failure mid-deploy | Low | High | transactional forward-only migrations; empty+populated DB tests; backups | RECOMMENDED |
| R8 | Production email recovery unavailable | High | Med | provider-abstracted; dev-mode reset; provider decision before prod | OPEN |
| R9 | Scope creep into admin/ops | Med | Med | explicit scope; extension points only | RECOMMENDED |
| R10 | Real-money temptation | Low | High | hard separation; disclosure; no payment code paths | RECOMMENDED |
| R11 | Cross-outcome matching complexity | Med | Med | defer to a separately reviewed feature | OPEN |
| R12 | Slippage tolerance blocks legitimate fills | Med | Med | define unit; raise default; per-order control; show estimate (spec Part 6.4) | OWNER DECISION |
| R13 | Resolution correction after payout | Low | High | compensating entries + funding policy + audit (spec Part 7) | PROPOSED |
| R14 | Push blocked (read-only credentials) | High | Med | owner grants write or supplies credential out-of-band | VERIFIED |

---

## 10. Owner decision register (Revision 3)

### 10.1 Architecture / product

| ID | Decision | Recommended | Tag |
| - | - | - | - |
| AR1 | Stack (Next.js + TS + Tailwind + Postgres/PGlite + Drizzle + Zod + Vitest/Playwright) | approve | RECOMMENDED |
| AR2 | Auth model | email + password for MVP | OPEN |
| AR3 | Money model | integer MMK; integer shares; integer price ticks | RECOMMENDED |
| AR4 | Ledger | append-only double-entry + maintained projection + reconciliation | RECOMMENDED |
| AR5 | MVP market type | binary YES/NO only; multi-outcome later | OPEN |
| AR6 | Fixtures | deterministic, idempotent, labelled SIMULATED | RECOMMENDED |
| AR7 | i18n / theming | key-based `en`/`my`; light-first with tested dark mode | RECOMMENDED |
| AR8 | First PR | PR-1 (design tokens + app shell) | RECOMMENDED |
| AR9 | Production DB target | managed vs self-hosted Postgres | OPEN |
| AR10 | Email provider | choose before production | OPEN |

### 10.2 Financial — see the financial spec Part 8 (F1–F14).

---

## 11. Remaining technical questions

| ID | Question |
| - | - |
| T1 | Exact integer price grid: 100 MMK payout/1% vs 1,000/0.1% vs basis points? |
| T2 | MVP without cross-outcome matching, or with it? |
| T3 | Market-order partial-fill policy: fill-available vs FOK? |
| T4 | Slippage unit (relative % vs points) and default value? |
| T5 | Pre-settlement dispute window: none, or a hold period? |
| T6 | Which real-PostgreSQL environment runs concurrency tests in CI? |
| T7 | Production email provider; is SMS required? |
| T8 | Production DB hosting + backup/restore procedure? |
| T9 | Seed "market-maker" fixtures so the dev book is not empty? |
| T10 | Brand assets: does a logo exist, or should one be proposed? |
| T11 | Correction funding: may the platform issue extra virtual credits to cover a settlement mistake? |
| T12 | Settlement batch size / concurrency limit for Phase B? |

---

## 12. Change list — Revision 2 → Revision 3

**Financial specification**
1. **Rebuilt the accounting model.** Removed the phantom `Cash` account; `CreditsIssued` is a
   contra-equity source of virtual credits, not an asset. `MarketCollateral` is replaced by
   `CollateralBucket` — a **restricted virtual-credit bucket**, not a real asset.
2. Added a full **account catalogue** with type, normal side, and debit/credit semantics for both
   ledgers; added the global credit-conservation identity **M1**.
3. **Reworked every journal entry** and corrected the reservation-direction error in Rev 2.
4. **Corrected share accounting**: defined share-ledger account types/rules and added worked
   examples for split, escrow, partial fill, cancel/release, merge, transfer, and win/lose
   settlement; added identity **S1** (free + escrowed = ownership, no double count).
5. **Corrected settlement/closure**: added the explicit **10-step lifecycle** and resolved the
   Rev 2 "atomic vs per-user" contradiction with **two-phase settlement** (market-atomic
   recognition + resumable per-user payout with unique payout keys).
6. **Re-proved collateralization**: stated all assumptions (A1–A6), gave a per-operation
   preservation argument, and separated design argument / proposed constraints / tests-to-write /
   tests-actually-executed / non-existent implementation.
7. **Corrected market-order and pricing**: maximum-spend semantics, remainder return,
   partial-fill semantics, **relative-vs-point slippage** definition, quote-expiry interaction,
   and showed the 3% tolerance would **reject** the worked example (5.376%).
8. **Added resolution correction policy** for before/partial/after settlement, with compensating
   entries, funding, and audit.
9. **Applied accurate labels** everywhere; explicitly refused to treat PGlite as proof of
   multi-session concurrency.
10. Added **Appendix V** with exact commands and observed output for all local verification.

**Architecture report**
1. Revision 3 of both documents; refreshed Git verification (3 commits ahead, clean tree).
2. Kept the corrected PGlite limitation framing; added R6, R12, R13 risks.
3. Added settlement/correction cross-references; extended decision register (F1–F14) and
   technical questions (T1–T12).

---

## 13. Stop condition

Per instruction, this revision **stops here**. I have **not** started Milestone 1, added features,
implemented auth/trading/ledger/settlement, created schemas or migrations, modified financial
logic, or pushed/merged/deployed. I am **not** asking for permission to implement trading. I
await your independent review of Revision 3.
