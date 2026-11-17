# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 12.3) — **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 12.2 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 12.3)
**Milestone:** still Milestone 0 — planning only. **Milestone 1 has NOT started.** **No trading,
ledger, matching, settlement, schema, migration, or auth code exists.**
**Revision 12.3 is a documentation-consistency release only:** it tracks the architecture report's
Revision 12.3 corrections (README scaffold-location clarification and the Git publication history) and
carries **no financial change** — the payout-terminology clarification (§6.7 / E8) and the price-grid
clarification (Appendix B topic 16; **T1 stays OPEN**) from Revision 12.2 stand unchanged. **No financial
policy, account, journal, or decision was changed and no alternative was selected.**

### Verification labels

| Label | Meaning |
| - | - |
| **VERIFIED (scratch)** | A scratch model outside the repo was run; output observed (Appendix A). **Not** a product test. |
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

## Part 0 — Change history (Revision 9, Revision 10, Revision 11, Revision 12, Revision 12.2 and Revision 12.3)

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
| E | **F28 inconsistency** (E6 implied receivable-first vs F28 recommended loss-first) | **6.4a** now states **two explicit alternatives** (proposed recommendation vs alternative) for all claim states; **neither is selected as policy** and **F28 stays NOT APPROVED**. |
| F | **Option A completeness** unproven | Option A lifecycle + **no-double-count proof** added (6.6), complete **for the supplied scenario only**; adoption is F20. |

### Revision 9 review preparation and independent-review corrections

- The scratch scripts are **in the repository** at `docs/verification/rev9/` with a README, captured
  outputs, and exact commands — so a reviewer can reproduce the results.
- **F28 is stated as two explicit alternatives** (proposed recommendation vs alternative) in **6.4a**;
  **neither is selected as policy** and **F28 remains NOT APPROVED**. The E6 body no longer implies an
  order.
- **State 4 is reconstructed** from the actual `E2 → E3 (100) → E5 (100)` sequence: before issuance,
  `recv 0, loss 100, pending 100, corr 100, units 1` (the earlier `(100, 100)` figure was unreachable
  for that sequence and is removed). The scratch test `R9-32pre` asserts these balances.
- **Appendix A.1 selected-output block corrected** to the reproduced **105 tests / 220 assertions**.
- **PGlite duplicate-collection rejection is now actually exercised (`P9`)**; before this correction it
  was claimed but not tested.
- **Explicit unresolved limitations added** (Part 12): no real-PostgreSQL multi-session verification;
  concurrent corrections; partial write-off/collection combinations; per-user allocation and
  multi-user payout; Option A demonstrated only for the supplied scenario.
- Option A is shown to be **complete for the supplied scenario** (6.6).

### Revision 10 — final-review corrections (documentation only)

- **C2 and S1 are now defined** (Part 4a), with scope, sign convention, and a **reported discrepancy** in
  the scratch model's `C2()` (sign-inverted; never exercised at non-zero share balances). **The model was
  not modified** in Revision 10. *(Superseded by Revision 11, which corrected the model — see below.)*
- **E6 clarity:** the E6 table row and the 6.4 block now state that the allocation split `(a, b)` is the
  **F28** owner decision; **loss-first and receivable-first remain distinct and neither is selected.**
- **F30** (correction/entitlement identifier model) and **F31** (whole-Kyat unit divisibility) added as
  **NOT APPROVED** decisions (Part 10a). **No design or policy is chosen.**
- **Coverage claim withdrawn:** the "20 required topics — complete" phrasing is replaced by **Appendix B
  coverage matrix**, which explicitly lists the unresolved **pricing, price-tick, minimum-notional, and
  fee** rules. **No values invented.**
- **Appendix numbering corrected** ("Appendix V" → **Appendix A**) with all cross-references updated.
- **Register reference corrected:** "F1–F29" replaced by the IDs that exist (**F14, F16–F29**); F1–F13 and
  F15 are documented as **undefined**.

### Revision 11 — C2 verification correction and consistency (documentation + verification only)

- **C2 verification-model defect corrected** (Part 4a): `rev9.mjs` now computes
  `C2() = amt(YES) === amt(NO)` instead of the sign-inverted `bal[YES] === -bal[NO]`. **Verification
  script only** — no financial rule, account, journal, or decision changed.
- **S1 independently re-derived** (Part 4a) from the split/merge/escrow/release/retire journals and
  confirmed correct; restated via `amt(...)`. **S1 unchanged in substance.**
- **New share-ledger tests** (rev9.mjs **Section 4**, S4-01…S4-09) exercise C2/S1 at **zero and
  non-zero** outstanding balances, with a **regression guard** for the old formula. Scratch totals:
  **136 test cases, 253 invariant assertions** (was 105/220).
- **Trading milestone reference corrected** (Part 11): "Milestone 4" → **Milestone 7+ (gated)**,
  labelled **PROPOSED** and subject to owner approval. *(The M7+ label was part of the unapproved
  Revision 10/11 sequence; it is superseded by Revision 12 — see below.)*
