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
- Milestone 0 (Discovery & Architecture) **Revision 4** delivered in `docs/`. Awaiting owner approval.
- Trading code is **gated** on approval of `docs/FINANCIAL-SPECIFICATION.md`.
- Accounting model (Rev 4): non-redeemable virtual credits; NO `Cash` asset; `CreditsIssued`
  contra-equity; `CollateralBucket` = restricted virtual-credit bucket (not a real asset).
- Backing invariant is **claim-based** (Rev 4): `CollateralBucket + SettlementPayable +
  SettlementCorrection = payout_per_share x ClaimUnitsRemaining`. Rev 3's bucket-only C1 was
  false during settlement.
- Settlement: 12-step, two-phase, resumable; payout journal + unique payout key committed
  atomically; no reliance on a worker-progress flag.
- Corrections: immutable `SettlementEntitlement` snapshot survives share retirement;
  `CorrectionReceivable`/`CorrectionPayable`/`SettlementCorrection`; never silent negative balances.
- Verification labels: VERIFIED / DOCUMENTED / RECOMMENDED / PROPOSED / OPEN / OWNER DECISION.
  Do not mark designs VERIFIED without executed evidence.
- Recommended stack: Next.js App Router + TS + Tailwind + PostgreSQL/PGlite + Drizzle +
  Zod + Vitest/Playwright + key-based `en`/`my` i18n.
- PGlite VERIFIED for local/test (logic + constraints); real PostgreSQL needed for concurrency tests.
- First PR recommended: design tokens + app shell only (see architecture report Section 8).

### Commands
- `npm run dev` / `npm run build` / `npm run lint`

### Known environment issue: pushing to GitHub
- Repo: https://github.com/0xmingalaba/khanthman-openhands (default branch `main`, shallow clone).
- **`git push` fails with HTTP 403** ("Permission ... denied"). Both the git credential
  helper (`~/.openhands/git-credential-helper`) and `$GITHUB_TOKEN` resolve to a GitHub App
  / integration token that has **read-only** access. `git ls-remote` (read) works; API writes
  return `Resource not accessible by integration`.
- To push, the owner must grant write (`contents: write`) to the app/integration or provide a
  PAT with `repo` scope. Do **not** push to `main`; use a feature branch and open a PR.
