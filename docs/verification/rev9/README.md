# Revision 9 verification (Milestone 0)

Reproducible scratch verification for **Revision 9** of the financial specification. These files are
**verification artifacts, not application code** and are **not** imported by the app.

## Files

| File | Purpose |
| - | - |
| `rev9.mjs` | Scratch accounting model. Section 1 = the 45 Revision 8 tests (preserved); Section 2 = the 30 Revision 9 tests; Section 3 = 30 review-prep tests (F28 cancel-order — both alternatives — and Option A). |
| `rev9-pglite.mjs` | PGlite mechanism test (atomic multi-journal, rollback, unique issuance/collection/payout keys, non-negative, corrected issuance). |
| `rev9.expected.out` | Captured stdout of `rev9.mjs`. |
| `rev9-pglite.expected.out` | Captured stdout of `rev9-pglite.mjs`. |

## Prerequisites and versions (as run)

- **Node.js v24.22.2**
- **@electric-sql/pglite 0.5.16** (PostgreSQL 18.6, wasm32) — required **only** by `rev9-pglite.mjs`
- **Linux 6.8.0-1055-gke**

`rev9.mjs` has **no dependencies** (plain Node). `rev9-pglite.mjs` imports
`@electric-sql/pglite`, which is **not** a dependency of this repository, so it must be run from a
directory where that package is installed.

## Commands and expected results

**Option 1 — run the dependency-free model directly from the repository root** (no setup):

```
node docs/verification/rev9/rev9.mjs
```

Expected: `test cases: 105 (105 passed, 0 failed)` and
`invariant assertions at commit boundaries: 220` and `>>> ALL CHECKS PASSED (scratch)`. Exit code `0`.

**Option 2 — run both scripts from a scratch directory** (needed for the PGlite test, which requires
`@electric-sql/pglite`). Set `REPO` to the absolute path of the repository root, then:

```
REPO=/absolute/path/to/khanthman-openhands
mkdir -p /tmp/ledgertest && cd /tmp/ledgertest
npm init -y
npm install @electric-sql/pglite@0.5.16
cp "$REPO/docs/verification/rev9/rev9.mjs" .
cp "$REPO/docs/verification/rev9/rev9-pglite.mjs" .
node rev9.mjs
node rev9-pglite.mjs
```

Expected for `rev9-pglite.mjs`: `P4 corrected E6: ... true`, `P5 Path A: loss reversed after issuance:
true ...`, `P6 duplicate issuance: rejected: ... "issuance_pkey"`, `P9 duplicate collection: rejected:
... "collections_pkey"`, `P7 duplicate payout: rejected: ...`, `P8 ... "accounts_balance_check"`.
Exit code `0`.

**Verify reproduction against the committed output files:**

```
node docs/verification/rev9/rev9.mjs | diff - docs/verification/rev9/rev9.expected.out
```

An empty diff means the committed expected output was produced by the committed script.

## Counting method

- A **test case** is a scenario with an explicit expected/actual outcome. **Expected
  rejections/rollbacks count as PASS** when the safe behaviour is observed.
- An **invariant assertion** is one invariant (MMK, SHARE, UNIT, C1, C1b, M1, C2, S1, non-negativity,
  sub-ledger tie-out, no-double-count) checked at one commit boundary via `report(...)`.
- The summary prints both counts; do not treat individual assertions as separate test cases.

## Verification levels (do not conflate)

1. **Scratch-model tests** — `rev9.mjs`, a single-process in-memory model. Sequential only; **no real
   concurrency**; **not** a product test.
2. **PGlite mechanism tests** — `rev9-pglite.mjs`, a **single-connection** PostgreSQL 18.6 (WASM)
   engine. They verify transactions, `CHECK` constraints, unique keys, rollback, and the atomic
   issuance group. They **cannot** reproduce multi-session contention.
3. **Real PostgreSQL multi-session tests** — **NONE PERFORMED.** **Real PostgreSQL multi-session
   concurrency remains unverified.**

**None of these is application-level financial validation** — there is no application, no schema, and
no production ledger. See `docs/FINANCIAL-SPECIFICATION.md` Part 12 and Appendix V.
