# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 4) — **requires explicit product owner approval before any trading code is written**
**Supersedes:** Revision 3 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 4)
**Milestone:** still Milestone 0 — planning only. **No trading, ledger, matching, settlement,
schema, migration, or auth code exists.**

### Verification labels

| Label | Meaning |
| - | - |
| **VERIFIED** | An actual command/test was run and its output observed (evidence quoted with version). |
| **DOCUMENTED** | Supported by a primary technical document (URL given). |
| **RECOMMENDED** | My professional recommendation. |
| **PROPOSED** | A design not implemented and not tested. |
| **OPEN** | Needs further investigation or an owner decision. |
| **OWNER DECISION** | Needs explicit product-owner approval. |

> **Honesty statement.** No application, schema, migration, ledger service, matching engine,
> settlement, or auth code has been written. The only **VERIFIED** items are the **scratch
> models** in Appendix V (run outside the repository, against Node.js, not against the product)
> and the primary sources cited. **Scratch-model tests are not product tests.** Everything
> describing the product is **PROPOSED**.

---

## Part 0 — What changed in Revision 4 (and why)

Revision 3 had three defects the owner identified:

1. **C1 was false during settlement.** Rev 3 moved collateral from `CollateralBucket` into
   `SettlementPayable` and paid winners incrementally, so
   `CollateralBucket = P × outstanding` broke the moment recognition ran. **Fixed in Part 5** by
   replacing C1 with a **claim-based invariant** that stays true at every intermediate state.
2. **M1 omitted settlement and correction accounts.** **Fixed in Part 2**, which lists every
   account, and Part 3, which shows every journal preserves the complete identity.
3. **Settlement was not provably resumable, and corrections had no entitlement model.** **Fixed
   in Parts 4 and 6**, with an executed 12-step crash/restart example and an immutable
   **entitlement snapshot**.

---

## Part 1 — The virtual-credit model (PROPOSED)

These are **non-redeemable virtual credits**: not money, not deposits, backed by **nothing**
outside the platform's books. Therefore:

- There is **no `Cash` account** and **no real asset** anywhere.
- The only source of credits is issuance, recorded against `CreditsIssued` (contra-equity).
- Market collateral is **not** an asset; it is a **restricted virtual-credit bucket**.
- The model tracks **who holds credits and shares** and enforces **conservation**, with no claim
  of external backing.

Two independent ledgers: the **MMK ledger** (whole MMK) and the **share ledger** (integer
shares). Each balances independently; journals never mix MMK and share entries.

---

## Part 2 — Complete account catalogue (PROPOSED)

Sign convention: each account has a **normal side** (D or C). An entry on the normal side
**increases** the account; an entry on the opposite side **decreases** it. Every journal must
have Σ debits = Σ credits **within its own ledger**.

### 2.1 MMK ledger accounts

| Account | Type | Represents | Normal | Debit effect | Credit effect |
| - | - | - | - | - | - |
| `CreditsIssued` | Contra-equity (source of credits) | Total virtual credits issued | **D** | Increase total issued (new issuance) | Decrease total issued (permitted withdrawal) |
| `UserAvailable:{u}` | User holding (unrestricted) | Spendable credits owed to `u` | **C** | Decrease spendable credits | Increase spendable credits |
| `UserReserved:{u}` | User holding (restricted) | Credits `u` committed to open **buy** orders | **C** | Release/decrease reserved | Reserve/increase reserved |
| `CollateralBucket:{m}` | Restricted virtual-credit bucket | Credits locked to back `m`'s outstanding complete sets | **C** | Release out of bucket (merge) or move to payable (recognition) | Move into bucket (split) |
| `SettlementPayable:{m}` | Liability | Credits owed to `m`'s winners, not yet paid | **C** | Pay a winner (reduce owed) | Recognize owed at settlement; receive funding |
| `SettlementCorrection:{m}` | Correction balance | A clearing account for corrections of `m`'s settlement | **C** | Apply a correction payout | Receive correction funding |
| `CorrectionReceivable:{u}` | Receivable (asset-like claim on a user) | Virtual credits a user must be debited because they were mis-paid and cannot be recovered from a live balance | **D** | Increase what the user owes | Reduce what the user owes (as recovered) |
| `CorrectionPayable:{u}` | Liability | Virtual credits owed to a user because they were under-paid | **C** | Pay the user | Recognize what is owed |

**Claim-unit control accounts** (unit: "claim units" = winning shares, not MMK):

