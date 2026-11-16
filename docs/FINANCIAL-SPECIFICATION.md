# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 9) — **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 8 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 9)
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
> code has been written. **Scratch and PGlite results are not product tests. Real PostgreSQL
> multi-session concurrency remains unverified.** Everything describing the product is **PROPOSED**.
> **Nothing in this document is approved.** **A passing scratch model does not establish that this
> specification is correct** — see Part 12 (Assumptions and limitations).

---

## Part 0 — What changed in Revision 9

Revision 8 had a **blocking accounting defect in the E7 additional-credit issuance lifecycle**:

1. **C1 violation.** E7 posted `CreditsIssued D 200 / SettlementCorrection:M C 200` **without**
   reopening the corresponding claim units. After E7, `SettlementCorrection = 200` but
   `ClaimUnitsRemaining = 0`, so `C1 = 200 ≠ 0` — **C1 failed**.
2. **Double-counted obligation.** `PendingCorrectionClaim:M` was **not** cleared, so the same
   correction was represented in both `PendingCorrectionClaim` (200) and `SettlementCorrection`
   (200) — a **400 obligation for a 200 correction**.
3. **Incomplete lifecycle.** The path from uncollectible receivable through write-off, issuance,
   reopening, and payout was never demonstrated end-to-end.

Revision 9 corrects all three.

| # | Revision 8 defect | Revision 9 correction |
| - | - | - |
| A | E7 credited `SettlementCorrection` without reopening units | Issuance (`E6`) is now **atomic with realization (`E4`) and reopening (`E7`)**; the reopened units match the funded amount exactly (Part 6.4). |
| B | `PendingCorrectionClaim` not cleared | Issuance **cancels the outstanding claim** — the receivable (Path B) or the write-off loss (Path A) — and realization clears `PendingCorrectionClaim`, so the obligation is never counted twice (Part 6.4, Part 8). |
| C | No end-to-end path | Full worked examples for Path A (write-off → issuance) and Path B (issuance while outstanding), plus 14 required scenarios (Part 8). |
| D | Duplicated `E3` event identifier | Events renumbered uniquely: **E1–E9** (Part 6.1). |
| E | **F28 inconsistency** (E6 cancels receivable-first vs F28 recommends loss-first) | Derivation added in **6.4a** for all claim states; **loss-first** recommended; **F28 left unapproved**. |
| F | **Option A completeness** unproven | Option A lifecycle + **no-double-count proof** added (6.6); Option A is complete; adoption is F20. |

### Revision 9 review preparation (this commit)

- The scratch scripts are now **in the repository** at `docs/verification/rev9/` with a README,
  captured outputs, and exact commands — so a reviewer can reproduce the results.
- The F28 cancel-order question is derived (6.4a) and left **unresolved**.
- Option A is shown to be complete (6.6).

---

## Part 1 — Three accounting domains

**MMK**, **Share**, and **Claim-unit** ledgers balance **independently**. A journal belongs to exactly
one domain and must balance within it; units are never mixed; no domain balances against another; a
logical operation may comprise several single-domain journals **committed atomically in one
transaction** when the invariants require it. **VERIFIED (scratch + PGlite).**

---

## Part 2 — Account catalogue

Normal balance = the side on which an increase is recorded; a normal-side balance is **never
negative**.

### 2.1 MMK ledger

| Account | Normal | Purpose / accounting meaning |
| - | - | - |
| `CreditsIssued` | **D** | Contra-equity source of virtual credits; total credits ever issued. Increases **only** on an authorized issuance. |
| `UserAvailable:{u}` | **C** | Spendable virtual credits owed to user `u`. |
| `UserReserved:{u}` | **C** | Credits committed to `u`'s open buy orders (restricted). |
| `CollateralBucket:{m}` | **C** | Credits backing market `m`'s outstanding complete sets. |
| `SettlementPayable:{m}` | **C** | Credits owed to `m`'s winners, recognized but unpaid. |
| `SettlementCorrection:{m}` | **C** | **Realized** credits held to fund a correction of `m` (the only correction account that counts as C1 collateral). |
| `PendingCorrectionClaim:{m}` | **C** | A recognized-but-**unfunded** correction obligation (memorandum; **excluded from C1**). |
| `CorrectionReceivable:{u}` | **D** | A claim on `u` for credits that must be returned (mis-paid, not yet collected). |
| `CorrectionWriteOffLoss:{m}` | **D** | An **owner-approved** write-off of an uncollectible correction claim (a loss / contra-equity). |
| `CorrectionPayableMarket:{m}` | **C** | Option-A control account for recognized-but-unpaid correction entitlements (Option A only; in C1). |

