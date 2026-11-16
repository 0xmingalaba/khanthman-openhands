# Financial Specification — Khant Hman Prediction Market

**Status:** DRAFT (Revision 2) — **requires explicit product owner approval before any trading code is written**
**Supersedes:** Revision 1 (2026-11-16)
**Companion document:** `docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md`
**Milestone:** still Milestone 0 — planning only. **No trading code exists.**

Every finding is tagged:

- **VERIFIED** — confirmed by a command run or a primary source.
- **RECOMMENDED** — my professional recommendation; needs approval.
- **OPEN** — needs your input; I have not decided.
- **OWNER DECISION** — a product/financial choice only you can make.

> All amounts are **whole Myanmar Kyat (MMK)**; all share quantities are **integers**.
> **No floating-point arithmetic is used anywhere in the money path.** Every price, balance,
> and total is an integer; where a quotient is needed for *display* only, it is rendered as a
> rounded string and never stored or used for further arithmetic.

---

## Part A — Collateral, accounting, and worked examples

This part replaces the earlier one-paragraph treatment of collateral. It defines the accounts,
then walks through **ten operations** showing before-state, the operation, after-state, the
ledger accounts affected, the debit/credit entries, and the conservation invariants. It ends
with the backing proof and an explicit warning about the limits of double-entry bookkeeping.

### A.1 The five things that must not be confused

| Concept | What it is | Where it lives |
| - | - | - |
| **User credits** | MMK the platform owes a user. Split into *available* and *reserved*. | Liability accounts `UserAvailable:{user}`, `UserReserved:{user}` |
| **Reserved credits** | MMK a user has committed to an open **buy** order; still theirs, not yet spent. | Liability account `UserReserved:{user}` |
| **Escrowed shares** | Outcome shares a user has committed to an open **sell** order; still theirs. | Share accounts `EscrowedShares:{user}:{outcome}` |
| **Market collateral** | MMK the platform holds to back the outstanding complete sets of one market. | Asset account `MarketCollateral:{market}` |
| **Settlement liability** | MMK owed to winners during resolution, before payout completes. | Liability account `SettlementPayable:{market}` |

### A.2 Accounts and the two ledgers

The system keeps **two independent double-entry ledgers**, each of which must balance on its
own:

**1. MMK ledger** (unit: MMK)

| Account | Type | Meaning |
| - | - | - |
| `Cash` | Asset | The platform's operating pool of MMK |
| `MarketCollateral:{market}` | Asset | MMK backing that market's outstanding sets |
| `UserAvailable:{user}` | Liability | Spendable user credit |
| `UserReserved:{user}` | Liability | Credit reserved by open buy orders |
| `SettlementPayable:{market}` | Liability | Owed to winners during settlement |
| `CreditsIssued` | Equity (contra) | Source of virtual credit (mirrors `Cash` for grants) |

**2. Share ledger** (unit: shares of a specific outcome)

| Account | Type | Meaning |
| - | - | - |
| `SharesFree:{user}:{outcome}` | User holding | Free shares |
| `EscrowedShares:{user}:{outcome}` | User holding | Shares locked by open sell orders |
| `SharesOutstanding:{market}:{outcome}` | Control | Total shares of that outcome in existence |

**Sign convention:** debit increases assets; credit increases liabilities/equity. Every journal
below balances (sum of debits = sum of credits) **within each ledger**.

### A.3 Base parameters used in the examples

These are the **RECOMMENDED** defaults (see Part C for the precision choice):

- Winning share payout: **100 MMK** (so a complete YES+NO set is backed by **100 MMK**).
- Price grid: integer MMK **1–99** per share (1 MMK = 1% implied probability).
- New-user virtual credit: **10,000 MMK** (OWNER DECISION; see the decision register).

### A.4 The ten worked examples

Throughout, `→` shows the operation. Each example lists the **MMK journal** and the **share
journal** separately.

---

#### Example 1 — Initial virtual credit allocation

**Operation:** Grant Alice 10,000 MMK (virtual, non-redeemable).

**Before:** everything zero.

**MMK journal**

| Account | Debit | Credit |
| - | - | - |
| `Cash` | 10,000 | |
| `CreditsIssued` | | 10,000 |

Wait — the grant creates a user liability, not directly equity. The correct entry credits the
user's liability and debits the issuance equity, with `Cash` tracking the operating pool:

