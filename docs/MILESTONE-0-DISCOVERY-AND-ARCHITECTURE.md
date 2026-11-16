# Milestone 0 — Discovery & Architecture Report (Revision 6)

**Project:** Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)
**Repository:** https://github.com/0xmingalaba/khanthman-openhands
**Status:** DRAFT (Revision 6) — **awaiting product-owner review. NO APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 5 (2026-11-16)
**Companion:** `docs/FINANCIAL-SPECIFICATION.md` (Revision 6)
**Milestone:** still Milestone 0 — planning only. **Milestone 1 has NOT started.** **No product
features, auth, trading, ledger, matching, settlement, schema, or migrations have been implemented.**

### Verification labels

| Label | Meaning |
| - | - |
| **VERIFIED (scratch)** | A scratch model outside the repo was run; output observed. **Not** a product test. |
| **VERIFIED (PGlite)** | A scratch test ran against PGlite (PostgreSQL 18.6 WASM, **single connection**). Mechanism evidence only. |
| **VERIFIED (real PostgreSQL)** | Ran against a real PostgreSQL **server** with multiple sessions. **NONE PERFORMED.** |
| **DOCUMENTED** | Supported by a primary technical document (URL given). |
| **RECOMMENDED** | My professional recommendation. |
| **PROPOSED** | A design not implemented and not tested. |
| **OPEN** | Needs further investigation or an owner decision. |
| **OWNER DECISION** | Needs explicit product-owner approval. |
| **NOT VERIFIED** | Explicitly not established. |

> **Honesty statement.** No application, schema, migration, ledger, matching, settlement, or auth
> code has been written. **Scratch and PGlite results are not product tests. No real PostgreSQL
> multi-session concurrency has been verified.** Everything describing the product is PROPOSED.
> **Nothing in this document is approved.**

---

## 1. Repository and Git verification (VERIFIED)

Run against the live local clone on 2026-11-16. **No secrets, tokens, or credential contents are
included.** To avoid a self-referential stale hash, this table states facts true after this revision
is committed; the exact final commit hash is in the delivery message.

| Item | Value |
| - | - |
| Current branch | `milestone-0-discovery-architecture` |
| Commit sequence (oldest → newest) | `f6c7567` (initial) → `1b185f4` → `babc731` → `30cfa08` → `8eef5e4` → `1d408bf` → `502fda3` → `c2ea388` → `61a3f99` → **this revision's commit** |
| Commits ahead of `main` | one documentation commit per Milestone-0 revision plus small follow-ups; exact final count and hash are in the delivery message |
| Commits behind `main` | 0 |
| Working tree | **clean** after this revision is committed |
| Remote | `origin` = `https://github.com/0xmingalaba/khanthman-openhands.git` (plain URL, no embedded credentials) |
| `origin/main` | still `f6c756701a49e2bd6c2574ae2d2bd498c22b3fc9` — **nothing pushed** |
| Branches | only `main` and `milestone-0-discovery-architecture` |
| Stashes / tags | none |
| Clone depth | **shallow** (`git rev-parse --is-shallow-repository` → `true`) |

### 1.1 Files changed in each commit

| Commit | Title | Files |
| - | - | - |
| `f6c7567` | Initial commit (pre-existing) | `README.md` (2 lines) |
| `1b185f4` | Milestone 0 discovery & architecture report | 19 files (scaffold + `AGENTS.md` + both `docs/*.md`) |
| `babc731` | record status + push blocker in AGENTS.md | `AGENTS.md` |
| `30cfa08` | Milestone 0 revision 2 | `AGENTS.md`, both `docs/*.md` |
| `8eef5e4` | Milestone 0 revision 3 | `AGENTS.md`, both `docs/*.md` |
| `1d408bf` | Milestone 0 revision 4 | `AGENTS.md`, both `docs/*.md` |
| `502fda3`, `c2ea388` | revision-4 self-consistency fixes | `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` |
| `61a3f99` | Milestone 0 revision 5 | `AGENTS.md`, both `docs/*.md` |

### 1.2 Direct answers

- **Is the `create-next-app` scaffold committed?** **VERIFIED: yes** — all 19 scaffold files are
  tracked, **stock/unmodified**.
- **Was `AGENTS.md` added or modified?** **VERIFIED: added** in `1b185f4`, then **modified** in
  `babc731`, `30cfa08`, `8eef5e4`, `1d408bf`, `61a3f99`, and this revision.
