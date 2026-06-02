# PROJECT_MAP — accountant-saas-v2

> **Generated:** 2026-05-31 22:08 UTC+3  
> **Last Build:** 2026-05-31 22:20 UTC+3 — ✅ **Build Succeeded**  
> **Target:** 100% feature parity with Qoyod (https://app.qoyod.com)  
> **Paradigm:** Simplicity First · Domain-Driven · No Feature Creep

---

## TECH_STACK (Actual)

| Layer        | Technology                     | Version     | Notes                                   |
| ------------ | ------------------------------ | ----------- | --------------------------------------- |
| Runtime      | Node.js                        | 22.20.0 LTS | Windows · v22 Jod LTS                   |
| Package Mgr  | pnpm                           | 11.5.0      | Disk efficiency, strict deps            |
| Framework    | Next.js                        | 16.2.6      | App Router, RSC, Server Actions         |
| UI Library   | React                          | 19.2.6      | Latest stable with RSC support          |
| Language     | TypeScript                     | 5.9.3       | Strict mode, full type safety           |
| ORM          | Prisma                         | 7.8.0       | Adapter pattern (PrismaBetterSqlite3)   |
| Database     | SQLite (dev) / PostgreSQL (prod)| —           | SQLite via better-sqlite3 for dev       |
| Auth         | next-auth                      | 4.24.14     | Credentials provider, JWT sessions      |
| Validation   | Zod                            | 4.4.3       | Schema validation, inferred types       |
| CSS          | Tailwind CSS                   | 4.3.0       | Utility-first, JIT, zero-runtime        |
| Icons        | lucide-react                   | 1.17.0      | Lightweight, consistent icon set        |
| i18n         | next-intl                      | 4.12.0      | ICU messages, RTL, Arabic/English       |
| Charts       | recharts                       | 3.8.1       | Dashboard financial charts              |
| Date/Number  | Intl API (native)              | built-in    | Locale-aware formatting (ar-SA)         |
| Logging      | pino                           | 9.x         | Async, non-blocking                     |
| DB Adapter   | @prisma/adapter-better-sqlite3 | 7.8.0       | Node:sqlite built-in (v22.5+)           |

**Dev tools:** ESLint 9 · tsx (seed runner) · Playwright (future)

---

## SYSTEM_FLOW

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│  (RTL Layout · Arabic/English · Responsive)              │
└──────────┬──────────────────────────────┬──────────────┘
           │ HTTPS                        │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  Next.js App Router  │      │  next-auth (Credentials) │
│  (Server Components) │─────▶│  Session JWT + CSRF      │
│  - Pages (RSC)       │      └─────────────────────────┘
│  - Server Actions    │
│  - API Routes        │
└──────────┬───────────┘
           │ Server-only
           ▼
┌─────────────────────────────────────────────────────────┐
│               Prisma ORM (typed queries)                  │
│  - Migrations · Middleware (audit/soft-delete)            │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL 16 (Neon / RDS)                   │
│  Schemas: public (tenants), audit (logs)                 │
│  Extensions: pgcrypto, uuid-ossp                         │
└─────────────────────────────────────────────────────────┘
```

**Data Flow Rules:**
1. All mutations → Server Actions → Zod validation → Prisma → Response
2. All reads → RSC direct DB query (no client fetch waterfall)
3. Reports → DB aggregation queries + server-side computation
4. File uploads → direct-to-S3 presigned URLs (invoices/attachments)
5. Background jobs → Inngest / BullMQ (recurring invoices, reminders)

---

## ARCHITECTURE

### Directory Structure — Single Next.js app, domain-sliced

```
accountant-saas-v2/
├── prisma/
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── [locale]/          # next-intl dynamic locale
│   │   │   ├── (auth)/        # login, register, forgot-password
│   │   │   ├── (dashboard)/   # authenticated layout + sidebar
│   │   │   │   ├── dashboard/
│   │   │   │   ├── sales/
│   │   │   │   │   ├── invoices/
│   │   │   │   │   ├── quotes/
│   │   │   │   │   ├── returns/
│   │   │   │   │   └── customers/
│   │   │   │   ├── purchases/
│   │   │   │   │   ├── invoices/
│   │   │   │   │   ├── returns/
│   │   │   │   │   └── vendors/
│   │   │   │   ├── expenses/
│   │   │   │   ├── banking/
│   │   │   │   │   ├── accounts/
│   │   │   │   │   ├── transactions/
│   │   │   │   │   └── reconciliation/
│   │   │   │   ├── inventory/
│   │   │   │   │   ├── items/
│   │   │   │   │   ├── warehouses/
│   │   │   │   │   └── adjustments/
│   │   │   │   ├── accounting/
│   │   │   │   │   ├── chart-of-accounts/
│   │   │   │   │   ├── journal-entries/
│   │   │   │   │   └── general-ledger/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── balance-sheet/
│   │   │   │   │   ├── income-statement/
│   │   │   │   │   ├── cash-flow/
│   │   │   │   │   ├── trial-balance/
│   │   │   │   │   ├── ar-aging/
│   │   │   │   │   └── ap-aging/
│   │   │   │   ├── payroll/
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx   # sidebar + topbar shell
│   │   │   └── layout.tsx       # next-intl provider wrapper
│   ├── components/
│   │   ├── ui/                  # shadcn primitives (button, input, table, dialog...)
│   │   ├── forms/               # reusable form components (auto-form pattern)
│   │   ├── tables/              # data-table (TanStack Table wrapper)
│   │   └── layout/              # Sidebar, Topbar, Breadcrumbs
│   ├── domains/                 # ★ DOMAIN LAYER — shared business logic
│   │   ├── accounting/          # double-entry engine, account types, journal logic
│   │   ├── sales/               # invoice state machine, customer logic
│   │   ├── purchases/           # PO logic, vendor logic
│   │   ├── inventory/           # stock movement, cost calculation
│   │   ├── banking/             # reconciliation, transaction matching
│   │   ├── reports/             # all financial report builders
│   │   ├── tax/                 # VAT calculation, tax codes
│   │   └── organization/        # multi-tenant, user roles, settings
│   ├── lib/
│   │   ├── prisma.ts            # singleton PrismaClient
│   │   ├── auth.ts              # next-auth config (credentials)
│   │   ├── logger.ts            # async logger (Pino)
│   │   └── utils.ts             # cn(), formatCurrency(), etc.
│   ├── validations/             # Zod schemas (mirrors domain)
│   │   ├── invoice.schema.ts
│   │   ├── account.schema.ts
│   │   └── ...
│   ├── hooks/                   # shared React hooks
│   └── messages/                # next-intl JSON translation files
│       ├── ar.json
│       └── en.json
├── public/                      # static assets, logo, fonts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                     # Playwright
├── docker-compose.yml           # PostgreSQL + app for dev
└── package.json
```

### Domain Isolation Rules

- **NO circular dependencies** between domains. Each domain has a single public `index.ts` exporting its service functions.
- **Shared/Core layer** (`src/lib/`) is minimal: only Prisma client, auth config, logger, and pure utility functions (formatting, math).
- **Server Actions** live in `src/app/[locale]/(dashboard)/<domain>/_actions.ts` — they call domain service functions.
- **Components** inside domain folders are private (prefixed `_` or colocated). Only `src/components/ui/`, `src/components/forms/`, etc. are shared.
- **No micro-files**: each domain should have at most 3-5 files. A domain file can be 300+ lines if the logic is cohesive.

### Database Design Principles

- **Double-entry constraint**: every journal entry has `sum(debits) = sum(credits)` enforced at DB level via trigger + Prisma validation.
- **Soft delete** with `deletedAt` timestamp on all transactional entities.
- **Audit trail**: separate `AuditLog` table for all mutations (who, what, when, diff).
- **Multi-tenant** via `organizationId` on every table — no shared data leakage.

### Logging Strategy (Protocol IV)

```typescript
// src/lib/logger.ts — Async, non-blocking, levels: debug|info|warn|error
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

---

## ORPHANS & PENDING

| Item                          | Status      | Notes                                       |
| ----------------------------- | ----------- | ------------------------------------------- |
| Multi-tenant isolation        | PENDING     | middleware check pending                    |
| Email notifications           | PENDING     | Post-marketing emails (invoice send, reminders) |
| PDF generation (invoices)     | PENDING     | @react-pdf/renderer or puppeteer            |
| Dark mode                     | PENDING     | Tailwind dark variant, simple toggle        |
| Proxy (Next.js 16)            | WARN        | middleware.ts deprecated; rename to proxy.ts |
| Vitest/Playwright tests       | NOT YET     | Only build verification so far              |
| Forms: auto-form component    | ✅ DONE    | Generic form builder created                |
| Forms: invoice-line-editor    | ✅ DONE    | Reusable line editor component              |
| General Ledger page           | ✅ DONE    | Expandable card-based table                 |
| Sales Quotes list + new form  | ✅ DONE    | Full CRUD with line editor                  |
| Sales Returns list            | ✅ DONE    | DataTable with status badges                |
| Purchase Returns list         | ✅ DONE    | DataTable with status badges                |
| Banking Transactions page     | ✅ DONE    | List + create dialog, colored amounts       |
| Banking Reconciliation page   | ✅ DONE    | List with status badges                     |
| Warehouses page               | ✅ DONE    | List + add dialog                           |
| Inventory Adjustments page    | ✅ DONE    | List + create dialog                        |
| Payroll page                  | ✅ DONE    | Coming Soon layout with feature cards       |
| Sales Report                  | ✅ DONE    | Invoice list with totals                    |
| Purchase Report               | ✅ DONE    | Invoice list with totals                    |
| Expense Report                | ✅ DONE    | Expense list with account + total            |
| Tax Report                    | ✅ DONE    | Grouped by tax code                         |
| Cash Flow Report              | ✅ DONE    | Monthly inflows/outflows                    |
| AR Aging Report               | ✅ DONE    | 5 aging buckets per customer                |
| AP Aging Report               | ✅ DONE    | 5 aging buckets per vendor                  |
| Domain: banking services      | ✅ DONE    | getBankAccounts, getBankTransactions, etc.  |
| Domain: inventory services    | ✅ DONE    | getItems, getWarehouses, getStockMovements  |
| Domain: organization services | ✅ DONE    | getOrganization, updateOrganization, etc.   |
| Domain: tax services          | ✅ DONE    | getTaxCodes, createTaxCode, calculateTax   |
| API: bank-transactions route  | ✅ DONE    | POST + GET, wired to domain service         |
| API: warehouses route         | ✅ DONE    | POST + GET                                  |
| API: inventory/adjustments    | ✅ DONE    | POST + GET                                  |
| API: sales-quotes route       | ✅ DONE    | POST + GET, auto-increment number           |
| API: sales-returns route      | ✅ DONE    | POST + GET                                  |
| API: purchase-returns route   | ✅ DONE    | POST + GET                                  |
| API: bank-reconciliation      | ✅ DONE    | POST + GET (was missing entirely)           |
| API: items route              | ✅ DONE    | POST + GET + nameAr (was POST-only)         |
| API: vendors route            | ✅ DONE    | POST + GET + nameAr (was POST-only)         |
| API: customers route          | ✅ DONE    | POST + GET + nameAr (was POST-only)         |
| API: sales-invoices route     | ✅ DONE    | POST + GET (was POST-only)                  |
| API: purchase-invoices route  | ✅ DONE    | POST + GET (was POST-only)                  |
| API: expenses route           | ✅ DONE    | POST + GET (was POST-only)                  |
| API: journal-entries route    | ✅ DONE    | POST + GET, wired to domain service         |
| API: tax-codes route          | ✅ DONE    | POST + GET + nameAr                         |
| API: bank-accounts route      | ✅ DONE    | POST + GET + nameAr                         |
| API: currencies route         | ✅ DONE    | POST + GET + nameAr                         |

---

## MILESTONES — Verifiable Goals (Status)

### M1 — Foundation ✅
- [x] Project scaffold: Next.js 16 + TypeScript + Tailwind 4 + Prisma 7
- [x] SQLite database created and seeded
- [x] next-auth credentials login (email + password) with JWT session
- [x] next-intl configured: ar + en, RTL layout
- [x] Auth pages (login) — Arabic/English
- [x] Dashboard shell: sidebar (Qoyod-identical nav tree) + topbar
- [x] ✅ Build succeeds with `pnpm run build`

### M2 — Core Accounting Engine 🟡
- [x] Prisma schema: 25+ models (Chart of Accounts, Currencies, Tax codes)
- [x] Double-entry journal engine (debit/credit Zod validation)
- [x] Chart of Accounts page (tree view with expand/collapse)
- [x] Journal Entry list + create form
- [x] General Ledger page (expandable grouped entries)
- [ ] Journal Entry auto-posting to General Ledger (sync GL balances)

### M3 — Sales & Purchases 🟡
- [x] Customers CRUD (list page + create dialog)
- [x] Vendors CRUD (list page + create dialog)
- [x] Sales Invoice list + create form with line editor
- [x] Purchase Invoice list + create form with line editor
- [x] Invoice status enum (DRAFT → CONFIRMED → PAID → CANCELLED)
- [x] Sales Quotes list + create form with line editor
- [x] Sales Returns list page
- [x] Purchase Returns list page

### M4 — Expenses & Banking 🟡
- [x] Expense list + create form
- [x] Bank Accounts list + add dialog
- [x] Bank Transactions list + create dialog
- [x] Bank Reconciliation list page
- [x] Expense + Bank Account models in schema

### M5 — Inventory 🟡
- [x] Items/Products list + add dialog with SKU, pricing
- [x] Item model with stock tracking
- [x] Warehouses list + add dialog
- [x] Inventory Adjustments list + create dialog

### M6 — Reports ✅
- [x] Trial Balance page
- [x] Income Statement page
- [x] Balance Sheet page
- [x] Sales Report page
- [x] Purchase Report page
- [x] Expense Report page
- [x] Tax Report page (grouped by tax code)
- [x] Cash Flow Statement page (monthly)
- [x] AR Aging page (5 buckets)
- [x] AP Aging page (5 buckets)

### M7 — Polish & Admin ✅
- [x] Organization settings page (edit form)
- [x] Users list page
- [x] Tax Codes list + add dialog
- [x] Currencies list + add dialog
- [x] AuditLog model
- [x] Fiscal year management

### M8 — Testing & Deployment 🔲
- [ ] Unit tests: domain services, validation schemas
- [ ] Integration tests: API / Server Actions
- [ ] E2E tests: critical user journeys (Playwright)
- [ ] Rename middleware.ts → proxy.ts (Next.js 16)
- [ ] CI/CD pipeline
- [ ] Deploy to Vercel + Neon PostgreSQL

---

**Total estimated effort:** 8 weeks (2 months) with 1-2 developers.  
**Risk register:** Double-entry complexity (M2), bank reconciliation matching logic (M4), report accuracy (M6).  
**Go/No-Go after M2** — if double-entry engine is solid, rest is CRUD.