| Account | Debit | Credit |
| - | - | - |
| `CreditsIssued` (equity, contra) | 10,000 | |
| `UserAvailable:Alice` (liability) | | 10,000 |

`Cash` is maintained as an asset equal to the total user liability that is *not* held as
market collateral. After this grant: `Cash` = 10,000; `UserAvailable:Alice` = 10,000.

**After:** Alice available = 10,000. **MMK total in system = 10,000.**

**Conservation:** Σ(all MMK accounts) is unchanged by any later transfer; only issuance (this
entry) changes it, and only through `CreditsIssued`.

---

#### Example 2 — Split

**Operation:** Alice splits **100 MMK** into **1 YES + 1 NO**.

**Before:** Alice available = 10,000; MarketCollateral = 0; outstanding YES = 0, NO = 0.

**MMK journal**

| Account | Debit | Credit |
| - | - | - |
| `MarketCollateral:M` | 100 | |
| `UserAvailable:Alice` | | 100 |

**Share journal**

| Account | Debit | Credit |
| - | - | - |
| `SharesFree:Alice:YES` | 1 | |
| `SharesOutstanding:M:YES` | | 1 |
| `SharesFree:Alice:NO` | 1 | |
| `SharesOutstanding:M:NO` | | 1 |

**After:** Alice available = 9,900; Alice holds 1 YES + 1 NO; MarketCollateral = 100;
outstanding YES = NO = 1.

**Conservation:** MMK total unchanged; **YES_out = NO_out = 1**; **MarketCollateral = 100 =
100 × 1**. ✅

---

#### Example 3 — Buying YES from another user (same-outcome match)

**Setup:** Bob split 100 MMK earlier, so Bob holds 1 YES + 1 NO. Alice buys Bob's 1 YES at
**60 MMK**.

**Before:** Alice available = 9,900; Bob available = 9,900 (after his own grant+split);
MarketCollateral = 200; YES_out = NO_out = 2.

**MMK journal**

| Account | Debit | Credit |
| - | - | - |
| `UserAvailable:Alice` | 60 | |
| `UserAvailable:Bob` | | 60 |

**Share journal**

| Account | Debit | Credit |
| - | - | - |
| `SharesFree:Alice:YES` | 1 | |
| `SharesFree:Bob:YES` | | 1 |

**After:** Alice available = 9,840 and holds 1 YES; Bob available = 9,960 and holds 1 NO;
MarketCollateral = 200; YES_out = NO_out = 2.

**Conservation:** MMK total unchanged (transfer); share totals unchanged (transfer);
**MarketCollateral still = 100 × 2 = 200**; the 2 YES and 2 NO remain fully backed. ✅

---

#### Example 4 — Buying NO from another user (same-outcome match)

**Setup:** Carol holds 1 NO (from a split) and sells it to Alice at **40 MMK**.

**MMK journal**

| Account | Debit | Credit |
| - | - | - |
| `UserAvailable:Alice` | 40 | |
| `UserAvailable:Carol` | | 40 |

**Share journal**

| Account | Debit | Credit |
| - | - | - |
| `SharesFree:Alice:NO` | 1 | |
| `SharesFree:Carol:NO` | | 1 |

**Conservation:** identical structure to Example 3. ✅

> **Note on complementary prices:** Alice paid 60 for YES (Ex. 3) and 40 for NO (Ex. 4); 60 +
> 40 = 100. This is the *economically expected* relationship but is **not enforced** when the
> two books are independent — see Part B.

---

#### Example 5 — Selling shares

**Operation:** Alice sells her 1 YES to Bob at **55 MMK** (a within-book transfer).

**MMK journal**

| Account | Debit | Credit |
| - | - | - |
| `UserAvailable:Bob` | 55 | |
| `UserAvailable:Alice` | | 55 |

**Share journal**

| Account | Debit | Credit |
| - | - | - |
| `SharesFree:Bob:YES` | 1 | |
| `SharesFree:Alice:YES` | | 1 |

**Conservation:** MMK and share totals unchanged. A sale moves value and shares; it does not
create or destroy either. ✅

---

#### Example 6 — Partial fills

**Operation:** Alice places a **buy limit** for **10 YES @ 60**. This first **reserves 600
MMK**. The order then fills **4 shares** against Bob's resting sell, and 6 remain open.

**(6a) Reservation on placement**

