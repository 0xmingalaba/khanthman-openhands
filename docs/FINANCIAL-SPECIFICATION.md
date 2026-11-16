# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 5) — **requires explicit product owner approval before any trading code is written**
**Supersedes:** Revision 4 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 5)
**Milestone:** still Milestone 0 — planning only. **No trading, ledger, matching, settlement,
schema, migration, or auth code exists.**

### Verification labels

| Label | Meaning |
| - | - |
| **VERIFIED (scratch)** | A scratch model outside the repo was run; output observed (Appendix V). **Not** a product test. |
| **VERIFIED (PGlite)** | A scratch test ran against PGlite (PostgreSQL 18.6 in WASM). Constraint/mechanism evidence only. |
| **VERIFIED (real PostgreSQL)** | Ran against a real PostgreSQL **server** with multiple sessions. **None performed.** |
| **DOCUMENTED** | Supported by a primary technical document (URL given). |
| **RECOMMENDED** | My professional recommendation. |
| **PROPOSED** | A design not implemented and not tested. |
| **OPEN** | Needs further investigation or an owner decision. |
| **OWNER DECISION** | Needs explicit product-owner approval. |

> **Honesty statement.** No application, schema, migration, ledger, matching, settlement, or auth
> code has been written. **Scratch and PGlite results are not product tests.** **No real
> PostgreSQL multi-session concurrency has been verified.** Everything describing the product is
> **PROPOSED**.

---

## Part 0 — What changed in Revision 5

1. **Correction paths B–F fully specified** with before/after balances, an MMK journal, a
   claim-unit journal, and explicit C1/C1b/M1 checks at each step, all executed in the scratch
   model (Part 6). `SettlementCorrection` is explicitly accounted.
2. **Three independent accounting domains** defined (MMK, Share, Claim-unit); journals may not
   mix units, and no domain balances against another (Part 1, Part 2).
3. **Settlement failure modes** extended (crash before/after commit, duplicate payout, concurrent
   workers, idempotency-key conflict, restart) — simulated in scratch and, for the unique-key
   mechanism, in PGlite; **real concurrency is explicitly not claimed** (Part 5).
4. **M1 completed** with a per-operation delta proof for every financial operation, including
   issuance, receivable recovery, and every correction path (Part 3).
5. **Entitlement rules completed**: the settlement ownership cutoff (free + escrowed shares,
   cancellations, pending executions) and superseding resolution versions (Part 7).
6. **Market-order terminology corrected** — filled quantity, partial fills, unspent budget,
   expired orders, and rejected orders are distinct; fill completion is never inferred from
   budget consumption (Part 8).

---

## Part 1 — Three accounting domains (PROPOSED)

The system maintains **three ledgers that balance independently**:

| Domain | Unit | Balances when |
| - | - | - |
| **MMK ledger** | whole MMK | Σ debits = Σ credits over MMK accounts |
| **Share ledger** | integer shares of an outcome | Σ debits = Σ credits over share accounts |
| **Claim-unit control ledger** | integer "claim units" (winning shares) | `ClaimUnitsRemaining = UnitsControl` |

**Rules.**
1. **A journal belongs to exactly one domain** and must balance **within that domain**.
2. **Units are never mixed** in a single journal. An MMK journal has only MMK accounts; a share
   journal has only share accounts; a unit journal has only unit accounts.
3. **No domain balances against another.** The MMK ledger is not "made true" by the share ledger.
4. **One logical operation may comprise several single-domain journals**, all committed in **one
   database transaction**, so the whole operation is atomic while each domain balances itself.
5. Cross-domain consistency is enforced by **invariants** (C1, C1b, C2, S1) and by the
   **atomic transaction**, not by netting one domain's debits against another's credits.

**VERIFIED (scratch):** the scratch model **refuses to post a journal that spans domains**
(`MIXED DOMAINS` error) and **refuses an unbalanced journal** (`UNBALANCED` error); every one of
the 34 executed checks confirmed each domain balanced on its own.

---

## Part 2 — Complete account catalogue (PROPOSED)

