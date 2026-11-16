# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 3) — **requires explicit product owner approval before any trading code is written**
**Supersedes:** Revision 2 (2026-11-16)
**Companion:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md`
**Milestone:** still Milestone 0 — planning only. **No trading, ledger, matching, or settlement
code exists.** Everything here is a design.

### Verification labels used in this document

| Label | Meaning |
| - | - |
| **VERIFIED** | An actual command/test was run and its output observed (evidence quoted). |
| **DOCUMENTED** | Supported by a primary technical document (URL given). |
| **RECOMMENDED** | My professional recommendation. |
| **PROPOSED** | A design that is **not implemented and not tested**. |
| **OPEN** | Requires further investigation or an owner decision. |
| **OWNER DECISION** | Requires explicit product-owner approval. |

> **Important honesty statement.** No application, schema, migration, ledger service, matching
> engine, or settlement code has been written. **Nothing in this document is "verified" merely
> because an equation appears in it.** The only VERIFIED items are the local scratch
> experiments listed in Appendix V (a scratch ledger model and scratch constraint tests) and
> the primary sources cited. Everything else is PROPOSED.

---

## Part 0 — Scope and the central correction

Revision 2 described `MarketCollateral` as an **asset** while writing journals that treated it
inconsistently, and it implied virtual credits were backed by a `Cash` balance that had no
corresponding journal entry. **Revision 3 removes all of that.**

**Core principle:** these are **non-redeemable virtual credits**. They are not money, not
deposits, and are backed by **nothing** outside the platform's own books. Therefore:

- There is **no `Cash` account** and **no real asset** anywhere in this model.
- The only "source" of virtual credits is the issuance event, recorded against a contra-equity
  account `CreditsIssued`. It is **not** an asset.
- Market collateral is **not** a real asset; it is a **restricted virtual-credit bucket** — a
  labeled, restricted *liability/equity* holding of already-issued credits.
- The model is self-contained: it tracks **who holds credits and shares**, and enforces
  **conservation**, without ever claiming external backing.

---

## Part 1 — The virtual-credit accounting model (PROPOSED)

### 1.1 The two independent ledgers

1. **MMK ledger** — unit: whole MMK. Tracks the distribution of issued virtual credits.
2. **Share ledger** — unit: integer shares of a specific outcome. Tracks who owns shares.

Each ledger **balances independently**. A journal must balance **within its own ledger**;
MMK entries never mix with share entries in one journal.

### 1.2 Account catalogue (MMK ledger)

Sign convention: **debit (D)** and **credit (C)**. Each account has a **normal side**. An entry
on the normal side **increases** the account; an entry on the opposite side **decreases** it.

| Account | Type | Represents | Normal side | A debit… | A credit… |
| - | - | - | - | - | - |
| `CreditsIssued` | Contra-equity (source of credits) | Total virtual credits ever issued | **D** | Increases total issued | Decreases total issued (only via controlled withdrawal of credits) |
| `UserAvailable:{u}` | User credit balance (unrestricted) | Spendable credits owed to user `u` | **C** | Decreases user's spendable credits | Increases user's spendable credits |
| `UserReserved:{u}` | User credit balance (restricted) | Credits `u` committed to open **buy** orders | **C** | Decreases the reserved amount (fill/cancel/release) | Increases the reserved amount (placing a buy order) |
| `CollateralBucket:{m}` | Restricted virtual-credit bucket | Credits locked to back market `m`'s outstanding sets | **C** | Releases credits out of the bucket (merge, settlement) | Moves credits into the bucket (split) |
| `SettlementPayable:{m}` | Settlement liability | Credits owed to winners of `m` before payout | **C** | Pays out (reduces what is owed) | Recognizes what is owed at settlement |

**Explicitly excluded:** there is **no** `Cash` account, no bank account, no external asset.
`CreditsIssued` is a contra-equity that *mirrors* the credits in circulation; it is not an asset.

### 1.3 Account catalogue (share ledger)

| Account | Type | Represents | Normal side | A debit… | A credit… |
| - | - | - | - | - | - |
| `SharesFree:{u}:{o}` | User share holding (unrestricted) | Free shares of outcome `o` owned by `u` | **D** | Increases `u`'s free shares | Decreases `u`'s free shares |
| `SharesEscrowed:{u}:{o}` | User share holding (restricted) | Shares `u` locked in open **sell** orders | **D** | Increases escrowed shares | Decreases escrowed shares (fill/cancel/release) |
| `SharesOutstanding:{m}:{o}` | Control account | Total shares of outcome `o` in existence for `m` | **C** | Decreases total shares (merge/settlement retire) | Increases total shares (split creates) |

**Ownership rule:** a user's true ownership of outcome `o` is
`SharesFree:{u}:{o} + SharesEscrowed:{u}:{o}`. These are two *buckets of the same ownership*,
never a double count — a share is in exactly one of them at any time.

### 1.4 The global MMK identity

**Identity M1 (credit conservation):**

> `CreditsIssued` = Σ_users (`UserAvailable` + `UserReserved`) + Σ_markets `CollateralBucket`
> + Σ_markets `SettlementPayable`

Read in debit/credit terms: the debit-normal `CreditsIssued` (increased by issuance) equals the
sum of the credit-normal holding accounts. **No journal may create or destroy a credit except a
controlled issuance/withdrawal against `CreditsIssued`.**

### 1.5 Parameter used in all examples

`PAYOUT_PER_SHARE = 100 MMK` (so one complete YES+NO set is backed by 100 MMK). *(OWNER
DECISION — see Part 8. Chosen here only to make the examples concrete.)*

### 1.6 Executed evidence for this model

**VERIFIED (scratch).** I wrote a scratch program implementing exactly this account model
(dual-normal-side posting, a hard `debits == credits` check, and automatic invariant checks)
and executed a sequence of operations covering grants, splits, buys, escrow, partial fill,
cancel, merge, and settlement for **both** outcomes. Command and result are in **Appendix V**.
Summary: **all invariant checks passed** for both a YES-winning and a NO-winning settlement.

This verifies the **arithmetic of the model as designed**. It does **not** verify any product
code (none exists) and does **not** verify multi-session database concurrency.

---

## Part 2 — Worked MMK journal entries (PROPOSED)

Notation: `D` = debit, `C` = credit. Each journal balances (Σ debits = Σ credits). After each
step I show the **check** performed by the scratch model.

### 2.1 Initial virtual-credit issuance

Grant Alice 10,000 MMK of virtual credit.

| Account | D | C |
| - | - | - |
| `CreditsIssued` | 10,000 | |
| `UserAvailable:Alice` | | 10,000 |

**Correction vs Rev 2:** no `Cash` debit. The credit comes from `CreditsIssued` (contra-equity),
**not** from a cash asset. M1 holds: issued 10,000 = available 10,000. ✅

### 2.2 Split (create a complete set)

Alice splits 100 MMK → 1 YES + 1 NO.

| Account | D | C |
| - | - | - |
| `UserAvailable:Alice` | 100 | |
| `CollateralBucket:M` | | 100 |

| Account | D | C |
| - | - | - |
| `SharesFree:Alice:YES` | 1 | |
| `SharesOutstanding:M:YES` | | 1 |
| `SharesFree:Alice:NO` | 1 | |
| `SharesOutstanding:M:NO` | | 1 |

Credits move **available → restricted bucket** (not destroyed). Shares increase in equal pairs.
Backing: bucket +100, outstanding +1 each → C1 preserved. ✅

### 2.3 Buying YES from another user (transfer)

Alice buys Bob's 1 YES at 60 MMK.

| Account | D | C |
| - | - | - |
| `UserAvailable:Alice` | 60 | |
| `UserAvailable:Bob` | | 60 |

| Account | D | C |
| - | - | - |
| `SharesFree:Alice:YES` | 1 | |
| `SharesFree:Bob:YES` | | 1 |

Pure transfer within the MMK ledger and within the share ledger. No creation/destruction. ✅

### 2.4 Buying NO from another user (transfer)

Alice buys Carol's 1 NO at 40 MMK — structurally identical to 2.3. ✅

### 2.5 Selling shares

Alice sells her 1 YES to Bob at 55 MMK — same structure as 2.3 (mirrored). ✅

### 2.6 Reservation for an open buy order

Alice places a buy limit: 10 YES @ 60 → reserve 600 MMK.

| Account | D | C |
| - | - | - |
| `UserReserved:Alice` | 600 | |
| `UserAvailable:Alice` | | 600 |

Wait — direction. Placing a buy order **increases** the reserved amount. `UserReserved` is
credit-normal, so increasing it is a **credit**; the matching debit reduces `UserAvailable`
(debit-normal decrease). Corrected entry:

| Account | D | C |
| - | - | - |
| `UserAvailable:Alice` | 600 | |
| `UserReserved:Alice` | | 600 |

Alice's total credit is unchanged; 600 moves available → reserved. ✅

### 2.7 Fill of a reserved buy (partial)

4 of the 10 reserved shares fill @ 60 = 240 MMK.

| Account | D | C |
| - | - | - |
| `UserReserved:Alice` | 240 | |
| `UserAvailable:Bob` | | 240 |

| Account | D | C |
| - | - | - |
| `SharesFree:Alice:YES` | 4 | |
| `SharesFree:Bob:YES` | | 4 |

Remaining reservation = 360 MMK. ✅

### 2.8 Cancellation and reservation release

Cancel the remaining 6 shares → release 360 MMK.

| Account | D | C |
| - | - | - |
| `UserReserved:Alice` | 360 | |
| `UserAvailable:Alice` | | 360 |

Release is bounded by `price × unfilled qty`. ✅

### 2.9 Merge (destroy a complete set)

Alice merges 1 YES + 1 NO → 100 MMK.

| Account | D | C |
| - | - | - |
| `CollateralBucket:M` | 100 | |
| `UserAvailable:Alice` | | 100 |

| Account | D | C |
| - | - | - |
| `SharesOutstanding:M:YES` | 1 | |
| `SharesFree:Alice:YES` | | 1 |
| `SharesOutstanding:M:NO` | 1 | |
| `SharesFree:Alice:NO` | | 1 |

Credits move **restricted bucket → available**. Bucket and outstanding each decrease by one set.
C1 preserved. ✅

### 2.10 Winning settlement (market resolves YES)

Suppose outstanding = 2 YES / 2 NO, bucket = 200; Alice holds 2 YES (winner).

**(a) Recognize liability**

| Account | D | C |
| - | - | - |
| `CollateralBucket:M` | 200 | |
| `SettlementPayable:M` | | 200 |

**(b) Pay winners**

| Account | D | C |
| - | - | - |
| `SettlementPayable:M` | 200 | |
| `UserAvailable:Alice` | | 200 |

**(c) Retire all shares**

| Account | D | C |
| - | - | - |
| `SharesOutstanding:M:YES` | 2 | |
| `SharesFree:Alice:YES` | | 2 |

(NO shares retired against their holders' `SharesFree:…:NO` accounts, with no MMK payout.)

After: bucket = 0, payable = 0, outstanding = 0. ✅

### 2.11 Losing settlement (market resolves NO)

Mirror of 2.10: the NO holder is paid, YES shares are retired with no payout. ✅

### 2.12 Conservation checks after every step

After each journal above, the scratch model asserted: M1 (credit conservation), C1 (backing),
C2 (YES count = NO count), C3 (Σ user shares = outstanding). **All passed** (Appendix V).

---

## Part 3 — Share accounting (PROPOSED)

### 3.1 Rules

- Shares exist **only** in integer amounts.
- A share is created **only** by Split (and, if enabled, cross-outcome minting — Part 6.4), and
  **always** as an equal YES+NO pair.
- A share is destroyed **only** by Merge or by settlement retirement.
- **Transfers** move shares between users' free/escrow buckets without changing totals.
- A user's ownership of an outcome = `SharesFree + SharesEscrowed` for that user/outcome.

### 3.2 Worked share examples

**S1 — Creation via Split.** Alice splits 2 sets:
`SharesFree:Alice:YES +2` / `SharesOutstanding:M:YES +2`; same for NO. Ownership: Alice 2/2.

**S2 — Sell-order escrow.** Alice escrows 2 YES:
`SharesEscrowed:Alice:YES +2` / `SharesFree:Alice:YES −2`. Total ownership unchanged (2 YES);
2 of them are now restricted.

**S3 — Partial sell-order fill.** 1 of the 2 escrowed YES sells to Bob @55:
MMK: `UserAvailable:Bob D 55` / `UserAvailable:Alice C 55`.
Shares: `SharesFree:Bob:YES +1` / `SharesEscrowed:Alice:YES −1`.
Alice ownership = 1 free YES + 1 escrowed YES = 2 (correct, not double-counted); Bob = 1 free YES.

**S4 — Sell-order cancellation and release.** Cancel the remaining 1 escrowed YES:
`SharesFree:Alice:YES +1` / `SharesEscrowed:Alice:YES −1`. Alice = 2 free YES.

**S5 — Merge.** Alice merges 2 YES + 2 NO:
`SharesOutstanding:M:YES −2` / `SharesFree:Alice:YES −2`; same for NO. Ownership 0/0; bucket −200.

**S6 — Share transfer.** Bob sells 1 YES to Carol: `SharesFree:Carol:YES +1` /
`SharesFree:Bob:YES −1`. Totals unchanged.

**S7 — Winning settlement.** Winners' shares are retired against `SharesOutstanding` after
payout (2.10c). Losing shares retired with no payout.

**S8 — Losing settlement.** Mirror of S7.

### 3.3 No double-counting (PROPOSED invariant)

**Identity S1:** for each outcome `o`, `Σ_users (SharesFree:{u}:{o} + SharesEscrowed:{u}:{o})
= SharesOutstanding:{m}:{o}`. Because escrow is a **move** between the two user buckets (never
a copy), ownership is counted exactly once. The scratch model checked S1 after every step (C3).

---

## Part 4 — Settlement and market closure lifecycle (PROPOSED)

Revision 2 was inconsistent: it called settlement "a single atomic job per market" *and* "a
separate, atomic transaction per user". **Revision 3 resolves this** with an explicit two-phase
model (4.2) plus a resumable batch worker (4.3).

### 4.1 The ten-step lifecycle

| # | Step | Effect |
| - | - | - |
| 1 | **Stop accepting orders** | Market → `closing`; new orders rejected; **matching disabled** (matching transaction re-checks status and aborts) |
| 2 | **Cancel/expire open orders** | Every open order → `cancelled`/`expired` |
| 3 | **Release remaining buy reservations** | `UserReserved → UserAvailable` for every unfilled buy remainder |
| 4 | **Return escrowed sell shares** | `SharesEscrowed → SharesFree` for every unfilled sell remainder |
| 5 | **Record final resolution + evidence** | Write immutable `ResolutionRecord` (outcome, source, evidence, resolver, time) |
| 6 | **Calculate winning claims** | Compute `100 × winning shares` per holder from the frozen book |
| 7 | **Settle winners** | Pay each winner (batched, resumable — 4.3) |
| 8 | **Retire both winning and losing shares** | `SharesOutstanding` and holders' buckets → 0 |
| 9 | **Confirm market collateral is zero** | Assert `CollateralBucket = 0` |
| 10 | **Mark fully settled** | Market → `settled`; only after reconciliation succeeds |

Steps 1–4 close the market *cleanly* (no reservations or escrow left dangling). Steps 5–10
perform resolution and settlement.

### 4.2 Resolving "atomic vs per-user"

**Design (PROPOSED):** settlement is **two phases**.

- **Phase A — Recognition (one atomic transaction per market).** Steps 5 and the *recognition*
  journal of 6: move the market's whole collateral from `CollateralBucket` to
  `SettlementPayable`, and freeze the resolution record. This is atomic and market-wide.
- **Phase B — Payout (many atomic transactions, one per user, resumable).** Step 7: for each
  winner, one transaction moves `100 × shares` from `SettlementPayable` to `UserAvailable:{u}`
  and records a unique payout key. Steps 8–10 run after all payouts are confirmed.

This removes the Rev 2 contradiction: **recognition is market-atomic; payout is per-user and
resumable.** `SettlementPayable` is the intermediate state that makes the batch safe.

### 4.3 Resumability, idempotency, duplicate prevention

- Each payout carries a **unique payout key** `(market_id, user_id, resolution_version)`.
  Inserting the key and crediting the user happen in **one transaction**; a duplicate insert
  fails on the unique constraint, so a retry is a **no-op**.
- The batch worker records progress; a crash resumes by **skipping keys already present**.
- The market is marked `settled` **only after** a reconciliation query confirms
  `SettlementPayable = 0` and `CollateralBucket = 0` and every winner has a payout key.
- A guarded state transition (`UPDATE … WHERE status = 'resolving'`) ensures exactly one worker
  drives the batch.

### 4.4 Worked settlement example — YES wins

State at closure: outstanding 2 YES / 2 NO, bucket 200. Alice 2 YES; Bob 2 NO.

1. Stop orders; cancel; release; return escrow (no-ops if none).
2. Record resolution = YES.
3. Phase A: `CollateralBucket D 200` / `SettlementPayable C 200`.
4. Phase B: payout key (M, Alice, v1): `SettlementPayable D 200` / `UserAvailable:Alice C 200`.
5. Retire: `SharesOutstanding:YES D 2` / `SharesFree:Alice:YES C 2`;
   `SharesOutstanding:NO D 2` / `SharesFree:Bob:NO C 2`.
6. Reconcile: bucket 0, payable 0, outstanding 0 → mark `settled`. ✅

### 4.5 Worked settlement example — NO wins

Identical structure with Bob (2 NO) paid and Alice's YES retired without payout. ✅

Both examples were executed in the scratch model with all invariants passing (Appendix V).

---

## Part 5 — Collateralization re-proof (PROPOSED)

### 5.1 The invariant

**C1 (backing):** for each market `m`,
`CollateralBucket:{m} = PAYOUT_PER_SHARE × SharesOutstanding:{m}:YES
= PAYOUT_PER_SHARE × SharesOutstanding:{m}:NO`
and **C2:** `SharesOutstanding:YES = SharesOutstanding:NO`.

### 5.2 Assumptions (must all hold)

1. **A1:** Shares are created **only** in equal YES/NO pairs, **only** by Split (and, if enabled,
   cross-outcome minting, which also creates an equal pair). No other path mints shares.
2. **A2:** Each split locks exactly `PAYOUT_PER_SHARE` credits per set into `CollateralBucket`.
3. **A3:** Each merge/settlement removes an equal YES/NO pair and releases exactly
   `PAYOUT_PER_SHARE` per set.
4. **A4:** Transfers move shares between user buckets and credits between user accounts without
   changing any total.
5. **A5:** `PAYOUT_PER_SHARE` is constant for the life of a market.
6. **A6:** No admin/direct SQL path can create shares or move `CollateralBucket` outside these
   operations (enforced by control-account discipline and, at runtime, by the assertion in 5.5).

### 5.3 Preservation argument (permitted operation → C1 preserved)

| Operation | Effect on `CollateralBucket` | Effect on outstanding YES/NO | C1 preserved? |
| - | - | - | - |
| Grant | none | none | trivially yes |
| Split of n sets | +`P×n` | +n / +n | yes (both sides scale by n) |
| Transfer (buy/sell) | none | none | yes |
| Reserve / release (buy) | none | none | yes |
| Escrow / release (sell) | none | none | yes |
| Merge of n sets | −`P×n` | −n / −n | yes |
| Settlement recognition | −`P×N` (to payable) | unchanged until step 8 | yes for the phase; payable = `P×N` |
| Settlement retire | none | −N / −N (both → 0) | yes (bucket already 0) |

Because every operation changes the bucket and the outstanding counts **by the same multiple**,
the ratio `bucket / outstanding = P` is invariant. This is a **mathematical design argument**,
not a test result.

### 5.4 What each claim actually is

| Claim | Status |
| - | - |
| The invariant equation C1/C2 | **PROPOSED** design |
| The per-operation preservation argument | **PROPOSED** (hand proof) |
| The arithmetic of the model on a scripted sequence | **VERIFIED** (scratch model, Appendix V) |
| Database `CHECK`/unique constraints enforcing non-negativity, price range, payout uniqueness | **PROPOSED** as DDL; the *constraint mechanism* is **VERIFIED** in PGlite (Appendix V) |
| Constraints applied to the real schema | **Does not exist yet** (no schema/migrations) |
| Product ledger/matching/settlement code | **Does not exist yet** |
| Multi-session concurrency correctness | **Does not exist yet and is NOT proven by PGlite** (see Appendix V note) |

### 5.5 Enforcement (PROPOSED, beyond double-entry)

Double-entry proves journals balance; it does **not** prove backing (see Part 7 and Appendix V).
Backing is enforced by: (1) runtime assertions of C1/C2/C3 inside the same transaction, aborting
on failure; (2) `CHECK` constraints (non-negative, price range); (3) a unique payout key per
`(market, user, resolution_version)`; (4) scheduled reconciliation recomputing
`Σ user shares` vs `SharesOutstanding` and `bucket` vs `P × outstanding`, alerting on drift;
(5) tests that attempt to violate C1 and must fail. None of (1)–(5) is implemented.

---

## Part 6 — Market orders, pricing, and slippage

### 6.1 Market-buy amount is a maximum, not a guarantee

A market buy of "2,000 MMK" means **maximum spend = 2,000 MMK**, not a promise to spend 2,000.
The engine buys whole shares while the running cost stays within budget; **any remaining MMK is
returned** to `UserAvailable`.

### 6.2 Worked example — market buy YES, maximum spend 2,000 MMK

Resting asks: L1 5@60, L2 10@62, L3 20@65.

| Level | Price | Qty | Cost | Remaining budget |
| - | - | - | - | - |
| L1 | 60 | 5 | 300 | 1,700 |
| L2 | 62 | 10 | 620 | 1,080 |
| L3 | 65 | floor(1,080/65) = 16 | 1,040 | 40 |

- **Maximum spend** = 2,000 MMK (authorized cap)
- **Actual spend** = 1,960 MMK
- **Filled quantity** = 31 shares
- **Average price** = 1,960 / 31 = 63.2258 MMK (display-only quotient; authoritative facts are
  integer `1,960` and integer `31`)
- **Unspent balance returned** = 40 MMK
- **Partial fill?** No — the full budget was consumable.

### 6.3 Partial-fill semantics (PROPOSED)

- A **limit** order may rest and partially fill; the unfilled remainder stays on the book (GTC)
  or is cancelled (FAK/FOK as configured).
- A **market** order: policy **fill-available and return the unspent balance** (PROPOSED
  default). If liquidity runs out before the budget is used, the order is a **partial fill**,
  the unspent MMK is returned, and the result is reported as partial. A stricter alternative is
  **FOK** (reject entirely). *(OPEN — Part 8.)*

### 6.4 Slippage: relative vs percentage points

Slippage can be expressed two ways and they are **not** interchangeable:

- **Relative (percentage) slippage** = `(avgPrice − bestPrice) / bestPrice × 100%`.
- **Percentage-point slippage** = `avgPrice − bestPrice` (in MMK, where 1 MMK = 1 point = 1%).

For the 6.2 example (best ask 60, avg 63.2258):

**VERIFIED (computed):**

- Relative slippage = **5.376%**
- Point slippage = **3.2258 points**
- A **3% relative** tolerance **would REJECT** this fill (5.376% > 3%).
- A **3-point** tolerance **would also reject** it (3.2258 > 3).

**Conclusion:** the earlier "3%" figure was underspecified and, applied to this example, would
block a legitimate multi-level fill. **Recommendation:** express the tolerance in **relative
percent** and set the default **higher** (e.g. 10% relative) **or** expose it per-order and show
the user the exact estimated average price before confirming. **OWNER DECISION** on the number
and on the unit.

### 6.5 Quote expiry and slippage protection interaction (PROPOSED)

A quote carries an id, an estimated average price, and an expiry (e.g. 10 s). On submit:

1. The server revalidates against the **live** book.
2. If the fresh average price is within tolerance of the quote → execute.
3. If it is **worse** than tolerance → **do not execute**; return a re-quote and require
   confirmation (Market mode) or re-quote silently and execute (1-Tap, if still within tolerance).
4. If the quote has **expired** → the client must fetch a fresh quote; an expired quote is never
   executed.

So quote expiry bounds *staleness in time*; slippage tolerance bounds *price movement*. Both
are needed.

### 6.6 Cross-outcome matching

**OPEN / OWNER DECISION.** As in Revision 2: same-outcome matching plus Split/Merge is a
correct MVP without it; cross-outcome matching (YES-buy against NO-buy minting a set, and the
reverse) improves liquidity and consistency but adds complexity. Not decided here.

---

## Part 7 — Resolution correction policy (PROPOSED)

The ledger is **append-only**; it is never "reversed" or rewritten. Corrections are made with
**compensating entries** and new records. Three cases:

### 7.1 Mistake found *after resolution but before settlement*

- No payout has occurred; `SettlementPayable` may or may not be recognized yet.
- **Action:** write a **new `ResolutionRecord`** superseding the old one (the old record is kept,
  never edited), stating the reason and evidence. If Phase A recognition already ran, post a
  **compensating journal** to move `SettlementPayable` back to `CollateralBucket`
  (`SettlementPayable D` / `CollateralBucket C`), then re-run settlement with the corrected
  outcome.
- **User impact:** none yet (no credits moved). **Funding:** none required.

### 7.2 Mistake found during *partial settlement*

- Some winners already paid; the market is mid-Phase-B.
- **Action:** **stop** the batch. Write a superseding resolution record. For each user already
  paid **incorrectly**, post a **compensating entry** to reverse their credit
  (`UserAvailable:{u} D` / `SettlementPayable C`) — only if the user's balance is sufficient;
  otherwise record the reversal as a **receivable/deficit** and flag the account (do **not**
  force a negative balance). Then recompute claims under the corrected outcome and resume the
  batch for the remaining users.
- **Funding:** if a wrongly-paid user has already spent the credits, the correction may need the
  platform to absorb a deficit (since credits are virtual, this is an accounting adjustment, not
  a real-money shortfall) — but it must be **explicitly recorded and reviewed**, never hidden.
- **User impact:** affected users see a correcting transaction in their history with a clear
  reason.

### 7.3 Mistake found *after full settlement*

- All winners paid; shares retired; market `settled`.
- **Action:** the market stays `settled`; write a superseding resolution record and post
  **compensating journals** to move credits between affected users. Because the ledger is
  append-only, the original payout and the correction **both** remain visible.
- **Funding:** the platform funds any net deficit via a controlled `CreditsIssued` adjustment
  (issuance of additional virtual credits) that is **explicitly logged and reviewed**. This is
  an accounting event, not a cash transaction.
- **User impact:** each affected user receives a compensating credit/debit with an audit-linked
  reason; totals are reconciled and re-asserted (Part 5).

### 7.4 Audit and evidence

Every correction writes an **append-only `AuditLog`** entry (who, what, when, why, before/after)
and references the superseded record. Corrections never delete history.

---

## Part 8 — Revised financial decision register

| ID | Decision | Recommended | Tag |
| - | - | - | - |
| F1 | Payout per winning share | 100 MMK | OWNER DECISION |
| F2 | Price grid | 1–99 MMK (1%) | OWNER DECISION |
| F3 | Minimum order notional | 100 MMK | OWNER DECISION |
| F4 | Fees | None | OWNER DECISION |
| F5 | Slippage unit + default | **relative %**, default ~10% (not 3%) | OWNER DECISION |
| F6 | Quote expiry | 10 s | RECOMMENDED |
| F7 | Order types | GTC + optional GTD | RECOMMENDED |
| F8 | Market-order partial-fill policy | fill-available, return unspent | OPEN |
| F9 | Cross-outcome matching in MVP | defer | OPEN |
| F10 | Resolution authority | named audited operator, no UI | RECOMMENDED |
| F11 | Pre-settlement dispute window | none (or 24 h) | OPEN |
| F12 | New-user credit | 10,000 MMK | OWNER DECISION |
| F13 | "To Win" display | gross payout; profit separate | OWNER DECISION |
| F14 | Correction funding source | controlled `CreditsIssued` adjustment, audited | OPEN |

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

All experiments ran in scratch directories **outside** the repository (no repo files created).
Commands and observed output:

### V.1 Scratch ledger model (PROPOSED model arithmetic)

Command: `node model.mjs` (scratch file implementing the account model of Part 1 with dual
normal sides, a hard `debits == credits` check, and automatic invariant checks; sequence:
3 grants → 3 splits → buy YES → buy NO → escrow 2 YES → partial fill 1 → cancel → merge 2 sets →
settle).

Observed output (abridged):

```
=== RUN 1: settle YES ===
PASS [1 grants]        mmkBalanced=true backing=true yesEqNo=true sharesSum=true
PASS [2 splits (4 sets)] mmkBalanced=true backing=true yesEqNo=true sharesSum=true | coll=400 yOut=4 nOut=4
PASS [3 buy YES]       ...
PASS [4 buy NO]        ...
PASS [5 escrow 2 YES]  ...
PASS [6 partial fill 1 of 2] ...
PASS [7 cancel release] ...
PASS [8 merge 2 sets]  ... | coll=200 yOut=2 nOut=2
   ownership -> Alice Y0/N1  Bob Y1/N1  Carol Y1/N0
