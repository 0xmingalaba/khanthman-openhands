# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT — **requires explicit product owner approval before any trading code is written**
**Applies to:** all monetary and share arithmetic, order handling, matching, ledger, and settlement
**Date:** 2026-11-16
**Companion document:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md`

> **Gate:** the master build prompt requires this specification to be approved before
> executable financial operations are implemented. Nothing below is implemented yet.
>
> Each topic states my **RECOMMENDATION**, plus **Alternatives** and **Trade-offs**, and an
> explicit **DECISION** line for you to approve. Where a number is a genuine product choice
> (not a technical necessity), I mark it **[NEEDS OWNER INPUT]**.

Throughout, all amounts are **whole Myanmar Kyat (MMK)** and all share quantities are
**integers**. No fractional MMK, no Pya, no floats anywhere in the money path.

---

## 1. MMK collateral units

- **RECOMMENDATION:** the collateral unit is **1 MMK** (integer). A complete YES/NO set is
  backed by a fixed number of MMK. Polymarket's analogue is "a complete Yes/No set is backed
  by 1 unit of collateral". Mapping that idea to MMK, I recommend **1 complete share set =
  ‎100 MMK collateral** (i.e. a winning share pays **100 MMK**).
- **Why 100, not 1:** with a price grid of 1 MMK per share, the minimum tick would be 1% and
  the minimum order notional would be tiny. A **100 MMK payout per share** gives a natural
  cent-like grid: prices from **1 to 99 MMK per share** = 1%–99% probability, tick = 1 MMK =
  1 percentage point.
- **Alternatives:** payout of 10 MMK (10% min tick, coarse) or 1,000 MMK (finer grid,
  larger capital per share). 100 MMK is the cleanest middle.
- **Trade-offs:** larger payout-per-share means each share costs more, which suits
  Myanmar's "thousands of Kyat" intuition and the required presets (500 / 1,000 / 5,000 /
  10,000 MMK).
- **DECISION:** ☐ Approve payout = **100 MMK per winning share** (recommended)  ☐ Other: ____

## 2. YES/NO share units

- **RECOMMENDATION:** one **share** is a unit claim on an outcome. Quantities are **integers
  (BIGINT)**, minimum **1 share**. Shares are never currency and are never fractional.
- **Trade-offs:** integer shares simplify the ledger and Split/Merge; extremely small
  positions are impossible, which is desirable for a virtual-credit MVP.
- **DECISION:** ☐ Approve integer shares, min 1  ☐ Other: ____

## 3. Price representation and permitted range

- **RECOMMENDATION:** store price as an **integer number of MMK per share**, valid range
  **1–99 inclusive**. Price **is** the implied probability percentage. The complementary
  price is `100 − price`. **No float, ever.**
- **Relationship to payout:** buying at price `p` costs `p` MMK per share and pays `100` MMK
  if the outcome wins.
- **Alternatives:** basis points (0–10000) for a finer grid. Rejected for MVP: 1 MMK = 1% is
  the simplest grid that still feels granular.
- **DECISION:** ☐ Approve integer price 1–99  ☐ Finer grid (basis points)  ☐ Other: ____

## 4. Winning-share payout

- **RECOMMENDATION:** a winning share pays **100 MMK**; a losing share pays **0 MMK**.
  Payout occurs **only at settlement** (Section 19), never as part of trade-fill settlement.
- **DECISION:** ☐ Approve (100 / 0)  ☐ Other: ____

## 5. YES/NO price relationship

- **RECOMMENDATION:** YES and NO are **complements**: `yesPrice + noPrice = 100` at the same
  time. Buying YES at `p` is equivalent to selling NO at `100 − p`.
- **Consequence:** the order book must enforce that a YES bid at `p` and a NO bid at
  `100 − p` are the same offer, so matching works across both sides of the same set.
- **DECISION:** ☐ Approve complementary pricing  ☐ Other: ____

## 6. Minimum order and collateral

- **RECOMMENDATION:** minimum order **notional = 100 MMK** (≈ one share at a mid price);
  minimum **quantity = 1 share**. **[NEEDS OWNER INPUT]** on the notional floor.
- **Trade-offs:** a low floor is inclusive; a higher floor reduces dust and ledger noise.
- **DECISION:** ☐ min notional 100 MMK  ☐ min notional ____  ☐ no minimum

## 7. Quantity and rounding rules

- **RECOMMENDATION:**
  - Share quantity: **integer**, ≥ 1.
  - Money: **integer MMK**, ≥ 0.
  - A **market buy** given an MMK amount `A` and execution price `p` buys
    `floor(A / p)` shares, spending `floor(A / p) × p`; the unspent remainder is **not**
    deducted (or is returned), never rounded up. **All rounding is floor and always in the
    platform/user's favour conservatively** (never create value from rounding).
  - No banker's rounding, no half-up, no floats.
- **DECISION:** ☐ Approve floor-only, integer-only  ☐ Other: ____

## 8. Fees

- **RECOMMENDATION (MVP):** **no fees** for the virtual-credit MVP. Simplicity and
  transparency; the prompt forbids inventing fees.
- **Alternative (if you want Polymarket parity):** a **taker fee** `fee = C × rate ×
  p × (1 − p) / normalization`, makers fee-free, fee-free "world events" category. This
  requires choosing a rate and a normalization for integer MMK, and a fee destination
  account. **Not recommended for MVP.**
- **DECISION:** ☐ No fees (recommended)  ☐ Taker fee, rate = ____  ☐ Other: ____

## 9. Collateral reservation

- **RECOMMENDATION:** when a **buy limit order** is placed, reserve collateral immediately:
  `reserve = price × quantity` (integer MMK). Reservation moves MMK from **available** to
  **reserved** — it does **not** spend it. On fill, reserved → spent + any remainder released.
  On cancel/expiry, the unfilled remainder is released back to available.
- **Invariant:** `available + reserved = totalBalance`, always, and each is ≥ 0.
- **DECISION:** ☐ Approve reserve-on-place  ☐ Other: ____

## 10. Share escrow

- **RECOMMENDATION:** when a **sell limit order** is placed, escrow the shares immediately
  (move from **free shares** to **escrowed shares**). On fill, escrowed shares transfer to
  the buyer; on cancel/expiry, the unfilled remainder is released to free shares.
- **Invariant:** `freeShares + escrowedShares = ownedShares`, always, and each is ≥ 0.
- **DECISION:** ☐ Approve escrow-on-place  ☐ Other: ____

## 11. Matching rules

- **RECOMMENDATION:** **price-time priority** (best price first; ties broken by earliest
  order time). Matching is **server-authoritative** and runs inside a single DB transaction
  with appropriate row locks. Cross-side matching respects the complementarity in Section 5.
- **Determinism:** given the same book state and incoming order, the result is always
  identical (required for tests).
- **DECISION:** ☐ Approve price-time priority  ☐ Other: ____

## 12. Market-order execution

- **RECOMMENDATION:** a market order is a limit order priced to execute immediately against
  resting orders (Polymarket's model). A **market buy** specifies MMK to spend; it consumes
  asks from best to worst until the amount is exhausted or the book is empty. A **market
  sell** specifies shares; it consumes bids best-to-worst.
- **DECISION:** ☐ Approve  ☐ Other: ____

## 13. Slippage and quote expiry

- **RECOMMENDATION:** every quote returned to the client has an **expiry (recommended 10
  seconds)** and a **quote id**. Execution revalidates against the **fresh** book; if the
  book changed, the server returns the new price/quantity and requires confirmation for the
  Market mode, or re-quotes for 1-Tap. **[NEEDS OWNER INPUT]** on max acceptable slippage
  (recommended: reject if worse than **3%** or the user-visible estimate, whichever is
  stricter).
- **DECISION:** ☐ quote expiry 10 s, max slippage 3%  ☐ Other: ____

## 14. Partial fills

- **RECOMMENDATION:** limit orders may **partially fill**. Each fill creates a **Trade**
  record and updates filled quantity. The unfilled remainder stays on the book (GTC) or is
  cancelled (FAK/FOK as chosen). All fills are atomic.
- **DECISION:** ☐ Approve partial fills  ☐ Other: ____

## 15. Order expiry and cancellation

- **RECOMMENDATION:** default **GTC**. Optional **GTD** with an explicit expiry. Cancellation
  is allowed any time before full fill; only the **unfilled** portion can be cancelled.
  On market close, open orders are cancelled and reservations released.
- **DECISION:** ☐ Approve  ☐ Other: ____

## 16. Split / Merge conversion

- **RECOMMENDATION:** with a complete set backed by **100 MMK** (Section 1):
  - **Split:** `100 MMK → 1 YES + 1 NO` per share set, for `n` integer share sets:
    `100 × n MMK → n YES + n NO`.
  - **Merge:** `n YES + n NO → 100 × n MMK`, requiring equal integer amounts.
  - Both are **atomic** single transactions with ledger records, are **available to all
    eligible users**, and are **kept separate from order-book execution** (they must **not**
    directly move order-book prices).
- **DECISION:** ☐ Approve 100 MMK ↔ set  ☐ Other: ____

## 17. Market status restrictions

- **RECOMMENDATION:** trading (all four modes) allowed only when the market is
  **`active` AND `not closed` AND `acceptingOrders`**. Discoverable-but-closed markets are
  read-only. Split/Merge allowed only while the market is open and not resolved.
- **DECISION:** ☐ Approve  ☐ Other: ____

## 18. Market resolution

- **RECOMMENDATION:** resolution is recorded by an explicit **ResolutionRecord** (winning
  outcome, source, timestamp, note). For the MVP, resolution is a **recorded admin action
  performed by the system owner** — the prompt forbids an admin dashboard, so resolution will
  be a **controlled operation** (e.g. a guarded script/CLI), not a UI. Each market must
  display **resolution rules, source, and key dates** to users.
- **Note:** I will not invent a resolution oracle or dispute process for the MVP.
- **DECISION:** ☐ Approve recorded resolution (no oracle, no admin UI)  ☐ Other: ____

## 19. Winning and losing position settlement

- **RECOMMENDATION:** at resolution, for each holder: winning shares pay **100 MMK each**,
  losing shares pay **0**. Settlement is a **separate phase from trade-fill settlement** and
  is **atomic** per user, writing ledger entries. Split/Merge is disabled once resolved.
- **DECISION:** ☐ Approve  ☐ Other: ____

## 20. Ledger invariants

- **RECOMMENDATION — an append-only double-entry ledger** with these invariants, all tested:
  1. **No negative balances** (enforced by DB `CHECK`).
  2. **Every journal balances** (sum of debits = sum of credits, in MMK and in shares).
  3. **No double spending** (reservations + guarded updates).
  4. **No duplicate executions** (idempotency keys + unique trade keys).
  5. **No overselling** (share escrow + free-share checks).
  6. **No incorrect reservation release** (release is bounded by the unfilled remainder).
  7. **No partial financial state** (all-or-nothing transactions).
  8. **Every financial mutation is auditable** (append-only audit log).
  9. **Trade-fill settlement ≠ resolution payout** (separate code paths and ledger journals).
- **DECISION:** ☐ Approve  ☐ Other: ____

---

## 21. Trading modes — behaviour summary (for approval)

| Mode | Inputs | Behaviour |
| - | - | - |
| **1-Tap** | Buy/Sell, YES/NO, preset 1,000 / 5,000 / 10,000 MMK | On a valid preset: fresh server quote → server validation (balance, fresh price, dedupe, idempotency) → **immediate execution**, no second click. Returns fill/partial/reject. |
| **Market** | Buy/Sell, YES/NO, whole-MMK amount, presets 500 / 1,000 / 5,000 / 10,000 | Preview shows **Est. To Win**, **Average Price**, execution preview; then a **separate final Buy/Sell confirmation**; revalidates the quote before executing. |
| **Limit** | Buy/Sell, YES/NO, price (1–99), integer quantity | Reserves collateral (buy) or escrows shares (sell); rests on the book; partial fills; cancellable; full order history. |
| **Split/Merge** | integer share sets | Split MMK→set, or Merge set→MMK; atomic; ledgered; independent of the book. |

**"To Win" definition (needs approval):** for a buy of `q` shares at average price `p`,
`To Win = q × 100 MMK` (the gross payout if it wins). Net profit = `q × (100 − p)`.
I recommend displaying **To Win** as the gross payout and, secondarily, **Profit** as
`q × (100 − p)`.

- **DECISION:** ☐ Approve To Win = gross payout, show Profit separately  ☐ Other: ____

---

## 22. Open financial decisions (summary)

| ID | Decision needed | Recommended default |
| - | - | - |
| F1 | Payout per winning share | **100 MMK** |
| F2 | Price grid | **1–99 MMK (1% steps)** |
| F3 | Minimum order notional | **100 MMK** |
| F4 | Fees | **None** |
| F5 | Quote expiry / max slippage | **10 s / 3%** |
| F6 | Order types for MVP | **GTC + optional GTD; market = immediate limit** |
| F7 | Resolution mechanism | **Recorded owner action, no oracle/admin UI** |
| F8 | New-user virtual credit | **10,000 MMK (if onboarding approved)** |
| F9 | "To Win" definition | **Gross payout; profit shown separately** |

---

## 23. Approval

By approving this document, you confirm the financial rules above are correct and authorize
implementation of executable trading in Milestone 4.

- ☐ **Approved as written**
- ☐ **Approved with changes** (list them): ______________________________
- ☐ **Rejected** (reasons): ______________________________

Product owner signature / date: ______________________________
