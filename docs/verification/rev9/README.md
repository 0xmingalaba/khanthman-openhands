# Revision 9 verification (Milestone 0)

Reproducible scratch verification for **Revision 9** of the financial specification. These files are
**verification artifacts, not application code** and are **not** imported by the app.

## Files

| File | Purpose |
| - | - |
| `rev9.mjs` | Scratch accounting model. Section 1 = the 45 Revision 8 tests (preserved); Section 2 = the 30 Revision 9 tests; Section 3 = 27 Revision 9 review-prep tests (F28 cancel order + Option A). |
| `rev9-pglite.mjs` | PGlite mechanism test (atomic multi-journal, rollback, unique keys, non-negative, corrected issuance). |
| `rev9.expected.out` | Captured stdout of `rev9.mjs`. |
| `rev9-pglite.expected.out` | Captured stdout of `rev9-pglite.mjs`. |

## Prerequisites and versions (as run)

- **Node.js v24.22.2**
- **@electric-sql/pglite 0.5.16** (PostgreSQL 18.6, wasm32) — required **only** by `rev9-pglite.mjs`
- **Linux 6.8.0-1055-gke**

`rev9.mjs` has **no dependencies** (plain Node). `rev9-pglite.mjs` imports
`@electric-sql/pglite`, which is **not** a dependency of this repository. Install it in a scratch
directory outside the repo:

```
mkdir -p /tmp/ledgertest && cd /tmp/ledgertest
npm init -y
npm install @electric-sql/pglite@0.5.16
cp <repo>/docs/verification/rev9/rev9.mjs .
cp <repo>/docs/verification/rev9/rev9-pglite.mjs .
```

## Commands and expected results

```
node rev9.mjs
```
Expected: `test cases: 102 (102 passed, 0 failed)` and
`invariant assertions at commit boundaries: 220` and `>>> ALL CHECKS PASSED (scratch)`.
Exit code `0`.

```
node rev9-pglite.mjs
```
Expected: `P4 corrected E6: ... true`, `P5 Path A: loss reversed after issuance: true ...`,
`P6 duplicate issuance: rejected: ... "issuance_pkey"`, `P7 duplicate payout: rejected: ...`,
`P8 ... "accounts_balance_check"`. Exit code `0`.

## Counting method

- A **test case** is a scenario with an explicit expected/actual outcome. **Expected
  rejections/rollbacks count as PASS** when the safe behaviour is observed.
- An **invariant assertion** is one invariant (MMK, SHARE, UNIT, C1, C1b, M1, C2, S1, non-negativity,
  sub-ledger tie-out, no-double-count) checked at one commit boundary via `report(...)`.
- The summary prints both counts; do not treat individual assertions as separate test cases.

## Scope and honesty

These are **scratch models**, not product tests. They show the *proposed* journals are internally
consistent under the model's rules; they do **not** prove the financial rules are correct or complete.
**Real PostgreSQL multi-session concurrency remains unverified** (PGlite is single-connection).
See `docs/FINANCIAL-SPECIFICATION.md` Appendix V and Part 12.
