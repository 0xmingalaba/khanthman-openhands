# Milestone 0 — Discovery & Architecture Report (Revision 9)

**Project:** Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)
**Repository:** https://github.com/0xmingalaba/khanthman-openhands
**Status:** DRAFT (Revision 9) — **awaiting product-owner review. NO APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 8 (2026-11-16)
**Companion:** `docs/FINANCIAL-SPECIFICATION.md` (Revision 9)
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
> code has been written. **Scratch and PGlite results are not product tests. Real PostgreSQL
> multi-session concurrency remains unverified.** Everything describing the product is PROPOSED.
> **Nothing in this document is approved.**

---

## 1. Repository and Git verification (VERIFIED)

Run against the live local clone on 2026-11-16. **No secrets, tokens, or credential contents are
included.** To avoid a self-referential stale hash, this table states facts true after this revision
is committed; the exact final commit hash is in the delivery message.

| Item | Value |
| - | - |
| Current branch | `milestone-0-discovery-architecture` |
| Commit sequence (oldest → newest) | `f6c7567` → `1b185f4` → `babc731` → `30cfa08` → `8eef5e4` → `1d408bf` → `502fda3` → `c2ea388` → `61a3f99` → `f1557dcac345eb4700138ddc0ee580da1a0511c3` → `5fb6e14e74b281980c43ccb36d003aac0ac0175e` → `b300f1aa5b72b5e02a59723df51e8eb8d022cc9c` → **this revision's commit** |
| Commits ahead of `main` | one documentation commit per Milestone-0 revision plus small follow-ups; exact final count and hash are in the delivery message |
| Commits behind `main` | 0 |
| Working tree | **clean** after this revision is committed |
| Remote | `origin` = `https://github.com/0xmingalaba/khanthman-openhands.git` (plain URL, no embedded credentials) — **canonical repository confirmed** |
| `origin/main` | still `f6c756701a49e2bd6c2574ae2d2bd498c22b3fc9` — **nothing pushed** |
| Branches | only `main` and `milestone-0-discovery-architecture` (the working branch does **not** exist remotely) |
| Stashes / tags | none |
| Clone depth | **shallow** (`git rev-parse --is-shallow-repository` → `true`) |

### 1.1 Files changed in each commit

Verified with `git show --stat`. **Revisions 6–8 file lists corrected.**