| Account | Debit | Credit |
| - | - | - |
| `UserReserved:Alice` | 600 | |
| `UserAvailable:Alice` | | 600 |

Alice's *total* credit is unchanged; 600 moves from available to reserved.

**(6b) Fill of 4 shares @ 60 = 240 MMK**

| Account | Debit | Credit |
| - | - | - |
| `UserReserved:Alice` | 240 | |
| `UserAvailable:Bob` | | 240 |

| Account | Debit | Credit |
| - | - | - |
| `SharesFree:Alice:YES` | 4 | |
| `SharesFree:Bob:YES` | | 4 |

Remaining reservation = 600 − 240 = **360 MMK**, still in `UserReserved:Alice`.

**Conservation:** total Alice credit (available + reserved) unchanged by (6a); (6b) is a
transfer between Alice and Bob; **Σ reserved = Σ open buy orders' (price × unfilled qty)**. ✅

---

#### Example 7 — Cancellation and reservation release

**Operation:** Alice cancels the remaining 6 shares of her order. Release 360 MMK.

| Account | Debit | Credit |
| - | - | - |
| `UserReserved:Alice` | 360 | |
| `UserAvailable:Alice` | | 360 |

**After:** Alice's reservation = 0 for this order; available restored by 360.

**Conservation:** released amount is exactly `price × unfilled qty`; it can never exceed the
original reservation (guarded by the unfilled-quantity check). ✅

---

#### Example 8 — Merge

**Operation:** Alice holds 1 YES + 1 NO and merges them into **100 MMK**.

**Before:** MarketCollateral = 100 × k for the current outstanding k sets.

**MMK journal**

| Account | Debit | Credit |
| - | - | - |
| `UserAvailable:Alice` | 100 | |
| `MarketCollateral:M` | | 100 |

**Share journal**

| Account | Debit | Credit |
| - | - | - |
| `SharesOutstanding:M:YES` | 1 | |
| `SharesFree:Alice:YES` | | 1 |
| `SharesOutstanding:M:NO` | 1 | |
| `SharesFree:Alice:NO` | | 1 |

**Conservation:** outstanding YES and NO each decrease by 1 (they stay equal);
**MarketCollateral decreases by exactly 100**, keeping `MarketCollateral = 100 × outstanding`.
✅

---

#### Example 9 — Winning resolution

**Setup:** Market resolves **YES**. Suppose outstanding = 2 YES / 2 NO, MarketCollateral = 200.
Winners: Alice holds 2 YES. Losers: Bob holds 2 NO.

**(9a) Recognize settlement liability**

| Account | Debit | Credit |
| - | - | - |
| `MarketCollateral:M` | 200 | |
| `SettlementPayable:M` | | 200 |

**(9b) Pay each winner 100 MMK per winning share**

| Account | Debit | Credit |
| - | - | - |
| `SettlementPayable:M` | 200 | |
| `UserAvailable:Alice` | | 200 |

Losing NO shares are retired (share ledger: `SharesOutstanding:M:NO` 2 → 0), with no MMK
payout to their holders.

**Conservation:** `MarketCollateral` reaches 0; `SettlementPayable` reaches 0; the 200 MMK
that was collateral is now user credit. **Every winning share was paid in full because
`MarketCollateral` equalled `100 × outstanding`.** ✅

---

#### Example 10 — Losing resolution

**Setup:** Same as Example 9 but the market resolves **NO**.

**(10a) Recognize settlement liability**

| Account | Debit | Credit |
| - | - | - |
| `MarketCollateral:M` | 200 | |
| `SettlementPayable:M` | | 200 |

**(10b) Pay Bob 200 MMK (2 NO × 100)**

| Account | Debit | Credit |
| - | - | - |
| `SettlementPayable:M` | 200 | |
| `UserAvailable:Bob` | | 200 |

Alice's YES shares are retired with no payout.

**Conservation:** identical structure to Example 9, mirrored. ✅

### A.5 Why winning claims are fully backed

**VERIFIED (by the invariants above):** the design maintains, at all times, for every market:

> **Invariant C1 (backing):** `MarketCollateral = 100 × SharesOutstanding(YES)
> = 100 × SharesOutstanding(NO)`, and `SharesOutstanding(YES) = SharesOutstanding(NO)`.