- **F30/F31 surfaced in the outstanding lists:** the architecture report now lists **F14, F16–F31** in
  its stop condition (§13) and adds open questions **T28–T30** (§11). **Both remain NOT APPROVED.**

### Revision 12 — owner-approved roadmap restoration (documentation only)

- **The owner-approved M0–M6 roadmap is restored** and used consistently. The unapproved Revision
  10/11 sequence is superseded; **no milestone is renumbered and M7+ is removed.** Trading and the
  ledger now sit inside **M4**, strictly behind financial-specification approval.
- **Milestone references updated** here: Part 10a now gates F30/F31 before the **M4** ledger/trading
  work; Part 11 assigns executable trading to **M4 (gated)**; Appendix B topic 20 defers order types /
  matching / partial fills to **M4**.
- **No financial decision changed.** F14 and F16–F31 remain **NOT APPROVED**; F28, F30 and F31 remain
  undecided. **No policy was selected and no ledger/trading/schema/migration code was written.**
  **C2/S1 verification corrections are not financial approval.** See the architecture report §12.3.

### Revision 12.2 — independent-review corrections (documentation + evidence only)

- **Internal payout terminology clarified (§6.7 / E8).** E8's "payout" is **internal virtual-credit
  settlement/distribution** only — it is **not** a cash payment, withdrawal, redemption, external
  transfer, or real-money payout. **No journal, account, or policy changed.**
- **Price grid clarified (Appendix B topic 16).** `CHECK (price BETWEEN 1 AND 99)` is a **proposed
  integer range bound only** and implies **no tick increment**; the exact integer price grid remains
  **T1, still OPEN**. **No price grid is selected or approved.**
- **Verification evidence published.** `docs/verification/rev9/` is published on the review branch
  `review/m0-documents-2026-11-16` (**byte-identical**, no reported result changed); see the architecture
  report §6.1. **No reported test result changed.**
- **No financial decision changed (Revision 12.2).** F14, F16–F31 remain **NOT APPROVED**; F28, F30,
  F31 undecided; no policy selected. See the architecture report §12.4.

### Revision 12.3 — documentation-consistency corrections (documentation only, no financial change)

- **README scaffold-location contradiction resolved** (in `README.md`) and the **full Git publication
  history** recorded (initial review publication `a6bf123`, Revision 12.2 publication `b2437c8`, current
  review-branch head `b2437c8`, `main` baseline `f6c7567`); see the architecture report §1.3 and §12.5.
- **No financial change.** The payout-terminology clarification (§6.7 / E8) and the price-grid
  clarification (Appendix B topic 16; **T1 stays OPEN**) from Revision 12.2 stand unchanged. F14,
  F16–F31 remain **NOT APPROVED**; F28, F30, F31 undecided; **no journal, account, or policy changed.**

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
(scratch):** M1 held after every committed journal group (Appendix A.1).

---

## Part 4 — C1 (market collateralization) and C1b