| Commit | Title | Files changed |
| - | - | - |
| `f6c7567` | Initial commit (pre-existing) | `README.md` (2 lines) |
| `1b185f4` | Milestone 0 discovery & architecture report | 19 files (scaffold + `AGENTS.md` + both `docs/*.md`) |
| `babc731` | record status + push blocker in AGENTS.md | `AGENTS.md` |
| `30cfa08` | Milestone 0 revision 2 | `AGENTS.md`, both `docs/*.md` |
| `8eef5e4` | Milestone 0 revision 3 | `AGENTS.md`, both `docs/*.md` |
| `1d408bf` | Milestone 0 revision 4 | `AGENTS.md`, both `docs/*.md` |
| `502fda3`, `c2ea388` | revision-4 self-consistency fixes | `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` |
| `61a3f99` | Milestone 0 revision 5 | `AGENTS.md`, both `docs/*.md` |
| `f1557dcac345eb4700138ddc0ee580da1a0511c3` | Milestone 0 revision 6 | `AGENTS.md`, `docs/FINANCIAL-SPECIFICATION.md`, `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (3 files) |
| `5fb6e14e74b281980c43ccb36d003aac0ac0175e` | Milestone 0 revision 7 | `AGENTS.md`, both `docs/*.md` (3 files) |
| `b300f1aa5b72b5e02a59723df51e8eb8d022cc9c` | Milestone 0 revision 8 | `AGENTS.md`, both `docs/*.md` (3 files) |
| *(this revision)* | Milestone 0 revision 9 | `AGENTS.md`, both `docs/*.md` |

**Shallow-clone limitation:** the clone is **shallow**, so historical file-change verification is
limited to the commits present locally (all listed above are present). The exact Revision 9 hash and
counts are reported in the delivery message.

### 1.2 Direct answers

- **Is the `create-next-app` scaffold committed?** **VERIFIED: yes** — all 19 scaffold files are
  tracked, **stock/unmodified**.
- **Was `AGENTS.md` added or modified?** **VERIFIED: added** in `1b185f4`, then modified in later
  revisions (including this one).
- **Unexpected generated files?** **VERIFIED: none tracked.** Only `.next/`, `node_modules/`,
  `next-env.d.ts`, `tsconfig.tsbuildinfo` exist and are git-ignored; **zero** untracked non-ignored
  files.

### 1.3 Push status — not assumed

**VERIFIED: local commits are NOT pushed.** `origin/main` is still `f6c7567`; the working branch does
**not** exist remotely. **No remote operation occurred in this revision.**

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
and unique constraints work; the corrected issuance group (MMK+UNIT) committed atomically and rolled
back cleanly. **DOCUMENTED:** PGlite is intended for unit/CI testing and local development
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
committed atomically in one DB transaction (financial spec Part 1).

### 4.5 Correction architecture (PROPOSED)

**Recommended (Option B):** no separately recognized correction-payable account; realized funding in
`SettlementCorrection:{m}` backs the reopened claim units via C1. **Alternative (Option A):** a
market-scoped control account `CorrectionPayableMarket:{m}` in C1 with a subledger.
**OWNER DECISION F20 / AR15 (unchanged in Revision 9).**

### 4.6 Correction lifecycle (PROPOSED, corrected in Rev 9)

Unique events **E1–E9**: mispayment, recognition, collection, realization, write-off, issuance,
reopening, payout, retirement. The **issuance group (E6+E4+E7) is atomic**: issuance creates funding,
cancels the outstanding claim (receivable or write-off loss), realizes funding, and reopens units —
so C1 holds and the obligation is never double-counted. **F27–F29.**

### 4.7 Atomic multi-journal correction (PROPOSED)

A correction is **one transaction** of several single-domain journals, asserted at its **commit
boundary**. Intermediate uncommitted states are **never observable** (transaction isolation) and the
application **must never commit a partial, invariant-breaking correction**.

### 4.8 Locking and concurrency (RECOMMENDED)

One DB transaction per financial mutation; consistent lock order; `SELECT … FOR UPDATE`; advisory
locks around matching; optimistic guards; idempotency keys; unique issuance/collection/payout/
correction keys. **Concurrency tests run on real PostgreSQL** (PROPOSED, NOT VERIFIED).

### 4.9 Market closure and cancellation races (RECOMMENDED)

| Race | Solution |
| - | - |
| Fill vs close | matching transaction locks the market row and re-checks `acceptingOrders` |
| Cancel vs fill | both lock the order row `FOR UPDATE`; cancel releases only the unfilled remainder |
| Close vs close | guarded transition (`WHERE status='open'`) so exactly one wins |
| Release vs release | release bounded by unfilled qty, under lock; a second release is a no-op |

### 4.10 Authentication and production email recovery (RECOMMENDED)

Email + password, Argon2id, server-side sessions (`HttpOnly`+`Secure`+`SameSite`), CSRF, rate
limiting. Recovery: **development** surfaces reset tokens in the UI/log; **production** requires a
transactional email provider behind a small interface (OWNER DECISION). *(OPEN: provider; SMS.)*

### 4.11 Migration recovery strategy (RECOMMENDED)

Versioned **forward-only** SQL migrations, recorded in a migration table, run transactionally.
Recovery = a **new** migration. Tests: apply to empty **and** populated DBs. Backups/restore before
production (OWNER DECISION).

### 4.12 Testing of constraints and financial invariants (RECOMMENDED)

- **Constraint tests:** violate `CHECK (>= 0)`, `CHECK (price BETWEEN 1 AND 99)`, unique keys, FKs —
  each **must fail**. **VERIFIED (PGlite)** for the mechanism; **PROPOSED** for the real schema.
- **Invariant tests:** assert C1, C1b, C2, S1, M1, and non-negativity at **every commit boundary**.
- **Correction tests:** recognition, collection, realization, write-off, issuance, reopening, payout;
  Path A and Path B; atomicity; rollback; idempotency.
- **Settlement failure tests:** six modes, run on **real PostgreSQL** for the concurrency ones.
- **Property-style tests:** randomized sequences asserting all invariants after every step.

### 4.13 Module map (RECOMMENDED)

```
src/app/ (thin routes)   src/components/ (design system)   src/features/ (feature UI)
src/server/{auth,market,trading,positions,ledger,db,lib}    src/i18n/ (en,my)
tests/{unit,integration,e2e}   docs/
```

The UI is never authoritative for balances, prices, or calculations.

---

## 5. Database design (PROPOSED)

Entities (no schema exists): users, user_preferences, sessions, categories, events, markets,
outcomes, market_sources, resolution_records, **settlement_entitlements** (immutable), orders,
trades, positions, balances (projection), **ledger_accounts, ledger_journals, ledger_entries**
(tagged with **domain**), **settlement_payouts** (unique key), **corrections** (unique key +
`correction_seq`), **collections**, **issuances**, **writeoffs** (each with idempotency keys),
**correction_payables** (Option A; key `(market_id, resolution_version, user_id)`), idempotency_keys,
audit_logs.

Integrity (PROPOSED): integer MMK `BIGINT` with `CHECK (>= 0)`; shares `BIGINT` with `CHECK (>= 0)`;
price `INT` with `CHECK (price BETWEEN 1 AND 99)`; claim units `INT` with `CHECK (>= 0)`;
**`CHECK (balance >= 0)` on every account balance** (verified in PGlite); a `CHECK`/trigger that a
journal's entries share **one domain**; append-only ledger/entitlement/audit tables; unique keys for
positions, idempotency, payouts, corrections, collections, issuances, writeoffs, correction payables;
unique slugs; FKs with explicit `ON DELETE`; indexes; **one financial mutation = one transaction**.

---

## 6. Testing strategy (RECOMMENDED)

| Level | Tool | Runs against | Covers |
| - | - | - | - |
| Unit | Vitest | n/a | money math, ticks, quote/slippage, validation, i18n keys |
| Integration (logic/constraints) | Vitest + **PGlite** | PGlite | auth, sessions, retrieval, orders, matching logic, partial fills, positions, split/merge, ledger, idempotency, audit, constraint tests, key uniqueness, atomic multi-journal corrections, correction lifecycle |
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
disguised as collateral**.

---

## 8. First PR scope (RECOMMENDED — unchanged from Rev 2–8)

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

## 9. Risk register (Revision 9)

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
| R14 | Push blocked | Low | Med | write access verified available; nothing pushed | VERIFIED |
| R15 | Correction creates a hidden deficit | Low | High | `PendingCorrectionClaim` excluded from C1; no negative balances | PROPOSED |
| R16 | Claim-unit drift between MMK and unit journals | Low | Critical | unit journal in the same transaction; C1b asserted each commit | PROPOSED |
| R17 | Cross-domain journal accidentally mixes units | Low | High | model + DB `CHECK` reject mixed-domain journals | PROPOSED |
| R18 | Real concurrency of settlement workers unproven | High | High | explicitly unverified; must run on real PostgreSQL before release | OPEN |
| R19 | C1 counts an uncollected receivable as backing (Policy A) | Med | Critical | Policy A/B choice (F17); disclosed under Policy A | OWNER DECISION |
| R20 | Correction never completes because funding is never recoverable | Med | Med | pending-correction state; issuance or disclosed loss (F18/F19/F26) | OWNER DECISION |
| R21 | Additional issuance increases virtual-credit supply without approval | Low | High | issuance strictly gated on F14; not implemented | OWNER DECISION |
| R22 | Option A control account and its subledger drift apart, silently breaking C1 | Low | Critical | tie-out assertion each commit; recommend Option B (F20) | OWNER DECISION |
| R23 | A correction payable is recognized but its backing is spent elsewhere | Low | High | Option B has no payable account; Option A keeps the control inside C1 | PROPOSED |
| R24 | Partial correction reopens an unfunded claim unit | Low | High | unfunded shortfall in `PendingCorrectionClaim` (excluded from C1); reopen only funded units (F21) | PROPOSED |
| R25 | Receivable recognition, collection and realization conflated | Med | High | eight events, each its own journal; only realization funds (F23) | PROPOSED |
| R26 | Realization commits without matching claim units, breaking C1 | Low | Critical | realization and reopening commit atomically (F24) | PROPOSED |
| R27 | A receivable is written off without owner approval, hiding a loss | Low | High | write-off requires explicit approval; unapproved rejected (F25) | OWNER DECISION |
| R28 | A correction stays pending forever with no resolution path | Med | Med | visible pending state; issuance or disclosed write-off (F26) | OWNER DECISION |
| **R29** | **Issuance funds a correction without reopening units (the Rev-8 E7 defect), breaking C1** | Med | Critical | issuance group (E6+E4+E7) atomic; C1 asserted each commit (F29) | **PROPOSED** |
| **R30** | **Issuance funds a correction while the claim remains outstanding, double-counting the obligation** | Med | Critical | issuance cancels the outstanding claim (receivable/loss); `pending+corr ≤ x` asserted (F28) | **PROPOSED** |
| **R31** | **A later collection re-funds an already issuance-funded correction** | Low | High | issuance cancels the receivable, so collection is rejected (R9-04) | **PROPOSED** |
| **R32** | **The write-off loss is silently erased by a later issuance** | Low | High | loss reversal is an explicit, committed journal; historical loss is never hidden (F27) | **OWNER DECISION** |

---

## 10. Owner decision register (Revision 9)

### 10.1 Architecture / product

| ID | Decision | Recommendation | Tag |
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
| AR13 | Correction funding policy (Policy A vs Policy B) | Policy B | OWNER DECISION |
| AR14 | `CHECK (balance >= 0)` on every account balance | adopt | RECOMMENDED |
| AR15 | Correction-payable representation: Option A vs Option B | Option B | OWNER DECISION |
| AR16 | Delayed correction payout as a separate transaction | supported | OWNER DECISION |
| AR17 | Receivable lifecycle: recognize → collect → realize as separate events | adopt | RECOMMENDED |
| AR18 | Write-off account `CorrectionWriteOffLoss:{m}` (debit-normal) and approval gate | adopt | RECOMMENDED |
| **AR19** | **Issuance group atomicity (E6+E4+E7) and cancellation target (receivable vs loss)** | adopt: atomic; cancel the outstanding claim | **OWNER DECISION** |

### 10.2 Financial — see the financial spec Part 10 (F1–F29).

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
| T14 | Must `SettlementCorrection` close at zero? | OWNER DECISION |
| T15 | Does C1 count an uncollected receivable as backing (F17)? | OWNER DECISION |
| T16 | Treatment of an uncollectible receivable (F18)? | OWNER DECISION |
| T17 | Fallback if issuance is not approved (F19)? | OWNER DECISION |
| T18 | Which correction-payable design (Option A or B, F20)? | OWNER DECISION |
| T19 | Are partial funding and partial claim-unit reopening permitted (F21)? | OWNER DECISION |
| T20 | Is delayed correction payout supported (F22)? | OWNER DECISION |
| T21 | When is the receivable recognized (F23)? | OWNER DECISION |
| T22 | Is the collect→realize→reopen group atomic (F24)? | OWNER DECISION |
| T23 | Write-off mechanics and `PendingCorrectionClaim` clearing (F25)? | OWNER DECISION |
| T24 | May a correction remain pending indefinitely (F26)? | OWNER DECISION |
| **T25** | **Which issuance path (Path A vs Path B) and what does issuance cancel (F27/F28)?** | **OWNER DECISION** |
| **T26** | **Is the issuance group atomic (F29)?** | **OWNER DECISION** |
| **T27** | **How is a partially written-off claim handled when issuance funds the remainder?** | **OPEN** |

---

## 12. Change list — Revision 8 → Revision 9

1. **E7 issuance defect corrected.** Issuance is now the atomic group **E6 (issue) + E4 (realize) +
   E7 (reopen)**: it creates funding, cancels the outstanding claim, realizes funding, and reopens the
   matching claim units, so **C1 holds** and the obligation is **not double-counted**.
2. **`PendingCorrectionClaim` reconciliation defined:** realization clears it; the sum
   `PendingCorrectionClaim + SettlementCorrection` never exceeds the correction amount.
3. **Duplicate `E3` event identifier fixed:** events renumbered uniquely **E1–E9**.
4. **Two issuance paths analysed** (Path A write-off→issuance, Path B issuance while outstanding) with
   complete journals and post-commit balances; **F27/F28/F29**, **AR19**, **R29–R32**, **T25–T27**.
5. **Verification extended:** Revision 9 scratch model (**75 test cases, 165 invariant assertions**;
   Rev-8 suite preserved) + PGlite mechanism test.
6. **Revision history corrected** to include `b300f1a` (Rev 8) and this revision's commit.

---

## 13. Stop condition

Per instruction, this revision **stops here**. I have **not** started Milestone 1, added features,
implemented auth/trading/ledger/settlement, created schemas or migrations, modified financial logic,
or pushed/merged/deployed. **No financial specification approval is assumed.** I await your
independent review and explicit decisions on F14, F16–F29, AR13, AR15–AR19.