This holds because **every share is created in equal YES/NO pairs and only ever by Split** (and,
if enabled, by cross-outcome minting, which also creates an equal pair — see Part B), and
**every destruction is by Merge or settlement**, which removes equal pairs and releases
exactly 100 MMK per set. Transfers (Examples 3–5) never change the totals.

Therefore, whichever outcome wins, the total payout owed (`100 × winning shares outstanding`)
is exactly equal to the collateral held. No scenario can leave winners under-funded, provided
the invariant is enforced (not merely assumed) — see A.6.

### A.6 Double-entry is not, by itself, proof of collateralization

**RECOMMENDED — and a direct response to your review.** A double-entry ledger guarantees only
that **every journal balances** (Σ debits = Σ credits). It does **not** guarantee that shares
are backed:

- A bug could mint shares (`SharesOutstanding` +1) while writing a *balanced but wrong* MMK
  entry, or none at all, leaving the MMK ledger balanced while `MarketCollateral ≠ 100 ×
  outstanding`.
- A bug could double-credit a user's available balance while still balancing some other pair
  of accounts.
- `Cash` could be spent twice across two markets while each individual journal balanced.

So we treat collateralization as a **separately asserted and separately tested** property:

1. **Runtime assertions:** after every financial mutation, inside the same transaction, the
   service re-computes C1 and the conservation invariants (A.7) and **aborts the transaction**
   if any fails.
2. **Database constraints:** `CHECK` constraints enforce non-negative balances, non-negative
   shares, and `price BETWEEN 1 AND 99` at the storage layer (VERIFIED working in PGlite:
   a `CHECK (bal >= 0)` rejected a negative update).
3. **Scheduled reconciliation:** a job recomputes, per market, `Σ user shares` vs
   `SharesOutstanding` and `MarketCollateral` vs `100 × outstanding`, and raises an alert on
   any drift.
4. **Tests:** dedicated invariant tests (see the architecture report) that attempt to violate
   C1 and must fail.

In short: **the ledger proves the accounting identity; the invariants prove the backing.**
They are different guarantees and both are required.

### A.7 Conservation invariants (must hold after every committed transaction)

| ID | Invariant |
| - | - |
| **C1** | `MarketCollateral:{m} = 100 × SharesOutstanding:{m}:YES = 100 × SharesOutstanding:{m}:NO` |
| **C2** | `SharesOutstanding:{m}:YES = SharesOutstanding:{m}:NO` |
| **C3** | For each user/outcome: `Σ (SharesFree + EscrowedShares) = SharesOutstanding` (summed over users) |
| **C4** | `Σ_users (UserAvailable + UserReserved) + Σ_m MarketCollateral + SettlementPayable = CreditsIssued` |
| **C5** | `Σ_users UserReserved:{u} = Σ open buy orders (price × unfilled qty)` |
| **C6** | `Σ_users EscrowedShares:{u}:{o} = Σ open sell orders unfilled qty` (per outcome) |
| **C7** | Every account is non-negative for assets/liabilities of this kind (no negative balances/shares) |
| **C8** | Every MMK journal and every share journal balances (Σ debits = Σ credits) |

---

## Part B — YES/NO pricing

### B.1 Bid, ask, and spread

- **Bid** — the highest price a buyer will pay for a given outcome.
- **Ask** — the lowest price a seller will accept for that outcome.
- **Spread** — `ask − bid`; tighter = more liquid. Each outcome (YES, NO) has its own book
  with its own bid/ask/spread.

### B.2 The complementarity relationship (and its limits)

**RECOMMENDED / clarification.** In theory a complete set is worth 100 MMK, so a fair market
has `yesPrice + noPrice = 100`. **But this is a property of the relationship between the two
books, not a constraint that either book must satisfy at all times.** Independent books can be
inconsistent. Concretely:

| Book | Best bid | Best ask |
| - | - | - |
| YES | 58 | 62 |
| NO | 40 | 44 |

Here `58 + 40 = 98` and `62 + 44 = 106`. Neither pair sums to 100. This is normal and expected
with **independent order books**. A gap where `yesBid + noBid < 100` (here 98) is a *risk-free
profit* for anyone who buys both sides and merges a set: pay 98, receive 100 on merge. This is
an **arbitrage**, and in a mature market arbitrageurs close it — but the system must not
*assume* it is closed.