| Account | Type | Represents | Normal | Debit effect | Credit effect |
| - | - | - | - | - | - |
| `ClaimUnitsRemaining:{m}` | Control (units) | Winning claim units not yet paid | **D** | Increase (a new set is created) | Decrease (a unit is paid) |
| `UnitsControl:{m}` | Control (units, balancing) | Balancing control for the above | **C** | Decrease | Increase |

### 2.2 Share ledger accounts

| Account | Type | Represents | Normal | Debit effect | Credit effect |
| - | - | - | - | - | - |
| `SharesFree:{u}:{o}` | User holding (unrestricted) | Free shares of outcome `o` owned by `u` | **D** | Increase free shares | Decrease free shares |
| `SharesEscrowed:{u}:{o}` | User holding (restricted) | Shares `u` locked in open sell orders | **D** | Increase escrowed | Decrease escrowed |
| `SharesOutstanding:{m}:{o}` | Control | Total shares of outcome `o` in existence | **C** | Decrease (merge/settle) | Increase (split) |

**Ownership rule:** ownership of `o` = `SharesFree:{u}:{o} + SharesEscrowed:{u}:{o}` (two
buckets of the same holding, never a double count).

---

## Part 3 — The credit-conservation identity M1 (corrected and complete)

### 3.1 M1

> **M1:** `CreditsIssued` = Σ_users (`UserAvailable` + `UserReserved` + `CorrectionPayable`)
> + Σ_markets (`CollateralBucket` + `SettlementPayable` + `SettlementCorrection`)
> − Σ_users `CorrectionReceivable`

**Revision 4 adds** `SettlementPayable`, `SettlementCorrection`, `CorrectionPayable`, and
`CorrectionReceivable` to M1. (`CorrectionReceivable` is subtracted because it is an asset-like
claim: it offsets the extra credits a user was given but must give back.)

### 3.2 Why every journal preserves M1

Because every journal has Σ debits = Σ credits and only touches the accounts in M1 with
offsetting effects, M1 is an **algebraic consequence of double-entry** over this account set.
**VERIFIED (scratch):** the model in Appendix V re-asserts M1 after every operation (grants,
splits, buys, escrow, partial fill, cancel, merge, recognition, each payout, retirement) and it
held at every step for both settlement outcomes and all correction cases.

### 3.3 The claim-based backing invariant C1 (replaces Rev 3's C1)

> **C1:** for each market `m`,
> `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> and **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}` (units conservation).
> and **C2:** `SharesOutstanding:{m}:YES = SharesOutstanding:{m}:NO` (before retirement).

**Interpretation.** `ClaimUnitsRemaining` counts the **winning shares still owed a payout**. At
split, one claim unit is added per set (because exactly one side wins). Recognition moves credits
from bucket to payable **without changing the total backing or the unit count**. Each payout
reduces both the payable and the unit count by the same unit amount, so C1 holds **before
recognition, after recognition, after each payout, after a crash, and after retirement**
(where all three terms are 0). **VERIFIED (scratch):** C1, C1b, C2, M1, and S1 all held at every
one of the 12 settlement steps in Appendix V, including across a simulated crash/restart.

### 3.4 Accounting treatment of recognized, unpaid, and paid claims

| Claim state | MMK account | Effect |
| - | - | - |
| Recognized, unpaid | `SettlementPayable` (C) | Credits owed, still counted in C1's total |
| Already paid | `UserAvailable:{u}` (C) | Credits delivered; `SettlementPayable` and `ClaimUnitsRemaining` both reduced by the same unit |
| Mis-paid (correction) | `CorrectionReceivable` / `CorrectionPayable` / `SettlementCorrection` | See Part 6 |

---

## Part 4 — Settlement lifecycle and resumable proof (PROPOSED)

### 4.1 The twelve steps

| # | Step | Transaction boundary |
| - | - | - |
| 1 | Stop accepting orders; disable matching | one transaction (market status guard) |
| 2 | Cancel/expire open orders | one transaction (per order or batch, idempotent) |
| 3 | Release remaining buy reservations | one transaction per release, idempotent |
| 4 | Return escrowed sell shares | one transaction per release, idempotent |
| 5 | Record resolution + entitlement snapshot | one transaction (immutable) |
| 6 | **Recognition**: bucket → payable | **one atomic transaction per market** |
| 7 | Pay winners | **one atomic transaction per user** (key + journals together) |
| 8 | (crash/restart: resume by scanning payout keys) | — |
| 9 | Retire winning and losing shares | one transaction (after all payouts confirmed) |
| 10 | Confirm `CollateralBucket = 0` and `ClaimUnitsRemaining = 0` | read/assert |
| 11 | Final reconciliation of M1 and C1 | read/assert |
| 12 | Mark market `settled` | one guarded transaction |