> **C1:** `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `+ (Option A only) CorrectionPayableMarket:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}`

**`PendingCorrectionClaim` and `CorrectionReceivable` are never counted as funded collateral.**
**VERIFIED (scratch):** `R9-01b` (C1 holds after issuance), `R9-18` (unfunded reopen rejected),
`R9-12c` (realization without reopening rejected).

### 4a. C2 and S1 (share-ledger invariants) — definitions

These invariants are asserted by the scratch model and required by the architecture report (Section
4.12), but were previously **undefined** here. They are now stated. Scope: **per market `{m}` and per
outcome `{o} ∈ {YES, NO}`**, checked at **every commit boundary** together with M1/C1/C1b.

**Share accounts (Part 2.2):** `SharesFree:{u}:{o}` (D, debit-normal), `SharesEscrowed:{u}:{o}` (D),
`SharesOutstanding:{m}:{o}` (C, credit-normal).

> **C2 (complementary outstanding shares):**
> `SharesOutstanding:{m}:YES = SharesOutstanding:{m}:NO`
> — the number of YES shares outstanding equals the number of NO shares outstanding for the same market.
> A complete set is always created and retired as one YES + one NO, so the two sides must match.

> **S1 (per-outcome share conservation):**
> for each outcome `{o}`: `Σ_u (SharesFree:{u}:{o} + SharesEscrowed:{u}:{o}) = SharesOutstanding:{m}:{o}`
> — every share outstanding is held by some user (free or escrowed); no share exists without a holder
> and no holder exists without a corresponding outstanding share.

**Note on sign convention.** `SharesOutstanding` is **credit-normal**, so its magnitude is
`amt('SharesOutstanding:{m}:{o}') = −balance`. The statements above are in **magnitudes
(normal-balance / `amt`)**, i.e. `amt(YES) = amt(NO)` for C2 and
`Σ_u (SharesFree + SharesEscrowed) = amt(SharesOutstanding)` for S1. This is the convention the
corrected model uses.

**S1 — independent derivation (Revision 11).** S1 is a **conservation law over share holders**, derived
from the two journals that create and destroy shares, and from escrow/release which only move a share
between two holder accounts:

- **Split** (create a complete set): `SharesFree:{u}:{o} D n / SharesOutstanding:{m}:{o} C n`. This
  raises the holder side (`SharesFree`) by `n` and the outstanding magnitude (`amt`) by `n`. The two
  sides stay equal.
- **Merge** (destroy a complete set): `SharesOutstanding:{m}:{o} D n / SharesFree:{u}:{o} C n`. The
  exact inverse of split; equality preserved.
- **Escrow / release**: `SharesEscrowed D / SharesFree C` (or the reverse), **same outcome**. This
  moves `n` from one debit-normal holder account to another; the sum `SharesFree + SharesEscrowed` is
  unchanged, and `SharesOutstanding` is untouched. Equality preserved.
- **Retire**: `SharesOutstanding:{m}:{o} D n / SharesFree:{u}:{o} C n`. Removes a held share and the
  matching outstanding share together; equality preserved.

Because every journal either (a) changes both sides by the same amount, or (b) moves value between the
two holder accounts, the identity `Σ_u (SharesFree:{u}:{o} + SharesEscrowed:{u}:{o}) =
amt(SharesOutstanding:{m}:{o})` holds at **every** commit boundary. **Conclusion: S1 as stated is
correct, and the model's S1 is consistent with it.** The model was previously written as
`Σ amt(SharesFree)+amt(SharesEscrowed) === -bal(SharesOutstanding)`; the `−bal(...)` and `amt(...)`
forms are equal for a credit-normal account, so S1 was already correct — Revision 11 restates it via
`amt(...)` for clarity and consistency with C2. **S1 is unchanged in substance.**

**C2 — defect corrected (Revision 11).** Revision 10 **reported** that the scratch model's `C2()` was
sign-inverted: it computed `bal[YES] === -bal[NO]`. Because both `SharesOutstanding` accounts are
**credit-normal**, a split records both raw balances as **negative** (e.g. `-2` and `-2`), so
`bal[YES] === -bal[NO]` compared `-2` against `+2` and returned **`false`** whenever shares were
outstanding. The defect was invisible because `C2()` was only ever evaluated at **zero** balances
(shares were always fully retired before each `report(...)`), where `0 === -0` is `true`.

**The model has now been corrected** to `C2() = amt('SharesOutstanding:M:YES') === amt('SharesOutstanding:M:NO')`,
i.e. equality of **YES and NO outstanding-share magnitudes**. This is a **verification-model fix only**
— it changes no financial rule, account, journal, or decision. New tests (**rev9.mjs Section 4**,
S4-01…S4-09) exercise C2 at **non-zero** outstanding balances (single split, multiple splits, merge,
escrow/release, retirement, intermediate states, and correction-lifecycle boundaries), and include a
**regression guard** (`S4-02e`/`S4-02f`) proving the old formula returns `false` where the corrected
formula returns `true`. `S4-09` confirms `C2=true` with **8 shares outstanding** at three consecutive
commit boundaries. **C2/S1 verification corrections do not constitute financial-specification
approval.**

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
| **E6** | Owner-approved issuance | `CreditsIssued D x / (CorrectionReceivable:Bob C a + CorrectionWriteOffLoss:M C b)`, `a+b=x` — **how `x` is split between `a` and `b` is F28, NOT APPROVED** (see 6.4a) | MMK |
| **E7** | Funded claim-unit reopening | `ClaimUnitsRemaining:M D x/P / UnitsControl:M C x/P` | UNIT |
| **E8** | Payout of the corrected entitlement (**internal** virtual-credit settlement only — see 6.7) | `SettlementCorrection:M D x / UserAvailable:Alice C x` (Option B) | MMK |
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
                   NOTE: the split (a, b) is NOT determined here — it is the F28 owner decision.
E4-realize (MMK): PendingCorrectionClaim:M D x / SettlementCorrection:M C x
E7-reopen (UNIT): ClaimUnitsRemaining:M D x/P / UnitsControl:M C x/P
```

**The allocation split `(a, b)` in E6 is an unresolved owner decision (F28).** The `a+b=x` line above
does **not** fix how `x` is divided between the receivable and the write-off loss. When only one
component is outstanding the split is forced; when **both** are outstanding and `x` is **smaller** than
the claim, the split depends on the cancel order, which is **F28** and is **NOT APPROVED**. This section
deliberately **does not assume an order**; **6.4a** states the **two alternatives** (proposed
recommendation vs alternative) and the unresolved decision. **Neither alternative is the implemented
policy.** The balance check below uses the Path-B case where only the receivable exists, so it is
**order-independent**.

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

### 6.4a E6 cancel order — the two alternatives (F28, NOT APPROVED)