Option-A per-user attribution lives in a **subledger** `CorrectionPayableSubledger(market,
resolution_version, user)` whose sum equals `CorrectionPayableMarket:{m}`; it is **not** a balance
account, so there is **no double count**.

### 2.2 Share ledger

`SharesFree:{u}:{o}` (D), `SharesEscrowed:{u}:{o}` (D), `SharesOutstanding:{m}:{o}` (C).

### 2.3 Claim-unit control ledger

`ClaimUnitsRemaining:{m}` (D), `UnitsControl:{m}` (C). Opens at 0; split +n; merge −n; payout −k;
returns to 0 at completion; **never negative**; always `ClaimUnitsRemaining = UnitsControl` (C1b).

---

## Part 3 — M1 (MMK accounting reconciliation)

> **M1:** `CreditsIssued + Σ_u CorrectionReceivable:{u} + Σ_m CorrectionWriteOffLoss:{m}`
> `= Σ_u (UserAvailable + UserReserved)`
> `+ Σ_m (CollateralBucket + SettlementPayable + SettlementCorrection + PendingCorrectionClaim + CorrectionPayableMarket)`

`PendingCorrectionClaim` and `CorrectionPayableMarket` are **control accounts**; the Option-A
subledger is **not** separately summed. `CorrectionWriteOffLoss` is debit-normal and sits on the debit
side. M1 is a statement of **accounting conservation**, not of economic backing. **VERIFIED
(scratch):** M1 held after every committed journal group (Appendix V.1).

---

## Part 4 — C1 (market collateralization) and C1b

> **C1:** `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `+ (Option A only) CorrectionPayableMarket:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}`

**`PendingCorrectionClaim` and `CorrectionReceivable` are never counted as funded collateral.**
**VERIFIED (scratch):** `R9-01b` (C1 holds after issuance), `R9-18` (unfunded reopen rejected),
`R9-12c` (realization without reopening rejected).

---

## Part 5 — Settlement lifecycle and atomicity (unchanged)

Twelve steps; atomic per-user payout; no reliance on a progress flag. **VERIFIED (PGlite):** unique
payout keys reject duplicates and credit exactly once.

---

## Part 6 — The correction lifecycle (events, accounts, invariants)

### 6.1 Unique economic events (fixes the duplicated Rev-8 `E3`)

| Event | Meaning | Journal | Domain |
| - | - | - | - |
| **E1** | Original mispayment to Bob | `SettlementPayable:M D x / UserAvailable:Bob C x` | MMK |
| **E2** | Recognition of the recovery claim | `CorrectionReceivable:Bob D x / PendingCorrectionClaim:M C x` | MMK |
| **E3** | Actual collection from Bob | `UserAvailable:Bob D x / CorrectionReceivable:Bob C x` | MMK |
| **E4** | Realization of collected/issued funds | `PendingCorrectionClaim:M D x / SettlementCorrection:M C x` | MMK |
| **E5** | Owner-approved write-off | `CorrectionWriteOffLoss:M D x / CorrectionReceivable:Bob C x` | MMK |
| **E6** | Owner-approved issuance | `CreditsIssued D x / (CorrectionReceivable:Bob C a + CorrectionWriteOffLoss:M C b)`, `a+b=x` | MMK |
| **E7** | Funded claim-unit reopening | `ClaimUnitsRemaining:M D x/P / UnitsControl:M C x/P` | UNIT |
| **E8** | Payout of the corrected entitlement | `SettlementCorrection:M D x / UserAvailable:Alice C x` (Option B) | MMK |
| **E9** | Claim-unit retirement | `UnitsControl:M D u / ClaimUnitsRemaining:M C u` | UNIT |

### 6.2 E2 — recognition

Debit `CorrectionReceivable:Bob` (D), credit `PendingCorrectionClaim:M` (C). Meaning: Bob owes `x`
back; the market has a recognized but **unfunded** claim. M1 unchanged; **C1 unaffected** (neither
account is in C1). Correction is **pending**, not funded. **VERIFIED (scratch R9-00, R8-01).**

### 6.3 E3/E4/E7 — collection (or issuance), realization, reopening

**Collection path:** `E3` collect (MMK) → `E4` realize (MMK) → `E7` reopen (UNIT), atomic.
**The atomicity is a proved necessity:** after `E4`, `SettlementCorrection = x` requires
`ClaimUnitsRemaining = x/P` for C1; realizing without reopening breaks C1. **VERIFIED (scratch
R8-12c).** `E3` collect may commit alone (an intermediate state where Bob has paid but funding is not
yet realized is reconciled: `CorrectionReceivable` falls, `PendingCorrectionClaim` still carries the
obligation, `SettlementCorrection = 0`, `ClaimUnitsRemaining = 0`).

### 6.4 E6 — corrected issuance (the Rev-9 fix)

**One atomic group:** `E6` issue + `E4` realize + `E7` reopen.

```
E6-issue  (MMK): CreditsIssued D x
                 / <cancel the outstanding claim: a from one component, b from the other, a+b=x>