### 4.2 The atomicity rule (no reliance on a progress flag)

**The payout journal and the unique payout key are written in ONE transaction.** The unique key
`(market_id, user_id, resolution_version)` has a `UNIQUE` constraint; the credit and the key
insert commit together or not at all. **Correctness does not depend on any separately-updated
"worker progress" flag** — the set of existing keys *is* the progress record. On restart, the
worker selects winners with no key and pays them. A duplicate attempt fails on the unique
constraint and is a no-op.

### 4.3 Worked 12-step example — two winners, crash and restart (YES wins)

**Setup.** Alice grants 10,000; Bob grants 10,000; Carol grants 10,000. Alice splits 3 sets
(bucket 300), Carol splits 2 sets (bucket 200); Alice sells 2 NO to Bob for 80. Entitlement
snapshot after resolution (YES wins): **Alice 3, Carol 2**. Payout per share = 100.

Invariants at each step (**VERIFIED** in Appendix V; all `PASS`):

| Step | bucket | payable | claimUnits | outstanding | M1 | C1 | S1 |
| - | - | - | - | - | - | - | - |
| 0 grants | 0 | 0 | 0 | 0 | ✅ | ✅ | ✅ |
| 1 holdings (5 sets) | 500 | 0 | 5 | 5 | ✅ | ✅ | ✅ |
| 2 open orders (reserve 500, escrow 2 NO) | 500 | 0 | 5 | 5 | ✅ | ✅ | ✅ |
| 3 reservation released | 500 | 0 | 5 | 5 | ✅ | ✅ | ✅ |
| 4 escrow released | 500 | 0 | 5 | 5 | ✅ | ✅ | ✅ |
| 5 resolution record (snapshot Alice 3, Carol 2) | 500 | 0 | 5 | 5 | ✅ | ✅ | ✅ |
| 6 recognition (bucket→payable 500) | 0 | 500 | 5 | 5 | ✅ | ✅ | ✅ |
| 7 pay Alice (key `M:Alice:v1` committed) | 0 | 200 | 2 | 5 | ✅ | ✅ | ✅ |
| 8 **crash** | 0 | 200 | 2 | 5 | ✅ | ✅ | ✅ |
| 9 restart (keys present: `M:Alice:v1`; Carol missing) | 0 | 200 | 2 | 5 | ✅ | ✅ | ✅ |
| 10 pay Carol (key `M:Carol:v1` committed) | 0 | 0 | 0 | 5 | ✅ | ✅ | ✅ |
| 11 retire all shares | 0 | 0 | 0 | 0 | ✅ | ✅ | ✅ |
| 12 final reconciliation | 0 | 0 | 0 | 0 | ✅ | ✅ | ✅ |

**Transactions.** Step 6 is one transaction. Each of steps 7 and 10 is one transaction
(`SettlementPayable D P×units` / `UserAvailable:{u} C P×units`, **plus**
`ClaimUnitsRemaining C units` / `UnitsControl D units`, **plus** the payout-key insert).
Step 11 is one transaction. Step 12 is a read/assert; step 12b marks `settled`.

**Payout journal (per winner, atomic):**

| Account | D | C |
| - | - | - |
| `SettlementPayable:M` | 100 × units | |
| `UserAvailable:{u}` | | 100 × units |
| `ClaimUnitsRemaining:M` | | units |
| `UnitsControl:M` | units | |

**Final balances (VERIFIED):** `CreditsIssued = 30,000`; Alice `10,080`; Bob `9,920`;
Carol `10,000`; bucket 0; payable 0. (Alice: 10,000 − 300 − 80 + 300 payout − … net shown by
the model; the key point is M1 holds and no credit was created or destroyed.)

### 4.4 NO-wins variant

Identical structure with the entitlement snapshot pointing to the NO holders. The scratch model
also ran the earlier Rev-3 sequence for a NO-winning outcome with all invariants passing
(Appendix V.1).

---

## Part 5 — Collateralization proof (corrected)

### 5.1 Invariants