**Status of this decision.** **F28 is NOT APPROVED.** No order is selected as implemented policy. The
two mathematically-correct alternatives are stated below with their full journals, before/after
balances, and M1 results. **Both preserve M1, C1, and C1b.** They differ **only** in *which residual
claim remains* when a claim is **partly written off** and the issuance is **smaller** than the
outstanding claim. The **proposed recommendation** is *loss-first*; the **alternative** is
*recv-first*.

Notation: outstanding claim `C = recv + loss`; issuance `x ≤ C`; `recv` = `CorrectionReceivable:Bob`,
`loss` = `CorrectionWriteOffLoss:M`. `E4` (`PendingCorrectionClaim:M D x / SettlementCorrection:M C x`)
and `E7` (reopen `x/P` units) are identical in both alternatives.

**The two alternatives (complete journals):**

| Alternative | `E6-issue` (MMK) | First-cancelled component | Residual when `x < C` |
| - | - | - | - |
| **Alternative A — loss-first** (**proposed recommendation**) | `CreditsIssued D x / CorrectionWriteOffLoss:M C min(x,loss) / CorrectionReceivable:Bob C (x−min(x,loss))` | write-off loss | the **receivable** stays outstanding (still collectible) |
| **Alternative B — recv-first** | `CreditsIssued D x / CorrectionReceivable:Bob C min(x,recv) / CorrectionWriteOffLoss:M C (x−min(x,recv))` | receivable | the **write-off loss** stays outstanding |

**All five states, both alternatives (before → after; M1 checked at each commit):**

| State | Before (`recv`, `loss`) | Issuance `x` | **Alt A (loss-first)** residual | **Alt B (recv-first)** residual | M1 |
| - | - | - | - | - | - |
| **1. Fully outstanding** | (200, 0) | 200 | (0, 0) | (0, 0) | ✅ |
| **2. Fully written-off** | (0, 200) | 200 | (0, 0) | (0, 0) | ✅ |
| **3. Partially written-off, full issuance** | (100, 100) | 200 | (0, 0) | (0, 0) | ✅ |
| **3b. Partially written-off, partial issuance** | (100, 100) | 100 | (**100, 0**) | (**0, 100**) | ✅ |
| **4. Partly collected AND partly written-off** | (0, 100) | 100 | (0, 0) | (0, 0) | ✅ |

**Per-state journals and balances:**

- **State 1 — (200, 0), x = 200.** Both alternatives: `CreditsIssued D 200 / CorrectionReceivable:Bob C 200`. After: recv 0, loss 0, pending 0, corr 200, units 2. **Alternatives agree** (only a receivable exists). *Meaning:* Bob's whole debt is extinguished; the funded units back the payout.
- **State 2 — (0, 200), x = 200.** Both alternatives: `CreditsIssued D 200 / CorrectionWriteOffLoss:M C 200`. After: recv 0, loss 0, pending 0, corr 200, units 2. **Alternatives agree** (only a loss exists). *Meaning:* the recorded loss is reversed (reclassified to issuance cost).
- **State 3 — (100, 100), x = 200.** Both alternatives: `CreditsIssued D 200 / CorrectionReceivable:Bob C 100 / CorrectionWriteOffLoss:M C 100`. After: recv 0, loss 0, pending 0, corr 200, units 2. **Alternatives agree** (issuance covers the whole claim). *Meaning:* both the residual debt and the residual loss are cleared.
- **State 3b — (100, 100), x = 100 (the only divergent state).**
  - **Alt A (loss-first):** `CreditsIssued D 100 / CorrectionWriteOffLoss:M C 100`. After: **recv 100**, loss 0, pending 100, corr 100, units 1. *Meaning:* the recorded loss is reversed first; the **residual receivable (100) remains collectible** from Bob.
  - **Alt B (recv-first):** `CreditsIssued D 100 / CorrectionReceivable:Bob C 100`. After: recv 0, **loss 100**, pending 100, corr 100, units 1. *Meaning:* the debt is cancelled first; the **write-off loss (100) stays on the books** until a later issuance.
- **State 4 — E2 recognize 200 → E3 collect 100 (funds 1 unit) → E5 write off the remaining 100.** Resulting before-issuance balances: **recv 0, loss 100, pending 100, corr 100, units 1** (the receivable is fully consumed by the collection; the write-off consumes the rest of the claim). Issuance `x = 100`: both alternatives `CreditsIssued D 100 / CorrectionWriteOffLoss:M C 100`. After: recv 0, loss 0, pending 0, corr 200, units 2. **Alternatives agree** (no receivable remains). *Meaning:* the remaining loss is reversed; the correction is fully funded (100 collected + 100 issued).

**Interpretation.**

- **States 1, 2, 3, 4:** both alternatives agree; no decision is needed for these states.
- **State 3b (the only divergent state):** Alt A (loss-first) leaves the **receivable** outstanding; Alt B (recv-first) leaves the **write-off loss** outstanding.

**The unresolved owner decision (F28).**

