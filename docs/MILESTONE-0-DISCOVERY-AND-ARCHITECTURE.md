# Milestone 0 — Discovery & Architecture Report (Revision 12.4)

**Project:** Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)
**Repository:** https://github.com/0xmingalaba/khanthman-openhands
**Status:** DRAFT (Revision 12.4) — **delivered, awaiting explicit product-owner approval. NO APPROVAL
HAS BEEN GRANTED.** (Delivery is **not** owner acceptance.)
**Supersedes:** Revision 12.3 (2026-11-16)
**Companion:** `docs/FINANCIAL-SPECIFICATION.md` (Revision 12.4)
**Milestone:** still Milestone 0 — planning only. **Milestone 1 has NOT started.** **No product
features, auth, trading, ledger, matching, settlement, schema, or migrations have been implemented.**
**Revision 12.4 synchronizes the current Git publication references** (documentation only): it records the
Revision 12.3 publication (`7bca12d`) and the current review-branch head (`7bca12d`, **3 commits ahead**
of `main`) while preserving the labelled historical records (initial publication `a6bf123`, Revision 12.2
`b2437c8`). **No financial policy, account, journal, architecture direction, or owner decision was
changed.**

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

Run against the live local clone on **2026-11-16**. **No secrets, tokens, or credential contents are
included.** This section distinguishes two branches:

- the **original working branch** `milestone-0-discovery-architecture`, where the Revision 12 documents
  are **modified but uncommitted**; and
- the **separate documentation review branch** `review/m0-documents-2026-11-16`, where a **committed
  documentation-only snapshot** was published for independent review.

The Revision 12 documents therefore **have a committed hash only on the review branch**; on the working
branch they remain uncommitted.

| Item | Value |
| - | - |
| Observation date | **2026-11-16** (single observation; not a live feed) |
| Remote | `origin` = `https://github.com/0xmingalaba/khanthman-openhands.git` (plain URL, no embedded credentials) — **canonical repository confirmed** |
| `origin/main` | `f6c756701a49e2bd6c2574ae2d2bd498c22b3fc9` — **UNCHANGED; nothing merged or pushed to `main`** |
| Working branch | `milestone-0-discovery-architecture` — HEAD `bb498b30a8bf169a4d281adc9fd6626375dc8faa` (`bb498b3`); Revision 12 docs **uncommitted**; working tree **NOT clean** (four modified `.md`) |
| Working-branch commit sequence (oldest → newest) | `f6c7567` → `1b185f4` → `babc731` → `30cfa08` → `8eef5e4` → `1d408bf` → `502fda3` → `c2ea388` → `61a3f99` → `f1557dcac345eb4700138ddc0ee580da1a0511c3` → `5fb6e14e74b281980c43ccb36d003aac0ac0175e` → `b300f1aa5b72b5e02a59723df51e8eb8d022cc9c` → `8b6e3ea` → `a8bbb06` → `ec59879` → `9f1304d` → `bb498b3` (**HEAD**) |
| Working branch vs `main` | **16 ahead / 0 behind** `origin/main` |
| Review branch | `review/m0-documents-2026-11-16` — **published**; **current head `7bca12dbbb5dc355a54fe2cc0dcb976e3eb56a47` (`7bca12d`)**, a **documentation-and-evidence snapshot based on `origin/main`**; publication history: initial publication `a6bf123e2cd6f71ce6626a47c920c84f2fc770aa` (`a6bf123`, Revision 12) → `b2437c8` (Revision 12.2) → `7bca12d` (Revision 12.3); **3 commits ahead / 0 behind** `origin/main` |
| Branches (remote) | exactly `main` and `review/m0-documents-2026-11-16` (the working branch does **not** exist remotely) |
| Stashes / tags | none |
| Clone depth | **shallow** (`git rev-parse --is-shallow-repository` → `true`) |

### 1.1 Files changed in each commit

Verified with `git show --stat`. **Revisions 6–8 file lists corrected.**