E4-realize (MMK): PendingCorrectionClaim:M D x / SettlementCorrection:M C x
E7-reopen (UNIT): ClaimUnitsRemaining:M D x/P / UnitsControl:M C x/P
```

The **cancel order** (which claim component is cancelled first) is **F28** and is **not yet
approved** — see 6.4a, which derives both orders for every claim state. This section deliberately
does **not** assume an order.

**Why the group is correct (order-independent):**

1. **Issuance creates funding.** `CreditsIssued` (D) rises by `x`; the virtual-credit supply rises by
   `x`. The credit side **cancels the outstanding claim** (the receivable and/or the write-off loss),
   so no value is created beyond the authorized issuance.
2. **`PendingCorrectionClaim` is cleared, not doubled.** `E4` moves the obligation from
   `PendingCorrectionClaim` to `SettlementCorrection`; the sum `PendingCorrectionClaim +
   SettlementCorrection` stays `≤ 200`. **VERIFIED (scratch R9-02, R9-23).**
3. **`SettlementCorrection` is funded and units are reopened together**, so C1 holds at the commit
   boundary. **VERIFIED (scratch R9-01b, R9-21).**
4. **No double funding.** Because the issuance **cancels the receivable**, a **later collection is
   impossible** when the whole claim was receivable-funded — the receivable balance is 0, so `E3`
   collect is **rejected**. **VERIFIED (scratch R9-04, R9-10).** (If only part of the claim is
   cancelled — see 6.4a, State 3b — the residual receivable remains collectible, which is intended.)

**Balance check (x = 200, Path B):** debit `CreditsIssued +200`; credit
`CorrectionReceivable:Bob +200`; `E4` debit `PendingCorrectionClaim 200`, credit
`SettlementCorrection 200`; `E7` unit journals +2/−2. Post-commit: `CreditsIssued 30200`,
`CorrectionReceivable 0`, `PendingCorrectionClaim 0`, `SettlementCorrection 200`,
`ClaimUnitsRemaining 2`. **VERIFIED (scratch R9-01, R9-03b; PGlite P3/P4).**

### 6.4a E6 cancel order — derivation for every claim state (F28, unresolved)

When a claim has been **partly written off** (some of it is a receivable, some is a
`CorrectionWriteOffLoss`) and the issuance is **smaller** than the outstanding claim, the two cancel
orders give **different residuals**. This is the F28 inconsistency: the E6 formula above cancels the
**receivable first**, while the F28 recommendation cancels the **loss first**. **Neither is approved.**
Both are shown; **both preserve M1, C1, and C1b** — they differ only in *which residual claim remains*.

Notation: outstanding claim `C = recv + loss`; issuance `x ≤ C`; `recv` = `CorrectionReceivable:Bob`,
`loss` = `CorrectionWriteOffLoss:M`.

| State | Before (`recv`, `loss`) | Issuance `x` | **recv-first** residual (`recv`, `loss`) | **loss-first** residual (`recv`, `loss`) | Journals (E6-issue) | M1 |
| - | - | - | - | - | - | - |
| **1. Fully outstanding** | (200, 0) | 200 | (0, 0) | (0, 0) | `CreditsIssued D 200 / CorrectionReceivable C 200` | ✅ |
| **2. Fully written-off** | (0, 200) | 200 | (0, 0) | (0, 0) | `CreditsIssued D 200 / CorrectionWriteOffLoss C 200` | ✅ |
| **3. Partially written-off, full issuance** | (100, 100) | 200 | (0, 0) | (0, 0) | `CreditsIssued D 200 / CorrectionReceivable C 100 / CorrectionWriteOffLoss C 100` | ✅ |
| **3b. Partially written-off, partial issuance** | (100, 100) | 100 | (**0, 100**) | (**100, 0**) | recv-first: `CreditsIssued D 100 / CorrectionReceivable C 100`; loss-first: `CreditsIssued D 100 / CorrectionWriteOffLoss C 100` | ✅ |
| **4. Partly collected AND partly written-off** | (100, 100) with 1 unit already funded | 100 | (0, 100) | (100, 0) | as 3b | ✅ |

In every state, `E4` also posts `PendingCorrectionClaim:M D x / SettlementCorrection:M C x`, and `E7`
reopens `x/P` units. M1 holds in every case because the issuance debit (`CreditsIssued`) is matched by
credits to claim accounts of exactly `x`; no value is created or destroyed.

**Interpretation and the unresolved choice (F28):**

- **States 1, 2, 3:** both orders agree (only one component exists, or the issuance covers the whole
  claim). No decision needed.
- **State 3b (the only divergent case):** **recv-first** leaves the **write-off loss** outstanding
  (`loss 100`); **loss-first** leaves the **receivable** outstanding (`recv 100`).
  - **loss-first (the F28 recommendation):** reverses the recorded loss first, so the historical loss
    is extinguished as early as possible, and the residual is a still-collectible receivable. This
    matches the accounting intuition "issuance replaces the loss, not the debt".
  - **recv-first (the E6 formula as written):** cancels the debt first, leaving the loss on the books
    until a later issuance/collection.
- **State 4:** the earlier collection already funded 1 unit; the residual `(100, 100)` behaves as 3b.

**Recommendation:** **loss-first** (extinguish the recorded loss before the receivable). **NOT
APPROVED** — F28 remains open, and the E6 body must not be read as having chosen an order.

**VERIFIED (scratch, review-prep suite):** R9-24…R9-27 (states 1–2, both orders), R9-28/R9-29
(state 3, both orders), R9-30/R9-31 (state 3b — the divergence), R9-32 (state 4), R9-33 (M1 for both
orders).

### 6.5 E5 — write-off

`CorrectionWriteOffLoss:M D x / CorrectionReceivable:Bob C x` (owner-approved only). It **records a
historical loss**; it creates **no funding** and backs **no** claim unit. The claim remains
**pending** (`PendingCorrectionClaim` unchanged) until funded by issuance or collection. Unapproved
write-off is **rejected**. **VERIFIED (scratch R8-09/R8-10, R9-05a/b).**

### 6.6 Option A — complete lifecycle and no-double-count proof

**Option A** (the alternative to the recommended Option B) recognizes a correction entitlement into a
**market-scoped control account** `CorrectionPayableMarket:{m}` before paying it. Option A is a
**supported alternative**; the journals are:

| Step | Journal | Domain |
| - | - | - |
| Recognize (after funding + reopen) | `SettlementCorrection:M D x / CorrectionPayableMarket:M C x` (+ subledger row `(m, version, Alice) += x`) | MMK |
| Pay | `CorrectionPayableMarket:M D x / UserAvailable:Alice C x` (− subledger row) | MMK |
| Retire | `UnitsControl:M D u / ClaimUnitsRemaining:M C u` | UNIT |

**Full Option A lifecycle** (issuance-funded example, x = 200): `E2` recognize → `{E6+E4+E7}` fund and
reopen 2 units → **recognize** `SettlementCorrection:M D 200 / CorrectionPayableMarket:M C 200` →
**pay** `CorrectionPayableMarket:M D 200 / UserAvailable:Alice C 200` → **retire** 2 units.
Post-commit: `SettlementCorrection 0`, `CorrectionPayableMarket 0`, `ClaimUnitsRemaining 0`,
`UserAvailable:Alice 10000`. **VERIFIED (scratch R9-34…R9-38).**

**No-double-count proof.** `SettlementCorrection` and `CorrectionPayableMarket` are **never both
positive for the same entitlement**:

- At **funding** (`E4`), `SettlementCorrection = x`, `CorrectionPayableMarket = 0`, `units = x/P` →
  C1 backed by `SettlementCorrection`.
- At **recognition**, `E8-rec-A` **debits** `SettlementCorrection` by `x` and **credits**
  `CorrectionPayableMarket` by `x`; afterward `SettlementCorrection = 0`, `CorrectionPayableMarket =
  x`, `units = x/P` → C1 backed by `CorrectionPayableMarket`. The two accounts move in **opposite
  directions by the same amount**, so `SettlementCorrection + CorrectionPayableMarket = x` throughout
  (**never `2x`**). **VERIFIED (scratch R9-35: sum = 200, not 400).**
- At **payout**, `CorrectionPayableMarket` is debited to 0 and the units retire together.
- A **second recognition** is **rejected** (`SettlementCorrection` is 0, so the debit would go
  negative). **VERIFIED (scratch R9-38).**
- The **subledger** is a *detail* of `CorrectionPayableMarket`, never added to it, so there is **no
  control↔subledger double count**. **VERIFIED (scratch R9-37: `subTie` holds at every boundary).**

**Conclusion:** Option A is **complete** and internally consistent, and it cannot double-count the same
entitlement. Whether to adopt it remains **OWNER DECISION F20 / AR15** (recommendation: Option B).

### 6.7 E8/E9 — payout and retirement

`E8` (MMK) moves realized funding to Alice; `E9` (UNIT) retires the units. **Payout and retirement
must be atomic**, and the payout may not exceed the funded `SettlementCorrection`. **VERIFIED
(scratch R9-09, R8-15).**

---

## Part 7 — Correction state model

| State | `CorrectionReceivable` | `PendingCorrectionClaim` | `SettlementCorrection` | `ClaimUnitsRemaining` | Meaning |
| - | - | - | - | - | - |
| **Recognized (pending)** | x | x | 0 | 0 | Obligation known; not funded |
| **Partially funded** | x−f | x−f | f | f/P | Funded tranche reopened |
| **Fully funded** | 0 | 0 | x | x/P | Ready to pay |
| **Paid** | 0 | 0 | 0 | 0 | Correction complete |
| **Written off (unfunded)** | 0 | x | 0 | 0 | Loss recorded; still pending |
| **Permanently pending** | x | x | 0 | 0 | No recovery, no issuance, no write-off |

The terms are distinct: **recognized** (E2 recorded), **pending** (not funded),
**funded** (`SettlementCorrection > 0`), **paid** (E8 done), **written-off** (E5 done),
**permanently pending** (owner declines all funding). A correction is **never** shown as settled
while it is pending.

---

## Part 8 — Worked scenarios

Example: payout/share **100 MMK**; correction **200 MMK**; **2 claim units**; initial erroneous
payout 200 MMK. Option B unless stated. Transaction boundaries and idempotency keys are given per
scenario; M1/C1/C1b are asserted after **every** committed group.

### 8.1 Path A vs Path B (comparison)

| Aspect | **Path A — write-off, then issuance** | **Path B — issuance while receivable outstanding** |
| - | - | - |
| Sequence | E2 recognize → E5 write-off → E6 issue (cancels loss) → E4 realize → E7 reopen | E2 recognize → E6 issue (cancels receivable) → E4 realize → E7 reopen |
| What the issuance cancels | `CorrectionWriteOffLoss` (reverses the recognized loss) | `CorrectionReceivable` (extinguishes the claim on Bob) |
| Loss treatment | Loss is recognized at write-off and **reversed** when issuance funds the correction (the loss is reclassified to issuance cost). **Not silently erased** — it was recognized in a committed state and is explicitly reversed by a journal. | No loss recorded (no write-off). |
| Double-funding risk | After write-off the receivable is 0, so collection is impossible; issuance then funds once. | Issuance cancels the receivable, so a later collection is **rejected**. |
| When appropriate | Owner has decided the receivable is uncollectible and formally writes it off, then later funds the correction. | Owner funds the correction while still nominally pursuing Bob, but accepts that issuance replaces collection. |
| Reporting | Shows a write-off loss then a reversal. | Shows the claim extinguished without a loss. |

**Recommendation (OWNER DECISION F27):** use **Path B** when the owner intends to fund the correction
by issuance and **forgo** collection (the receivable is cancelled). Use **Path A** when a write-off
must be recorded first for accounting/disclosure reasons. **Both are internally consistent; the
choice is the owner's.**

### 8.2 Zero recovery, no write-off

E2 only. Post-commit: `recv 200, pending 200, corr 0, units 0`. M1 ✅, C1 ✅ (0 = 0), C1b ✅.
Correction **pending**. **VERIFIED (scratch R8-04, R9-16b).**

### 8.3 Zero recovery, owner-approved write-off

E2 → E5. Post-commit: `recv 0, loss 200, pending 200, corr 0, units 0`. M1 ✅ (loss on debit side),
C1 ✅, C1b ✅. Correction **pending**. **VERIFIED (scratch R9-05b).**

### 8.4 Write-off followed by issuance (Path A)

E2 → E5 → {E6 + E4 + E7}. Post-commit: `recv 0, loss 0, pending 0, corr 200, units 2`,
`CreditsIssued +200`. M1 ✅, C1 ✅ (200 = 100×2), C1b ✅. **VERIFIED (scratch R9-05c/d; PGlite P5).**

### 8.5 Issuance before collection (Path B)

E2 → {E6 + E4 + E7}. Post-commit: `recv 0, pending 0, corr 200, units 2`, `CreditsIssued +200`.
**VERIFIED (scratch R9-01; PGlite P3/P4).**

### 8.6 Later collection after issuance

`E3` collect is **rejected** (receivable = 0). This is what prevents a second funding of the same
correction. **VERIFIED (scratch R9-04).**

### 8.7 Partial collection of 100

E2 → {E3 100 + E4 100 + E7 1}. Post-commit: `recv 100, pending 100, corr 100, units 1`.
**VERIFIED (scratch R8-03, R9-07).**

### 8.8 Partial funding and reopening of one unit

As 8.7; the unfunded unit stays pending; reopening it is **rejected**. **VERIFIED (scratch R8-03c).**

### 8.9 Delayed payout after reopening

Funding tx commits; payout tx commits later. Between them: `corr 200, units 2` → C1 ✅. **VERIFIED
(scratch R8-14, R9-09).**

### 8.10 Complete correction and final reconciliation

All correction accounts 0; Alice 10000; Bob 10000 (collection path) or 10200 (issuance path);
`CreditsIssued` 30000 (collection) or 30200 (issuance). **VERIFIED (scratch R8-20, R9-20).**

### 8.11 Insufficient available balance for collection

Bob has 50; collecting 200 is **rejected** (would drive `UserAvailable:Bob` negative). **VERIFIED
(scratch R8-06, R9-17).**

### 8.12 Duplicate issuance request

Second issuance is **rejected** (nothing left to cancel) and idempotency key returns the original
result. **VERIFIED (scratch R9-10, R9-15; PGlite P6).**

### 8.13 Duplicate payout request

Second payout is **rejected** (`SettlementCorrection` exhausted) / unique key. **VERIFIED (scratch
R9-13; PGlite P7).**

### 8.14 Crash after one transaction commits, before the next starts

Funding committed; the next transaction rolls back; state is reconciled and **resumable**
(`pending 200, corr 0, units 0`). **VERIFIED (scratch R9-14).**

### 8.15 Retry after crash

Idempotent: retry is a **no-op**. **VERIFIED (scratch R9-15).**

### 8.16 Owner declines issuance permanently

Issuance **rejected**; correction stays **permanently pending** (`pending 200, corr 0, units 0`).
**VERIFIED (scratch R9-16).**

---

## Part 9 — Atomicity, idempotency, recovery

| Requirement | Rule |
| - | - |
| Funding + reopening atomic | `E4` realize + `E7` reopen commit in **one** transaction (C1 requires it). |
| Reopening + UnitsControl atomic | `E7` writes `ClaimUnitsRemaining` and `UnitsControl` in **one** UNIT journal. |
| Payout + retirement atomic | `E8` (MMK) + `E9` (UNIT) commit in **one** transaction. |
| Collection/funding separation | `E3` collect may precede `E4`+`E7` **only** if the intermediate state is reconciled (it is: see 6.3) and resumable. |
| Retries | Never duplicate economic effects (idempotency keys). |

**Unique idempotency keys:** recognition `(market, resolution_version, user)`; collection
`(market, user, collection_seq)` + request key; write-off `(market, resolution_version, writeoff_seq)`;
issuance `(market, resolution_version, issuance_seq)` + request key; reopening
`(market, resolution_version, reopen_seq)`; payout `(market, resolution_version, user)`; retirement
`(market, resolution_version, user, retire_seq)`.

**Crash behaviour:** before commit → no effect; immediately after commit → restart sees the committed
state; between collection and funding → the reconciled intermediate state resumes; between funding
and payout → funding is preserved and payout resumes; during retry → idempotent no-op.
**VERIFIED (scratch R9-14/R9-15; PGlite P2).**

---

## Part 10 — Financial decision register (Revision 9)

All prior decisions remain **unresolved**. F14, F18, F19, F20, F21, F22, F23, F24, F25, F26 are
**NOT APPROVED**.

| ID | Decision | Recommendation | Status |
| - | - | - | - |
| F14 | May the platform issue additional virtual credits to fund a correction? | undecided | **NOT APPROVED** |
| F16 | Must `SettlementCorrection` close at zero? | yes | **NOT APPROVED** |
| F17 | Does C1 count an uncollected receivable as backing (Policy A) or only realized funding (Policy B)? | Policy B | **NOT APPROVED** |
| F18 | Treatment of uncollectible receivables | write off as disclosed loss | **NOT APPROVED** |
| F19 | Fallback if additional issuance is not approved? | pending correction | **NOT APPROVED** |
| F20 | CorrectionPayable representation: Option A vs Option B | Option B | **NOT APPROVED** |
| F21 | Partial funding vs all-or-nothing correction | funded-tranche | **NOT APPROVED** |
| F22 | Is delayed correction payout supported? | yes | **NOT APPROVED** |
| F23 | When is the receivable recognized? | at correction record (E2) | **NOT APPROVED** |
| F24 | Is the collect→realize→reopen group required to be atomic? | yes | **NOT APPROVED** |
| F25 | Write-off mechanics and `PendingCorrectionClaim` clearing | write off to `CorrectionWriteOffLoss`; clear pending claim via realization | **NOT APPROVED** |
| F26 | May a correction remain pending indefinitely? | yes, visibly pending | **NOT APPROVED** |
| **F27** | **Which issuance path: Path A (write-off then issuance) or Path B (issuance while outstanding)?** | Path B if collection is forgone; Path A if a write-off must be recorded first | **NOT APPROVED** |
| **F28** | **When issuance funds a correction, what does it cancel — the receivable or the write-off loss?** | **loss-first** (see 6.4a) | **NOT APPROVED** |
| **F29** | **Is the issuance group (E6+E4+E7) required to be atomic?** | yes (C1 requires it) | **NOT APPROVED** |

**New-decision detail (F27–F29):**

- **F27 — issuance path.** *Options:* Path A (write-off first) / Path B (issuance while outstanding).
  *Financial consequence:* Path A records then reverses a loss; Path B extinguishes the receivable
  with no loss. *Abuse/security:* both must be owner-authorized and audit-logged; neither may be
  triggered by a user. *Operational:* Path A adds a write-off approval step. *Recommendation:* Path B
  if collection is forgone; Path A if a write-off must be disclosed. **NOT APPROVED.**
- **F28 — what issuance cancels.** *Options:* cancel the receivable first / cancel the write-off loss
  first / cancel both proportionally (when a claim was partially written off). *Financial consequence:*
  the two orders agree for states 1–3 but **diverge only in state 3b** (partially written-off claim,
  partial issuance): **recv-first** leaves the write-off loss outstanding; **loss-first** leaves the
  receivable outstanding (see 6.4a). Both preserve M1/C1/C1b. *Abuse/security:* prevents funding a
  correction while also collecting the same amount (only the residual receivable stays collectible).
  *Operational:* loss-first needs a rule that reverses the recorded loss before the debt.
  *Recommendation:* **loss-first** (extinguish the recorded loss first, leaving a still-collectible
  receivable). **NOT APPROVED.**
- **F29 — atomicity of the issuance group.** *Options:* atomic `E6+E4+E7` / allow `E6` alone.
  *Financial consequence:* `E6` alone breaks C1 and double-counts. *Abuse/security:* non-atomic
  issuance could create unbacked claim units. *Operational:* simpler and safer when atomic.
  *Recommendation:* **atomic**. **NOT APPROVED.**

---

## Part 11 — Approval

**NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.** Approving this document is required
before any executable trading is implemented in Milestone 4. **Nothing here is implemented.**

- ☐ **Approved as written**
- ☐ **Approved with changes:** ______________________________
- ☐ **Rejected (reasons):** ______________________________

Product owner signature / date: ______________________________

---

## Part 12 — Assumptions, edge cases, and limitations

- **Scratch ≠ proof.** A passing scratch model shows the *proposed* journals are internally consistent
  under the model's rules; it does **not** prove the financial rules are correct or complete.
- **Assumptions:** payout/share fixed at 100; a correction maps to one market and resolution version;
  the owner authorizes issuance/write-off out of band; the model's `noDoubleCount` check uses the
  scenario total (200).
- **Unresolved edge cases:** multiple concurrent corrections on one market; a partially written-off
  claim then partially collected; reversal of a correction after issuance; cross-market corrections.
- **Real concurrency:** **Real PostgreSQL multi-session concurrency remains unverified.**

---

## Appendix V — Exact local verification performed

Environment: **Node.js v24.22.2**; **@electric-sql/pglite 0.5.16**; **PostgreSQL 18.6 (PGlite
0.5.16) on wasm32**; **Linux 6.8.0-1055-gke**. The **canonical, reproducible copies** of the scripts
live in the repository at **`docs/verification/rev9/`** (see its `README.md` for exact commands,
versions, and expected output); the originals were run from a scratch directory (`/tmp/ledgertest`).

### V.1 Revision 9 scratch model — VERIFIED (scratch)

- **Command:** `node docs/verification/rev9/rev9.mjs` (reproducible; see `docs/verification/rev9/README.md`)
- **Structure:** Section 1 = **45 Revision 8 tests (preserved)**; Section 2 = **30 Revision 9 tests**;
  Section 3 = **27 review-prep tests** (F28 cancel-order, Option A).
- **Counting method:** **102 test cases** (each a scenario with an explicit expected/actual outcome)
  plus **220 invariant assertions** (11 invariants × 20 commit boundaries). A test passes when the
  observed outcome equals the expected outcome, **including expected rejections/rollbacks**.
- **Result:** **102 / 102 test cases PASS, 0 FAIL; 220 invariant assertions, 0 FAIL**; ending
  `>>> ALL CHECKS PASSED (scratch)`. Captured output: `docs/verification/rev9/rev9.expected.out`.
- **Selected actual output:**

```
PASS R9-01 corrected E6 issuance+realize+reopen commits atomically | expected=committed actual=committed
PASS R9-01b corr 200 = 100 x 2 units (C1 holds after issuance) | expected=true actual=true
PASS R9-02 no double-count: pending 0 and corr 200 | expected=true actual=true
PASS R9-03 issuance cancels the receivable (recv 0) | expected=true actual=true
PASS R9-04 later collection after issuance is rejected (receivable gone) | expected=rolled-back actual=rolled-back
PASS R9-05d final: recv 0, loss 0, pending 0, corr 200, units 2 | expected=true actual=true
PASS R9-08b all funded: recv 0, pending 0, corr 200, units 2 | expected=true actual=true
PASS R9-10 duplicate issuance rejected (nothing left to cancel) | expected=rolled-back actual=rolled-back
PASS R9-14 crash between funding and payout: funding tx fails and rolls back | expected=rolled-back actual=rolled-back
PASS R9-16 owner declines issuance -> correction stays pending | expected=rolled-back actual=rolled-back
PASS R9-23 no double-count: pending+corr == 200 (never 400) | expected=true actual=true
test cases: 75 (75 passed, 0 failed)
invariant assertions at commit boundaries: 165
>>> ALL CHECKS PASSED (scratch)
```

- **Limitations:** sequential single-process simulation; not real concurrency.

### V.2 Revision 9 PGlite mechanism test — VERIFIED (PGlite)

- **Command:** `node docs/verification/rev9/rev9-pglite.mjs` (requires `@electric-sql/pglite@0.5.16`; see the README)
- **Purpose:** corrected issuance atomic group (MMK+UNIT); `PendingCorrectionClaim` cleared;
  write-off→issuance loss reversal; rollback; unique issuance/collection/payout keys; non-negative.
- **Actual output:**

```
P1 recognize: committed
P2 issuance rollback: rolled-back: injected failure after journals
   state unchanged after rollback: true
P3 issuance commit: committed
P4 corrected E6: issued 30200, recv 0, pending 0, corr 200, units 2: true
   ledger rows T-ISS: 6 | T-ISS-FAIL: 0
P5a after write-off: loss 200, recv 0: true
P5 Path A: loss reversed after issuance: true | pending 0: true | corr 200: true
P6 duplicate issuance: rejected: duplicate key value violates unique constraint "issuance_pkey"
P7 duplicate payout: rejected: duplicate key value violates unique constraint "payouts_pkey"
P8 negative claim cancel rejected: rolled-back: ... violates check constraint "accounts_balance_check"
```

- **Limitations:** PGlite is **single-connection**; it does not prove multi-session behaviour.

### V.3 Real PostgreSQL — NOT VERIFIED

**Real PostgreSQL multi-session concurrency remains unverified.**

### V.4 Git state — VERIFIED

See the architecture report Section 1.