- **Proposed recommendation — Alt A (loss-first):** reverse the recorded loss first, so the historical
  loss is extinguished as early as possible and the residual is a still-collectible receivable. This
  matches the accounting intuition "issuance replaces the loss, not the debt". **RECOMMENDED — NOT
  APPROVED.**
- **Alternative — Alt B (recv-first):** cancel the debt first, leaving the loss on the books until a
  later issuance. **NOT APPROVED.**

**Neither alternative is selected as policy.** **F28 remains NOT APPROVED.** The E6 body in 6.4 must
not be read as having chosen an order.

**VERIFIED (scratch, review-prep suite):** R9-24/R9-25 (state 1, both orders), R9-26/R9-27 (state 2,
both orders), R9-28/R9-29 (state 3, both orders), R9-30/R9-31 (state 3b — the divergence, both
orders), R9-32/R9-32c (state 4, both orders), R9-32pre (state-4 before-issuance balances), R9-33
(M1/C1/C1b for both orders).

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

**Conclusion:** Option A is **internally consistent and complete for the supplied scenario**, and it
cannot double-count the same entitlement. This is **not** a claim of production-completeness —
concurrency, multi-user allocation, and crash/retry for Option A are **not verified** (Part 12).
Whether to adopt Option A remains **OWNER DECISION F20 / AR15** (recommendation: Option B).

### 6.7 E8/E9 — internal settlement ("payout") and retirement

`E8` (MMK) moves realized funding to Alice; `E9` (UNIT) retires the units. **Payout and retirement
must be atomic**, and the payout may not exceed the funded `SettlementCorrection`. **VERIFIED
(scratch R9-09, R8-15).**

> **Terminology — "payout" here is INTERNAL only.** Throughout this document, **"payout"** means the
> **internal virtual-credit settlement/distribution** of an entitlement between ledger accounts
> (`SettlementCorrection:M` → `UserAvailable:Alice`). It is **explicitly NOT** any of the following, and
> this document defines no such mechanism:
>
> - **cash payment** (no money is paid);
> - **withdrawal** (credits can never be withdrawn);
> - **redemption** (credits are non-redeemable; there is **no** `Cash` asset — see Part 2.1);
> - **external transfer** (no transfer leaves the system);
> - **real-money payout** (credits have **no** monetary value).
>
> The **virtual-credit-only** product rule is **unchanged**: credits are internal, non-redeemable
> units. This clarification changes **no journal, account, or financial policy** — it only fixes
> wording so "payout" is never read as a cash disbursement.

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

## Part 10 — Financial decision register (Revision 12.3)

All decisions in this register remain **unresolved / NOT APPROVED**. The register begins at **F14**;
**F1–F13 and F15 are not defined in this document** (see the note after the table).

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
| **F28** | **When issuance funds a correction, what does it cancel first — the receivable (Alternative B) or the write-off loss (Alternative A)?** | **Alternative A (loss-first)** (see 6.4a) | **NOT APPROVED** |
| **F29** | **Is the issuance group (E6+E4+E7) required to be atomic?** | yes (C1 requires it) | **NOT APPROVED** |

**New-decision detail (F27–F29):**

- **F27 — issuance path.** *Options:* Path A (write-off first) / Path B (issuance while outstanding).
  *Financial consequence:* Path A records then reverses a loss; Path B extinguishes the receivable
  with no loss. *Abuse/security:* both must be owner-authorized and audit-logged; neither may be
  triggered by a user. *Operational:* Path A adds a write-off approval step. *Recommendation:* Path B
  if collection is forgone; Path A if a write-off must be disclosed. **NOT APPROVED.**
- **F28 — what issuance cancels first.** *Options:* **Alternative A (loss-first)** — cancel the
  write-off loss first, then the receivable; **Alternative B (recv-first)** — cancel the receivable
  first, then the loss. *Financial consequence:* the alternatives agree in states 1, 2, 3 and 4 but
  **diverge only in state 3b** (partially written-off claim, partial issuance): **Alt A** leaves the
  **receivable** outstanding; **Alt B** leaves the **write-off loss** outstanding (see 6.4a). Both
  preserve M1/C1/C1b. *Abuse/security:* prevents funding a correction while also collecting the same
  amount (only the residual receivable stays collectible). *Operational:* Alt A needs a rule that
  reverses the recorded loss before the debt. *Recommendation:* **Alternative A (loss-first)**.
  **NOT APPROVED — neither alternative is selected as policy.**
- **F29 — atomicity of the issuance group.** *Options:* atomic `E6+E4+E7` / allow `E6` alone.
  *Financial consequence:* `E6` alone breaks C1 and double-counts. *Abuse/security:* non-atomic
  issuance could create unbacked claim units. *Operational:* simpler and safer when atomic.
  *Recommendation:* **atomic**. **NOT APPROVED.**