- **C1 (backing):** `CollateralBucket + SettlementPayable + SettlementCorrection
  = P × ClaimUnitsRemaining`
- **C1b (units conservation):** `ClaimUnitsRemaining = UnitsControl`
- **C2 (paired shares, pre-retirement):** `SharesOutstanding:YES = SharesOutstanding:NO`
- **S1 (ownership):** for each outcome, `Σ_users (SharesFree + SharesEscrowed) = SharesOutstanding`

### 5.2 Assumptions

**A1** shares are created only in equal YES/NO pairs, only by Split (or cross-outcome minting,
which also pairs); **A2** each split locks exactly `P` per set into the bucket and adds one claim
unit; **A3** merge/settlement removes an equal pair and releases exactly `P` per set;
**A4** transfers move value/shares between users without changing totals; **A5** `P` is constant
per market; **A6** no path creates shares or moves the bucket outside these operations.

### 5.3 Preservation per operation

| Operation | bucket+payable+correction | claimUnits | C1 |
| - | - | - | - |
| Grant | 0 | 0 | holds |
| Split n sets | +`P×n` | +n | holds |
| Transfer | 0 | 0 | holds |
| Reserve/release (buy) | 0 | 0 | holds |
| Escrow/release (sell) | 0 | 0 | holds |
| Merge n sets | −`P×n` | −n | holds |
| **Recognition** | 0 (bucket→payable) | 0 | **holds** (total unchanged) |
| **Payout of k units** | −`P×k` | −k | **holds** |
| Retirement | 0 (already 0) | 0 | holds |

**This is the correction to Rev 3:** C1 is expressed over the **sum** of the three settlement
accounts versus **remaining claim units**, so recognition (a bucket→payable move) and each
payout (which reduces both sides equally) preserve it. Rev 3's C1 was false during settlement
because it compared the bucket alone to *all* outstanding shares.

### 5.4 What each claim is (reconciled)

| Claim | Status |
| - | - |
| C1/M1/S1 equations | **PROPOSED** design |
| Per-operation preservation argument | **PROPOSED** (hand proof) |
| C1/M1/S1 hold across the 12 settlement steps + crash/restart | **VERIFIED** (scratch, Appendix V.2) |
| C1/M1/S1 hold across all correction cases | **VERIFIED** (scratch, Appendix V.3) |
| DB `CHECK`/`UNIQUE` constraints enforce non-negativity, price range, payout uniqueness | **PROPOSED** DDL; the **constraint mechanism** is **VERIFIED** in PGlite (Appendix V.4) |
| Constraints applied to the real schema | **Does not exist** |
| Product ledger/matching/settlement code | **Does not exist** |
| Multi-session concurrency correctness | **Does not exist; NOT proven by PGlite** |

---

## Part 6 — Resolution correction and historical entitlements (PROPOSED)

### 6.1 The immutable entitlement snapshot

At step 5 (resolution), the system writes an **append-only `SettlementEntitlement`** table:

```
SettlementEntitlement(market_id, resolution_version, user_id, winning_units, payout_amount, created_at)
```

with a `UNIQUE(market_id, resolution_version, user_id)`. This snapshot is computed from the
frozen share ownership **at closure** and **survives share retirement** — so a correction can
still know what each user *should* have received after the shares are gone. It is never updated
or deleted; a correction writes a **new** `resolution_version`.

### 6.2 The mis-paid-credit problem

When a payout is wrong, the credits may be in one of five states. The correction path depends on
the state; the design **never** silently creates a negative balance or erases history.

### 6.3 Correction scenarios (all **VERIFIED** in scratch, Appendix V.3)

**Case 0 — Before recognition.** No `SettlementPayable` yet; just supersede the resolution record
and re-run. No journals needed. No user impact.

**Case A — After recognition, before payout.** Reverse recognition
(`SettlementPayable D` / `CollateralBucket C`), supersede the record, re-recognize with the
corrected outcome. No user impact.

**Case B — During partial payout; wrongly paid credits still AVAILABLE.**
Reverse directly: `UserAvailable:{u} D` / `SettlementPayable C` (and `UnitsControl D` /
`ClaimUnitsRemaining C` to restore the unit). Verified: Bob mis-paid 100 then reversed to
available; M1 and C1 hold.

**Case C — Wrongly paid credits RESERVED** (user placed a buy order with them). Reverse from the
reserved bucket: `UserReserved:{u} D` / `SettlementPayable C`; verified.