**VERIFIED:** Polymarket's own documentation confirms the displayed price is the midpoint of
the spread, falling back to the last traded price when the spread is wide — i.e. the two books
are quoted independently and are not forced to sum to a fixed value:

> "The displayed price is the **midpoint** of the bid-ask spread. If the spread is wider than
> $0.10, the last traded price is shown instead."
> — https://docs.polymarket.com/concepts/prices-orderbook.md

### B.3 Complementary order representation

A **buy of YES at price p** is economically equivalent to a **sell of NO at price 100 − p**
(both pay p now for a claim worth 100 if YES wins). Some engines store orders in one canonical
form and *derive* the other. **RECOMMENDED for MVP:** store each order against its **own
outcome** (do not derive), so the order book is simple and each order is unambiguous. The
equivalence is then available as an *optional matching rule*, not as a data model.

### B.4 Cross-outcome matching

Cross-outcome matching means matching orders from **different** outcomes:

- **YES-buy at p** against **NO-buy at (100 − p)** → **mint** a complete set: the two buyers'
  cash funds 100 MMK of collateral, and the market issues 1 YES to the first and 1 NO to the
  second.
- **YES-sell at p** against **NO-sell at (100 − p)** → **merge** a complete set: the two
  sellers deliver one share each, the set is merged, and 100 MMK is paid out.

This is the mechanism that keeps the two books mutually consistent and is capital-efficient.

### B.5 Displayed probability

**RECOMMENDED rule (mirrors Polymarket):**

1. If the outcome has both a best bid and a best ask: **displayed price = floor((bid + ask) /
   2)** (integer MMK), i.e. the midpoint. Probability = that number as a percentage.
2. Else if there is only one side: display that side, clearly labelled (e.g. "bid only").
3. Else if there is a last traded price: display it, labelled "last trade".
4. Else: display **"—"** and the label **"No price yet"**. **We must never invent a price**
   (this directly satisfies the "no fabricated information" rule).

### B.6 Is cross-outcome matching necessary for the MVP?

**RECOMMENDED: defer it; it is *not* strictly necessary for a correct MVP — but it has a UX
cost.** Analysis:

| | Same-outcome matching only (recommended for MVP) | With cross-outcome matching |
| - | - | - |
| Share creation | Only via **Split** | Via Split **and** YES-buy/NO-buy matches |
| Books | Independent; arbitrage can persist | Mutually consistent; arbitrage closed by matching |
| Correctness | Simpler; easier to prove invariants | More complex; more invariants to test |
| Liquidity | Requires makers to Split to create inventory | Buyers on opposite sides meet directly |
| "Polymarket feel" | Slightly reduced (needs seeded makers) | Closer to Polymarket |

**Recommendation:** implement **Split/Merge + same-outcome matching** first (so inventory can
always be created), and add cross-outcome matching as a **separately reviewed, later** feature.
Note that C1/C2 still hold without cross-outcome matching (all creation is by Split), so the
backing proof is unaffected.

**OPEN / OWNER DECISION:** include cross-outcome matching in the MVP, or defer it?

---

## Part C — Price precision

### C.1 The real design axis is payout-per-share

Because MMK is whole-Kyat and we forbid fractional MMK, the price *tick* in MMK determines the
probability grid only in relation to the **payout per share**. Three coherent options:

| Option | Winning payout / share | Price grid (MMK) | Tick | Implied-probability step |
| - | - | - | - | - |
| **A — 1%** | 100 MMK | 1–99 | 1 MMK | 1% |
| **B — 0.1%** | 1,000 MMK | 1–999 | 1 MMK | 0.1% |
| **C — basis points** | 10,000 MMK | 1–9,999 | 1 MMK = 1 bp | 0.01% |

(One could also keep a 100 MMK payout and use sub-MMK price units, but that **requires
fractional MMK / Pya**, which the product rules forbid — so it is excluded.)

### C.2 Implications

| Dimension | A (1%) | B (0.1%) | C (bps) |
| - | - | - | - |
| **MMK arithmetic** | Smallest integers; trivially safe | Integers still exact; larger magnitudes | Integers exact; largest magnitudes |
| **Winning payout** | 100 MMK/share (matches "thousand-Kyat" presets) | 1,000 MMK/share | 10,000 MMK/share |
| **Min order (1 share)** | ~tens of MMK | ~hundreds of MMK | ~thousands of MMK |
| **User experience** | Coarse but intuitive ("60% = 60 MMK") | Fine, less intuitive pricing | Finest; least intuitive |
| **Capital per share** | Lowest | 10× higher | 100× higher |
| **Storage** | `INT` suffices | `INT` suffices | `INT` suffices (all integer) |
| **Matching complexity** | Lowest | Moderate | Moderate (same code path) |
| **Preset fit** (500/1,000/5,000/10,000 MMK) | Excellent | Good | Awkward (few shares per preset) |