**Register-completeness note (corrected).** The register defines **F14, F16–F29**. **F1–F13 and F15 are
not defined anywhere in this specification.** An earlier architecture-report citation of "F1–F29" was
therefore **incorrect**; it has been corrected to the IDs that exist. **No decision has been renumbered**
and **no missing decision has been invented**. If F1–F13/F15 were ever intended, they are **not
documented** — recorded here as an open documentation gap for the owner.

### Part 10a — Additional decisions introduced by the final-review corrections (both NOT APPROVED)

These two decisions were identified during the final Milestone 0 independent review. They are recorded
so the gaps are visible. **Neither selects an implementation or a financial policy.**

| ID | Decision | Why it matters | Status |
| - | - | - | - |
| **F30** | **Correction-level and entitlement-level identifier model.** Multiple corrections on one market, multiple beneficiaries within one correction, and multiple corrections for one user require **immutable per-correction and per-entitlement identifiers**, plus an explicit rule reconciling the market-level aggregate accounts (`PendingCorrectionClaim:{m}`, `SettlementCorrection:{m}`) to individual correction records and individual user entitlements. Today the model uses **market-scoped aggregates only** and a **single beneficiary (Alice)**, so it cannot represent two corrections on one market distinctly. | Without it, C1 can hold at the aggregate level while individual corrections are misallocated; the correction lifecycle is **not safe for multi-user/multi-correction** use. | **NOT APPROVED** |
| **F31** | **Whole-Kyat / unit-divisibility rule.** E7 reopens `x/P` claim units for issuance `x` at payout-per-share `P`. The specification does **not** state whether `x` must be a multiple of `P`, nor the **rejection behaviour** when `P ∤ x` (e.g. issuance 150 with `P = 100` → `1.5` units). | Integer/whole-Kyat correctness; an undefined rule can create fractional or unbacked units. | **NOT APPROVED** |

**What these decisions block:** F30 and F31 must be resolved **before the ledger schema and the
correction/trading implementation** (**Milestone 4**, gated on financial-specification approval). They
do **not** block Milestone 1 (application foundation).

**What remains deliberately unselected here:** the identifier design (F30) and the divisibility policy
(F31). This document **records the need**; it does **not** choose a design or a policy.


---

## Part 11 — Approval

**NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.** Approving this document is required
before any executable trading is implemented. Per the architecture report's **owner-approved** roadmap
(§3.3), executable trading is assigned to **Milestone 4 (gated)** — "Financial specification &
trading": the financial specification must be **approved first**, and only then may trading
implementation begin. **Nothing here is implemented.**

- ☐ **Approved as written**
- ☐ **Approved with changes:** ______________________________
- ☐ **Rejected (reasons):** ______________________________

Product owner signature / date: ______________________________

---

## Part 12 — Assumptions, edge cases, and limitations

- **Scratch ≠ proof.** A passing scratch model shows the *proposed* journals are internally consistent
  under the model's rules; it does **not** prove the financial rules are correct or complete. **None of
  the scratch or PGlite checks is application-level financial validation** — there is no application,
  no schema, and no production ledger.
- **Three distinct verification levels (do not conflate):**
  1. **Scratch-model tests** — a single-process in-memory model (`rev9.mjs`). Sequential only; no real
     concurrency; **not** a product test.
  2. **PGlite mechanism tests** — a **single-connection** PostgreSQL 18.6 (WASM) engine
     (`rev9-pglite.mjs`). They verify transactions, `CHECK` constraints, unique keys, rollback, and the
     atomic issuance group. They **cannot** reproduce multi-session contention.
  3. **Real PostgreSQL multi-session tests** — **NONE PERFORMED.** **Real PostgreSQL multi-session
     concurrency remains unverified.**
- **Assumptions:** payout/share fixed at 100; a correction maps to one market and resolution version;
  the owner authorizes issuance/write-off out of band; the model's `noDoubleCount` check uses the
  scenario total (200).
- **Explicit unresolved limitations (disclosed, not resolved):**
  - **No real PostgreSQL multi-session concurrency verification.** Every isolation/race claim is
    PROPOSED only.
  - **Multiple concurrent corrections on one market are unresolved** — the model handles one
    correction at a time; concurrent corrections on the same market (and their interaction with C1 and
    `PendingCorrectionClaim`) are not specified.
  - **Partial write-off and collection combinations require further verification** — State 4 (partly
    collected + partly written off) is derived and asserted, but richer interleavings (e.g. partial
    collection *after* a partial write-off, or repeated partial tranches) are not exhaustively covered.
  - **Per-user correction allocation and multi-user payout handling require further specification** —
    the worked examples use a single beneficiary (Alice); how a correction is allocated across several
    affected users, and how multi-user payout is scheduled, is not yet specified.
  - **Option A is demonstrated for the supplied scenario only** — 6.6 shows one issuance-funded
    scenario; it is **not** established as production-complete (concurrency, multi-user allocation, and
    crash/retry for Option A are not verified).
  - **Correction reversal after issuance and cross-market corrections** remain unspecified.

---

## Appendix A — Exact local verification performed