Sign convention: each account has a **normal side** (D or C). An entry on the normal side
increases the account; an entry on the opposite side decreases it.

### 2.1 MMK ledger

| Account | Type | Represents | Normal | Debit effect | Credit effect |
| - | - | - | - | - | - |
| `CreditsIssued` | Contra-equity (source of credits) | Total virtual credits issued | **D** | Increase issued (new issuance) | Decrease issued (permitted withdrawal) |
| `UserAvailable:{u}` | User holding (unrestricted) | Spendable credits owed to `u` | **C** | Decrease | Increase |
| `UserReserved:{u}` | User holding (restricted) | Credits `u` committed to open **buy** orders | **C** | Release | Reserve |
| `CollateralBucket:{m}` | Restricted virtual-credit bucket | Credits backing `m`'s outstanding complete sets | **C** | Release (merge) or move to payable (recognition) | Move in (split) |
| `SettlementPayable:{m}` | Liability | Credits owed to `m`'s winners, unpaid | **C** | Pay a winner | Recognize owed; receive funding |
| `SettlementCorrection:{m}` | Correction clearing balance | Credits held to settle corrections of `m` | **C** | Apply a correction payout | Receive correction funding (receivable or issuance) |
| `CorrectionReceivable:{u}` | Receivable (claim on a user) | Credits a user must be debited (mis-paid, not recoverable from a live balance) | **D** | Increase what `u` owes | Reduce (as recovered) |
| `CorrectionPayable:{u}` | Liability | Credits owed to `u` (under-paid) | **C** | Pay the user | Recognize owed |

### 2.2 Share ledger

| Account | Type | Represents | Normal | Debit effect | Credit effect |
| - | - | - | - | - | - |
| `SharesFree:{u}:{o}` | User holding (unrestricted) | Free shares of outcome `o` owned by `u` | **D** | Increase | Decrease |
| `SharesEscrowed:{u}:{o}` | User holding (restricted) | Shares `u` locked in open sell orders | **D** | Increase | Decrease |
| `SharesOutstanding:{m}:{o}` | Control | Total shares of outcome `o` in existence | **C** | Decrease (merge/settle) | Increase (split) |

Ownership of `o` = `SharesFree:{u}:{o} + SharesEscrowed:{u}:{o}` (two buckets of one holding).

### 2.3 Claim-unit control ledger

| Account | Type | Represents | Normal | Debit effect | Credit effect |
| - | - | - | - | - | - |
| `ClaimUnitsRemaining:{m}` | Control (units) | Winning claim units not yet paid | **D** | Increase (new set created / correction re-opens) | Decrease (a unit is paid) |
| `UnitsControl:{m}` | Control (units, balancing) | Balancing control for the above | **C** | Decrease | Increase |

**Lifecycle and permitted balance of the claim-unit ledger (per market `m`):**

- **Opens** at 0. Each **split of n sets** adds **+n** (exactly one side of a set will win).
- **Merge of n sets** removes **−n** (a merged set can no longer produce a claim).
- **Recognition** does **not** change the unit count.
- **Each payout of k units** removes **−k**.
- At **full settlement** the count returns to **0**; it may never go negative (a payout can never
  exceed the remaining claim units).
- A **correction** may re-open the count by writing a **new resolution version**; the count for
  that version opens at the corrected entitlement and again returns to 0.
- **Permitted balance:** `0 ≤ ClaimUnitsRemaining` and `ClaimUnitsRemaining = UnitsControl` at
  all times (**C1b**).

---

## Part 3 — M1: complete credit-conservation proof (PROPOSED)

### 3.1 M1

> **M1:** `CreditsIssued + Σ_u CorrectionReceivable:{u}`
> `= Σ_u (UserAvailable + UserReserved + CorrectionPayable)`
> `+ Σ_m (CollateralBucket + SettlementPayable + SettlementCorrection)`

(`CorrectionReceivable` is an asset-like claim, so it sits on the debit side with `CreditsIssued`.)