- **Unexpected generated files?** **VERIFIED: none tracked.** Only `.next/`, `node_modules/`,
  `next-env.d.ts` exist and are git-ignored; **zero** untracked non-ignored files.

### 1.3 Push status — not assumed

**VERIFIED: local commits are NOT pushed.** `origin/main` is still `f6c7567`; no remote branch
`milestone-0-discovery-architecture` exists. A read-only access check on 2026-11-16 found the repo
**grants Contents write and Pull Requests write** (app `openhands-ai` installation), verified
without modifying the remote (`git push --dry-run`). **Nothing was pushed.** I am **not** asking you
to paste a PAT into chat.

---

## 2. Product understanding (CONFIRMED)

Polymarket-style prediction market trading **virtual YES/NO shares** about real-world events. Hard
rules: **MMK only, whole Kyat**; **virtual credits only** (no deposit/withdraw/payment/payout/
redeem); **no fabricated data** (fixtures labelled SIMULATED); **no admin dashboard**; **original
branding**; **no version-based naming**.

---

## 3. UX research (DOCUMENTED)

Fetched 2026-11-16 from `docs.polymarket.com` (markdown) and `polymarket.com` (live HTML). Used
only as behavioural/UX reference.

- **Homepage nav (live):** Trending · Combos · Perps · Breaking · New · Live · Politics · Sports ·
  Crypto · Esports · Iran · Finance · Geopolitics · Tech · Elections · Culture · Economy · Weather ·
  Mentions · Art · More. Section **"Featured markets"**; cards show title, end date, outcome +
  probability + bar, volume, "+N more".
- **Markets & events:** event = question; market = binary YES/NO; multi-outcome = one event with
  several binary markets. — `https://docs.polymarket.com/concepts/markets-events.md`
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

Next.js (App Router) · React · strict TypeScript · Tailwind · **PostgreSQL** (PGlite for
local/test) · **Drizzle ORM** with versioned SQL migrations · Zod · Vitest + Playwright · key-based
`en`/`my` i18n · Noto Sans Myanmar. **VERIFIED:** the scaffold builds; `drizzle-orm/pglite` resolves.

### 4.2 PGlite suitability (VERIFIED, with explicit limit)

**VERIFIED (scratch):** engine PostgreSQL 18.6 (PGlite 0.5.16); transactions, `CHECK` constraints,
and unique constraints work; a multi-journal correction committed atomically and rolled back cleanly.
**DOCUMENTED:** PGlite is intended for unit/CI testing and local development
(`https://pglite.dev/docs/about`).

**Limit (explicit):** PGlite is **single-connection, single-process** and **cannot** reproduce real
multi-session contention. **PGlite evidence is never presented as proof of real PostgreSQL
multi-session concurrency.**

### 4.3 PostgreSQL production compatibility (RECOMMENDED)

Because PGlite **is** PostgreSQL, the same SQL dialect/schema/constraints/migrations run in both.
Production uses a standard PostgreSQL server (managed vs self-hosted — OWNER DECISION). CI runs
migrations + integration tests against **both** PGlite and a real PostgreSQL server.

### 4.4 Three accounting domains (PROPOSED)

Three independently balanced domains — MMK, Share, Claim-unit — with single-domain journals
committed atomically in one DB transaction (financial spec Part 1). Balance projection and
reconciliation apply per domain; the **ledger is the source of truth**.

### 4.5 Atomic multi-journal correction (PROPOSED)

A correction is **one transaction** of several single-domain journals, asserted at its **commit
boundary**. Intermediate uncommitted states are **never observable** (transaction isolation) and
the application **must never commit a partial, invariant-breaking correction**. See financial spec
Part 6.6.

### 4.6 Locking and concurrency (RECOMMENDED)

One DB transaction per financial mutation; consistent lock order; `SELECT … FOR UPDATE` on
balance/order rows; `pg_advisory_xact_lock(market_id)` around matching; optimistic guards; idempotency
keys; unique payout/correction keys. **Concurrency tests run on real PostgreSQL** (PROPOSED, NOT
VERIFIED).

### 4.7 Market closure and cancellation races (RECOMMENDED)

| Race | Solution |
| - | - |
| Fill vs close | matching transaction locks the market row and re-checks `acceptingOrders` |
| Cancel vs fill | both lock the order row `FOR UPDATE`; cancel releases only the unfilled remainder |
| Close vs close | guarded transition (`WHERE status='open'`) so exactly one wins |
| Release vs release | release bounded by unfilled qty, under lock; a second release is a no-op |

