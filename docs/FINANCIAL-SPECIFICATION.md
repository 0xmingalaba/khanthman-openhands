# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 8) — **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 7 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 8)
**Milestone:** still Milestone 0 — planning only. **Milestone 1 has NOT started.** **No trading,
ledger, matching, settlement, schema, migration, or auth code exists.**

### Verification labels

| Label | Meaning |
| - | - |
| **VERIFIED (scratch)** | A scratch model outside the repo was run; output observed (Appendix V). **Not** a product test. |
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
> multi-session concurrency has been verified.** Everything describing the product is **PROPOSED**.
> **Nothing in this document is approved.**

---

## Part 0 — What changed in Revision 8

Revision 7 had an **accounting inconsistency** in its correction example: it posted
`UserAvailable:Bob D 200 / SettlementCorrection:M C 200` as a "full recovery" but then reported the
receivable rising to 200 and, in the full-recovery case, claimed the receivable was zero — without a
journal that recognizes, collects, and realizes the receivable as **separate** events.

Revision 8 fixes this by separating the economic events and giving each its own journal.

| # | Revision 7 defect | Revision 8 correction |
| - | - | - |
| A | Recognition, collection and realization were conflated; the receivable balance did not follow from valid journals | **Eight distinct economic events** defined, each with its own single-domain journal (Part 6). The receivable is recognized (E2), collected (E3), realized (E3), and only realized funding backs units. |
| B | No write-off representation | New debit-normal account **`CorrectionWriteOffLoss:{m}`** for an **owner-approved** write-off (Part 6.6). |
| C | "Recovery" journal credited `SettlementCorrection` without recognizing the claim first | Correct order: **recognize → collect → realize**; realization and unit reopening commit **atomically** (Part 6.3, Part 7). |

**The key rule the scratch model proved:** because C1 forbids funding without matching claim units,
**`E3 realize` and `E8 reopen` must commit in one transaction** (`R8-12c` rejects realization alone).
`E3 collect` may commit separately. This is a **necessary design constraint**, not a preference.

---

## Part 1 — Three accounting domains (unchanged)

**MMK**, **Share**, and **Claim-unit** ledgers balance **independently**. A journal belongs to exactly
one domain and must balance within it; units are never mixed; no domain balances against another; a
logical operation may comprise several single-domain journals **committed atomically in one
transaction** when the invariants require it. **VERIFIED (scratch + PGlite).**

---

## Part 2 — Account catalogue

### 2.1 MMK ledger

| Account | Type | Represents | Normal |
| - | - | - | - |
| `CreditsIssued` | Contra-equity (source of credits) | Total virtual credits issued | **D** |
| `UserAvailable:{u}` | User holding (unrestricted) | Spendable credits owed to `u` | **C** |
| `UserReserved:{u}` | User holding (restricted) | Credits committed to open buy orders | **C** |
| `CollateralBucket:{m}` | Restricted virtual-credit bucket | Credits backing `m`'s outstanding complete sets | **C** |
| `SettlementPayable:{m}` | Liability | Credits owed to `m`'s winners, unpaid | **C** |
| `SettlementCorrection:{m}` | **Realized** correction funding | Realized credits held to fund a correction of `m` | **C** |
| `PendingCorrectionClaim:{m}` | Memorandum claim (**NOT in C1**) | A recognized-but-**unfunded** correction shortfall | **C** |
| `CorrectionReceivable:{u}` | Receivable (claim on a user) | Credits `u` must be debited (mis-paid, not yet collected) | **D** |
| **`CorrectionWriteOffLoss:{m}`** | **Loss / contra-equity (NEW in Rev 8)** | **An owner-approved write-off of an uncollectible receivable** | **D** |
| `CorrectionPayableMarket:{m}` | Correction payable control (Option A only) | Recognized-but-unpaid correction entitlements of `m` | **C** |

Per-user correction-payable attribution (Option A) lives in a **subledger**
`CorrectionPayableSubledger(market, resolution_version, user)` whose sum must equal
`CorrectionPayableMarket:{m}`; it is **not** a separate balance account, so there is **no
double-count** and **no control↔subledger transfer journal**.