### 3.2 Per-operation M1 delta proof

Every journal has Σ debits = Σ credits, so each side of M1 moves by the **same** amount.
**VERIFIED (scratch)** — the model computed both sides before and after each operation and
confirmed equal deltas (`dL == dR`) and M1 true after each:

| Operation | MMK journal | ΔL | ΔR | M1 |
| - | - | - | - | - |
| Grant | `CreditsIssued D 10000` / `UserAvailable:Alice C 10000` | +10000 | +10000 | ✅ |
| Split | `UserAvailable:Alice D 100` / `CollateralBucket C 100` | 0 | 0 | ✅ |
| Recognition | `CollateralBucket D 100` / `SettlementPayable C 100` | 0 | 0 | ✅ |
| Payout | `SettlementPayable D 100` / `UserAvailable:Alice C 100` | 0 | 0 | ✅ |
| **Issuance** | `CreditsIssued D 50` / `SettlementCorrection C 50` | +50 | +50 | ✅ |
| **Receivable raised** | `CorrectionReceivable:Bob D 50` / `SettlementCorrection C 50` | +50 | +50 | ✅ |
| **Receivable recovered** | `UserAvailable:Bob D 50` / `CorrectionReceivable:Bob C 50` | −50 | −50 | ✅ |
| Correction payable | `SettlementCorrection D 50` / `CorrectionPayable:Alice C 50` | 0 | 0 | ✅ |
| Correction payout | `CorrectionPayable:Alice D 50` / `UserAvailable:Alice C 50` | 0 | 0 | ✅ |

**Interpretation.** M1 is preserved because it is an algebraic consequence of double-entry over
this account set. **Issuance and receivable-raising are the only operations that change both
sides (they change the "size" of the system); all others redistribute within M1.**

### 3.3 SettlementCorrection lifecycle and permitted balance

- **Opens** at 0. **Funded** by a `CorrectionReceivable` (money owed by a mis-paid user) or by
  permitted **issuance** (`CreditsIssued D` / `SettlementCorrection C`).
- **Spent** by paying corrected entitlements (`SettlementCorrection D` / `CorrectionPayable:{u} C`,
  then `CorrectionPayable:{u} D` / `UserAvailable:{u} C`).
- **Closes** at 0 when the correction is fully settled.
- **Permitted balance:** non-negative. A correction may not pay out more than it was funded with.
- **C1 interplay:** while a correction is open, `SettlementCorrection` is part of C1's backing
  total and the corresponding claim units are re-opened (Part 4).

---

## Part 4 — Claim-based backing invariant C1 (PROPOSED)

> **C1:** `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}`
> **C2:** `SharesOutstanding:YES = SharesOutstanding:NO` (before retirement)
> **S1:** for each outcome, `Σ_u (SharesFree + SharesEscrowed) = SharesOutstanding`

**Why it holds at every stage:** recognition moves credits bucket → payable **without changing the
total or the unit count**; a payout reduces the total and the unit count by the same unit amount;
a correction re-opens the unit count and funds `SettlementCorrection` by the same amount. At
retirement all three terms are 0. **VERIFIED (scratch):** C1 and C1b held at **every** check in
Parts 6 and 7 (34/34 checks passed).

### 4.1 Assumptions

**A1** shares created only in equal YES/NO pairs, only by Split (or paired cross-outcome minting);
**A2** each split locks exactly `P` per set and adds one claim unit; **A3** merge/settlement
removes an equal pair and releases exactly `P` per set; **A4** transfers move value/shares without
changing totals; **A5** `P` constant per market; **A6** no path creates shares or moves the bucket
outside these operations.

---

## Part 5 — Settlement lifecycle, atomicity, and failure modes

### 5.1 The twelve steps (PROPOSED)