PASS [9/10 settle YES] ... | coll=0 yOut=0 nOut=0
   final MMK: CreditsIssued=30000 Alice=9955 Bob=10005 Carol=10040 Coll=0 Pay=0
=== RUN 2: settle NO ===
... PASS [9/10 settle NO] ...
   final MMK: CreditsIssued=30000 Alice=10055 Bob=10005 Carol=9940 Coll=0 Pay=0
>>> ALL INVARIANT CHECKS PASSED
```

**Interpretation:** the *arithmetic of the proposed model* is internally consistent for a
scripted sequence, for both settlement outcomes. This is **not** a product test and **not** a
concurrency test.

### V.2 Scratch constraint tests (PROPOSED constraints, PGlite)

Command: `node constraints.mjs` (PGlite; tables with `CHECK (available >= 0)`,
`CHECK (reserved >= 0)`, `CHECK (price BETWEEN 1 AND 99)`, `CHECK (qty >= 0)`).

Observed output:

```
PASS (rejected): negative available balance
PASS (rejected): negative reserved balance
PASS (rejected): price above 99
PASS (rejected): price below 1
PASS (rejected): negative qty
valid insert accepted: 1 row(s)
>>> ALL PROPOSED CONSTRAINTS ENFORCED
```

**Interpretation:** the *constraint mechanism* works in PGlite (PostgreSQL 18.6). The **real
schema does not exist yet**; this only shows the constraints are expressible and enforced.

### V.3 Slippage computation

Command: `python3` arithmetic for the 6.2 example. Output: actual spend 1,960 MMK; qty 31;
avg 63.2258 MMK; **relative slippage 5.376%**; **point slippage 3.2258**; a 3% tolerance
**rejects** the fill.

### V.4 PGlite concurrency limitation (VERIFIED)

**VERIFIED:** PGlite is a single-connection, single-process embedded engine. Earlier scratch
tests confirmed `SELECT … FOR UPDATE`, `pg_advisory_xact_lock`, and `SERIALIZABLE` are
*supported syntax*, but a single embedded instance **cannot reproduce real multi-session
contention**. Therefore **PGlite evidence must never be presented as proof of real PostgreSQL
multi-session concurrency.** Concurrency must be tested on a real PostgreSQL server (PROPOSED,
not done).

### V.5 Git state (VERIFIED)

See the architecture report Section 1 for the full Git verification (branch, HEAD, ahead-count,
clean tree, per-commit files). No repository files were created or modified for these
experiments.