### 4.8 Authentication and production email recovery (RECOMMENDED)

Email + password, Argon2id, server-side sessions (`HttpOnly`+`Secure`+`SameSite`), CSRF, rate
limiting. Recovery: **development** surfaces reset tokens in the UI/log; **production** requires a
transactional email provider behind a small interface (OWNER DECISION). *(OPEN: provider; SMS.)*

### 4.9 Migration recovery strategy (RECOMMENDED)

Versioned **forward-only** SQL migrations, recorded in a migration table, run transactionally.
Recovery = a **new** migration. Tests: apply to empty **and** populated DBs. Backups/restore before
production (OWNER DECISION).

### 4.10 Testing of constraints and financial invariants (RECOMMENDED)

- **Constraint tests:** violate `CHECK (>= 0)`, `CHECK (price BETWEEN 1 AND 99)`, unique keys, FKs —
  each **must fail**. **VERIFIED (PGlite)** for the mechanism; **PROPOSED** for the real schema.
- **Invariant tests:** assert C1, C1b, C2, S1, M1, and non-negativity at **every commit boundary**.
- **Correction tests:** Cases B–F with before/after balances; atomicity; rollback.
- **Settlement failure tests:** six modes, run on **real PostgreSQL** for the concurrency ones.
- **Property-style tests:** randomized sequences asserting all invariants after every step.

### 4.11 Module map (RECOMMENDED)

```
src/app/ (thin routes)   src/components/ (design system)   src/features/ (feature UI)
src/server/{auth,market,trading,positions,ledger,db,lib}    src/i18n/ (en,my)
tests/{unit,integration,e2e}   docs/
```

The UI is never authoritative for balances, prices, or calculations.

---

## 5. Database design (PROPOSED)

Entities (no schema exists): users, user_preferences, sessions, categories, events, markets,
outcomes, market_sources, resolution_records, **settlement_entitlements** (immutable),
orders, trades, positions, balances (projection), **ledger_accounts, ledger_journals,
ledger_entries** (tagged with **domain**), **settlement_payouts** (unique key), **corrections**
(unique key + `correction_seq`), idempotency_keys, audit_logs.

Integrity (PROPOSED): integer MMK `BIGINT` with `CHECK (>= 0)`; shares `BIGINT` with `CHECK (>= 0)`;
price `INT` with `CHECK (price BETWEEN 1 AND 99)`; claim units `INT` with `CHECK (>= 0)`;
**`CHECK (balance >= 0)` on every account balance** (verified in PGlite); a `CHECK`/trigger that a
journal's entries share **one domain**; append-only ledger/entitlement/audit tables; unique keys for
positions, idempotency, payouts, corrections; unique slugs; FKs with explicit `ON DELETE`; indexes;
**one financial mutation = one transaction**.

---

## 6. Testing strategy (RECOMMENDED)

| Level | Tool | Runs against | Covers |
| - | - | - | - |
| Unit | Vitest | n/a | money math, ticks, quote/slippage, validation, i18n keys |
| Integration (logic/constraints) | Vitest + **PGlite** | PGlite | auth, sessions, retrieval, orders, matching logic, partial fills, positions, split/merge, ledger, idempotency, audit, constraint tests, payout/correction key uniqueness, atomic multi-journal corrections |
| Integration (concurrency) | Vitest + **real PostgreSQL** | Postgres server | row-lock races, closure/cancel races, simultaneous fills, concurrent settlement workers, double-spend attempts |
| Migration | dedicated | PGlite + Postgres | migrations on empty and populated DBs |
| E2E | Playwright | running app | navigation, search, filters, market detail, trading UI, portfolio, locale/theme, responsive, accessibility |
| Static | `tsc --noEmit`, ESLint, `next build` | n/a | typecheck, lint, build |

**Reporting rule:** the QA report lists every command and result and names any **skipped** test and
why. A green `next build` is never proof of readiness.

---

## 7. Security strategy (RECOMMENDED)

Argon2id; server-side sessions; CSRF; rate limiting; Zod validation at every boundary; safe output;
no account enumeration; secrets in env only; audit logging; idempotency and concurrency protection;
resolution as a **named, audited operator action**; **append-only ledger and entitlement snapshot**;
**collateralization asserted and reconciled** (C1) at commit boundaries; **no unfunded deficit
disguised as collateral** (financial spec Part 7).

---

## 8. First PR scope (RECOMMENDED — unchanged from Rev 2–5)