As Revision 4: (1) stop orders/disable matching; (2) cancel/expire open orders; (3) release buy
reservations; (4) return escrowed sell shares; (5) write the resolution record **and entitlement
snapshot**; (6) recognition (bucket → payable, **one atomic transaction per market**); (7) pay
winners (**one atomic transaction per user**: payout key + MMK journal + unit journal together);
(8) crash/restart resume by scanning payout keys; (9) retire shares; (10) assert
`CollateralBucket = 0` and `ClaimUnitsRemaining = 0`; (11) final M1/C1 reconciliation; (12) mark
`settled` (guarded).

### 5.2 Atomicity rule (no progress-flag reliance)

The payout's **MMK journal, unit journal, and unique payout key commit in ONE transaction**. The
unique key `(market_id, user_id, resolution_version)` has a `UNIQUE` constraint. **Correctness
does not depend on any separately-updated worker-progress flag** — the set of existing keys *is*
the progress record.

### 5.3 Failure modes

| Mode | Simulated result (scratch) | PGlite result |
| - | - | - |
| Crash **before** commit | Transaction not applied; state byte-identical; retry commits once | — |
| Crash **after** commit, before worker ack | Payout persisted; restart rescan finds the key; retry is a no-op; no double-pay | — |
| Duplicate payout attempt | Second attempt `duplicate` (no-op) | `rejected: duplicate key value violates unique constraint "settlement_payouts_pkey"` |
| Two concurrent workers, same payout | One `committed`, one `duplicate` | (mechanism) unique key rejects the second |
| Duplicate idempotency key, **different payload** | `conflict` (rejected) | `rejected: duplicate key value violates unique constraint "settlement_payouts_idempotency_key_key"` |
| Restart and recovery | Rescan pays only missing users; exactly-once | Alice credited exactly once (`10300`) |

**VERIFIED (scratch):** Section 2 of the scratch model exercised all six modes; every check passed.
**VERIFIED (PGlite):** the unique-key + atomic-credit mechanism was tested directly (Appendix V.3):
the duplicate insert was rejected and the user was credited exactly once.

**NOT VERIFIED (real PostgreSQL):** PGlite is single-connection; it **cannot** reproduce true
multi-session contention. **Real multi-session concurrency is NOT verified.** The "two concurrent
workers" result above is a **simulated** serialization in scratch, not a real race. Real
concurrency must be tested on a PostgreSQL server (PROPOSED, not done).

---

## Part 6 — Correction paths B–F, with before/after balances (PROPOSED, VERIFIED scratch)

Each case is executed in the scratch model. Below, `bucket/payable/corr/units` are the MMK and
unit control balances; `AvA/AvB/AvC` are `UserAvailable` for Alice/Bob/Carol; `recvB` is
`CorrectionReceivable:Bob`. **Every step below reported MMK=true, SHARE=true, UNIT=true, C1=true.**

### Case B — mistake after recognition, before payout

- **Journal (MMK):** `SettlementPayable:M D 200` / `CollateralBucket:M C 200` (reverse recognition).
- **Unit journal:** none. **ClaimUnitsRemaining: unchanged (2). UnitsControl: unchanged (2).**
- **SettlementCorrection:** unchanged (0).
- **Before:** bucket 0, payable 200, corr 0, units 2.
- **After:** bucket 200, payable 0, corr 0, units 2. **C1 ✅ C1b ✅ M1 ✅.**

### Case C — during partial payout; mis-paid credits still AVAILABLE

Two steps: reverse the wrong payout, then pay the true winner.

- **Reverse (MMK):** `UserAvailable:Bob D 100` / `SettlementPayable:M C 100`.
- **Reverse (unit):** `ClaimUnitsRemaining:M D 1` / `UnitsControl:M C 1` (**restores the unit**).
- **SettlementCorrection:** unchanged (0).
- **Before:** bucket 0, payable 100, corr 0, units 1, AvB 10100.
- **After reverse:** bucket 0, payable 200, corr 0, units 2, AvB 10000.
- **Pay true winner (MMK):** `SettlementPayable:M D 200` / `UserAvailable:Alice C 200`; **(unit)**
  `ClaimUnitsRemaining:M C 2` / `UnitsControl:M D 2`.
- **After:** bucket 0, payable 0, corr 0, units 0, AvA 10000. **C1 ✅ C1b ✅ M1 ✅.**

