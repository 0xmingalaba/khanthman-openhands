# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 6) — **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED.**
**Supersedes:** Revision 5 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md` (Revision 6)
**Milestone:** still Milestone 0 — planning only. **Milestone 1 has NOT started.** **No trading,
ledger, matching, settlement, schema, migration, or auth code exists.**

### Verification labels

| Label | Meaning |
| - | - |
| **VERIFIED (scratch)** | A scratch model outside the repo was run; output observed (Appendix V). **Not** a product test. |
| **VERIFIED (PGlite)** | A scratch test ran against PGlite (PostgreSQL 18.6 WASM, **single connection**). Constraint/mechanism evidence only. |
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

## Part 0 — What changed in Revision 6 (and why)

Revision 5 had four defects the owner identified. Revision 6 corrects each.

| # | Revision 5 defect | Revision 6 correction |
| - | - | - |
| A | **Case F broke C1.** It re-opened claim units **before** funding `SettlementCorrection`, so during the intermediate state `ClaimUnitsRemaining` and `UnitsControl` increased while `CollateralBucket`, `SettlementPayable`, and `SettlementCorrection` stayed 0 → C1 false. Its recovery path also **credited `CorrectionReceivable` before it existed**, which can make the receivable **negative**. | Case F is now **one atomic logical operation** whose **single-domain journals** establish funding, recover the receivable **after** establishing it, and re-open units — all in **one transaction**, asserted at the commit boundary. A negative receivable is now **forbidden** (scratch rejects it; PGlite `CHECK` enforces it). (Part 6) |
| B | **Case F-issue sequencing** was not atomic (issuance and unit reopening could be ordered wrongly). | Issuance funding and claim-unit reopening are now **one transaction**; the `CreditsIssued` increase and the resulting supply increase are shown. Issuance remains an **OWNER DECISION (F14)**. (Part 6.5) |
| C | **C1 vs recoverable funding were conflated**: `CorrectionReceivable` was treated as backing without stating when it is *recoverable*. | Revision 6 separates **accounting balance**, **correction receivable**, **recoverable funding**, **additional issuance**, and **uncollectible receivable**, answers the owner's questions, and presents **two clearly separated policy alternatives (A and B)**. (Part 7) |
| D | The **2,000 MMK market-buy example** had no requested quantity and wrongly concluded "not a partial fill". | The example now specifies an **explicit requested quantity** and compares it to the filled quantity, and defines all ten quantities distinctly. Policy stays **OPEN/OWNER DECISION**. (Part 9) |

---

## Part 1 — Three accounting domains (unchanged)

Three ledgers balance **independently**: **MMK** (whole MMK), **Share** (integer shares), **Claim-unit**
(integer claim units). Rules:

1. **A journal belongs to exactly one domain** and must balance within it.
2. **Units are never mixed** in one journal.
3. **No domain balances against another.**
4. One logical operation may comprise several single-domain journals, all committed in **one DB
   transaction** (atomic), while each domain balances itself.
5. Cross-domain consistency is enforced by invariants (C1, C1b, C2, S1) **at commit boundaries**,
   not by netting one domain against another.

**VERIFIED (scratch):** the model **refuses** a mixed-domain journal (`MIXED DOMAINS`) and an
unbalanced journal (`UNBALANCED`). **VERIFIED (PGlite):** a three-journal correction (MMK + MMK +
UNIT) committed atomically; a forced failure left all domains unchanged (Appendix V.2).

---

## Part 2 — Complete account catalogue

Sign convention: each account has a **normal side** (D or C); an entry on the normal side increases
the account. **No normal-side balance may become negative.**

### 2.1 MMK ledger

| Account | Type | Represents | Normal |
| - | - | - | - |
| `CreditsIssued` | Contra-equity (source of credits) | Total virtual credits issued | **D** |
| `UserAvailable:{u}` | User holding (unrestricted) | Spendable credits owed to `u` | **C** |
| `UserReserved:{u}` | User holding (restricted) | Credits committed to open **buy** orders | **C** |
| `CollateralBucket:{m}` | Restricted virtual-credit bucket | Credits backing `m`'s outstanding complete sets | **C** |
| `SettlementPayable:{m}` | Liability | Credits owed to `m`'s winners, unpaid | **C** |
| `SettlementCorrection:{m}` | Correction clearing balance | Credits held to settle corrections of `m` | **C** |
| `CorrectionReceivable:{u}` | Receivable (claim on a user) | Credits `u` must be debited (mis-paid) | **D** |
| `CorrectionPayable:{u}` | Liability | Credits owed to `u` (under-paid) | **C** |

### 2.2 Share ledger

`SharesFree:{u}:{o}` (D), `SharesEscrowed:{u}:{o}` (D), `SharesOutstanding:{m}:{o}` (C).
Ownership of `o` = free + escrowed.

### 2.3 Claim-unit control ledger

`ClaimUnitsRemaining:{m}` (D), `UnitsControl:{m}` (C).

**Lifecycle / permitted balance (per market `m`):** opens at 0; **split +n**, **merge −n**;
recognition unchanged; **payout −k**; returns to **0** at full settlement; may **never** go
negative; a correction may re-open it under a **new resolution version**. Always
`ClaimUnitsRemaining = UnitsControl` (**C1b**), and `ClaimUnitsRemaining ≥ 0`.

---

## Part 3 — M1: credit conservation (unchanged form)

> **M1:** `CreditsIssued + Σ_u CorrectionReceivable:{u}`
> `= Σ_u (UserAvailable + UserReserved + CorrectionPayable)`
> `+ Σ_m (CollateralBucket + SettlementPayable + SettlementCorrection)`

M1 is an algebraic consequence of double-entry over this account set; each side moves by the same
amount in every journal. **VERIFIED (scratch)** in Revision 5 (per-operation delta table) and
re-asserted at **every commit boundary** in the Revision 6 model.

**Important:** M1 is a statement of **accounting conservation**, **not** of economic backing. See
Part 7 for the distinction.

---

## Part 4 — Backing invariant C1

> **C1:** `CollateralBucket:{m} + SettlementPayable:{m} + SettlementCorrection:{m}`
> `= PAYOUT_PER_SHARE × ClaimUnitsRemaining:{m}`
> **C1b:** `ClaimUnitsRemaining:{m} = UnitsControl:{m}`
> **C2:** `SharesOutstanding:YES = SharesOutstanding:NO` (before retirement)
> **S1:** per outcome, `Σ_u (SharesFree + SharesEscrowed) = SharesOutstanding`

C1 is preserved because recognition moves credits bucket → payable (total unchanged), a payout
reduces total and units equally, and a correction re-opens units and funds `SettlementCorrection`
by the same amount **in the same transaction**. **VERIFIED (scratch):** C1/C1b held at every commit
boundary (Appendix V.1).

---

## Part 5 — Settlement lifecycle and atomicity

Twelve steps (unchanged): (1) stop orders; (2) cancel/expire; (3) release buy reservations;
(4) return escrowed sell shares; (5) resolution record + **entitlement snapshot**; (6) recognition
(atomic per market); (7) pay winners (atomic per user: payout key + MMK journal + unit journal);
(8) crash/restart resume; (9) retire shares; (10) assert zeros; (11) reconcile; (12) mark settled.

**Atomicity rule:** the payout's **MMK journal, unit journal, and unique payout key commit in ONE
transaction**. Correctness does not depend on a progress flag — the set of keys *is* the progress
record. **VERIFIED (PGlite):** unique key + atomic credit rejects duplicates and credits once
(Revision 5, Appendix V.3 of Rev 5; carried forward).

**Failure modes** (simulated in scratch; **real concurrency NOT claimed**): crash before commit
(no effect); crash after commit before ack (restart rescans, no double-pay); duplicate payout
(rejected); two workers (simulated: one commits, one no-ops); idempotency key with different
payload (conflict); restart/recovery (exactly-once).

---

## Part 6 — Case F: atomic correction (CORRECTED)

### 6.1 The Revision 5 defect

Revision 5's Case F posted the unit-reopening journal **before** the funding journal and posted a
receivable recovery that **credited `CorrectionReceivable` before it was established**. Two
consequences:

- **C1 broke** in the intermediate state (units up, backing still 0).
- The recovery could drive `CorrectionReceivable:Bob` **negative** — an invalid balance.

### 6.2 The corrected design: one atomic logical operation

**Case F (recoverable mispayment) is one transaction `T-F` comprising three single-domain
journals**, in this order:

| Journal | Domain | Entries |
| - | - | - |
| **j1 — establish funding** | MMK | `CorrectionReceivable:Bob D 200` / `SettlementCorrection:M C 200` |
| **j2 — recover the receivable** | MMK | `UserAvailable:Bob D 200` / `CorrectionReceivable:Bob C 200` |
| **j3 — re-open claim units** | UNIT | `ClaimUnitsRemaining:M D 2` / `UnitsControl:M C 2` |

The **corrected payout** is a second transaction `T-F-pay`:

| Journal | Domain | Entries |
| - | - | - |
| **j4 — pay corrected entitlement** | MMK | `SettlementCorrection:M D 200` / `UserAvailable:Alice C 200` |
| **j5 — close claim units** | UNIT | `ClaimUnitsRemaining:M C 2` / `UnitsControl:M D 2` |

A **share-domain** journal participates only if the corrected entitlement requires a share
movement; in this example none is needed (shares were retired under v1 and the correction is
purely a credit settlement).

**Ordering rule (receivable recovery):** the receivable **must be established (j1) before it is
recovered (j2)**. `CorrectionReceivable` is **debit-normal**, so crediting it (j2) is only valid
once a debit balance exists. **VERIFIED (scratch):** posting j2 without j1 is **rejected**
(`NEGATIVE BALANCE: CorrectionReceivable:Bob would be -200`). **VERIFIED (PGlite):** the
`balances.balance >= 0` `CHECK` rejects the same move (`violates check constraint
"balances_balance_check"`).

### 6.3 Case F recovery — state and invariant trace (VERIFIED scratch)

| Stage | bucket | payable | corr | units | AvA | AvB | AvC | recvB | issued | C1 | C1b | M1 |
| - | - | - | - | - | - | - | - | - | - | - | - | - |
| **Before** (wrong v1 settled) | 0 | 0 | 0 | 0 | 9800 | 10200 | 10000 | 0 | 30000 | ✅ | ✅ | ✅ |
| *mid1 (uncommitted, after j1)* | 0 | 0 | 200 | 0 | 9800 | 10200 | 10000 | 200 | 30000 | *breaks* | ✅ | ✅ |
| *mid2 (uncommitted, after j2)* | 0 | 0 | 200 | 0 | 9800 | 10000 | 10000 | 0 | 30000 | *breaks* | ✅ | ✅ |
| **After T-F commit** (j1+j2+j3) | 0 | 0 | 200 | 2 | 9800 | 10000 | 10000 | 0 | 30000 | ✅ | ✅ | ✅ |
| **After T-F-pay commit** (j4+j5) | 0 | 0 | 0 | 0 | 10000 | 10000 | 10000 | 0 | 30000 | ✅ | ✅ | ✅ |

- **mid1/mid2 are UNCOMMITTED.** The model shows them only to explain ordering; they are **not
  observable** by another transaction (see 6.6). C1 is momentarily unsatisfied inside the
  transaction, which is exactly why the whole correction **must be one transaction** and why a
  partial commit is forbidden.
- **After each commit**, all invariants hold: MMK ✅, SHARE ✅, UNIT ✅, C1 ✅, C1b ✅, M1 ✅, C2 ✅,
  S1 ✅, non-negative ✅.
- **CorrectionReceivable never goes negative**; **SettlementCorrection never goes negative**; **no
  user balance goes negative** (all `nonNeg=true`).

### 6.4 Rollback (VERIFIED scratch + PGlite)

If any journal in the transaction fails (e.g. an unbalanced journal, or a policy violation), the
**entire transaction rolls back**. **VERIFIED (scratch):** after an injected failure the state was
**byte-identical** to the pre-transaction state. **VERIFIED (PGlite):** after an injected failure,
zero ledger rows existed for the failed transaction and every balance was unchanged.

### 6.5 Case F-issue — atomic issuance funding (CORRECTED)

When the mis-paid credits were **already spent** (uncollectible), the correction may be funded by
**permitted issuance** — **an OWNER DECISION (F14)**, not assumed here.

**One transaction `T-G`:**

| Journal | Domain | Entries |
| - | - | - |
| **j1 — issuance funding** | MMK | `CreditsIssued D 200` / `SettlementCorrection:M C 200` |
| **j2 — re-open claim units** | UNIT | `ClaimUnitsRemaining:M D 2` / `UnitsControl:M C 2` |
| **j3 — pay corrected entitlement** | MMK | `SettlementCorrection:M D 200` / `UserAvailable:Alice C 200` |
| **j4 — close claim units** | UNIT | `ClaimUnitsRemaining:M C 2` / `UnitsControl:M D 2` |

**Effect on `CreditsIssued` and supply:** `CreditsIssued` increases by 200 (30000 → 30200); the
**virtual-credit supply increases by 200**. M1 holds because both sides rise by 200. **VERIFIED
(scratch):** all invariants hold before and after; rollback restores the pre-state.

**If issuance is NOT approved (alternative operational outcome):** the correction cannot be funded
by new credits. Options: (i) **leave the correction PENDING** until recoverable funding exists
(possibly never); (ii) fund from **recovered receivables only** (policy B); (iii) fund from a
**pre-approved correction reserve** created at market creation (a design change — OPEN); or
(iv) accept the deficit as an **explicitly disclosed platform loss** and mark it uncollectible
(Part 7). **The owner must choose; I do not choose on the owner's behalf.**

### 6.6 Why intermediate states are never observable

A relational database gives **transaction isolation**: other transactions see either the
**pre-commit** state or the **post-commit** state, never the in-flight state. Therefore:

- The invariant-breaking intermediate states (mid1/mid2) are **invisible** to any other session.
- The application **must never** commit an invariant-breaking partial correction; each
  transaction is asserted at its commit boundary (in the design, by running the invariant checks
  **inside** the transaction and aborting if any fails).
- **NOT VERIFIED (real PostgreSQL):** this isolation behaviour was **not** tested on a real
  PostgreSQL server with multiple sessions. PGlite is single-connection. **Real concurrency is not
  claimed.**

---

## Part 7 — What C1 actually guarantees (CLARIFICATION)

### 7.1 Five distinct concepts

1. **Accounting balance** — the ledger identity (Σ debits = Σ credits per domain; M1; C1) is
   mathematically satisfied. This is what the scratch model and the invariants check.
2. **Correction receivable** — a **recorded claim** (`CorrectionReceivable:{u}`, debit-normal)
   against a user who was mis-paid. It is an accounting claim, **not** a recovered asset.
3. **Recoverable funding** — credits **actually recovered** and sitting in `SettlementCorrection`
   (or otherwise available) to pay a correction.
4. **Additional issuance** — **newly created** virtual credits, approved by the product owner.
5. **Uncollectible receivable** — an outstanding claim that **cannot currently be recovered**
   (e.g. the mis-paid user spent the credits).

### 7.2 Answers to the owner's questions

| Question | Answer |
| - | - |
| **Does C1 permit a receivable to count as backing?** | **Only under Policy A (below).** Under Policy B it does **not**. This is an **OWNER DECISION (F17)**. |
| **If yes, what justifies it?** | Policy A assumes the receivable is **enforceable and will be recovered** (a contractual claim on the user), so it is treated as backing pending recovery. This is an **assumption**, not a guarantee. |
| **If no, how must the model change?** | Policy B: `SettlementCorrection` may be funded **only** by realized funding (recovered credits or approved issuance). C1 then always means **funded** backing. Units are re-opened **only for the funded tranche**. |
| **What if the user spent the credits and cannot repay?** | The receivable is **uncollectible**. Under Policy A it remains an outstanding claim (with a **WARN** and disclosure); under Policy B the correction **cannot proceed** on that funding and stays **PENDING**. |
| **Can a correction remain pending until funding is available?** | **Yes.** A pending correction is a first-class state; nothing is paid until funded (Policy B), or it proceeds with disclosed unfunded backing (Policy A). |
| **Can a correction proceed using newly issued credits?** | **Only if the owner approves issuance (F14).** Then Part 6.5 applies. Otherwise no. |
| **Treatment of an uncollectible receivable?** | Policy A: keep it outstanding, **disclose** it, and never present it as recovered. Policy B: it **cannot** back funding; the correction stays pending or is written off as a disclosed loss. |
| **Can `SettlementCorrection` remain outstanding after settlement?** | **Recommendation: no** (F16) — it should close at 0 when the correction completes. An outstanding `SettlementCorrection` means a correction is still in flight; if it cannot close, that is an **explicit deficit**, not hidden collateral. |

### 7.3 Two policy alternatives (OWNER DECISION)

**Policy A — Receivable-backed (C1 counts uncollected receivables).**
`SettlementCorrection` may be funded by a `CorrectionReceivable`. C1 and M1 hold immediately; the
correction proceeds. **Risk:** an uncollectible receivable means C1's "backing" is **not
economically realized** — this is an **unfunded deficit that must be disclosed**, never disguised.
**VERIFIED (scratch):** Policy A runs; the model emits `WARN: N MMK outstanding receivable`.

**Policy B — Realized-funding-only (C1 counts only recovered credits / approved issuance).**
A correction may re-open **only** the funded tranche; an uncollected receivable **cannot** back
funding. Corrections with insufficient funding stay **PENDING**. **VERIFIED (scratch):** Policy B
rejects an unfunded reopen (`REJECTED: uncollected receivable cannot back funding`) and re-opens
only the funded tranche.

**Recommendation (not a decision):** **Policy B** is safer for a system that must never present an
unfunded deficit as collateral. **The owner must choose.** Recorded as **F17** (financial) and
**AR13** (architecture).

---

## Part 8 — SettlementCorrection lifecycle

- **Opens** at 0. **Funded** by recovered receivables (Policy A/B) or approved issuance (F14).
- **Spent** paying corrected entitlements via `CorrectionPayable:{u}`.
- **Closes** at 0 when the correction completes.
- **Permitted balance:** **non-negative**; **should close at 0** (F16). Any residual is an explicit
  deficit.
- **C1 interplay:** while open, it is part of C1's backing total and the matching claim units are
  re-opened in the **same transaction**.

---

## Part 9 — Market-buy terminology (CORRECTED)

### 9.1 Ten distinct quantities

| Term | Definition |
| - | - |
| **Maximum spend** | MMK cap the user authorizes. |
| **Actual spend** | Σ (fill price × fill qty). |
| **Requested quantity** | Shares the user asked for (**may be undefined for a pure "spend this much" order**). |
| **Filled quantity** | Integer shares executed. |
| **Remaining quantity** | `requested − filled` (undefined if requested is undefined). |
| **Unspent budget** | `maximum spend − actual spend`, returned to `UserAvailable`. |
| **Complete fill** | Filled quantity **equals** requested quantity (requires a requested quantity). |
| **Partial fill** | Filled quantity **less than** requested quantity (requires a requested quantity). |
| **Expired quote/order** | Past its validity window; **not executed**; re-quote. |
| **Rejected order** | Refused (slippage, insufficient funds, FOK failure, market closed); **no fill**. |

### 9.2 Corrected 2,000 MMK example

**Specify an explicit requested quantity.** Suppose the user requests **35 shares** with a maximum
spend of 2,000 MMK. Asks: L1 5@60, L2 10@62, L3 20@65.

- Fills: 5 + 10 + `floor(1,080/65) = 16` = **31 shares**; **actual spend 1,960**;
  **unspent budget 40**; **remaining quantity = 35 − 31 = 4 shares**.
- Because **filled (31) < requested (35)**, this **is a partial fill**. Revision 5's claim that it
  was "not a partial fill" was **wrong**: it had no requested quantity and (incorrectly) inferred
  completion from budget consumption.
- **Fill completion is never inferred from budget consumption.** Budget exhaustion and fill
  completion are independent.

**Alternative presentation (no requested quantity):** if the order is a pure "spend up to 2,000"
order, report **executed quantity 31, actual spend 1,960, unspent budget 40** and **make no claim
about completeness**.

**Other cases:** *insufficient liquidity* — only L1+L2 → 15 shares cost 920, **unspent 1,080
returned**, **partial**; *slippage breach* — new average 70 vs best ask 60 → relative 16.67%,
beyond tolerance → **rejected**; *expired quote* → **rejected**, re-quote; *duplicate submission* —
idempotency key returns the original result.

### 9.3 Policy retained as OPEN/OWNER DECISION

- **Partial-fill policy (fill-available vs fill-or-kill)** — **OPEN (F8)**.
- **Slippage unit and default** — **OWNER DECISION (F5)**. I do not approve a default.

---

## Part 10 — Financial decision register (Revision 6)

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
| F16 | Must `SettlementCorrection` close at 0 (no residual after settlement)? | yes | RECOMMENDED |
| **F17** | **Does C1 count an uncollected `CorrectionReceivable` as backing (Policy A) or only realized funding (Policy B)?** | **Policy B** | **OWNER DECISION** |
| **F18** | **Treatment of an uncollectible receivable: keep outstanding with disclosure, or write off as a disclosed loss?** | **write off as disclosed loss** | **OWNER DECISION** |
| **F19** | **If issuance (F14) is not approved, what is the fallback: pending correction, reserve, or disclosed loss?** | **pending correction** | **OWNER DECISION** |

---

## Part 11 — Approval

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

### V.1 Revision 6 scratch model — VERIFIED (scratch)

- **Command:** `node rev6.mjs`
- **Purpose:** Case F recovery, Case F-issue, atomicity/failure modes, invariant assertions at
  commit boundaries; reject invalid intermediate commits and unbalanced journals.
- **Result:** **22 PASS / 0 FAIL**, ending `>>> ALL CHECKS PASSED (scratch); warnings=2`.
  (`warnings=2` are the two **Policy A** cases where an uncollected receivable is counted as
  backing — C1/M1 hold but funding is not realized.)
- **Selected actual output:**

```
PASS F0 fully settled (wrong v1)   MMK=true SH=true UN=true C1=true C1b=true M1=true C2=true S1=true nonNeg=true recv=0
   before: bucket=0 payable=0 corr=0 units=0 | AvA=9800 AvB=10200 AvC=10000 recvB=0 issued=30000
   -- transaction T-F (3 single-domain journals, one transaction) --
     (uncommitted after j1) mid1: corr=200 units=0 recvB=200
     (uncommitted after j2) mid2: corr=200 units=0 recvB=0
   [T-F] COMMITTED (all invariants hold at boundary)