| PR | Title | Scope | Tests |
| - | - | - | - |
| **PR-1** | Design tokens + app shell | tokens, `globals.css`, `layout.tsx`, primitives, `ThemeToggle`, static placeholder home (EN+MY + disclosure), metadata | Vitest component test; Playwright smoke |
| PR-2 | i18n foundation | typed `en`/`my` dictionaries, locale provider/switch | key-parity; locale-switch E2E |
| PR-3 | Database foundation | Drizzle config, connection, migration runner, migration 0001 (non-financial tables) | migration tests; constraint tests |
| PR-4 | Auth | register/login/logout, Argon2id, sessions, guard, CSRF, rate limit, dev reset | auth/session/authorization/reset tests |
| PR-5 | Market discovery + detail (read-only) | home feed, categories, search, filters, cards, detail, states | retrieval tests; discovery + theming/localization E2E |
| PR-6 | Dev fixtures | deterministic, idempotent, labelled SIMULATED | seed idempotency; no-duplicate test |
| PR-7+ | Trading (**gated**) | order book, limit, market, 1-Tap, split/merge, ledger (three domains), positions, settlement, corrections — **only after financial spec approval** | invariant + concurrency + settlement + correction suites |

No PR is created, merged, or deployed in this milestone.

---

## 9. Risk register (Revision 6)

| # | Risk | Likelihood | Impact | Mitigation | Tag |
| - | - | - | - | - | - |
| R1 | Burmese financial terminology quality | Med | High | glossary + fluent-speaker sign-off before release | OPEN |
| R2 | Burmese font rendering (stacked diacritics) | Med | Med | Noto Sans Myanmar, tested line-height, visual QA | RECOMMENDED |
| R3 | Matching correctness under concurrency | Med | High | row/advisory locks, consistent lock order, **real-Postgres** concurrency tests | RECOMMENDED |
| R4 | "No fabricated data" vs demo needs | Med | High | fixtures labelled SIMULATED everywhere | RECOMMENDED |
| R5 | Collateral not actually backed | Low | Critical | claim-based C1 at commit boundaries + reconciliation | RECOMMENDED |
| R6 | PGlite mistaken for proof of concurrency | Med | High | explicit limitation; concurrency tests on real Postgres | VERIFIED (limitation) |
| R7 | Migration failure mid-deploy | Low | High | transactional forward-only migrations; empty+populated DB tests | RECOMMENDED |
| R8 | Production email recovery unavailable | High | Med | provider-abstracted; dev-mode reset | OPEN |
| R9 | Scope creep into admin/ops | Med | Med | explicit scope; extension points only | RECOMMENDED |
| R10 | Real-money temptation | Low | High | hard separation; disclosure; no payment code paths | RECOMMENDED |
| R11 | Cross-outcome matching complexity | Med | Med | defer to a separately reviewed feature | OPEN |
| R12 | Slippage tolerance blocks legitimate fills | Med | Med | define unit; raise default; per-order control; show estimate | OWNER DECISION |
| R13 | Resolution correction after payout | Low | High | atomic correction + entitlement snapshot + funding policy + audit | PROPOSED |
| R14 | Push blocked | Low | Med | write access verified available (contents + PR write) | VERIFIED |
| R15 | Correction creates a hidden deficit | Low | High | `CorrectionReceivable` makes the deficit explicit; no negative balances | PROPOSED |
| R16 | Claim-unit drift between MMK and unit journals | Low | Critical | unit journal in the same transaction; C1b asserted each commit | PROPOSED |
| R17 | Cross-domain journal accidentally mixes units | Low | High | model + DB `CHECK` reject mixed-domain journals | PROPOSED |
| R18 | Real concurrency of settlement workers unproven | High | High | explicitly unverified; must run on real PostgreSQL before release | OPEN |
| **R19** | **C1 counts an uncollected receivable as backing, so an unfunded deficit looks collateralized** | Med | Critical | Policy A/B choice (F17); WARN + disclosure under Policy A; recommend Policy B | **OWNER DECISION** |
| **R20** | **Correction never completes because funding is never recoverable** | Med | Med | pending-correction state; reserve or disclosed loss (F18/F19) | **OWNER DECISION** |
| **R21** | **Additional issuance increases virtual-credit supply without owner approval** | Low | High | issuance strictly gated on F14; not implemented | **OWNER DECISION** |

---

## 10. Owner decision register (Revision 6)

### 10.1 Architecture / product

