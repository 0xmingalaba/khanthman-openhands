<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: Khant Hman Prediction Market (ခန့်မှန်း ဈေးကွက်)

Polymarket-inspired prediction market for Myanmar. **MMK only, whole Kyat, virtual credits
only** (no deposits/withdrawals/payments/payouts). No fabricated data — dev fixtures must be
labelled SIMULATED. No admin dashboard. Original branding (Polymarket is a UX reference only).

### Build status
- Milestone 0 (Discovery & Architecture) **Revision 11** delivered in `docs/`. Awaiting owner review.
  Revision 11 corrects the **C2 verification-model defect** and resolves four documentation
  inconsistencies (D12–D15); **no financial policy, account, journal, architecture direction, or
  owner decision changed.** The only code change is the scratch verification script
  `docs/verification/rev9/rev9.mjs` (C2 sign fix + Section 4 share tests).
- **NO FINANCIAL SPECIFICATION APPROVAL HAS BEEN GRANTED. Milestone 1 has NOT started.**
- Trading code is **gated** on approval of `docs/FINANCIAL-SPECIFICATION.md`.
- **Reproducible verification** lives in `docs/verification/rev9/` (scripts + README + captured
  output). It is **verification, not application code**; do not import it. Run:
  `node docs/verification/rev9/rev9.mjs` (no deps; **136 tests, 253 assertions**; Section 4 covers C2/S1) and
  `node docs/verification/rev9/rev9-pglite.mjs` (needs `@electric-sql/pglite@0.5.16`).
  Three levels: scratch (single-process) / PGlite (single-connection) / real PostgreSQL multi-session
  (**NOT PERFORMED**). None is application-level financial validation.
- Accounting model (Rev 9): three **independently balanced domains** — MMK, Share, Claim-unit.
  Single-domain journals; no domain balances against another; committed atomically together.
- Unique economic events **E1–E9** (Rev 9 fixed the duplicated Rev-8 `E3`):
  E1 mispayment, E2 recognition, E3 collection, E4 realization, E5 write-off, E6 issuance,
  E7 reopening, E8 payout, E9 retirement.
- Receivable lifecycle: recognize (`CorrectionReceivable D / PendingCorrectionClaim C`) ->
  collect (`UserAvailable:Bob D / CorrectionReceivable:Bob C`) -> realize
  (`PendingCorrectionClaim D / SettlementCorrection C`). Only **realized** funding backs units.
- **Issuance (E6) is ATOMIC with realization (E4) and reopening (E7)** — this is the Rev-9 fix:
  the Rev-8 E7 credited `SettlementCorrection` without reopening units (broke C1) and did not clear
  `PendingCorrectionClaim` (double-counted). Issuance cancels the outstanding claim
  (receivable and/or write-off loss), so `pending + corr` never exceeds the correction amount and a
  later collection cannot re-fund it. **The cancel order is F28 and is NOT APPROVED**: financial spec
  6.4a states two alternatives — Alt A (loss-first, the proposed recommendation) and Alt B
  (recv-first) — and selects neither.
- Write-off: owner-approved only, `CorrectionWriteOffLoss:M D / CorrectionReceivable:Bob C`
  (debit-normal loss). Unapproved write-off is rejected.
- C1 backing = `CollateralBucket + SettlementPayable + SettlementCorrection
  (+ CorrectionPayableMarket under Option A) = payout_per_share x ClaimUnitsRemaining`.
  `PendingCorrectionClaim` and `CorrectionReceivable` are **EXCLUDED** from C1.
- Non-redeemable virtual credits; NO `Cash` asset; `CreditsIssued` contra-equity.
- Issuance to fund a correction remains an **OWNER DECISION (F14)**; not implemented.
- Verification labels: VERIFIED (scratch) / VERIFIED (PGlite) / VERIFIED (real PostgreSQL) /
  DOCUMENTED / RECOMMENDED / PROPOSED / OPEN / OWNER DECISION / NOT VERIFIED. **Real PostgreSQL
  multi-session concurrency remains unverified.** Do not mark designs VERIFIED without executed
  evidence. A passing scratch model does not prove the specification is correct.
- Recommended stack: Next.js App Router + TS + Tailwind + PostgreSQL/PGlite + Drizzle +
  Zod + Vitest/Playwright + key-based `en`/`my` i18n.
- PGlite VERIFIED for local/test (logic + constraints); real PostgreSQL needed for concurrency tests.
- First PR recommended: design tokens + app shell only (see architecture report Section 8).

### Commands
- `npm run dev` / `npm run build` / `npm run lint`

### Known environment issue: pushing to GitHub
- Repo: https://github.com/0xmingalaba/khanthman-openhands (default branch `main`, shallow clone).
- **Read access — verified** (`git ls-remote` works; remote refs visible).
- **Write access — NOT verified.** Write access is **never** tested by pushing.
- **Historical report (not re-tested):** a prior session reported `git push` failing with **HTTP 403**
  ("Permission ... denied"); both the git credential helper (`~/.openhands/git-credential-helper`) and
  `$GITHUB_TOKEN` resolve to a GitHub App / integration token with **read-only** access, and API writes
  return `Resource not accessible by integration`. Treat this as **historical** until re-established.
- To push, the owner must grant write (`contents: write`) to the app/integration or provide a PAT with
  `repo` scope. Do **not** push to `main`; use a feature branch and open a PR.

### Dependency status (Revision 11 — do not overstate)
- **Declared in `package.json`:** `next`, `react`, `react-dom` (deps); `@tailwindcss/turbopack`,
  `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `tailwindcss`,
  `typescript` (devDeps). **Nothing else.**
- **Installed:** the above and their transitive deps. **`drizzle-orm`, `@electric-sql/pglite`,
  `vitest`, `@playwright/test` are NOT installed. `zod` is only a transitive dep of `eslint-config-next`.**
- **Proposed (not added):** Drizzle + `drizzle-kit`, PGlite, Zod (direct), Vitest, Playwright.
- **Verified:** the **scaffold** builds (`npm run build` / `tsc --noEmit` / `eslint` all exit 0).
  Do **not** claim `drizzle-orm/pglite` (or any proposed dep) resolves.
