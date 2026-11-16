# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 7) — **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 6 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 7)
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

## Part 0 — What changed in Revision 7

Revision 6 had a **blocking accounting inconsistency**: when a recognized correction moved 200 MMK
from `SettlementCorrection` into `CorrectionPayable:Alice`, C1's backing total dropped by 200 while
the 200 MMK liability still existed, so **C1 failed**. Revision 7 corrects this and completes the
correction lifecycle.

| # | Issue | Revision 7 outcome |
| - | - | - |
| A | `CorrectionPayable` breaks C1 | Two alternatives evaluated; **Option A** (market-scoped control account `CorrectionPayableMarket:{m}` included in C1/M1, per-user attribution in a subledger) and **Option B** (no separately recognized payable). **Recommend Option B; OWNER DECISION F20.** (Parts 6, 7) |
| B | Correction lifecycle incomplete | Full 10-state worked example with every journal, boundary, and invariant. (Part 8) |
| C | Insufficient recovery | Three scenarios (full / insufficient / uncollectible) with alternatives. (Part 9) |
| D | Immediate vs delayed payout | Both lifecycles verified; backing preserved between transactions. (Part 10) |
| E | Policy A vs B | Distinction made explicit; F17 updated, **not** silently approved. (Part 11) |

**Note on what Revision 7 does *not* do:** it does **not** choose an economic policy. Options A/B
and Policies A/B are recorded as **OWNER DECISIONS**.

---

## Part 1 — Three accounting domains (unchanged)

**MMK**, **Share**, and **Claim-unit** ledgers balance **independently**. A journal belongs to
exactly one domain and must balance within it; units are never mixed; no domain balances against
another; a logical operation may comprise several single-domain journals **committed atomically in
one transaction**; cross-domain consistency is enforced by invariants at commit boundaries.
**VERIFIED (scratch + PGlite).**

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
| `SettlementCorrection:{m}` | Correction funding | **Realized** credits held to fund a correction of `m` | **C** |
| `PendingCorrectionClaim:{m}` | Memorandum liability (**NOT in C1**) | A correction shortfall that is recorded but **not funded** | **C** |
| `CorrectionPayableMarket:{m}` | Correction payable control (Option A only) | Recognized-but-unpaid correction entitlements of `m` | **C** |
| `CorrectionReceivable:{u}` | Receivable (claim on a user) | Credits `u` must be debited (mis-paid) | **D** |

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

## Part 3 — M1 (credit conservation)

> **M1:** `CreditsIssued + Σ_u CorrectionReceivable:{u}`
> `= Σ_u (UserAvailable + UserReserved)`
> `+ Σ_m (CollateralBucket + SettlementPayable + SettlementCorrection + PendingCorrectionClaim + CorrectionPayableMarket)`

`PendingCorrectionClaim` and `CorrectionPayableMarket` are **control accounts**; `CorrectionPayableMarket`
is included **only under Option A**, and the subledger is **not** separately summed (no double count).
M1 is a statement of **accounting conservation**, not of economic backing (Part 11).
**VERIFIED (scratch):** M1 held at every commit boundary (Appendix V.1).

---

## Part 4 — Backing invariant C1 (corrected)