### Case D — mis-paid credits TRANSFERRED to another user

- **Raise receivable (MMK):** `CorrectionReceivable:Bob D 100` / `SettlementCorrection:M C 100`.
- **Restore unit:** `ClaimUnitsRemaining:M D 1` / `UnitsControl:M C 1`.
- **Before:** bucket 0, payable 100, corr 0, units 1, AvC 10100.
- **After funding:** bucket 0, payable 100, corr 100, units 2, recvB 100.
- **Pay winner (MMK):** `SettlementPayable:M D 100` / `UserAvailable:Alice C 100` **and**
  `SettlementCorrection:M D 100` / `UserAvailable:Alice C 100`; **(unit)** remove 2 units.
- **After:** bucket 0, payable 0, corr 0, units 0, AvA 10000, recvB 100 (open claim on Bob).
- **SettlementCorrection:** funded 100, spent 100, closed 0. **C1 ✅ C1b ✅ M1 ✅.**

### Case E — mis-paid credits USED TO BUY SHARES

Economically identical to Case D (the credits left Bob's balance via a trade); the trade is **not
unwound** (share and MMK transfers remain valid).

- **Raise receivable (MMK):** `CorrectionReceivable:Bob D 100` / `SettlementCorrection:M C 100`.
- **Restore unit:** +1. **Pay winner** from payable and from `SettlementCorrection`; remove 2 units.
- **After:** bucket 0, payable 0, corr 0, units 0, AvA 10000, recvB 100; Bob's purchased shares
  remain. **C1 ✅ C1b ✅ M1 ✅.**

### Case F — after FULL settlement (new resolution version)

- **Before (v1, wrong):** bucket 0, payable 0, corr 0, units 0, AvB 10200 (Bob wrongly paid).
- **Re-open units for v2:** `ClaimUnitsRemaining:M D 2` / `UnitsControl:M C 2`.
- **Recover from Bob (MMK):** `UserAvailable:Bob D 200` / `CorrectionReceivable:Bob C 200`
  (reduces what he was over-credited); **fund** `CorrectionReceivable:Bob D 200` /
  `SettlementCorrection:M C 200`.
- **After funding:** bucket 0, payable 0, corr 200, units 2, AvB 10000, recvB 0.
- **Pay true winner (v2):** `SettlementCorrection:M D 200` / `UserAvailable:Alice C 200`;
  **(unit)** remove 2.
- **After:** bucket 0, payable 0, corr 0, units 0, AvA 10000. **C1 ✅ C1b ✅ M1 ✅.**

### Case F-issue — fully settled and mis-paid credits ALREADY SPENT (issuance)

- **Re-open units for v2:** +2.
- **Issue to fund (MMK):** `CreditsIssued D 200` / `SettlementCorrection:M C 200`.
- **Pay true winner:** `SettlementCorrection:M D 200` / `UserAvailable:Alice C 200`; remove 2 units.
- **After:** bucket 0, payable 0, corr 0, units 0, AvA 10000, AvC 10200 (Bob spent to Carol).
- **Effect on M1:** issuance raised **both** sides by 200; M1 holds. **C1 ✅ C1b ✅ M1 ✅.**
  *(OWNER DECISION F14: is issuance permitted at all?)*

### 6.1 Summary of correction journals

| Case | MMK journal(s) | Unit journal(s) | ClaimUnits change | UnitsControl change | SettlementCorrection |
| - | - | - | - | - | - |
| B | reverse recognition | none | 0 | 0 | 0 |
| C | reverse payout; pay winner | +1 then −2 | +1 then −2 | +1 then −2 | 0 |
| D | receivable→corr; pay from payable+corr | +1 then −2 | +1 then −2 | +1 then −2 | +100 then −100 |
| E | receivable→corr; pay from payable+corr | +1 then −2 | +1 then −2 | +1 then −2 | +100 then −100 |
| F | recover from Bob; corr→pay | +2 then −2 | +2 then −2 | +2 then −2 | +200 then −200 |
| F-issue | issuance→corr; corr→pay | +2 then −2 | +2 then −2 | +2 then −2 | +200 then −200 |

---

## Part 7 — Entitlement rules (PROPOSED)

### 7.1 Settlement ownership cutoff

The **entitlement snapshot** is computed at **step 5**, from ownership **as of market closure**
(step 1), and recorded immutably.

- **Ownership counted = `SharesFree + SharesEscrowed`** for the winning outcome. Escrowed shares
  are still the user's shares, so they count.
- **Open buy orders** never confer ownership (they hold reserved credits, not shares); their
  reservations are released in step 3 and are **not** entitlements.
- **Open sell orders:** the shares are counted for their owner, but steps 2–4 **cancel** the
  orders and **return** the escrowed shares to `SharesFree` first, so the snapshot sees free
  shares. A sell order that had **partially filled** before closure entitles its owner to the
  **unfilled remainder** (the filled portion already transferred).
- **Pending executions at the instant of closure:** matching is disabled at step 1 and the market
  row is locked, so **no trade is mid-flight** when the snapshot is taken. Any trade that commits
  before closure is reflected in ownership; none commits after.
- **Cutoff is the closure timestamp**; the snapshot is a pure function of the frozen ledger state
  at that timestamp.

### 7.2 Superseding resolution versions

- A resolution is identified by `resolution_version` (v1, v2, …).
- **Historical records are never modified.** A correction writes a **new**
  `SettlementEntitlement` set with the next version and a **new** `ResolutionRecord` that
  references the superseded version and states the reason.
- **Claim units re-open per version:** the corrected version's claim units are opened, funded, and
  paid to 0; the prior version's units remain as historical record (already 0 after its payouts).
- **Idempotency:** each correction carries `(market_id, resolution_version, user_id,
  correction_seq)`; duplicates are no-ops.
- **Audit:** every supersession and every compensating journal writes an append-only `AuditLog`
  entry (who/what/when/why/before/after).

---

## Part 8 — Market-order terminology (PROPOSED)

These are **distinct** quantities and must not be conflated:

| Term | Definition |
| - | - |
| **Maximum spend** | The MMK cap the user authorizes for a market buy. |
| **Actual spend** | Σ (fill price × fill qty) over executed fills. |
| **Filled quantity** | Integer shares actually executed. |
| **Partial fill** | Filled quantity < requested quantity (for a market buy, **unspent budget remains**). |
| **Unspent budget** | `maximum spend − actual spend`, returned to `UserAvailable`. |
| **Expired order** | A quote/order past its validity window; **not executed**; requires re-quote. |
| **Rejected order** | An order refused (slippage beyond tolerance, insufficient funds, FOK failure, market closed). **No fill occurred.** |

**Rule:** **fill completion is never inferred from budget consumption.** A market buy may spend
its entire budget and still be a **partial fill** (the last level did not have enough shares), or
may spend less than budget and be **fully filled** for its intended size. Only the **filled
quantity vs requested quantity** determines partial-vs-complete.

### 8.1 Worked examples

- **Multi-level fill** (max 2,000): asks L1 5@60, L2 10@62, L3 20@65 → L3 fills `floor(1,080/65)=16`;
  actual 1,960; filled 31; unspent 40 returned; **not** partial (budget fully consumed, and the
  remaining 40 cannot buy a whole share).
- **Insufficient liquidity** (partial): only L1 5@60, L2 10@62 → 15 shares cost 920; **unspent
  1,080 returned**; **partial fill**.
- **Slippage breach:** new average 70 vs best ask 60 → **relative slippage 16.67%**, **10 points**;
  beyond tolerance → **rejected**, re-quote.
- **Expired quote:** submitted after expiry → **rejected**, re-quote.
- **Duplicate submission:** same idempotency key → returns original result; never executes twice.

### 8.2 Owner decisions retained

- **Partial-fill policy** (fill-available vs FOK) — **OPEN** (F8).
- **Slippage unit (relative % vs points) and default value** — **OWNER DECISION** (F5). I do
  **not** approve a default on your behalf. (Note: the Rev-3 "3%" would reject the worked
  multi-level example at 5.376% relative.)

---

## Part 9 — Financial decision register (Revision 5)

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
| F16 | Are `SettlementCorrection` balances allowed to persist across a market close? | no — must close at 0 | RECOMMENDED |

---

## Part 10 — Approval

Approving this document confirms the financial rules and authorizes implementation of executable
trading in Milestone 4. **Nothing here is implemented.**

- ☐ **Approved as written**
- ☐ **Approved with changes:** ______________________________
- ☐ **Rejected (reasons):** ______________________________

Product owner signature / date: ______________________________

---

## Appendix V — Exact local verification performed

Environment: **Node.js v24.22.2**; **@electric-sql/pglite 0.5.16** (PostgreSQL 18.6, wasm32);
**Linux 6.8.0-1055-gke**. All commands ran in scratch directories **outside** the repository.

### V.1 Extended scratch model — VERIFIED (scratch)

Command: `node rev5.mjs`. It enforces (a) single-domain journals, (b) balanced journals, and
(c) C1/C1b/M1/C2/S1 after every operation; it runs all correction cases, all six settlement
failure modes, and the M1 delta proof.

Result: **34 PASS / 0 FAIL**, ending `>>> ALL CHECKS PASSED (scratch)`. Selected output:

```
PASS B0 after recognition        MMK=true SHARE=true UNIT=true C1=true
PASS D1 receivable raised, corr funded   ... C1=true   | payable=100 corr=100 units=2 recvB=100
PASS Fissue1 issued 200 to fund  ... C1=true
--- M2: crash AFTER commit but BEFORE worker ack ---
   RESTART: rescan keys -> Alice present; Carol missing
   SKIP: duplicate key M:Alice:v1 (no-op)
PASS M2 no double-pay            ...
--- M4: two concurrent workers, same payout (simulated) ---
   worker1=committed worker2=duplicate (one commits, other no-ops)
PASS M4 exactly-once             ...
PASS M1delta issuance            dL=50 dR=50 (equal) M1=true
PASS M1delta receivable recovery dL=-50 dR=-50 (equal) M1=true
>>> ALL CHECKS PASSED (scratch)
```

**Interpretation:** the **arithmetic of the proposed design** holds for all correction paths,
the six simulated failure modes, and every M1 delta. **This is a scratch model, not a product
test, and the "concurrent workers" case is a simulated serialization — not a real race.**

### V.2 Proposed DB constraint mechanism in PGlite — VERIFIED (PGlite)

Command: `node constraints.mjs` (from Rev 4; re-run for Rev 5). Result:
`>>> ALL PROPOSED CONSTRAINTS ENFORCED` — negative balances, out-of-range prices, and negative
quantities all rejected; valid insert accepted.

### V.3 Unique payout key + atomic credit in PGlite — VERIFIED (PGlite)

Command: `node payoutkey.mjs`. Creates `settlement_payouts` with
`PRIMARY KEY (market_id, user_id, resolution_version)` and `UNIQUE (idempotency_key)`, and
performs the payout (insert key + credit) in **one transaction**. Output:

```
pay1 (alice): committed
dup  (alice): rejected: duplicate key value violates unique constraint "settlement_payouts_pkey"
dup key diff user: rejected: duplicate key value violates unique constraint "settlement_payouts_idempotency_key_key"
balances: [{"user_id":"alice","available":10300},{"user_id":"bob","available":10000}] | payout rows: 1
alice credited exactly once: true
```

**Interpretation:** the unique-key + atomic-credit mechanism prevents double payout **in a single
PGlite instance**. This does **not** test multi-session contention.

### V.4 Real PostgreSQL — NOT EXECUTED

No real PostgreSQL server was used. **Multi-session concurrency is unverified.** PGlite is
single-connection and cannot reproduce it.

### V.5 Git state — VERIFIED

See the architecture report Section 1; it agrees with the commit for this revision.