Environment: **Node.js v24.22.2**; **@electric-sql/pglite 0.5.16**; **PostgreSQL 18.6 (PGlite
0.5.16) on wasm32**; **Linux 6.8.0-1055-gke**. The **canonical, reproducible copies** of the scripts
live in the repository at **`docs/verification/rev9/`** (see its `README.md` for exact commands,
versions, and expected output); the originals were run from a scratch directory (`/tmp/ledgertest`).
**All three verification levels are distinct: scratch (single-process), PGlite (single-connection),
and real PostgreSQL multi-session (not performed).**

### A.1 Revision 9 scratch model (with Revision 11 share tests) — VERIFIED (scratch)

- **Command:** `node docs/verification/rev9/rev9.mjs` (reproducible; see `docs/verification/rev9/README.md`)
- **Structure:** Section 1 = **45 Revision 8 tests (preserved)**; Section 2 = **30 Revision 9 tests**;
  Section 3 = **30 review-prep tests** (F28 cancel-order, both alternatives, Option A);
  Section 4 = **31 Revision 11 share-ledger tests** (C2/S1 lifecycle, non-zero outstanding, regression guard).
- **Counting method:** **136 test cases** (each a scenario with an explicit expected/actual outcome)
  plus **253 invariant assertions** (11 invariants × 23 commit boundaries). A test passes when the
  observed outcome equals the expected outcome, **including expected rejections/rollbacks**.
- **Result:** **136 / 136 test cases PASS, 0 FAIL; 253 invariant assertions, 0 FAIL**; ending
  `>>> ALL CHECKS PASSED (scratch)`. Captured output: `docs/verification/rev9/rev9.expected.out`.
- **Selected actual output:**

```
PASS R9-01 corrected E6 issuance+realize+reopen commits atomically | expected=committed actual=committed
PASS R9-01b corr 200 = 100 x 2 units (C1 holds after issuance) | expected=true actual=true
PASS R9-02 no double-count: pending 0 and corr 200 | expected=true actual=true
PASS R9-03 issuance cancels the receivable (recv 0) | expected=true actual=true
PASS R9-04 later collection after issuance is rejected (receivable gone) | expected=rolled-back actual=rolled-back
PASS R9-05d final: recv 0, loss 0, pending 0, corr 200, units 2 | expected=true actual=true
PASS R9-10 duplicate issuance rejected (nothing left to cancel) | expected=rolled-back actual=rolled-back
PASS R9-14 crash between funding and payout: funding tx fails and rolls back | expected=rolled-back actual=rolled-back
PASS R9-16 owner declines issuance -> correction stays pending | expected=rolled-back actual=rolled-back
PASS R9-23 no double-count: pending+corr == 200 (never 400) | expected=true actual=true
PASS R9-30b recv-first residual: recv 0, loss 100 (loss stays outstanding) | expected=true actual=true
PASS R9-31b loss-first residual: loss 0, recv 100 (receivable stays outstanding) | expected=true actual=true
PASS R9-32pre collected+written-off before issuance: recv 0, loss 100, pending 100, corr 100, units 1 | expected=true actual=true
PASS S4-02 C2 holds with 3 YES and 3 NO outstanding (NON-ZERO) | expected=true actual=true
PASS S4-02e old sign-inverted formula returns FALSE at non-zero outstanding (defect regression) | expected=false actual=false
PASS S4-02f corrected C2 TRUE where the old formula is FALSE | expected=true actual=true
PASS S4-06b C2 FAILS after an unbalanced YES-only retire (0 YES, 2 NO) | expected=false actual=false
PASS S4-06e unbalanced retire is rolled back by the commit-boundary guard | expected=rolled-back actual=rolled-back
PASS S4-09 boundary 3 (paid, 4 shares outstanding)  MMK=true SH=true UN=true C1=true C1b=true M1=true C2=true S1=true nonNeg=true subTie=true noDbl=true
test cases: 136 (136 passed, 0 failed)
invariant assertions at commit boundaries: 253
>>> ALL CHECKS PASSED (scratch)
```

- **Limitations:** sequential single-process simulation; not real concurrency.

### A.2 Revision 9 PGlite mechanism test — VERIFIED (PGlite)