> **C1:** `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `+ (Option A only) CorrectionPayableMarket:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}`

**Critical:** `PendingCorrectionClaim:{m}` is **deliberately excluded** from C1. It represents an
**unfunded** shortfall, so it must **never** back a claim unit. This is what makes Policy B safe.
**VERIFIED (scratch):** C1 and C1b held at every commit boundary (Appendix V.1).

---

## Part 5 — Settlement lifecycle and atomicity (unchanged)

Twelve steps; atomic per-user payout (payout key + MMK journal + unit journal in one transaction);
no reliance on a progress flag. **VERIFIED (PGlite):** unique payout keys reject duplicates and
credit exactly once.

---

## Part 6 — BLOCKING ISSUE A: the CorrectionPayable defect

### 6.1 The defect

Revision 6 recognized a correction entitlement by moving credits from `SettlementCorrection` to a
per-user `CorrectionPayable:{u}`. Because C1's backing set was
`{CollateralBucket, SettlementPayable, SettlementCorrection}`, the move reduced C1's backing total
by 200 while `ClaimUnitsRemaining` stayed 2 → **C1 = 0 ≠ 200**. C1 failed.

### 6.2 Option A — include outstanding correction payables in C1

**Design.** Introduce **one market-scoped control account** `CorrectionPayableMarket:{m}` (credit-normal)
that **is** part of C1's backing set. Per-user attribution is a **subledger** row keyed by
`(market_id, resolution_version, user_id)`. Recognition is
`SettlementCorrection:{m} D / CorrectionPayableMarket:{m} C`; the subledger row is written in the
**same transaction**; payment is `CorrectionPayableMarket:{m} D / UserAvailable:{u} C` plus subledger
decrement.

**Precise aggregation rule (market-level):**
`CorrectionPayableMarket:{m}` = Σ over **unpaid** subledger rows for market `m` (all resolution
versions). It is a single control account per market, so:

- **No double-counting:** the subledger is a *detail* of the control, never added to it. The
  scratch model asserts `Σ subledger == CorrectionPayableMarket` at every boundary (`subTie`).
- **No wrong-market backing:** the account is **market-scoped** (`:{m}`); a payable for market `M`
  can never back a claim unit of market `N`.
- **No counting after payment:** payment debits the control and removes the subledger row in the
  same transaction.
- **No lost attribution with multiple corrections:** rows carry `(market, resolution_version, user)`;
  the control is the sum, so multiple corrections coexist without ambiguity.

**Market↔version mapping.** A user-level payable maps to a market and resolution version by its
`(market_id, resolution_version)` key, recorded when the entitlement is recognized from a specific
`SettlementEntitlement` snapshot. **VERIFIED (PGlite):** grouping `correction_payables` by
`(market_id, resolution_version)` returned per-market totals with no cross-market mixing (Appendix V.2, M4).

### 6.3 Option B — eliminate separately recognized correction payables

**Design.** There is **no** correction-payable account. The **realized** funding in
`SettlementCorrection:{m}` **is** the backing for the reopened claim units, and payment is the
**same journal** that moves funding to the user: `SettlementCorrection:{m} D / UserAvailable:{u} C`,
with the matching unit close in the same transaction. An unpaid entitlement is represented simply
as **funded `SettlementCorrection` + open `ClaimUnitsRemaining`** — C1 already ties them together,
so there is nothing extra to recognize.

**Delayed payment, batch, retry, crash recovery.** All remain possible: funding and unit reopening
commit in transaction 1 (funding backs the units via C1); payment commits in a later transaction.
Between them, C1 holds because `SettlementCorrection` still equals `P × ClaimUnitsRemaining`.
Retry is idempotent via the correction/payout key. **VERIFIED (scratch):** delayed lifecycle
(T05/T10) preserved backing across two transactions.

### 6.4 Comparison

| Criterion | Option A (control account in C1) | Option B (no recognized payable) |
| - | - | - |
| Accounting correctness | Correct if the control account and subledger are maintained exactly | Correct; fewer accounts, C1 does the work |
| C1 consistency | Requires C1 to include `CorrectionPayableMarket` | C1 already consistent; no new term |
| Market/version attribution | Explicit via market-scoped control + subledger | Implicit: funding is already market-scoped |
| Atomicity | Recognition + subledger must commit together | Single journal set; simplest atomicity |
| Idempotency | Needs a payable key | Needs only the correction/payout key |
| Crash/restart recovery | Recover from control + subledger | Recover from `SettlementCorrection` + keys |
| Auditability | Separate "recognized" state is visible | Recognized-but-unpaid is **not** a distinct state |
| Implementation complexity | Higher (control + subledger + tie-out) | Lower |
| Future correction support | Richer (explicit recognized state) | Sufficient; add later if needed |
| **Risk** | A control/subledger drift would silently break C1 | Recognized-but-unpaid entitlements are less explicit |

**RECOMMENDATION (OWNER DECISION F20):** **Option B** — it keeps C1 correct with fewer moving
parts, and it does not introduce a control/subledger pair that could drift. **Option A remains
valid** if the product needs an explicit "recognized but unpaid" state for reporting. **I do not
choose on the owner's behalf.**

**Scratch evidence for both options:** Option A (T01, T02, T18/T20, T22) and Option B (T04, T05,
T06, T07, T08, T11–T19) all passed every commit-boundary invariant (Appendix V.1).

---

## Part 7 — BLOCKING ISSUE E: Policy A vs Policy B (unchanged recommendation, not approved)

- **Policy A — receivable-backed.** An **accounting receivable** may contribute to C1 even though it
  is not realized funding. **Risk:** an **uncollectible** receivable can make the ledger appear
  balanced **without providing credits to pay the correction** — an **unfunded deficit disguised as
  collateral**. **VERIFIED (scratch):** T22 (Policy A) ends with `recvB = 200` **uncollected** while
  C1 holds — the risk is visible, so it must be **disclosed**, never hidden.
- **Policy B — realized-funding-only.** Only **recovered credits** or **owner-approved additional
  issuance** count. An unfunded claim is recorded in `CorrectionReceivable:{u}` against
  `PendingCorrectionClaim:{m}` (**not in C1**), so it **cannot** back a claim unit; the correction
  stays **PENDING**. **VERIFIED (scratch):** T07/T08 reject unfunded reopening.

**Clarifications (as requested):**
- **M1** is an accounting conservation identity.
- **C1** is a backing invariant over a **precisely defined** account set (Part 4).
- A **receivable** is a **claim**, not recovered credits.
- **Issuance** increases the virtual-credit supply (both M1 sides).
- An **uncollectible receivable** is **not** realized funding.
- A **pending** correction must be **visibly represented as pending**, never as settled.

**My earlier recommendation was Policy B; it is NOT an owner decision.** Recorded as **F17**.

---

## Part 8 — BLOCKING ISSUE B: complete correction lifecycle

Setting: payout per share **100 MMK**; correction entitlement **2 claim units** = **200 MMK**;
market `M`; Bob was mis-paid (wrong resolution v1); Alice is the true winner. Journal IDs, domains,
entries, reasons, and transaction boundaries are given; **every journal balances in its own domain**.

### 8.1 States and journals (Option B selected for the walk-through; Option A shown in Part 6)

| State | Description |
| - | - |
| S0 | Initial fully settled state (wrong v1) |
| S1 | Correction recorded (resolution version 2 + entitlement snapshot) |
| S2 | Funding established (realized recovery) |
| S3 | Claim units reopened |
| S4 | Correction entitlement recognized — **Option B: same as S3** (funding backs units); **Option A: `CorrectionPayableMarket` set** |
| S5 | Correction payable outstanding — **Option A only** |
| S6 | Corrected payout |
| S7 | Claim units closed |
| S8 | Correction funding closed |
| S9 | Final reconciliation |

| Journal | Domain | Debit | Credit | Reason | Boundary |
| - | - | - | - | - | - |
| **j0** (S1) | — | — | — | Write `ResolutionRecord(v2)` + immutable `SettlementEntitlement(v2, Alice=2)` | tx T-rec |
| **j1** (S2) | MMK | `UserAvailable:Bob 200` | `SettlementCorrection:M 200` | Realized recovery (Policy B) | tx T-F |
| **j2** (S3) | UNIT | `ClaimUnitsRemaining:M 2` | `UnitsControl:M 2` | Reopen corrected entitlement | tx T-F |
| **j3** (S6) | MMK | `SettlementCorrection:M 200` | `UserAvailable:Alice 200` | Corrected payout (Option B) | tx T-F-pay |
| **j4** (S7) | UNIT | `UnitsControl:M 2` | `ClaimUnitsRemaining:M 2` | Close claim units | tx T-F-pay |

**Option A variant:** after j2, j2a MMK `SettlementCorrection:M D 200 / CorrectionPayableMarket:M C 200`
(S4/S5), and j3 becomes `CorrectionPayableMarket:M D 200 / UserAvailable:Alice C 200`. See Part 6.2.

### 8.2 Per-state balances and invariants (Option B; VERIFIED scratch, Appendix V.1 T04/T05/T06)

| State | corr | corrPayMkt | pending | units | UnitsCtl | AvA | AvB | recvB | issued | C1 | C1b | M1 | nonNeg |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| S0 | 0 | 0 | 0 | 0 | 0 | 9800 | 10200 | 0 | 30000 | ✅ | ✅ | ✅ | ✅ |
| S2 (after j1) | 200 | 0 | 0 | 0 | 0 | 9800 | 10000 | 200 | 30000 | ✅ | ✅ | ✅ | ✅ |
| S3 (after j2) | 200 | 0 | 0 | 2 | 2 | 9800 | 10000 | 200 | 30000 | ✅ | ✅ | ✅ | ✅ |
| S6 (after j3) | 0 | 0 | 0 | 2 | 2 | 10000 | 10000 | 200 | 30000 | ✅ | ✅ | ✅ | ✅ |
| S9 (after j4) | 0 | 0 | 0 | 0 | 0 | 10000 | 10000 | 200 | 30000 | ✅ | ✅ | ✅ | ✅ |

- **C1 = 200 at S3** because `SettlementCorrection = 200 = 100 × 2`. (Under Policy B, `recvB = 200`
  is an *outstanding claim on Bob* only if not yet recovered; in the full-recovery case it is 0.)
- **S4/S5 do not exist under Option B.** Under Option A they exist and C1 includes
  `CorrectionPayableMarket`, so C1 holds there too (Part 6.2, T01).
- **UnitsControl** always mirrors `ClaimUnitsRemaining` (C1b). **Share-domain checks (C2/S1)** hold
  throughout (shares were retired at v1; no new shares are minted by a credit correction).

**Critical requirement met:** C1, C1b, and M1 hold at **every committed transaction boundary**.
Intermediate states *inside* an uncommitted transaction may temporarily violate C1, but the model
**rejects** any such state from being committed (Part 12, T17).

---

## Part 9 — BLOCKING ISSUE C: insufficient recovery funds

All scenarios use Bob mis-paid 200 (2 claim units, 200 MMK) and Policy B unless stated.

### 9.1 Scenario C1 — full recovery available

Bob has ≥ 200. **VERIFIED (scratch T06):** j1 recover 200; j2 reopen 2; j3 pay 200; j4 close 2.
Final: Alice 10000, Bob 10000, corr 0, units 0, recvB 0; C1/C1b/M1 ✅.

### 9.2 Scenario C2 — insufficient available credits (Bob has 100 of 200)

- **Is partial recovery allowed?** **Depends on policy (OWNER DECISION F21).** Under the
  **funded-tranche** alternative, yes: only **funded** units are reopened.
- **Can only one funded claim unit be reopened?** **Yes.** **VERIFIED (scratch T07a):** recover 100;
  record the remaining 100 as `PendingCorrectionClaim:M`; reopen **1** unit; pay 100; close 1.
  Result: `pending = 100`, `recvB = 100`, 1 unit paid, **1 unit remains PENDING**.
- **Is the remaining unit pending?** **Yes** — it is **not** reopened, because reopening it would
  break C1 (no funding). **VERIFIED (scratch T07b):** reopening 2 units with only 100 funding is
  **rejected** (C1 = 100 ≠ 200).
- **How is the outstanding receivable represented?** `CorrectionReceivable:Bob = 100` (debit-normal,
  non-negative), with the matching `PendingCorrectionClaim:M = 100` (**excluded from C1**).
- **How is an unfunded unit prevented from being treated as funded collateral?** The unfunded amount
  sits in `PendingCorrectionClaim` (not C1) and the unit is **not** reopened, so C1 cannot count it.
- **Alternatives:** (i) **funded-tranche** partial correction (recommended); (ii) **all-or-nothing**
  (correction stays fully pending until 200 is recovered); (iii) recover from **other** sources
  (reserve / approved issuance). **OWNER DECISION F21.**

### 9.3 Scenario C3 — uncollectible receivable (Bob spent everything)

- **Receivable record:** `CorrectionReceivable:Bob = 200` (a claim; **not** funding).
- **Actual recovered funding:** **0**.
- **Unfunded amount:** **200**.
- **Does the correction remain pending?** **Yes.** **VERIFIED (scratch T08):** the unfunded reopen
  is **rejected** (C1 fails), so the correction stays **PENDING**.
- **Could owner-approved issuance fund it?** **Yes, if F14 is approved.** **VERIFIED (scratch T08b):**
  issuance 200 → `SettlementCorrection` 200 → reopen 2 → pay Alice; `CreditsIssued` +200 (supply +200).
- **If issuance is not approved:** the correction stays **pending** (F19), or the receivable is
  written off as a **disclosed loss** (F18). **Policy B never represents an uncollectible receivable
  as realized funding.**

---

## Part 10 — BLOCKING ISSUE D: immediate vs delayed payout

### 10.1 Lifecycle 1 — immediate payout

Funding, unit reopening, and payment in **one transaction**. **VERIFIED (scratch T04):** j1 recover
200; j2 reopen 2; j3 pay 200; j4 close 2 — all in one tx; every boundary invariant ✅.
**VERIFIED (scratch T06):** same, with `recvB` fully recovered.

### 10.2 Lifecycle 2 — delayed payout

Funding + unit reopening commit in **transaction 1**; payment + unit close commit in **transaction 2**.
**VERIFIED (scratch T05/T10):** after tx1, `SettlementCorrection = 200` and
`ClaimUnitsRemaining = 2`, so **C1 holds between transactions**; the unpaid entitlement is
represented and **backed** by funded `SettlementCorrection`. After tx2, all zero.

### 10.3 The architecture must never permit

| Prohibited | How it is prevented | Evidence |
| - | - | - |
| A correction payable without backing | Under Option B there is no payable account; funding **is** the backing. Under Option A, `CorrectionPayableMarket` is **in C1**. | T01, T04 |
| A claim unit without backing | Reopening units without funding breaks C1 and is rejected | T07b, T08, T17a |
| A duplicate payout | Unique correction/payout key + funding exhaustion | T11, T12; PGlite M5 |
| A funding balance spent twice | `SettlementCorrection` is non-negative; a second spend is rejected | T19; PGlite M6 |
| A correction marked complete while money is unpaid | Completion requires `units = 0` **and** `SettlementCorrection = 0` **and** no open payable/subledger | T22 |

---

## Part 11 — M1 vs C1 (summary)

| Concept | Statement | Meaning |
| - | - | - |
| **M1** | Part 3 identity | Accounting conservation (credits issued = credits held + pending controls) |
| **C1** | Part 4 identity | Backing of reopened claim units by **funded** accounts (plus Option-A control) |
| **Policy A** | An uncollected receivable counts as backing | Makes C1 hold without realized credits — **disclosed risk** |
| **Policy B** | Only realized funding counts | C1 counts only recovered credits or approved issuance |

---

## Part 12 — Financial decision register (Revision 7)

| ID | Decision | Recommended | Status |
| - | - | - | - |
| F1 | Payout per winning share | 100 MMK | OWNER DECISION |
| F2 | Price grid | 1–99 MMK (1%) | OWNER DECISION |
| F3 | Minimum order notional | 100 MMK | OWNER DECISION |
| F4 | Fees | None | OWNER DECISION |
| F5 | Slippage unit + default | relative %, value TBD | OWNER DECISION |
| F6 | Quote expiry | 10 s | RECOMMENDED |
| F7 | Order types | GTC + optional GTD | RECOMMENDED |
| F8 | Market-order partial-fill policy | fill-available, return unspent | OPEN |
| F9 | Cross-outcome matching in MVP | defer | OPEN |
| F10 | Resolution authority | named audited operator, no UI | RECOMMENDED |
| F11 | Pre-settlement dispute window | none (or 24 h) | OPEN |
| F12 | New-user credit | 10,000 MMK | OWNER DECISION |
| F13 | "To Win" display | gross payout; profit separate | OWNER DECISION |
| F14 | May the platform issue additional virtual credits to fund a correction? | undecided | **OWNER DECISION** |
| F15 | Recovery of `CorrectionReceivable`: automatic netting vs manual review | manual review | OPEN |
| F16 | Must `SettlementCorrection` close at zero? | yes | **OWNER DECISION** |
| F17 | Does C1 count an uncollected receivable as backing (Policy A) or only realized funding (Policy B)? | Policy B | **OWNER DECISION** |
| F18 | How should uncollectible receivables be treated? (keep outstanding w/ disclosure vs write off as disclosed loss) | write off as disclosed loss | **OWNER DECISION** |
| F19 | Fallback if additional issuance is not approved? (pending / reserve / disclosed loss) | pending correction | **OWNER DECISION** |
| **F20** | **How should `CorrectionPayable` be represented and included in C1?** (Option A market control in C1 vs Option B no payable) | **Option B** | **OWNER DECISION** |
| **F21** | **Are partial correction funding and partial claim-unit reopening permitted?** (funded-tranche vs all-or-nothing) | funded-tranche | **OWNER DECISION** |
| **F22** | **Is delayed correction payout supported?** (separate payment transaction) | yes | **OWNER DECISION** |

---

## Part 13 — Approval

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

### V.1 Revision 7 scratch model — VERIFIED (scratch)

- **Command:** `node rev7.mjs`
- **Purpose:** both `CorrectionPayable` alternatives; full/insufficient/uncollectible recovery;
  immediate/delayed payout; duplicate submission/payout; idempotency conflict; failure before/after
  journals; rollback; invalid intermediate rejection; non-negativity; C1/C1b/M1 at every commit
  boundary; no double-count; no double-spend; final reconciliation.
- **Counting method:** **29 test cases** (each a scenario with an explicit expected/actual outcome)
  plus **210 invariant assertions** (10 invariants × 21 commit boundaries). A test **passes** when
  the observed outcome equals the expected outcome — including **expected rejections/rollbacks**,
  which count as passing when the safe behaviour is observed.
- **Result:** **29 / 29 test cases PASS, 0 FAIL; 210 invariant assertions, 0 FAIL**; ending
  `>>> ALL CHECKS PASSED (scratch)`.
- **Selected actual output:**

```
PASS T01 Option A recognition commits | expected=committed actual=committed
   T01.1 after recognition (corr=0, corrPayMkt=200, units=2, C1 holds) MMK=true ... C1=true C1b=true M1=true