### C.3 Recommendation

**RECOMMENDED: Option A (100 MMK payout, 1–99 grid, 1% steps)** for the MVP. It is the only
option that is simultaneously (a) integer-safe with the smallest numbers, (b) intuitive in the
"price = probability %" sense, and (c) well-matched to the required MMK presets. Finer grids
(B, C) multiply the capital per share and the UX complexity without changing correctness.

**OWNER DECISION:** approve Option A, or choose B/C. **I have not selected the final option.**

---

## Part D — Market-order execution (worked example)

A **market order** is a limit order priced to execute immediately against resting orders (this
is Polymarket's own model — VERIFIED: "All orders on Polymarket are technically limit orders. A
'market order' is simply a limit order priced to execute immediately." —
https://docs.polymarket.com/concepts/prices-orderbook.md). A **market buy** specifies **MMK to
spend**; a **market sell** specifies **shares**.

### D.1 Definitions

| Term | Definition |
| - | - |
| **Maximum spend** | The MMK cap the user authorizes for a market buy. |
| **Actual spend** | Σ (fill price × fill qty) over all fills — integer MMK. |
| **Average price** | `actualSpend / filledQty` — a **display-only** quotient; the authoritative facts are integer `actualSpend` and integer `filledQty`. |
| **Partial fill** | Some, but not all, of the requested size executed. |
| **Unspent balance** | `maximumSpend − actualSpend`; returned to the user's available credit. |
| **Slippage** | `averagePrice − bestPrice` (or relative), the cost of walking the book. |
| **Quote expiry** | The quote is valid for a fixed window (recommended 10 s); after it, a fresh quote is required. |
| **Insufficient liquidity** | The book cannot absorb the full request. |
| **Idempotent retry** | Re-sending the same request (same idempotency key) returns the original result and never executes twice. |

### D.2 Worked example — market buy YES, maximum spend 2,000 MMK

Resting **asks** for YES:

| Level | Price (MMK) | Available shares |
| - | - | - |
| 1 | 60 | 5 |
| 2 | 62 | 10 |
| 3 | 65 | 20 |

Walking the book with a 2,000 MMK budget:

| Step | Level | Price | Qty filled | Cost | Budget remaining |
| - | - | - | - | - | - |
| 1 | L1 | 60 | 5 | 300 | 1,700 |
| 2 | L2 | 62 | 10 | 620 | 1,080 |
| 3 | L3 | 65 | floor(1,080 / 65) = **16** | 1,040 | 40 |

- **Actual spend** = 300 + 620 + 1,040 = **1,960 MMK**
- **Filled quantity** = 5 + 10 + 16 = **31 shares**
- **Average price** = 1,960 / 31 = 63.2258… → **displayed as "63.2 MMK"** (display only)
- **Unspent balance** = 2,000 − 1,960 = **40 MMK** (returned to available)
- **Best price** = 60; **slippage** ≈ 63.2 − 60 = **3.2 MMK/share** (≈ 5.4%)
- **Partial fill?** No — the budget was fully consumed by available liquidity.

### D.3 The same request if the book were thinner

Suppose only L1 (5 @ 60) and L2 (10 @ 62) existed: 15 shares cost 920 MMK, leaving 1,080 MMK
unspent → **insufficient liquidity** for the intended spend. Policy (RECOMMENDED): for a
market order, execute the available portion and **return the unspent 1,080 MMK** to the user,
reporting a partial fill. (A stricter alternative is **FOK**: reject entirely if it cannot be
filled — OWNER DECISION.)

### D.4 Slippage protection and quote expiry

**RECOMMENDED:** the client receives a **quote** with an id, the estimated average price, and
an expiry (10 s). On submit, the server revalidates against the **live** book. If the new
average price is worse than the quote by more than the **max slippage (recommended 3%)**, the
server refuses and re-quotes instead of silently executing worse. Market mode requires an
explicit confirmation step; 1-Tap re-quotes and executes immediately if within tolerance.

### D.5 Idempotent retries

Every mutating request carries a client-generated **idempotency key**. The server stores the
key with the result in `IdempotencyKey`. A retry with the same key:

- returns the **original** result, and
- **never** executes a second time.

The key is bound to the user and the operation payload; conflicting reuse of a key with a
different payload is rejected.

---

## Part E — Resolution and settlement

### E.1 Authority to resolve

**RECOMMENDED (no admin dashboard required):** resolution is performed by a **designated
resolver identity** — for the MVP, the **platform owner/operator**. There is **no** user-facing
resolution UI and no staff dashboard. Resolution is executed through a **controlled, audited
operation** (e.g. a signed, single-purpose CLI/script that requires the operator's credentials
and a market in the correct pre-resolution state). The prompt forbids an admin dashboard, but
it does **not** permit leaving resolution authority undefined — so authority is defined here as
a named, authenticated operator action.

### E.2 Evidence and sources

Each market stores its **resolution rules** and **resolution source(s)** as data (shown to
users before trading). At resolution, a **`ResolutionRecord`** is written capturing: the chosen
outcome, the source reference(s) and evidence used, the resolver identity, the timestamp, and
a short rationale note. This record is what makes the decision reviewable after the fact.

### E.3 Auditing

Every resolution and settlement step writes **append-only `AuditLog`** entries (who, what,
when, why, before/after state). Audit rows are never updated or deleted.

### E.4 Mistakes and disputes

**RECOMMENDED:** once written, a `ResolutionRecord` is **immutable**. A correction is made by
writing a **new superseding record** that references the old one and states the reason; if
settlement already occurred, the correction is applied as **compensating ledger entries**
(never edits). For the MVP there is **no user-facing dispute UI**; disputes are handled by the
operator with a full audit trail. **OPEN:** whether to define a formal pre-settlement dispute
window (e.g. a 24-hour hold between resolution and payout).

### E.5 Settlement execution

Settlement is a single **atomic job per market** that: (1) moves `MarketCollateral` to
`SettlementPayable`; (2) for each holder of the winning outcome, credits `100 × shares`; (3)
retires all shares (winning and losing); (4) closes the market. Each user's payout is a
separate, atomic transaction keyed by `(market, user)`.

### E.6 Preventing duplicate settlement

Settlement is **idempotent and state-guarded**: the market transitions to a terminal `settled`
state exactly once via a **guarded state transition** (`WHERE status = 'resolving'`), and each
`(market, user)` payout carries a unique key. A re-run finds the market already `settled` and
each payout already recorded, so it performs **no** further mutation. This prevents double
payouts even under retries or crashes.

### E.7 Immutable financial history

The ledger is **append-only**: entries are only ever inserted, never updated or deleted.
Corrections are **compensating entries**. Combined with the audit log, the full financial
history remains reconstructable and immutable.

---

## Part F — Revised decision summary (financial)

| ID | Decision | Recommended default | Tag |
| - | - | - | - |
| F1 | Payout per winning share | 100 MMK | OWNER DECISION |
| F2 | Price grid | 1–99 MMK (1% steps) | OWNER DECISION |
| F3 | Minimum order notional | 100 MMK (≈1 share) | OWNER DECISION |
| F4 | Fees | None | OWNER DECISION |
| F5 | Quote expiry / max slippage | 10 s / 3% | RECOMMENDED |
| F6 | Order types | GTC + optional GTD; market = immediate limit | RECOMMENDED |
| F7 | Cross-outcome matching in MVP | Defer | OPEN |
| F8 | Market-order partial-fill policy | Fill available, return unspent | OPEN |
| F9 | Resolution authority | Named operator, audited, no UI | RECOMMENDED |
| F10 | Pre-settlement dispute window | None for MVP (or 24 h) | OPEN |
| F11 | New-user virtual credit | 10,000 MMK | OWNER DECISION |
| F12 | "To Win" display | Gross payout; profit shown separately | OWNER DECISION |

---

## Part G — Approval

Approving this document confirms the financial rules and authorizes implementation of
executable trading in Milestone 4. Nothing here is implemented yet.

- ☐ **Approved as written**
- ☐ **Approved with changes:** ______________________________
- ☐ **Rejected (reasons):** ______________________________

Product owner signature / date: ______________________________