### 2.2 Share ledger

`SharesFree:{u}:{o}` (D), `SharesEscrowed:{u}:{o}` (D), `SharesOutstanding:{m}:{o}` (C).

### 2.3 Claim-unit control ledger

`ClaimUnitsRemaining:{m}` (D), `UnitsControl:{m}` (C). Opens at 0; split +n; merge −n; payout −k;
returns to 0 at completion; **never negative**; always `ClaimUnitsRemaining = UnitsControl` (C1b).

---

## Part 3 — M1 (accounting conservation)

> **M1:** sum of all **debit-normal** balances = sum of all **credit-normal** balances.
> Expanded: `CreditsIssued + Σ_u CorrectionReceivable:{u} + Σ_m CorrectionWriteOffLoss:{m}`
> `= Σ_u (UserAvailable + UserReserved)`
> `+ Σ_m (CollateralBucket + SettlementPayable + SettlementCorrection + PendingCorrectionClaim + CorrectionPayableMarket)`

`PendingCorrectionClaim` and `CorrectionPayableMarket` are **control accounts**; the Option-A subledger
is **not** separately summed. `CorrectionWriteOffLoss` is debit-normal and sits on the debit side.
M1 is a statement of **accounting conservation**, **not** of economic backing (Part 7).
**VERIFIED (scratch):** M1 held at every commit boundary (Appendix V.1).

---

## Part 4 — Backing invariant C1