**Case D — Wrongly paid credits TRANSFERRED to another user.** The mis-paid user's balance is
gone. Post a **`CorrectionReceivable`** against the mis-paid user to fund the correction:
`CorrectionReceivable:{u} D` / `SettlementPayable C`; then pay the true entitlement. Verified:
Bob spent 100 to Alice; Bob carries a 100 receivable; Alice is paid her full 200 entitlement;
M1 holds with `CorrectionReceivable` in the identity.

**Case E — Wrongly paid credits USED TO BUY SHARES.** Economically the same as Case D: the
credits left the user's balance. The `CorrectionReceivable` is raised against the mis-paid user,
and the market's true winner is paid. (If the mis-paid user is also a legitimate winner, the
receivable and the entitlement are netted in the same correction transaction, still
double-entry.)

**Case F — Wrongly paid credits ALREADY SPENT (full settlement).** The market is `settled`.
Write a **new `resolution_version`** with a superseding entitlement snapshot; raise a
`CorrectionReceivable` on the mis-paid user; and, **if the owner permits**, **issue** virtual
credits to fund the under-paid users. Issuance is recorded explicitly:
`CreditsIssued D` / `CorrectionPayable:{u} C`, then `CorrectionPayable:{u} D` /
`UserAvailable:{u} C`. Verified: issuance of 100 raises `CreditsIssued` to 20,100 and pays
Alice's claim; M1 holds throughout.

### 6.4 Recovery, audit, and idempotency

- **Recovery of a receivable:** when the mis-paid user later has credits, a correction debits
  them (`UserAvailable:{u} D` / `CorrectionReceivable:{u} C`). Recovery never forces a negative
  balance; an unrecoverable receivable stays open and is visible.
- **Audit:** every correction writes an append-only `AuditLog` entry (who, what, when, why,
  before/after) and references the superseded `resolution_version`. History is never rewritten.
- **Idempotency:** each correction has its own key
  `(market_id, resolution_version, user_id, correction_seq)`; duplicate application is a no-op.
- **Effect on M1:** a correction **does not change M1's form**; it moves values among the
  accounts already in M1 (`CorrectionReceivable`, `CorrectionPayable`, `SettlementCorrection`).
  Additional issuance, if permitted, increases both `CreditsIssued` and a liability by the same
  amount, preserving M1. *(OWNER DECISION: is additional issuance permitted at all? See F14.)*

---

## Part 7 — Market orders, pricing, and slippage

**Market-buy amount = maximum spend, never guaranteed spend.** Remaining MMK is returned.

### 7.1 Worked multi-level fill (maximum spend 2,000 MMK)

Asks: L1 5@60, L2 10@62, L3 20@65. L3 fills `floor(1,080/65) = 16`.

- Maximum spend 2,000; **actual spend 1,960**; filled 31; average 63.2258 (display only);
  **unspent 40 MMK returned**; no partial (budget fully consumed).

### 7.2 Insufficient available liquidity (partial fill)

Only L1 (5@60) and L2 (10@62): 15 shares cost 920; **unspent 1,080 returned**; reported as a
partial fill. Policy default: fill-available, return unspent (**OPEN** F8).

### 7.3 A price movement that breaches slippage tolerance

Quote returned avg 63.2258 at quote time. If, by submit time, the book worsened so the new
average is 70, then:

- **relative slippage vs best ask (60)** = (70−60)/60 = **16.67%**
- **point slippage** = **10 points**

If the user's tolerance (relative) is 10%, the fill is **rejected** and re-quoted. **Unit is
explicit: relative percent.** The tolerance is **not approved by me on the owner's behalf**
(OWNER DECISION F5).

### 7.4 Expired quote

Quote expiry is 10 s (RECOMMENDED). If the client submits an expired quote, the server **refuses**
and requires a fresh quote. An expired quote is never executed. (Interaction: expiry bounds
*staleness in time*; slippage bounds *price movement*; both are required.)

### 7.5 Duplicate submission

Every mutating request carries an **idempotency key**. A duplicate returns the **original**
result and never executes twice. A key reused with a different payload is rejected.

### 7.6 Slippage unit and the Rev-3 example

For the Part 7.1 example: **relative slippage = 5.376%**, **point slippage = 3.2258**. A **3%
relative** tolerance **would reject** this legitimate multi-level fill. Hence my earlier "3%"
was underspecified; I recommend expressing tolerance in **relative percent** and choosing the
value with you. **I do not approve a default tolerance on your behalf.**