| Commit | Title | Files changed |
| - | - | - |
| `f6c7567` | Initial commit (pre-existing) | `README.md` (2 lines) |
| `1b185f4` | Milestone 0 discovery & architecture report | 19 files: 15 stock `create-next-app` scaffold files + `AGENTS.md` + both `docs/*.md` |
| `babc731` | record status + push blocker in AGENTS.md | `AGENTS.md` |
| `30cfa08` | Milestone 0 revision 2 | `AGENTS.md`, both `docs/*.md` |
| `8eef5e4` | Milestone 0 revision 3 | `AGENTS.md`, both `docs/*.md` |
| `1d408bf` | Milestone 0 revision 4 | `AGENTS.md`, both `docs/*.md` |
| `502fda3`, `c2ea388` | revision-4 self-consistency fixes | `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` |
| `61a3f99` | Milestone 0 revision 5 | `AGENTS.md`, both `docs/*.md` |
| `f1557dcac345eb4700138ddc0ee580da1a0511c3` | Milestone 0 revision 6 | `AGENTS.md`, `docs/FINANCIAL-SPECIFICATION.md`, `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (3 files) |
| `5fb6e14e74b281980c43ccb36d003aac0ac0175e` | Milestone 0 revision 7 | `AGENTS.md`, both `docs/*.md` (3 files) |
| `b300f1aa5b72b5e02a59723df51e8eb8d022cc9c` | Milestone 0 revision 8 | `AGENTS.md`, both `docs/*.md` (3 files) |
| `8b6e3ea` | Milestone 0 revision 9 correction accounting | `AGENTS.md`, both `docs/*.md` |
| `a8bbb06` | Milestone 0 revision 9 review preparation | `AGENTS.md`, both `docs/*.md`, `docs/verification/rev9/*` |
| `ec59879` | Milestone 0 revision 9 independent-review corrections | `AGENTS.md`, both `docs/*.md`, `docs/verification/rev9/*` |
| `9f1304d` | Milestone 0 revision 10 (final-review corrections) | `AGENTS.md`, `README.md`, both `docs/*.md`, `docs/verification/rev9/README.md` |
| `bb498b3` | Milestone 0 revision 11 (C2 verification + consistency) | both `docs/*.md`, `AGENTS.md`, `docs/verification/rev9/*` |
| *(uncommitted)* | Milestone 0 revision 12 (roadmap restoration) — **not yet committed on the working branch** | both `docs/*.md`, `README.md`, `AGENTS.md` |
| `a6bf123` | **Initial review publication** — Milestone 0 revision 12 documents published for review (`review/m0-documents-2026-11-16`) | `AGENTS.md`, `README.md`, both `docs/*.md` |
| `b2437c8` | Milestone 0 revision 12.2 (independent-review corrections) — **documentation + verification evidence** | `AGENTS.md`, `README.md`, both `docs/*.md`, `docs/verification/rev9/*` |
| `7bca12d` | Milestone 0 revision 12.3 (final documentation-consistency corrections) — **documentation only** | `AGENTS.md`, `README.md`, both `docs/*.md` |
| *(this revision)* | Milestone 0 revision 12.4 (synchronize current Git publication references) — **documentation only** | `AGENTS.md`, `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md`, `docs/FINANCIAL-SPECIFICATION.md` |

**Shallow-clone limitation:** the clone is **shallow**, so historical file-change verification is
limited to the commits present locally (all committed rows above are present). **Revision 12 is
uncommitted on the working branch**, so it has **no commit hash there**; its working-branch file list is
a working-tree change set. The **review branch** carries committed snapshots (Revisions 12 and 12.2).

### 1.2 Direct answers

- **Is the `create-next-app` scaffold committed?** **VERIFIED: yes — on the working branch
  `milestone-0-discovery-architecture`** — the stock scaffold is tracked there and **unmodified**.
  Exactly **15** scaffold files are tracked (counted from `git ls-files`):

  `.gitignore`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `package-lock.json`,
  `tsconfig.json`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`,
  `public/window.svg`, `src/app/favicon.ico`, `src/app/globals.css`, `src/app/layout.tsx`,
  `src/app/page.tsx`.

  **Excluded from that count:** `AGENTS.md`, `README.md`, the two `docs/*.md` files, and the
  `docs/verification/rev9/*` files (documentation/verification, not scaffold). **Not counted because
  not tracked (git-ignored):** `node_modules/`, `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`.
  (The "19 files" figure for commit `1b185f4` = 15 scaffold + `AGENTS.md` + 2 docs + `README.md`
  modification, i.e. 15 scaffold files plus 4 documentation files.)
- **Is the scaffold present on the review branch?** **VERIFIED: no.** The review branch
  `review/m0-documents-2026-11-16` is a **documentation-only snapshot based on `origin/main`**; it
  contains **only the four Markdown documents** (plus the verification evidence added in Revision 12.2).
  It does **not** contain the Next.js scaffold. Do **not** claim the scaffold is present on the review
  branch.
- **Was `AGENTS.md` added or modified?** **VERIFIED: added** in `1b185f4`, then modified in later
  revisions (including this one).
- **Unexpected generated files?** **VERIFIED: none tracked.** Only `.next/`, `node_modules/`,
  `next-env.d.ts`, `tsconfig.tsbuildinfo` exist and are git-ignored; **zero** untracked non-ignored
  files.

### 1.3 Push status — read access, write access, and publication

**Historical snapshot (observation date 2026-11-16, on the working branch
`milestone-0-discovery-architecture`, before the review branch existed):** at that time **no commit had
been pushed** — `origin/main` was `f6c7567` and the working branch did **not** exist remotely. That
historical snapshot is retained here **only because it is labelled with its date and branch context**;
it is **superseded** by the publication below.

**Publication (verified against the live remote on 2026-11-16):** the documentation review branch
**was successfully published** to the canonical repository. `git ls-remote --heads origin` shows exactly
two remote heads: `f6c756701a49e2bd6c2574ae2d2bd498c22b3fc9 refs/heads/main` and
`7bca12dbbb5dc355a54fe2cc0dcb976e3eb56a47 refs/heads/review/m0-documents-2026-11-16`. `origin/main`
**remained unchanged** (`f6c7567`) throughout; nothing was merged and nothing was pushed to `main`.

**Review-branch publication history (do not conflate these commits):**

| Stage | Commit | Meaning |
| - | - | - |
| Initial review publication | `a6bf123e2cd6f71ce6626a47c920c84f2fc770aa` (`a6bf123`) | Revision 12 documents published for independent review |
| Revision 12.2 publication | `b2437c8459380353d67b394d4bf8f0905f976c57` (`b2437c8`) | Independent-review corrections (documentation + verification evidence) |
| Revision 12.3 publication | `7bca12dbbb5dc355a54fe2cc0dcb976e3eb56a47` (`7bca12d`) | Final documentation-consistency corrections (documentation only) |
| **Current review-branch head** | **`7bca12d`** | 3 commits ahead of `main`; **this is the current head** |
| Original `main` baseline | `f6c756701a49e2bd6c2574ae2d2bd498c22b3fc9` (`f6c7567`) | Unchanged; nothing merged |

**`a6bf123` is the initial publication only — it is NOT the current branch head.** The current head is
**`7bca12d`**.

**Git access evidence (precise):**

- **Read access — VERIFIED.** `git ls-remote --heads origin` returns the remote heads above. Remote
  URL: `https://github.com/0xmingalaba/khanthman-openhands.git` (no embedded credentials).
- **Write access — VERIFIED for the credentials in use.** The review-branch publications succeeded:
  the initial publication (`a6bf123`), the Revision 12.2 commit (`b2437c8`), and the Revision 12.3
  commit (`7bca12d`) were pushed to a **new, non-`main` branch**, and the remote branch was
  independently re-fetched and confirmed to match the local commits. Write access is established by
  these **successful, non-destructive publications** — **not** by force-pushing or by writing to `main`.
- **Historical report (labelled historical — prior session, date not re-established, working branch
  context; NOT re-tested here):** an earlier session reported `git push` failing with **HTTP 403**
  ("Permission … denied"), with both the git credential helper and `$GITHUB_TOKEN` resolving to a
  GitHub App / integration token with **read-only** access, and API writes returning
  `Resource not accessible by integration`. This is a **historical observation only** and is **no longer
  the current state** — it is superseded by the verified publications above.
- **Net current state:** read = verified; write = **verified** (review branch published through
  `7bca12d`); `origin/main` = **unchanged**; the historical 403 is retained **only** as a dated,
  branch-scoped historical record. Policy is unchanged: **never push to `main`; use a feature/review
  branch.**

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

### 3.1 Proposed page inventory (PROPOSED — planning artifact, not an approved specification)

Every item is **PROPOSED**. This is a **planning inventory**, not a product specification, and nothing
here is approved. Localization (EN + MY), theme (light/dark), responsive layout (desktop/tablet/mobile),
and loading/empty/error/unavailable states are **cross-cutting requirements for every page**. The
**Staff/Admin dashboard is explicitly excluded** from current scope.

The **Milestone** column is an assignment aligned with the **§3.3 owner-approved roadmap** and the
**§8 PR sequence**: shell/static pages → **M1**, authentication pages → **M2**, discovery/detail pages →
**M3**, the trading interface → **M4 (gated)**, and portfolio/orders/activity/settings → **M5**.
**M0–M6 is the owner-approved sequence** (restored in Revision 12); the milestone numbers here are
**not** new commitments beyond it.

| # | Page / surface | Route (proposed) | Key content | Milestone |
| - | - | - | - | - |
| P1 | Home / discovery | `/` | featured + trending market cards, category chips, locale & theme toggles | M1 (shell) / M3 |
| P2 | Categories | `/categories`, `/category/[slug]` | category grid → filtered market list | M3 |
| P3 | Search | `/search` (or query on P1) | query box, filters (category, status, close date), results | M3 |
| P4 | Market detail | `/market/[slug]` | question, outcome probabilities, price history chart, order book, resolution rules & source, end date | M3 |
| P5 | Event / multi-outcome (later) | `/event/[slug]` | several binary markets under one event | later (AR5) |
| P6 | Trading interface | within `/market/[slug]` | the four planned modes: order book, limit, market, 1-Tap; split/merge | M4 (gated) |
| P7 | Portfolio / positions | `/portfolio` | open positions, claim units, split/merge actions | M5 |
| P8 | Orders | `/orders` | open/historical orders | M5 |
| P9 | Activity | `/activity` | trade & settlement history (append-only view) | M5 |
| P10 | Authentication | `/login`, `/register` | email + password (AR2); recovery (AR10) | M2 |
| P11 | Account settings | `/settings` | profile, locale, theme, session management | M5 |
| P12 | Legal / disclosure | `/about`, `/terms`, `/disclosure` | "virtual credits only, no real money" disclosure | M1 (static) |
| P13 | Not found / error | `not-found`, `error` | standard Next.js states | M1 |

### 3.2 Proposed component inventory (PROPOSED — planning artifact)

Reusable UI (design-system) components — **all PROPOSED**, to be built in PR-1 onward. Burmese
terminology for user-facing strings is marked for fluent-speaker review (risk R1).

| Group | Components (proposed) |
| - | - |
| Layout & navigation | `AppShell`, `TopNav`, `SideNav`, `Footer`, `LocaleToggle`, `ThemeToggle`, `DisclosureBanner` |
| Market display | `MarketCard`, `MarketGrid`, `OutcomeRow`, `ProbabilityBar`, `CategoryChip`, `StatusBadge`, `CloseDate` |
| Data viz | `PriceHistoryChart`, `OrderBookTable`, `VolumeSparkline` (all must show **real** data or a SIMULATED label) |
| Trading (gated) | `TradePanel`, `LimitOrderForm`, `MarketOrderForm`, `OneTapTrade`, `SplitMergeControl` |
| Portfolio | `PositionRow`, `ClaimUnitRow`, `OrderRow`, `ActivityRow` |
| Forms & feedback | `TextInput`, `PasswordInput`, `Button`, `Dialog`, `Toast`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `UnavailableState` |
| Primitives | `Card`, `Tabs`, `Tooltip`, `Badge`, `Icon` |

### 3.3 Milestone roadmap (OWNER-APPROVED M0–M6 — restored in Revision 12)

**Milestone 0 documentation is delivered and awaiting explicit owner approval; Milestone 1 has NOT
started.** The milestone sequence below is the **owner-approved M0–M6 roadmap**, restored in Revision 12
(it was silently dropped in Revision 3 and replaced by an unapproved sequence in Revisions 10–11).
**No milestone is renumbered and no M7+ exists.** Trading and the ledger sit **inside M4**, strictly
behind financial-specification approval. **M1 has not started and requires owner authorization.**
(Delivery of this documentation is **not** owner acceptance.)

| Milestone | Theme | Contents | Gate |
| - | - | - | - |
| **M0** | Discovery & architecture | this report + financial spec + verification (done) | owner review |
| **M1** | Application foundation | app foundation, design system (tokens, `globals.css`, `layout.tsx`, primitives), navigation/shell, localization (EN/MY), themes, **database + migrations**, reusable components, tests (PR-1, PR-2, PR-3) | **owner authorization**; AR1/AR7/AR8 |
| **M2** | Authentication & sessions | register/login/logout, Argon2id, sessions, protected routes, preferences, guard, CSRF, rate limit, dev reset, **development fixtures (deterministic, idempotent, labelled SIMULATED)** (PR-4, PR-6) | AR2/AR10 |
| **M3** | Market experience | home, discovery, search, categories, cards, market details, outcomes, charts, rules, activity (PR-5) | AR5 |
| **M4** | Financial specification & trading | **obtain explicit owner approval of the financial specification first**, then ledger (three domains) and trading implementation: order book, limit/market/1-Tap, split/merge, matching/fills, positions, settlement, corrections, safeguards (PR-7+) | **financial-spec approval (gate)**; F14–F31; **real-PostgreSQL concurrency tests**; F30/F31 before ledger tables |
| **M5** | Portfolio & account | portfolio, positions, balances, open orders, cancellation, history, account settings, refinements | M4 stable |
| **M6** | Security & release readiness | security, responsive testing, accessibility, DB integrity, **financial invariants, real-PostgreSQL concurrency**, regression, E2E, release-readiness report | all prior milestones |

**How the unapproved Revision 10/11 sequence maps onto M0–M6 (for reference; the old labels are
superseded):** old "M2 Database foundation" → **M1**; old "M5 Dev fixtures" → **M2**; old "M4
Discovery & detail" → **M3**; old "M6 Ledger core" + "M7+ Trading & settlement" → **M4** (gated); old
trading/portfolio "M7+" pages → **M4** (trading) and **M5** (portfolio). **No scope is lost by this
restoration**, and the former **M6 "QA & release readiness"** is restored as **M6 "Security & release
readiness"**.

#### M4 gate sequencing (distinct stages — do not collapse)

M4 is the **only** milestone that touches the ledger and trading. Its gates are **five distinct
stages**; passing one does **not** imply the next. **No stage is weakened by this clarification.**

1. **M4 entry conditions.** M1–M3 are complete and stable (foundation, auth/sessions, market
   experience). Entry to M4 is **not** a financial-specification approval.
2. **Financial-specification and owner-decision prerequisites.** **Explicit owner approval of
   `docs/FINANCIAL-SPECIFICATION.md` is required before any M4 ledger/trading implementation.**
   Separately, the **owner decisions remain NOT APPROVED** (F14, F16–F31; F28, F30, F31 undecided).
   Financial-spec approval does **not** by itself decide F14/F16–F31.
3. **Ledger-table prerequisites.** **F30 (identifier model) and F31 (whole-Kyat divisibility) must be
   resolved before the ledger tables are created.** No ledger schema or migration may be written while
   F30/F31 are undecided. (F28 is the E6 cancel order; also NOT APPROVED.)
4. **Implementation verification requirements.** Invariant + concurrency + settlement + correction
   suites, and **real-PostgreSQL multi-session concurrency tests** — which have **NOT been performed**
   (see §13 and spec Part 12). A passing scratch/PGlite check does **not** satisfy this stage.
5. **M6 release-readiness requirements.** Security, responsive testing, accessibility, DB integrity,
   financial invariants, real-PostgreSQL concurrency, regression, E2E, and a release-readiness report.
   These are **M6**, dependent on **all prior milestones** — **not** part of M4 entry.

**None of these five stages is satisfied as of this revision; no gate is relaxed.**

---

## 4. Architecture

### 4.1 Stack (RECOMMENDED)

Next.js (App Router) · React · strict TypeScript · Tailwind · **PostgreSQL** (PGlite for
local/test) · **Drizzle ORM** with versioned SQL migrations · Zod · Vitest + Playwright · key-based
`en`/`my` i18n · Noto Sans Myanmar.

**What is actually verified about this stack (corrected in this revision):** the **scaffold builds**
(`npm run build`, `tsc --noEmit`, `eslint` all exit 0 in this environment). That is the **only** stack
claim verified here. Dependency status is stated precisely below and **must not be read as "the stack
is installed and working"**:

| Category | Meaning | Current state |
| - | - | - |
| **Declared in `package.json`** | Listed as a direct dependency | **`next`, `react`, `react-dom`** (deps); **`@tailwindcss/turbopack`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `tailwindcss`, `typescript`** (devDeps). Nothing else. |
| **Actually installed** | Present under `node_modules/` | The declared packages and their transitive dependencies. **`drizzle-orm` is NOT installed. `@electric-sql/pglite` is NOT installed. `vitest` is NOT installed. `@playwright/test` is NOT installed. `zod` is present only as a transitive dependency of `eslint-config-next` (not a direct dependency).** |
| **Proposed for future implementation** | Recommended, not yet added | **Drizzle ORM + `drizzle-kit` + `drizzle-orm/pglite`, PGlite, Zod (as a direct dep), Vitest, Playwright.** These are **PROPOSED**, to be added in the PR that needs them (PR-3 onward). |
| **Scaffold build verification** | Ran and observed | `npm run build`, `npx tsc --noEmit`, `npx eslint .` — all exit `0` (see financial spec **Appendix A.5** / Section 6 static row). |

> **Correction (this revision):** an earlier draft of this section stated "**VERIFIED:** … `drizzle-orm/pglite`
> resolves." That claim was **incorrect** — `drizzle-orm` is neither declared in `package.json` nor
> installed, so it cannot have been resolved. The claim is replaced by the table above. **No dependency
> has been added by this correction.**

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
**OWNER DECISION F20 / AR15 (unchanged in Revision 11).**

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

> **Price grid is NOT defined (T1 OPEN).** `CHECK (price BETWEEN 1 AND 99)` is a **proposed integer
> range only** — it is a validity bound, **not** a chosen price grid, and it implies **no specific tick
> increment**. The **exact integer price grid / tick size is undecided** and remains **owner decision
> T1** (see §11). This document **does not** select or approve a price grid. (Consistent with the
> financial spec Appendix B topic 16 and T1; **no value is invented here**.)

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

### 6.1 Reproducible verification evidence (Milestone 0)

The Milestone-0 verification scripts, README, and captured expected outputs live at
**`docs/verification/rev9/`** and are **published on the documentation review branch
`review/m0-documents-2026-11-16`** (added in Revision 12.2) so a reviewer can reproduce the results
directly. They are **verification artifacts, not application code**, and are **not** imported by the app.

- **Provenance (source commit and files):** the directory was introduced in commit `a8bbb06`
  (Revision 9 review preparation) and last revised in `bb498b3` (Revision 11). The five files are
  `docs/verification/rev9/{README.md, rev9.mjs, rev9.expected.out, rev9-pglite.mjs,
  rev9-pglite.expected.out}`; the review-branch copies are **byte-identical** to the working-branch
  copies (same blob SHAs).
- **Reproduction:** `node docs/verification/rev9/rev9.mjs` (no dependencies) prints
  `test cases: 136 (136 passed, 0 failed)`, `invariant assertions at commit boundaries: 253`, and
  `>>> ALL CHECKS PASSED (scratch)`, exit `0`; `diff` against `rev9.expected.out` is **empty**.
- **Three distinct levels — do not conflate:** (1) **scratch** — single-process in-memory model
  (`rev9.mjs`); (2) **PGlite** — single-connection mechanism tests (`rev9-pglite.mjs`, needs
  `@electric-sql/pglite@0.5.16`); (3) **real PostgreSQL multi-session** — **NOT PERFORMED.** **None is
  application-level financial validation.**

The review branch is a **documentation-and-evidence snapshot only**; it does **not** contain the Next.js
scaffold or any application code. Reported test results are **unchanged** by Revision 12.2.

---

## 7. Security strategy (RECOMMENDED)

Argon2id; server-side sessions; CSRF; rate limiting; Zod validation at every boundary; safe output;
no account enumeration; secrets in env only; audit logging; idempotency and concurrency protection;
resolution as a **named, audited operator action**; **append-only ledger and entitlement snapshot**;
**collateralization asserted and reconciled** (C1) at commit boundaries; **no unfunded deficit
disguised as collateral**.

---

## 8. First PR scope (RECOMMENDED — unchanged from Rev 2–8)

PRs map onto the **owner-approved M0–M6 roadmap** (§3.3): PR-1/PR-2/PR-3 → **M1**, PR-4/PR-6 → **M2**,
PR-5 → **M3**, PR-7+ → **M4 (gated)**.

| PR | Milestone | Title | Scope | Tests |
| - | - | - | - | - |
| **PR-1** | M1 | Design tokens + app shell | tokens, `globals.css`, `layout.tsx`, primitives, `ThemeToggle`, static placeholder home (EN+MY + disclosure), metadata | Vitest component test; Playwright smoke |
| PR-2 | M1 | i18n foundation | typed `en`/`my` dictionaries, locale provider/switch | key-parity; locale-switch E2E |
| PR-3 | M1 | Database foundation | Drizzle config, connection, migration runner, migration 0001 (non-financial tables) | migration tests; constraint tests |
| PR-4 | M2 | Auth | register/login/logout, Argon2id, sessions, guard, CSRF, rate limit, dev reset | auth/session/authorization/reset tests |
| PR-5 | M3 | Market discovery + detail (read-only) | home feed, categories, search, filters, cards, detail, states | retrieval tests; discovery + theming/localization E2E |
| PR-6 | M2 | Dev fixtures | deterministic, idempotent, labelled SIMULATED | seed idempotency; no-duplicate test |
| PR-7+ | M4 (**gated**) | Ledger + trading | three-domain ledger, invariant assertion, reconciliation, order book, limit, market, 1-Tap, split/merge, positions, settlement, corrections — **only after financial spec approval** | invariant + concurrency + settlement + correction suites |

No PR is created, merged, or deployed in this milestone.

---

## 9. Risk register (Revision 12.4)

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
| R14 | Push blocked | Low | Med | **Read access verified; write access verified** (review branch `review/m0-documents-2026-11-16` published; current head `7bca12d`); a **historical** 403 failure is on record, dated and superseded (see §1.3). `origin/main` unchanged; nothing merged | VERIFIED (read + write) |
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

## 10. Owner decision register (Revision 12.4)

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
| **AR19** | **Issuance group atomicity (E6+E4+E7) and cancellation target (receivable vs loss)** | adopt: atomic; cancellation target is F28 (NOT APPROVED) | **OWNER DECISION** |

### 10.2 Financial — see the financial spec Part 10

**Defined financial decision IDs (spec Part 10):** **F14, F16, F17, F18, F19, F20, F21, F22, F23,
F24, F25, F26, F27, F28, F29** — plus the two IDs introduced by the final-review corrections, **F30
and F31** (defined in the spec, both **NOT APPROVED**; see below). **All remain NOT APPROVED.**

**Note (corrected):** an earlier draft cited "F1–F29". That range was **incorrect**: **F1–F13 and F15
are not defined** anywhere in the specification (the register begins at F14). No decisions have been
renumbered; the citation is corrected to the IDs that actually exist. If earlier revisions referenced
F1–F13, those decisions were **never written down** and are therefore **not documented** — this is
noted as an open documentation gap rather than fabricated.

**New financial decisions introduced (documentation only — NOT APPROVED):**

| ID | Decision | Status |
| - | - | - |
| **F30** | **Correction-level and entitlement-level identifier model.** Multiple corrections on one market and multiple beneficiaries require immutable per-correction and per-entitlement identifiers, and a rule reconciling market-level aggregate accounts to individual correction records and user entitlements. **The design is not selected.** | **NOT APPROVED** |
| **F31** | **Whole-Kyat / unit-divisibility rule.** The issuance amount `x` must relate to the payout-per-share `P` such that reopened units `x/P` are whole; the divisibility rule and the rejection behaviour when `P ∤ x` are **not yet defined**. **No policy is chosen.** | **NOT APPROVED** |

Neither F30 nor F31 selects an implementation; both are recorded so the gaps are visible in the
register. See spec Part 10a for the full statements.

---

## 11. Open technical questions

| ID | Question | Needs |
| - | - | - |
| T1 | Exact integer price grid / tick size? (the `BETWEEN 1 AND 99` bound is a proposed range only; **no tick increment is selected**) | **OPEN — OWNER DECISION** |
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
| **T28** | **What immutable per-correction and per-entitlement identifier model is used, so several corrections on one market and several beneficiaries can be represented distinctly (F30)?** | **OWNER DECISION** |
| **T29** | **How are the market-level aggregate correction accounts reconciled to individual correction records and per-user entitlements — i.e. what accounting granularity is authoritative (F30)?** | **OWNER DECISION** |
| **T30** | **Must an issuance amount `x` be a whole multiple of the payout-per-share `P`, and what is the rejection/handling rule for a fractional `x/P` (F31)?** | **OWNER DECISION** |

---

## 12. Change list (Revision 8 → 9, 9 → 10, 10 → 11, 11 → 12, 12 → 12.2, 12.2 → 12.3, then 12.3 → 12.4)

1. **E7 issuance defect corrected.** Issuance is now the atomic group **E6 (issue) + E4 (realize) +
   E7 (reopen)**: it creates funding, cancels the outstanding claim, realizes funding, and reopens the
   matching claim units, so **C1 holds** and the obligation is **not double-counted**.
2. **`PendingCorrectionClaim` reconciliation defined:** realization clears it; the sum
   `PendingCorrectionClaim + SettlementCorrection` never exceeds the correction amount.
3. **Duplicate `E3` event identifier fixed:** events renumbered uniquely **E1–E9**.
4. **Two issuance paths analysed** (Path A write-off→issuance, Path B issuance while outstanding) with
   complete journals and post-commit balances; **F27/F28/F29**, **AR19**, **R29–R32**, **T25–T27**.
5. **Verification extended and made reproducible:** the Revision 9 scratch model (**105 test cases,
   220 invariant assertions**; the 45 Rev-8 tests are preserved) is now committed in the repository at
   **`docs/verification/rev9/`** with a README, captured outputs, and exact commands; a PGlite
   mechanism test accompanies it.
6. **F28 stated as two explicit alternatives, not selected:** financial spec 6.4a gives the **proposed
   recommendation (loss-first)** and the **alternative (recv-first)** for every claim state; **neither
   is selected as policy** and **F28 remains unapproved**.
7. **State 4 reconstructed:** from `E2 → E3 (100) → E5 (100)` the before-issuance balances are
   `recv 0, loss 100, pending 100, corr 100, units 1`; the earlier unreachable `(100, 100)` figure is
   removed and the scratch test `R9-32pre` asserts the correct balances.
8. **Verification-claim and Appendix corrections:** the stale Appendix A.1 block now shows the
   reproduced **105 tests / 220 assertions**; PGlite duplicate-collection rejection is now actually
   exercised (`P9`); scratch, PGlite, and real-PostgreSQL levels are explicitly distinguished and none
   is described as application-level financial validation.
9. **Unresolved limitations disclosed** (financial spec Part 12): no real-PostgreSQL multi-session
   verification; concurrent corrections; partial write-off/collection combinations; per-user allocation
   and multi-user payout; Option A demonstrated for the supplied scenario only.
10. **Revision history corrected** to include `b300f1a` (Rev 8) and this revision's commit.

### 12.1 Change list — Revision 9 → Revision 10 (final-review corrections, documentation only)

11. **D1 — dependency claim corrected.** §4.1 no longer claims "`drizzle-orm/pglite` resolves". It now
    separates **declared / installed / proposed / scaffold-build-verified** dependencies. **No dependency
    was added.**
12. **D2 — Git write-access contradiction reconciled.** §1.3 and risk **R14** now state: **read access
    VERIFIED**, **write access NOT VERIFIED**, and a **historical** 403 push failure (labelled
    historical, not re-tested). Write access is never tested by pushing.
13. **D4 — C2 and S1 defined** (financial spec **Part 4a**), with scope, sign convention, and a
    **reported discrepancy**: the scratch model's `C2()` is sign-inverted and is never exercised at
    non-zero share balances. **The model was not modified** in Revision 10. *(Corrected in Revision 11:
    see §12.2 item 20.)*
14. **D5 — page/component inventory and roadmap added** (§3.1, §3.2, §3.3), labelled **PROPOSED**
    planning artifacts. Staff/Admin dashboard remains **excluded**.
15. **D6 — coverage claim withdrawn.** The README "20 required topics — complete" phrasing is replaced;
    the financial spec gains an **Appendix B coverage matrix** (spec'd / partial / missing / owner
    decision / deferred) and explicitly lists the unresolved **pricing, price-tick, minimum-notional, and
    fee** rules. **No values invented.**
16. **D7 — decision-register references corrected.** "F1–F29" replaced by the IDs that exist
    (**F14, F16–F29**); the spec documents that **F1–F13/F15 are undefined**. **F30** (correction/
    entitlement identifier model) and **F31** (whole-Kyat divisibility) added as **NOT APPROVED**
    decisions. **No decision renumbered; none invented.**
17. **D8 — appendix numbering corrected.** "Appendix V" → **Appendix A** (sequential from the start);
    cross-references in the spec, the architecture report, and the verification README updated.
18. **D10 — E6 clarity.** The E6 table row and the 6.4 code block now state that the allocation split
    `(a, b)` is the **F28** owner decision; **loss-first and receivable-first remain distinct and
    neither is selected.**
19. **D11 — scaffold file count corrected.** §1.2 states **15** tracked scaffold files (exact list),
    what is excluded, and how the "19 files" commit figure decomposes.

### 12.2 Change list — Revision 10 → Revision 11 (C2 verification + consistency)

20. **C2 verification-model defect corrected.** `docs/verification/rev9/rev9.mjs` now computes
    `C2() = amt(YES) === amt(NO)` (magnitudes) instead of the sign-inverted
    `bal[YES] === -bal[NO]`. This is a **scratch-verification fix only**; no financial rule, account,
    journal, or decision changed. See the financial spec **Part 4a**.
21. **S1 independently re-derived.** Part 4a derives S1 from the split/merge/escrow/release/retire
    journals and confirms the model's S1 is correct (restated via `amt(...)` for clarity). S1 is
    **unchanged in substance**.
22. **New share-ledger tests (Section 4, S4-01…S4-09).** They exercise C2/S1 at **zero and non-zero**
    outstanding balances (single split, multiple splits, merge, escrow/release, retirement,
    intermediate states, correction-lifecycle boundaries) and include a **regression guard**
    (`S4-02e`/`S4-02f`) proving the old formula returns `false` where the corrected one returns `true`.
    Scratch totals: **136 test cases, 253 invariant assertions** (was 105/220).
23. **D12 — page-inventory milestone tags corrected (Revision 11; superseded by Revision 12).** In
    Revision 11 §3.1 tagged auth pages **M3** and discovery/detail pages **M4**. Under the restored
    owner-approved roadmap (§12.3) those pages are now **M2** (auth/settings) and **M3**
    (discovery/detail); §3.1 is consistent with the **§3.3 roadmap** and the **§8 PR sequence**.
24. **D13 — trading milestone reference corrected (Revision 11; superseded by Revision 12).** The
    financial spec Part 11 no longer says trading ships in "Milestone 4"; in Revision 11 it stated
    **Milestone 7+ (gated)**. That M7+ label was part of the **unapproved** Revision 10/11 sequence and
    is **superseded in Revision 12** by the owner-approved **M4** (see §12.3).
25. **D14 — F30/F31 added to the stop-condition list.** §13 now lists **F14, F16–F31** (naming F30 and
    F31) as awaiting owner decisions, all **NOT APPROVED**.
26. **D15 — open questions T28–T30 added.** §11 now covers the **F30** identifier model, the
    **F30** aggregate-to-detail reconciliation/accounting granularity, and the **F31** whole-Kyat
    divisibility rule — recorded, **not selected**.

### 12.3 Change list — Revision 11 → Revision 12 (owner-approved roadmap restoration)

27. **Owner-approved M0–M6 roadmap restored.** §3.3 now uses the canonical owner-approved sequence
    (M0 Discovery & architecture · M1 Application foundation · M2 Authentication & sessions · M3 Market
    experience · M4 Financial specification & trading · M5 Portfolio & account · M6 Security & release
    readiness). The unapproved Revision 10/11 sequence (which had split the roadmap into M1–M7+ and had
    **dropped the release-readiness milestone**) is **superseded**. **No milestone is renumbered;
    M7+ is removed.**
28. **Database foundation folded into M1.** Drizzle config, connection, migration runner, and migration
    0001 (non-financial tables) move from the old "M2 Database foundation" into **M1**, matching the
    owner roadmap.
29. **Development fixtures folded into M2.** Deterministic, idempotent, labelled-SIMULATED fixtures move
    from the old "M5 Dev fixtures" into **M2 Authentication & sessions**.
30. **Ledger and trading placed inside M4, gated.** The three-domain ledger (old "M6 Ledger core") and
    trading/settlement (old "M7+ Trading & settlement") are both inside **M4**, strictly behind
    **financial-specification approval**; F30/F31 remain required before ledger tables. **No trading is
    implemented.**
31. **M6 restored as Security & release readiness.** Security, responsive testing, accessibility, DB
    integrity, **financial invariants, real-PostgreSQL concurrency**, regression, E2E, and a
    release-readiness report are an explicit final milestone again. **No testing/security/concurrency/
    accessibility requirement was removed** (they remain in §6, §7 and §9).
32. **Milestone labels made consistent.** §3.1 page inventory, §8 PR sequence, and the financial spec
    (Part 0, Part 10a, Part 11, Appendix B) now use the same M0–M6 labels. **All obsolete M7+ references
    are removed or explicitly marked as superseded.**
33. **No financial decision changed.** F14 and F16–F31 remain **NOT APPROVED**; F28, F30 and F31 remain
    undecided. **No financial policy was selected, no ledger/trading/schema/migration code was written,
    and C2/S1 verification corrections are not financial approval.**

### 12.4 Change list — Revision 12 → Revision 12.2 (independent-review corrections, documentation + evidence only)

34. **Verification evidence made available on the review branch.** `docs/verification/rev9/` (README,
    `rev9.mjs`, `rev9.expected.out`, `rev9-pglite.mjs`, `rev9-pglite.expected.out`) is published on
    `review/m0-documents-2026-11-16` **byte-identical** to the working branch (same blob SHAs), with
    provenance (`a8bbb06` → `bb498b3`) recorded in §6.1. Reproduction re-run: `136/136` tests, `253`
    assertions, `>>> ALL CHECKS PASSED (scratch)`, empty diff. **No reported result changed.** The
    three levels (scratch / PGlite / real-PostgreSQL-not-performed) stay distinct.
35. **Git status corrected (§1).** Now distinguishes the **historical HTTP 403** (dated, branch-scoped,
    labelled historical and superseded), the **successful publication** of
    `review/m0-documents-2026-11-16` (`a6bf123`), **verified write access** for the credentials in use,
    **`origin/main` unchanged** (`f6c7567`), and the **separate** working branch vs review branch.
36. **README branch-scope clarified.** README now states the review branch is a **documentation-only
    snapshot** and does **not** contain the Next.js scaffold; §1.2 states the same. No repository
    content is fabricated.
37. **Internal payout terminology clarified (spec §6.7 / E8).** E8's "payout" is **internal
    virtual-credit settlement/distribution only** and is explicitly **not** cash payment, withdrawal,
    redemption, external transfer, or real-money payout. **No journal, account, or policy changed.**
38. **Price-grid clarification (§5, §11 T1; spec Appendix B).** `CHECK (price BETWEEN 1 AND 99)` is a
    **proposed range bound only**, implying **no tick increment**; the exact integer price grid is
    **T1, still OPEN**. **No price grid is selected or approved.**
39. **M4 gate sequencing clarified (§3.3).** Five distinct stages — M4 entry · financial-spec/owner
    prerequisites · ledger-table prerequisites (F30/F31) · implementation verification (incl.
    real-PostgreSQL concurrency) · M6 release readiness. **No financial safety gate weakened.**
40. **No financial decision changed (Revision 12.2).** F14, F16–F31 remain **NOT APPROVED**; F28, F30,
    F31 undecided; AR13, AR15–AR19 unchanged; M0–M6 not renumbered. **No application code, schema, or
    migration was added.**

### 12.5 Change list — Revision 12.2 → Revision 12.3 (final documentation-consistency corrections)

41. **README scaffold-location contradiction resolved.** The opening status paragraph previously said the
    repository "contains an unmodified Next.js scaffold", which contradicted the following branch-scope
    paragraph. README now states plainly that the **scaffold lives only on the working branch
    `milestone-0-discovery-architecture`**, the **review branch
    `review/m0-documents-2026-11-16` is a documentation-and-evidence-only snapshot with no scaffold or
    application code**, and **`main` contains only the initial `README.md`**. No claim that the scaffold
    exists on the review branch remains.
42. **Git publication history recorded (§1.3, AGENTS.md).** At Revision 12.3 this distinguished the
    **initial review publication** `a6bf123`, the **Revision 12.2 publication** `b2437c8`, the
    **review-branch head at that time `b2437c8`**, and the **original `main` baseline** `f6c7567`.
    `a6bf123` is explicitly **not** the current head. (Superseded by Revision 12.4, which updates the
    current head to `7bca12d`; the historical records themselves are preserved.)
43. **Review-branch state corrected (Revision 12.3).** §1 and §1.1 showed the review branch at **head
    `b2437c8`** (**2 commits ahead** of `main`), replacing the earlier "1 commit ahead / `a6bf123`"
    description. (Updated again in Revision 12.4 to head `7bca12d`, 3 commits ahead.)
44. **No financial or architectural change (Revision 12.3).** F14, F16–F31 remain **NOT APPROVED**; F28,
    F30, F31 undecided; the E1–E9 journal model, AR13, AR15–AR19, and the M0–M6 roadmap are unchanged.
    **No application code, schema, migration, or verification-script change was made.**

### 12.6 Change list — Revision 12.3 → Revision 12.4 (synchronize current Git publication references)

45. **Stale current-head references corrected.** §1, §1.1, §1.3, R14, and AGENTS.md now show the review
    branch at **current head `7bca12d`** (**3 commits ahead** of `main`), replacing the earlier
    "current head `b2437c8` / 2 commits ahead" description that Revision 12.3 left stale.
46. **Revision 12.3 publication recorded.** The publication history now lists **initial publication
    `a6bf123`**, **Revision 12.2 `b2437c8`**, and **Revision 12.3 `7bca12d`**, then the **current
    review-branch head `7bca12d`** and the **original `main` baseline `f6c7567`**. Historical records are
    preserved and clearly labelled; `a6bf123` remains explicitly **not** the current head.
47. **No financial or architectural change (Revision 12.4).** F14, F16–F31 remain **NOT APPROVED**; F28,
    F30, F31 undecided; the E1–E9 journal model, AR13, AR15–AR19, and the M0–M6 roadmap are unchanged.
    **No application code, schema, migration, or verification-script change was made.**

---

## 13. Unresolved limitations and stop condition

**Explicit unresolved limitations (disclosed, not resolved):**

- **No real PostgreSQL multi-session concurrency verification.** Scratch (`rev9.mjs`) and PGlite
  (`rev9-pglite.mjs`) checks are single-process / single-connection. **None of the verification is
  application-level financial validation** — there is no application, schema, or production ledger.
- **Multiple concurrent corrections on one market remain unresolved.**
- **Partial write-off and collection combinations require further verification** (e.g. a partial
  collection *after* a partial write-off, or repeated partial tranches).
- **Per-user correction allocation and multi-user payout handling require further specification** (the
  worked examples use a single beneficiary).
- **Option A is demonstrated for the supplied scenario only**, not established as production-complete.

Per instruction, this revision **stops here**. I have **not** started Milestone 1, added features,
implemented auth/trading/ledger/settlement, created schemas or migrations, merged, deployed, or pushed
to `main`. **No financial rule, account, journal, or decision was changed.** Revision 12.4 is a
**documentation-only** correction: it synchronizes the current Git publication references, recording the
Revision 12.3 publication (`7bca12d`) and the **current review-branch head `7bca12d`** (**3 commits
ahead** of `main`) while preserving the labelled historical records (initial publication `a6bf123`,
Revision 12.2 `b2437c8`, `main` baseline `f6c7567`). Revision 12.2 published the existing
`docs/verification/rev9/` evidence to the review branch (**byte-identical**, no reported result
changed). The **only code change** on the working branch remains the Revision 11 **C2 verification-model
correction** in `docs/verification/rev9/rev9.mjs`. **No financial specification approval is assumed.** I
await your independent review and explicit decisions on **F14, F16–F31** (including **F30**
correction/entitlement identifier model and **F31** whole-Kyat divisibility), **AR13, AR15–AR19**. All
remain **NOT APPROVED**.
