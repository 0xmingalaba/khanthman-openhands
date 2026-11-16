# Khant Hman Prediction Market

**ခန့်မှန်း ဈေးကွက်**

A prediction market for Myanmar, where users express predictions about real-world events by
trading **virtual YES/NO shares**, in the spirit of the Polymarket user experience but with
original Khant Hman branding.

> **Status: Milestone 0 — Discovery & Architecture.** No product features are implemented
> yet. This repository currently contains an unmodified Next.js scaffold (used only to verify
> the recommended stack builds) plus planning documentation awaiting product-owner approval.
>
> **Virtual credits only.** Credits are virtual and can never be deposited, withdrawn, or
> redeemed. There is no real money, no payment processing, and no monetary value.

---

## Key rules this product follows

- **Currency: MMK only.** Whole Myanmar Kyat. No Pya, no fractional MMK, no USD/USDT.
- **Virtual credits only.** No deposits, withdrawals, payments, payouts, or redemption.
- **No fabricated information.** Prices, volume, charts, activity, orders, and resolutions
  must never be invented or shown as real. Development fixtures are labelled **SIMULATED**.
- **No staff/admin dashboard** in the current scope.
- **Original branding.** Polymarket is a UX reference only; no proprietary assets are used.
- **No version-based naming.**

---

## Planning documents (Milestone 0 deliverable)

- [`docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md`](docs/MILESTONE-0-DISCOVERY-AND-ARCHITECTURE.md)
  — repository verification, UX research, recommended architecture, database design, page
  and component inventory, security and testing strategy, risk register, owner decision
  register, roadmap, and the proposed first PR.
- [`docs/FINANCIAL-SPECIFICATION.md`](docs/FINANCIAL-SPECIFICATION.md)
  — the financial specification for the accounting and correction model that **must be approved before
  any trading code is written**. It is **substantially specified for the accounting model** but
  **materially incomplete for pricing, trading mechanics, and multi-user correction handling**; see its
  **Appendix B coverage matrix** for topic-by-topic status. It is **not** a complete financial
  specification and **no approval has been granted**. (Revision 11 corrected the C2 verification-model
  defect and the C2/S1 share-ledger tests; see the spec Part 4a and
  [`docs/verification/rev9/`](docs/verification/rev9/).)

---

## Recommended stack (proposed, pending approval)

Next.js (App Router) · React · strict TypeScript · Tailwind CSS · PostgreSQL / PGlite ·
Drizzle ORM with versioned migrations · Zod · Vitest + Playwright · key-based `en`/`my` i18n.

Verified in this environment: the Next.js **scaffold builds** (`npm run build`, `tsc --noEmit`,
`eslint`). Separately, a **scratch** run (outside this repository) confirmed that PGlite runs a real
PostgreSQL 18.6 engine with working transactions and constraints. **PGlite is not installed in this
repository** — it is a proposed dependency. See the financial spec **Appendix A** for the exact
verification evidence and its limits.

---

## Getting started (development)

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

---

## License / usage

Internal project. No license granted for reuse of third-party trademarks or assets.