PASS T04 Option B atomic fund+pay commits | expected=committed actual=committed
PASS T05 delayed: funding transaction commits | expected=committed actual=committed
PASS T10 backing preserved between transactions (corr=200, units=2) | expected=true actual=true
PASS T07b all-or-nothing reopen of the UNfunded unit is rejected (C1 fails) | expected=rolled-back actual=rolled-back
PASS T08 unfunded correction rejected -> stays PENDING | expected=rolled-back actual=rolled-back
PASS T12 second payout rejected (SettlementCorrection exhausted) | expected=rolled-back actual=rolled-back
PASS T19b second spend rejected (corr exhausted) | expected=rolled-back actual=rolled-back
PASS T22b Policy A final: Alice=10000 (paid); Bob keeps 10200 and recvB=200 stays UNCOLLECTED (the Policy A risk) | expected=true actual=true
test cases: 29 (29 passed, 0 failed)
invariant assertions at commit boundaries: 210
>>> ALL CHECKS PASSED (scratch)
```

- **Limitations:** sequential single-process simulation; "concurrent" cases are **simulated
  serializations**, not real races. **Real PostgreSQL concurrency is NOT VERIFIED.**

### V.2 Revision 7 PGlite mechanism test — VERIFIED (PGlite)

- **Command:** `node rev7-pglite.mjs`
- **Purpose:** atomic multi-journal correction across domains; rollback isolation; unique
  correction/payout keys; non-negative constraints; market-specific payable attribution; no
  duplicate payment.
- **Actual output:**

```
M1 rollback: rolled-back: injected failure after journals
   state unchanged after rollback: true
M2 commit: committed
   balances: [...{"account":"CorrectionPayableMarket:M","balance":200},...,{"account":"ClaimUnitsRemaining:M","balance":2}...]
M3 all three domains committed together: true
M4 market attribution: [{"market_id":"M","resolution_version":2,"total":350},{"market_id":"N","resolution_version":1,"total":300}]
M5 pay Alice: committed
M5 duplicate pay Alice: rejected: duplicate key value violates unique constraint "correction_payouts_pkey"
M5 same key different user: rejected: duplicate key value violates unique constraint "correction_payouts_idempotency_key_key"
M6 negative receivable rejected: rolled-back: new row for relation "accounts" violates check constraint "accounts_balance_check"
   receivable non-negative: true
   ledger rows T-F: 8 | T-FAIL: 0
```

- **Limitations:** PGlite is a **single-connection, single-process embedded** engine; it **cannot**
  reproduce real multi-session contention. Mechanism evidence only.

### V.3 Real PostgreSQL — NOT VERIFIED

No real PostgreSQL server was used. **Multi-session concurrency is unverified.**

### V.4 Git state — VERIFIED

See the architecture report Section 1.