### 7.7 Cross-outcome matching

**OPEN / OWNER DECISION** (unchanged): same-outcome matching + Split/Merge is a correct MVP
without it; cross-outcome matching improves liquidity at added complexity.

---

## Part 8 — Financial decision register (Revision 4)

| ID | Decision | Recommended | Tag |
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
| F14 | May the platform issue extra virtual credits to fund a correction? | undecided | OWNER DECISION |
| F15 | Recovery of `CorrectionReceivable`: automatic netting vs manual review | manual review | OPEN |

---

## Part 9 — Approval

Approving this document confirms the financial rules and authorizes implementation of
executable trading in Milestone 4. **Nothing here is implemented.**

- ☐ **Approved as written**
- ☐ **Approved with changes:** ______________________________
- ☐ **Rejected (reasons):** ______________________________

Product owner signature / date: ______________________________

---

## Appendix V — Exact local verification performed

All experiments ran in scratch directories **outside** the repository. Environment:
**Node.js v24.22.2**; **@electric-sql/pglite 0.5.16** (PostgreSQL 18.6, wasm32).

### V.1 Rev-3 model arithmetic (both outcomes) — VERIFIED

Command: `node model.mjs`. Output ended: `>>> ALL INVARIANT CHECKS PASSED` for both a
YES-winning and a NO-winning settlement (M1, C1, C2, C3 checked after every step).

### V.2 Claim-based C1 + resumable settlement, 12 steps with crash/restart — VERIFIED

Command: `node settlement4.mjs`. Output:

```
=== 12-STEP RESUMABLE SETTLEMENT (YES wins, 2 winners) ===
PASS 0. grants                 ... C1=true units=true ...
PASS 1. holdings (5 sets)      ... C1=true ... | bucket=500 payable=0 claimUnits=5 out=5
PASS 2. open orders            ...
PASS 3. reservation released   ...
PASS 4. escrow released        ...
5. resolution record: YES wins; entitlement snapshot {Alice:3, Carol:2}
PASS 6. recognition            ... | bucket=0 payable=500 claimUnits=5 out=5
PASS 7. pay Alice (key committed) ... | bucket=0 payable=200 claimUnits=2 out=5
8. *** worker CRASH ***
9. restart: keys present=["M:Alice:v1"] -> Carol missing
PASS 10. pay Carol (key committed) ... | bucket=0 payable=0 claimUnits=0 out=5
PASS 11. shares retired        ... out=0
PASS 12. final reconciliation  ...
   final: issued=30000 Alice=10080 Bob=9920 Carol=10000
>>> ALL INVARIANTS PASSED AT EVERY STAGE
```

**Interpretation:** the **arithmetic of the proposed claim-based design** holds at every
settlement stage, including a simulated crash between two payouts. This is a **scratch model**,
not a product test, and it does **not** exercise real database concurrency.

### V.3 Correction scenarios (available / reserved / transferred / spent / issuance) — VERIFIED

Command: `node correction.mjs`. Output: `>>> ALL CORRECTION INVARIANTS PASSED`, with every case
`PASS` (M1 and the global debit-positive sum = 0 after every journal). Cases exercised: reverse
from available; reverse from reserved; spent-to-another-user with `CorrectionReceivable` funding
the true winner; and full-settlement correction funded by explicit issuance.

### V.4 Proposed DB constraint mechanism in PGlite — VERIFIED

Command: `node constraints.mjs`. Output:

```
PASS (rejected): negative available balance
PASS (rejected): negative reserved balance
PASS (rejected): price above 99
PASS (rejected): price below 1
PASS (rejected): negative qty
valid insert accepted: 1 row(s)
>>> ALL PROPOSED CONSTRAINTS ENFORCED
```

**Interpretation:** the **constraint mechanism** works in PGlite. The **real schema does not
exist**; this only shows the constraints are expressible and enforced.

### V.5 Real PostgreSQL — NOT EXECUTED

No multi-session test was run. **VERIFIED limitation:** PGlite is a single-connection,
single-process embedded engine; it **cannot** reproduce real multi-session contention.
Concurrency must be tested on a real PostgreSQL server (**PROPOSED, not done**).

### V.6 Git state — VERIFIED

See the architecture report Section 1. The final HEAD, branch, ahead/behind, clean-tree status,
and remote state are reported there and agree with the commit for this revision.