- **Command:** `node docs/verification/rev9/rev9-pglite.mjs` (requires `@electric-sql/pglite@0.5.16`; see the README)
- **Purpose:** corrected issuance atomic group (MMK+UNIT); `PendingCorrectionClaim` cleared;
  write-off→issuance loss reversal; rollback; unique issuance/collection/payout keys; non-negative.
  **Duplicate collection is exercised at `P9` (it was only claimed, not tested, before this
  correction).**
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
P6 issuance: committed
P6 duplicate issuance: rejected: duplicate key value violates unique constraint "issuance_pkey"
P9 collection: committed
P9 duplicate collection: rejected: duplicate key value violates unique constraint "collections_pkey"
P7 payout: committed
P7 duplicate payout: rejected: duplicate key value violates unique constraint "payouts_pkey"
P8 negative claim cancel rejected: rolled-back: ... violates check constraint "accounts_balance_check"
```

- **Limitations:** PGlite is **single-connection**; it does not prove multi-session behaviour. This is
  a **mechanism** test (constraints, transactions, rollback), **not** application-level financial
  validation.

### A.3 Real PostgreSQL — NOT VERIFIED

**Real PostgreSQL multi-session concurrency remains unverified.**

### A.4 Git state — VERIFIED

See the architecture report Section 1.

### A.5 Scaffold static checks — VERIFIED (scaffold only)

| Check | Command | Result |
| - | - | - |
| Typecheck | `npx tsc --noEmit` | exit `0` |
| Lint | `npx eslint .` | exit `0` |
| Build | `npm run build` | exit `0` |

**Scope:** these check the **stock Next.js scaffold only**. They are **not** application-level financial
validation (no application exists) and say nothing about the financial rules.

### A.6 Application-level financial tests — NONE

**No application, schema, or production ledger exists**, so there are **no** application-level financial
tests. Scratch and PGlite results are **not** substitutes for them.

---

## Appendix B — Financial topic coverage matrix (final-review addition)

The README previously described this specification as "the complete financial specification (20
required topics)". That claim was **not substantiated** because the topics were never enumerated. This
matrix enumerates the coverage instead. **No value or policy is invented here.**

Status key: **S** = specified · **P** = partially specified · **M** = missing · **O** = owner decision
required · **D** = deferred to a later milestone.

| # | Topic | Status | Where / note |
| - | - | - | - |
| 1 | Currency (MMK only, whole Kyat) | S | Parts 1–2; README |
| 2 | Virtual credits (non-redeemable, no cash asset) | S | Part 2; README; AGENTS |
| 3 | Accounting domains (MMK / Share / Claim-unit) | S | Part 1 |
| 4 | Account catalogue, normal balances | S | Part 2 |
| 5 | M1 reconciliation | S | Part 3 (conservation only) |
| 6 | C1 collateralization + C1b | S | Part 4 |
| 7 | C2 / S1 share invariants | S (newly defined here) | Part 4a; C2 model defect **corrected in Rev 11** |
| 8 | Settlement lifecycle | P | Part 5 ("twelve steps" not enumerated) |
| 9 | Correction events E1–E9 | P | Part 6.1; E1/E9 pre/post/idempotency thin |
| 10 | Receivable recognition/collection/realization | S | Parts 6.2–6.3 |
| 11 | Write-off | S | Part 6.5 |
| 12 | Issuance (E6) + cancel order | S | Part 6.4 / 6.4a; F28 open |
| 13 | Correction state model | S | Part 7 |
| 14 | Worked scenarios | S | Part 8 |
| 15 | Atomicity / idempotency / recovery | P | Part 9; concurrency unproven |
| 16 | **Price grid / integer price tick** | **M** | **T1 OPEN** — not defined; `BETWEEN 1 AND 99` is a proposed range only, no tick selected |
| 17 | **Minimum order size / notional** | **M** | Not defined |
| 18 | **Fees** | **M** | Not defined; only Polymarket UX formula quoted |
| 19 | **Slippage tolerance unit/default** | **M** | Not defined (T4/R12) |
| 20 | **Order types / matching / partial fills** | **M** | Deferred to M4 (gated); not specified |
| 21 | **Split/merge/redeem rules** | **M** | Named only |
| 22 | **Market resolution rules / dispute window** | **M** | Not defined (T5) |
| 23 | **Correction/entitlement identifier model** | **M / O** | **F30 (NOT APPROVED)** |
| 24 | **Whole-Kyat unit divisibility** | **M / O** | **F31 (NOT APPROVED)** |
| 25 | **Multi-user / multi-correction allocation** | **M** | Part 12; F30 |
| 26 | **Real PostgreSQL concurrency behaviour** | **M / D** | Not tested (A.3) |
| 27 | **Pricing/probability display rules** | **P** | UX reference only |

**Explicitly unresolved pricing rules (no values invented):** the **price grid / integer price tick**
(#16), the **minimum order size / notional** (#17), the **fee rule** (#18), and the **slippage unit and
default** (#19) are **not specified** in this document and are **owner decisions** (T1, T4, R12).
**No values or policies are chosen here.**

**Price-grid scope note (T1 stays OPEN):** the integrity bound `CHECK (price BETWEEN 1 AND 99)` proposed
in the architecture report **§5** is a **validity range only** — it is **not** a price grid and implies
**no tick increment**. The **exact integer price grid / tick size is undecided** and remains **owner
decision T1**. This document **selects and approves no price grid**.

**Conclusion:** the specification is **substantially specified for the accounting/correction model** but
**materially incomplete for pricing, trading mechanics, and multi-user correction handling**. The
earlier "20 required topics — complete" phrasing is **withdrawn** and replaced by this matrix.
