# Khant Hman Prediction Market

**ခန့်မှန်း ဈေးကွက်**

A prediction market for Myanmar, where users express predictions about real-world events by
trading **virtual YES/NO shares**, in the spirit of the Polymarket user experience but with
original Khant Hman branding.

> **Status: Milestone 1 — Application foundation (in progress).** The owner approved the Milestone 0
> planning baseline and authorised Milestone 1. This branch (`milestone-1-foundation`) contains the
> application foundation: the Next.js App Router shell, the bilingual (EN/MY) localization layer, the
> light/dark design system, and a **non-financial** database foundation with versioned migrations.
> **No trading, ledger, balances, orders, or settlements exist yet**, and no fabricated market data is
> shown — the home page renders an honest empty state.
>
> - **Working branch `milestone-0-discovery-architecture`** — holds the original **unmodified Next.js
>   scaffold** plus the Milestone 0 planning documents.
> - **Documentation review branch `review/m0-documents-2026-11-16`** — a **documentation-and-evidence-only
>   snapshot**: the four Milestone 0 Markdown documents plus the `docs/verification/rev9/` evidence.
> - **`main`** — contains **only** the initial `README.md`.
>
> **Virtual credits only.** Credits are virtual and can never be deposited, withdrawn, redeemed,
> or cashed out. There is no real money, no payment processing, and no monetary value.

---

## Key rules this product follows

- **Currency: MMK only.** Whole Myanmar Kyat. No Pya, no fractional MMK, no USD/USDT.
- **Virtual credits only — no real-money flows.** No deposits, withdrawals, cash payouts,
  redemption, or external transfers. The **only** permitted movement is **internal virtual-credit
  settlement** between ledger accounts — non-redeemable credits with no monetary value.
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
  [`docs/verification/rev9/`](docs/verification/rev9/), which is included on the review branch.)

---

## Roadmap (owner-approved M0–M6)

The milestone sequence is the **owner-approved M0–M6 roadmap** (restored in Revision 12). No milestone
is renumbered and there is no M7+. Trading and the ledger sit **inside M4**, strictly behind
financial-specification approval. **Milestone 0 documentation has been delivered and accepted as the
planning baseline. Milestone 1 is in progress on `milestone-1-foundation`.**

| Milestone | Theme |
| - | - |
| **M0** | Discovery and architecture (this deliverable) |
| **M1** | Application foundation (design system, navigation, localization, themes, database, migrations, tests) |
| **M2** | Authentication and sessions (auth, sessions, preferences, development fixtures) |
| **M3** | Market experience (homepage, discovery, search, categories, market details) |
| **M4** | Financial specification and trading (**financial spec approved first**, then ledger + trading) |
| **M5** | Portfolio and account (portfolio, positions, orders, history, account settings) |
| **M6** | Security and release readiness (security, responsive, accessibility, financial integrity, regression, release readiness) |

See the architecture report **§3.3** for the full table and gates.

---

## Recommended stack (proposed, pending approval)

Next.js (App Router) · React · strict TypeScript · Tailwind CSS · PostgreSQL / PGlite ·
Drizzle ORM with versioned migrations · Zod · Vitest + Playwright · key-based `en`/`my` i18n.

Verified in this environment: the application **builds and passes all gates** on this branch
(`npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`). PGlite runs a
real PostgreSQL 18.x engine in the migration tests; the production database provider remains an open
owner decision. See [`docs/verification/m1/`](docs/verification/m1/) for the Milestone 1 evidence and
its limits.

---

## Getting started (development)

> These commands require the application foundation, which lives on the **`milestone-1-foundation`**
> branch.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest unit tests
npm run test:e2e   # playwright end-to-end tests
```

---

## License / usage

Internal project. No license granted for reuse of third-party trademarks or assets.