> **C1:** `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `+ (Option A only) CorrectionPayableMarket:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}`

**Critical:** `PendingCorrectionClaim:{m}` and `CorrectionReceivable:{u}` are **deliberately excluded**
from C1. Neither is realized funding, so neither may back a claim unit. **VERIFIED (scratch):**
`R8-11` (unfunded reopen rejected) and `R8-12c` (realize without reopen rejected).

---

## Part 5 — Settlement lifecycle and atomicity (unchanged)

Twelve steps; atomic per-user payout; no reliance on a progress flag. **VERIFIED (PGlite):** unique
payout keys reject duplicates and credit exactly once.

---

## Part 6 — BLOCKING ISSUE: CorrectionReceivable accounting lifecycle

### 6.1 The eight economic events (separated)

| Event | Description | Journal | Domain |
| - | - | - | - |
| **E1** | Original mispayment to Bob | `SettlementPayable:M D 200 / UserAvailable:Bob C 200` | MMK |
| **E2** | **Recognition** of the recovery claim | `CorrectionReceivable:Bob D 200 / PendingCorrectionClaim:M C 200` | MMK |
| **E3** | **Actual collection** from Bob | `UserAvailable:Bob D x / CorrectionReceivable:Bob C x` | MMK |
| **E3** | **Realization** of collected funds | `PendingCorrectionClaim:M D x / SettlementCorrection:M C x` | MMK |
| **E4** | **Partial collection** | same journals as E3 with `x < 200` | MMK |
| **E5** | **Uncollectible amount** | no journal; remains in `CorrectionReceivable` + `PendingCorrectionClaim` | — |
| **E6** | **Approved write-off** | `CorrectionWriteOffLoss:M D x / CorrectionReceivable:Bob C x` | MMK |
| **E7** | **Approved issuance** | `CreditsIssued D x / SettlementCorrection:M C x` | MMK |
| **E8** | **Funding + payment of Alice's entitlement** | reopen/pay/close journals | MMK + UNIT |

**A receivable is never treated as realized funding.** Recognition (E2) and realization (E3) are
**different events** with **different journals**; only realization puts credits into
`SettlementCorrection` (the C1 backing account).

### 6.2 E2 — initial receivable recognition

| Field | Value |
| - | - |
| Debit | `CorrectionReceivable:Bob` **200** (normal **D**) |
| Credit | `PendingCorrectionClaim:M` **200** (normal **C**) |
| Economic meaning | Bob owes 200 MMK back; the market has a recognized but **unfunded** correction claim of 200 |
| Effect on M1 | Debit side +200, credit side +200 → **M1 unchanged** (both sides rise) |
| Effect on C1 | **None** — neither account is in C1; `ClaimUnitsRemaining` stays 0, so C1 = 0 = 0 ✅ |
| Claim pending or funded? | **Pending** (`PendingCorrectionClaim` = 200), **not funded** |

**No new account was required for recognition** — `CorrectionReceivable` and
`PendingCorrectionClaim` already existed and correctly represent it.

### 6.3 E3 — full collection (200)

Two single-domain MMK journals, plus the unit reopening that must be atomic with realization:

| Journal | Domain | Debit | Credit | Reason | Boundary |
| - | - | - | - | - | - |
| `E3-collect` | MMK | `UserAvailable:Bob 200` | `CorrectionReceivable:Bob 200` | Actual collection | tx `T-C` (may be alone) |
| `E3-realize` | MMK | `PendingCorrectionClaim:M 200` | `SettlementCorrection:M 200` | Realization | tx `T-C` |
| `E8-reopen` | UNIT | `ClaimUnitsRemaining:M 2` | `UnitsControl:M 2` | Funded unit reopening | tx `T-C` |

**Multiple journals in one atomic transaction:** **YES.** `E3-realize` and `E8-reopen` **must** be
atomic, because after realization `SettlementCorrection = 200` requires `ClaimUnitsRemaining = 2` for
C1 to hold. **VERIFIED (scratch R8-12c):** realizing without reopening is **rejected**.

Double-entry is preserved; no credits are created or destroyed (collection moves credits from Bob to
the market's correction funding; realization is a memo reclassification within MMK).

### 6.4 E4 — partial collection (100 of 200)

| Journal | Domain | Debit | Credit |
| - | - | - | - |
| `E3-collect` | MMK | `UserAvailable:Bob 100` | `CorrectionReceivable:Bob 100` |
| `E3-realize` | MMK | `PendingCorrectionClaim:M 100` | `SettlementCorrection:M 100` |
| `E8-reopen` | UNIT | `ClaimUnitsRemaining:M 1` | `UnitsControl:M 1` |

**Post-commit balances (VERIFIED scratch R8-03):** `CorrectionReceivable:Bob = 100`,
`PendingCorrectionClaim:M = 100`, `SettlementCorrection:M = 100`, `ClaimUnitsRemaining:M = 1`.
**Only the funded tranche reopens claim units** (`1` unit for `100` MMK). **VERIFIED (scratch
R8-03c):** reopening the second, unfunded unit is **rejected**. An unfunded claim is **never** treated
as collateral.

### 6.5 E5 — uncollectible recovery

Example: claim 200, collection **0**, realized funding **0**. **No journal** is posted (nothing
happened); `CorrectionReceivable:Bob = 200` and `PendingCorrectionClaim:M = 200` remain **outstanding**.
The correction is **PENDING** — no unit may reopen (VERIFIED scratch R8-11). Permitted correction
states: **pending** (waiting for recovery) or **funded by approved issuance (E7, F14)**.

### 6.6 E6 — optional owner-approved write-off

A receivable is **never** written off silently. With explicit owner approval:

| Journal | Domain | Debit | Credit |
| - | - | - | - |
| `E6-writeoff` | MMK | `CorrectionWriteOffLoss:M 200` | `CorrectionReceivable:Bob 200` |

- **Loss treatment:** `CorrectionWriteOffLoss:M` is **debit-normal** (a loss / contra-equity-like
  account). It records that the market will not collect the receivable.
- **Effect on M1:** the debit side is unchanged (receivable 200 out, loss 200 in) → **M1 holds**;
  the write-off **converts a claim into a recognized loss**. It does **not** create funding and does
  **not** back any claim unit.
- **`PendingCorrectionClaim` after write-off:** the memorandum claim may be cleared against the loss
  **only under an explicit policy (F18)**; Rev 8 leaves the receivable-clearing journal as above and
  records the pending-claim treatment as an **OPEN decision**.
- **VERIFIED (scratch R8-09/R8-10):** an **unapproved** write-off is **rejected**; an approved one
  balances and M1 holds.

### 6.7 E7 — owner-approved issuance (F14)

Only with explicit owner approval: `CreditsIssued D 200 / SettlementCorrection:M C 200`. This
**increases the virtual-credit supply** by 200 (both M1 sides rise). **VERIFIED (scratch X2):**
`CreditsIssued` 30000 → 30200; **VERIFIED (scratch X1):** issuance is **rejected** when not approved.

### 6.8 E8 — funding and payment of Alice's corrected entitlement

`E8-reopen` (UNIT) + `E8-pay` (`SettlementCorrection:M D 200 / UserAvailable:Alice C 200`, MMK) +
`E8-close` (UNIT). Under **Option A**, `E8-pay` is preceded by
`SettlementCorrection:M D 200 / CorrectionPayableMarket:M C 200` and then
`CorrectionPayableMarket:M D 200 / UserAvailable:Alice C 200` (Part 8).

---

## Part 7 — Invariants, reconciled

| Invariant | Statement | Where enforced |
| - | - | - |
| **M1** | debit-normal sum = credit-normal sum (Part 3) | every commit boundary |
| **C1** | Part 4 backing identity | every commit boundary |
| **C1b** | `ClaimUnitsRemaining = UnitsControl` | every commit boundary |
| **Non-negativity** | no normal-side balance < 0 | every journal (model throws; PGlite `CHECK`) |
| **C2** | `SharesOutstanding:YES = SharesOutstanding:NO` (pre-retirement) | every commit boundary |
| **S1** | `Σ_u (free + escrowed) = SharesOutstanding` per outcome | every commit boundary |

**Distinctions (explicit):**
- **M1 and C1 are different invariants.** M1 is conservation; C1 is backing.
- **A receivable is not cash or realized funding** (it is debit-normal and excluded from C1).
- **`PendingCorrectionClaim` is not collateral** (excluded from C1).
- **No double counting:** the same amount never appears in both a receivable and a funded account;
  the Option-A subledger is never summed alongside its control account.
- **Each journal balances within its own domain**; multi-domain operations commit atomically.

**Intermediate (uncommitted) states.** Inside a transaction, C1 may temporarily differ (e.g. between
`E3-realize` and `E8-reopen`). This is **proved harmless**: (a) the model **refuses to commit** any
state where an invariant fails (commit-boundary assertion); (b) relational **transaction isolation**
means another session sees either the pre- or post-commit state, never the in-flight state.
**NOT VERIFIED (real PostgreSQL):** this isolation was **not** tested on a real multi-session server
(PGlite is single-connection). **Real concurrency is not claimed.**

---

## Part 8 — Complete correction lifecycle

Example: payout per share **100 MMK**; Bob mis-paid 200; Alice the true winner; **2 units**; corrected
payout **200 MMK**. Option B (no payable account) unless stated.

| State | Event | Journal(s) | Boundary |
| - | - | - | - |
| S0 | E1 original incorrect settlement | (already applied) | earlier |
| S1 | E2 receivable recognition | `CorrectionReceivable:Bob D 200 / PendingCorrectionClaim:M C 200` | tx `T-REC` |
| S2 | Correction record + immutable resolution version | write `ResolutionRecord(v2)` + `SettlementEntitlement(v2, Alice=2)` | tx `T-REC` |
| S3 | E3 full/partial collection | `UserAvailable:Bob D x / CorrectionReceivable:Bob C x` | tx `T-C` |
| S4 | E3 realization | `PendingCorrectionClaim:M D x / SettlementCorrection:M C x` | tx `T-C` |
| S5 | E8 funded unit reopening | `ClaimUnitsRemaining:M D x/100 / UnitsControl:M C x/100` | tx `T-C` |
| S6 | E8 immediate payout (Option B) | `SettlementCorrection:M D x / UserAvailable:Alice C x` | tx `T-C` |
| S6' | E8 delayed payout | same journal, **later** tx `T-P` | tx `T-P` |
| S7 | E8 unit close | `UnitsControl:M D units / ClaimUnitsRemaining:M C units` | tx `T-C`/`T-P` |
| S8 | E5 uncollectible remainder | none (stays pending) | — |
| S9 | E6/E7 optional write-off or issuance | Part 6.6 / 6.7 | tx `T-WO`/`T-IS` |
| S10 | Final reconciliation | all correction accounts 0 | read/assert |

**Uniqueness / idempotency keys:** recognition and correction carry
`(market_id, resolution_version, user_id, correction_seq)`; collection carries
`(market_id, user_id, collection_seq)` + idempotency key; payout carries
`(market_id, resolution_version, user_id)` + idempotency key. Duplicates are no-ops; the same key
with a different payload is a **conflict**.

**Option A / Option B:** the Rev-7 comparison is **retained unchanged** (F20/AR15 remain OWNER
DECISIONS); Revision 8 does **not** change F20 or AR15.

**Post-commit balances (full recovery, Option B — VERIFIED scratch R8-02/R8-20):**

| Account | S1 (recognized) | S3–S5 (collected+realized+reopened) | S10 (final) |
| - | - | - | - |
| `CorrectionReceivable:Bob` | 200 | 0 | 0 |
| `PendingCorrectionClaim:M` | 200 | 0 | 0 |
| `SettlementCorrection:M` | 0 | 200 | 0 |
| `ClaimUnitsRemaining:M` | 0 | 2 | 0 |
| `UserAvailable:Alice` | 9800 | 9800 | 10000 |
| `UserAvailable:Bob` | 10200 | 10000 | 10000 |
| `CreditsIssued` | 30000 | 30000 | 30000 |

---

## Part 9 — Financial decision register (Revision 8)

| ID | Decision | Recommendation | Status |
| - | - | - | - |
| F1–F13 | (as Revision 7: payout/share, price grid, min notional, fees, slippage, quote expiry, order types, partial-fill policy, cross-outcome matching, resolution authority, dispute window, new-user credit, "To Win" display) | (see Rev 7) | OWNER DECISION / OPEN |
| F14 | May the platform issue additional virtual credits to fund a correction? | undecided | **OWNER DECISION** |
| F15 | Recovery of `CorrectionReceivable`: automatic netting vs manual review | manual review | OPEN |
| F16 | Must `SettlementCorrection` close at zero? | yes | **OWNER DECISION** |
| F17 | Does C1 count an uncollected receivable as backing (Policy A) or only realized funding (Policy B)? | Policy B | **OWNER DECISION** |
| F18 | Treatment of uncollectible receivables | write off as disclosed loss | **OWNER DECISION** |
| F19 | Fallback if additional issuance is not approved? | pending correction | **OWNER DECISION** |
| F20 | CorrectionPayable representation: Option A vs Option B | Option B | **OWNER DECISION** |
| F21 | Partial funding vs all-or-nothing correction | funded-tranche | **OWNER DECISION** |
| F22 | Is delayed correction payout supported? | yes | **OWNER DECISION** |
| **F23** | **How is the correction receivable recognized?** (recognize at mispayment vs at correction record) | recognize at correction record (E2) | **RECOMMENDED — OWNER DECISION** |
| **F24** | **Is the collection→realization→reopen group required to be atomic?** | yes (proved necessary by C1) | **RECOMMENDED — OWNER DECISION** |
| **F25** | **How are uncollectible receivables written off, and does `PendingCorrectionClaim` clear against the write-off loss?** | write off to `CorrectionWriteOffLoss`; clear the pending claim only under explicit policy | **RECOMMENDED — OWNER DECISION** |
| **F26** | **May a correction remain open (pending) indefinitely?** | yes, visibly pending | **RECOMMENDED — OWNER DECISION** |

---

## Part 10 — Approval

**NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.** Approving this document is required
before any executable trading is implemented in Milestone 4. **Nothing here is implemented.**

- ☐ **Approved as written**
- ☐ **Approved with changes:** ______________________________
- ☐ **Rejected (reasons):** ______________________________

Product owner signature / date: ______________________________

---

## Appendix V — Exact local verification performed

Environment: **Node.js v24.22.2**; **@electric-sql/pglite 0.5.16**; **PostgreSQL 18.6 (PGlite
0.5.16) on wasm32**; **Linux 6.8.0-1055-gke**. All commands ran in scratch directories **outside**
the repository (`/tmp/ledgertest`).

### V.1 Revision 8 scratch model — VERIFIED (scratch)

- **Command:** `node rev8.mjs`
- **Purpose:** receivable recognition/collection/realization; full/partial/zero collection;
  over-collection guards; collection and payout idempotency; unapproved/approved write-off; funding
  gating unit reopening; immediate/delayed payout; duplicate payout/funding; failure/rollback;
  restart/retry; final reconciliation; uncollectible+issuance; Option A path.
- **Counting method:** **45 test cases** (each a scenario with an explicit expected/actual outcome)
  plus **70 invariant assertions** (10 invariants × 7 commit boundaries). A test **passes** when the
  observed outcome equals the expected outcome — **including expected rejections/rollbacks**, which
  count as passing when the safe behaviour is observed.
- **Result:** **45 / 45 test cases PASS, 0 FAIL; 70 invariant assertions, 0 FAIL**; ending
  `>>> ALL CHECKS PASSED (scratch)`.
- **Selected actual output:**

```
PASS R8-01 recognize: CorrectionReceivable D 200 / PendingCorrectionClaim C 200 | expected=committed actual=committed
PASS R8-01b receivable 200, pending 200, corr 0, units 0 | expected=true actual=true
PASS R8-02b receivable 0, pending 0, corr 200, units 2 | expected=true actual=true
PASS R8-03b receivable 100 outstanding, pending 100, funded 100, 1 unit | expected=true actual=true
PASS R8-03c reopening the 2nd (unfunded) unit is rejected | expected=rolled-back actual=rolled-back
PASS R8-05 collect 300 > outstanding 200 -> rejected | expected=rolled-back actual=rolled-back
PASS R8-06 collect 200 > Bob available 50 -> rejected | expected=rolled-back actual=rolled-back
PASS R8-09 unapproved write-off rejected | expected=rolled-back actual=rolled-back
PASS R8-11 unfunded correction cannot reopen claim units | expected=rolled-back actual=rolled-back
PASS R8-12c realize alone (no reopen) is rejected: funding without units breaks C1 | expected=rolled-back actual=rolled-back
PASS R8-14b backing preserved between transactions (corr 200, units 2) | expected=true actual=true
PASS R8-19 retry after restart is a no-op (idempotent) | expected=duplicate actual=duplicate
test cases: 45 (45 passed, 0 failed)
invariant assertions at commit boundaries: 70
>>> ALL CHECKS PASSED (scratch)
```

- **Limitations:** sequential single-process simulation; "concurrent" cases are **simulated
  serializations**, not real races. **Real PostgreSQL concurrency is NOT VERIFIED.**

### V.2 Revision 8 PGlite mechanism test — VERIFIED (PGlite)

- **Command:** `node rev8-pglite.mjs`
- **Purpose:** atomic multi-journal receivable lifecycle across MMK+UNIT; rollback isolation; unique
  collection/payout keys; non-negative constraints; receivable drained to zero.
- **Actual output:**

```
P1 rollback: rolled-back: injected failure after journals
   state unchanged after rollback: true
P2 commit: committed
   balances: [...,{"account":"CorrectionReceivable:Bob","balance":0},...,{"account":"SettlementCorrection:M","balance":200},...,{"account":"ClaimUnitsRemaining:M","balance":2},...]
P3 receivable drained to 0, corr funded 200, units 2: true
   ledger rows T-LIFE: 8 | T-FAIL: 0
P4 duplicate collect: rejected: duplicate key value violates unique constraint "collections_pkey"
P4 same key different seq: rejected: duplicate key value violates unique constraint "collections_idempotency_key_key"
P5 duplicate payout: rejected: duplicate key value violates unique constraint "payouts_pkey"
P6 negative receivable rejected: rolled-back: new row for relation "accounts" violates check constraint "accounts_balance_check"
```

- **Limitations:** PGlite is a **single-connection, single-process embedded** engine; it **cannot**
  reproduce real multi-session contention. Mechanism evidence only.

### V.3 Real PostgreSQL — NOT VERIFIED

No real PostgreSQL server was used. **Multi-session concurrency is unverified.**

### V.4 Git state — VERIFIED

See the architecture report Section 1.