| ID | Decision | Recommended | Tag |
| - | - | - | - |
| AR1 | Stack | approve | RECOMMENDED |
| AR2 | Auth model | email + password for MVP | OPEN |
| AR3 | Money model | integer MMK; integer shares; integer price ticks | RECOMMENDED |
| AR4 | Ledger | append-only double-entry, three domains, projection + reconciliation | RECOMMENDED |
| AR5 | MVP market type | binary YES/NO only; multi-outcome later | OPEN |
| AR6 | Fixtures | deterministic, idempotent, labelled SIMULATED | RECOMMENDED |
| AR7 | i18n / theming | key-based `en`/`my`; light-first with tested dark mode | RECOMMENDED |
| AR8 | First PR | PR-1 (design tokens + app shell) | RECOMMENDED |
| AR9 | Production DB target | managed vs self-hosted Postgres | OPEN |
| AR10 | Email provider | choose before production | OPEN |
| AR11 | Entitlement snapshot retention | keep forever (append-only) | RECOMMENDED |
| AR12 | Domain tagging on ledger entries | store a `domain` column per entry | RECOMMENDED |
| **AR13** | **Correction funding policy (Policy A receivable-backed vs Policy B realized-funding-only)** | **Policy B** | **OWNER DECISION** |
| **AR14** | **`CHECK (balance >= 0)` on every account balance** | **adopt** | RECOMMENDED |

### 10.2 Financial — see the financial spec Part 10 (F1–F19).

---

## 11. Open technical questions

| ID | Question | Needs |
| - | - | - |
| T1 | Exact integer price grid? | OWNER DECISION |
| T2 | MVP without cross-outcome matching, or with it? | OWNER DECISION |
| T3 | Market-order partial-fill policy: fill-available vs FOK? | OWNER DECISION |
| T4 | Slippage unit (relative % vs points) and default value? | OWNER DECISION |
| T5 | Pre-settlement dispute window: none, or a hold period? | OWNER DECISION |
| T6 | May the platform issue extra virtual credits to fund a correction (F14)? | OWNER DECISION |
| T7 | Which real-PostgreSQL environment runs concurrency tests in CI? | OPEN |
| T8 | Production email provider; is SMS required? | OPEN |
| T9 | Production DB hosting + backup/restore procedure? | OPEN |
| T10 | Seed "market-maker" fixtures so the dev book is not empty? | OPEN |
| T11 | Brand assets: does a logo exist, or should one be proposed? | OPEN |
| T12 | Settlement batch size / concurrency limit for the payout phase? | OPEN |
| T13 | `CorrectionReceivable` recovery: automatic netting vs manual review? | OWNER DECISION |
| T14 | Must `SettlementCorrection` close at 0? | OWNER DECISION |
| **T15** | **Does C1 count an uncollected receivable as backing (F17)?** | **OWNER DECISION** |
| **T16** | **Treatment of an uncollectible receivable (F18)?** | **OWNER DECISION** |
| **T17** | **Fallback if issuance is not approved (F19)?** | **OWNER DECISION** |

---

## 12. Change list — Revision 5 → Revision 6

1. **Case F corrected**: one atomic transaction (establish funding → recover receivable → re-open
   units), with before/after balances, uncommitted intermediate states shown for explanation only,
   rollback, and C1/C1b/M1 at every commit boundary. Negative receivable now **forbidden** (scratch
   rejects; PGlite `CHECK`).
2. **Case F-issue corrected**: issuance + unit reopening atomic; `CreditsIssued` and supply increase
   shown; issuance kept as **OWNER DECISION (F14)**; alternative outcome documented.
3. **C1 clarification**: separated accounting balance, correction receivable, recoverable funding,
   additional issuance, and uncollectible receivable; answered the owner's eight questions; two
   policy alternatives (A/B) recorded as **F17 / AR13**.
4. **Market-buy example corrected**: explicit requested quantity; all ten quantities defined; the
   "not a partial fill" claim removed; policy remains **OPEN/OWNER DECISION**.
5. **Verification extended**: Revision 6 scratch model (22 checks) + PGlite mechanism test;
   registers updated (F1–F19, AR1–AR14, R1–R21, T1–T17).

---

## 13. Stop condition

Per instruction, this revision **stops here**. I have **not** started Milestone 1, added features,
implemented auth/trading/ledger/settlement, created schemas or migrations, modified financial logic,
or pushed/merged/deployed. **No financial specification approval is assumed.** I await your
independent review and explicit decisions on F14, F17, F18, and F19.