PASS F1 after T-F commit           ... C1=true C1b=true M1=true ...
   after: bucket=0 payable=0 corr=200 units=2 | AvA=9800 AvB=10000 AvC=10000 recvB=0 issued=30000
   [T-F-pay] COMMITTED (all invariants hold at boundary)
PASS F2 after corrected payout     ... C1=true C1b=true M1=true ...
   final: bucket=0 payable=0 corr=0 units=0 | AvA=10000 AvB=10000 AvC=10000 recvB=0 issued=30000
PASS G1 after issuance-funded correction   ... | AvA=10000 AvB=0 AvC=20200 issued=30200
   rejected: NEGATIVE BALANCE: CorrectionReceivable:Bob would be -200
PASS F6 credit-before-exists rejected ...
   [T-partial] COMMIT-BOUNDARY invariant failure -> ROLLBACK
PASS F2 partial correction rejected ...
   [T-uncollectible-B] REJECTED: uncollected receivable cannot back funding (policy B) -> ROLLBACK
PASS F10b policy B: unfunded deficit rejected ...
>>> ALL CHECKS PASSED (scratch); warnings=2
```

- **Limitations:** sequential simulation in a single process; the "concurrent workers" case is a
  **simulated** serialization, **not** a real race. **Real PostgreSQL concurrency is NOT verified.**

### V.2 Revision 6 PGlite mechanism test — VERIFIED (PGlite)

- **Command:** `node rev6-pglite.mjs`
- **Purpose:** atomic commit of a three-journal correction across two domains; rollback isolation;
  a `CHECK` that forbids a negative receivable.
- **Actual output:**

```
rollback test (injected failure): rolled-back: injected failure after journals
state unchanged after rollback: true
commit test: committed
after balances: [{"account":"ClaimUnitsRemaining:M","balance":2},{"account":"CorrectionReceivable:Bob","balance":0},{"account":"SettlementCorrection:M","balance":200},{"account":"UnitsControl:M","balance":2},{"account":"UserAvailable:Bob","balance":9800}]
all three domains committed together: true
ledger rows for T-F: 6 | T-FAIL rows: 0
negative-receivable test: rolled-back: new row for relation "balances" violates check constraint "balances_balance_check"
receivable still non-negative: true
```

- **Limitations:** PGlite is a **single-connection, single-process embedded** engine. It **cannot**
  reproduce real multi-session contention. This is **mechanism** evidence only.

### V.3 Real PostgreSQL — NOT VERIFIED

No real PostgreSQL server was used. **Multi-session concurrency is unverified.**

### V.4 Git state — VERIFIED

See the architecture report Section 1; it agrees with the commit for this revision.
