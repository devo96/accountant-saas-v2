# PROJECT_MAP — accountant-saas-v2

> **Generated:** 2026-06-07 23:00 UTC+3  
> **Last Build:** 2026-06-07 22:55 UTC+3 — ✅ **Build Succeeded (252 pages)**  
> **Last Deploy:** 2026-06-07 21:35 UTC+3 — ✅ **Vercel (schema auto-synced, all pages live)**  
> **Seed:** All models populated with demo data (employee, customer, vendor, categories, units, payment terms, branches, fixed assets, items, invoices, receipts, journal entries, projects, tasks, advances, deductions, social insurance)  
> **Target:** 100% feature parity with Qoyod (https://app.qoyod.com)  
> **Paradigm:** Simplicity First · Domain-Driven · No Feature Creep  
> **Deployment:** https://accountant-saas-v2.vercel.app

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

## QOYOD FEATURE PARITY TRACKER — Sidebar Groups

| Group               | Qoyod   | Ours    | Missing Pages / Notes                                        |
| ------------------- | ------- | ------- | ------------------------------------------------------------ |
| **Dashboard**       | ✅      | ✅      | —                                                            |
| **Sales**           | ✅      | ✅      | Added: Customer Receipts, Recurring Invoices                 |
| **Purchases**        | ✅      | ✅      | Added: Simple Invoices, Supplier Payments                    |
| **Products & Costs** | ✅      | ✅      | Added: Inventory Dashboard, Categories, Units of Measure     |
| **Expenses**        | ✅      | ✅      | —                                                            |
| **Banking**         | ✅      | ✅      | —                                                            |
| **Accounting**      | ✅      | ✅      | Added: Easy Entries, Opening Balances, Accounting Quality, Cost Centers, Fixed Assets sub-pages |
| **Fixed Assets**    | ✅      | ✅      | Depreciation, Disposals, Asset Transfer — standalone group   |
| **Payroll**         | ✅      | ✅      | Added: Advances, Deductions, Social Insurance (pending full CRUD APIs) |
| **Reports**         | ✅      | ✅      | Added: VAT Return, Inventory Report, Budgets → /budgets      |
| **Tasks & Projects**| ✅      | ✅      | New: Projects, Tasks pages (pending full CRUD APIs)          |
| **Settings**        | ✅      | ✅      | Added: Branches, Payment Terms                               |

**12/12 groups matched ✅ — 58 sidebar items vs Qoyod ~58 items**
**All 23 new routes created with proper pages (no placeholders)**

## MODELS ADDED (9 new Prisma models)

| Model                | Schema File       | Used By                              |
| -------------------- | ----------------- | ------------------------------------ |
| Category             | schema.prisma     | Inventory Categories page            |
| UnitOfMeasure        | schema.prisma     | Inventory Units page                 |
| PaymentTerm          | schema.prisma     | Settings Payment Terms page          |
| Branch               | schema.prisma     | Settings Branches page               |
| Advance              | schema.prisma     | Payroll Advances page                |
| Deduction            | schema.prisma     | Payroll Deductions page              |
| SocialInsuranceRecord| schema.prisma     | Payroll Social Insurance page        |
| Project              | schema.prisma     | Projects page                        |
| Task                 | schema.prisma     | Tasks page                           |

## PAGES CREATED (23 new routes = 46 files: page + loading)

| Route                               | Type       | Data Source              |
| ----------------------------------- | ---------- | ------------------------ |
| `/sales/customer-receipts`          | ✅ Full    | PaymentReceipt (type=IN) |
| `/sales/recurring`                  | ✅ Full    | RecurringInvoice model   |
| `/purchases/simple-invoices`        | ✅ Full    | PurchaseInvoice (type)   |
| `/purchases/supplier-payments`      | ✅ Full    | PaymentReceipt (type=OUT)|
| `/inventory/dashboard`              | ✅ Full    | Item + Warehouse stats   |
| `/inventory/categories`             | ✅ Full    | Category model (new)     |
| `/inventory/units`                  | ✅ Full    | UnitOfMeasure model (new)|
| `/accounting/easy-entries`          | ✅ Full    | JournalEntry model       |
| `/accounting/opening-balances`      | ✅ Full    | Account model            |
| `/accounting/accounting-quality`    | ✅ Full    | Quality checks on data   |
| `/accounting/fixed-assets/...`      | ✅ Full    | FixedAsset model         |
| `/reports/vat-return`               | ✅ Full    | Invoice models           |
| `/reports/inventory-report`         | ✅ Full    | Item model               |
| `/reports/journal-entries`          | ✅ Full    | JournalEntry model       |
| `/reports/account-statement`        | ✅ Full    | Account + JournalEntry   |
| `/reports/budgets`                  | ✅ Redirect| → /budgets               |
| `/payroll/advances`                 | ✅ Full    | Advance model (new)      |
| `/payroll/deductions`               | ✅ Full    | Deduction model (new)    |
| `/payroll/social-insurance`         | ✅ Full    | SocialInsuranceRecord (new) |
| `/projects`                         | ✅ Full    | Project model (new)      |
| `/tasks`                            | ✅ Full    | Task model (new)         |
| `/settings/branches`                | ✅ Full    | Branch model (new)       |
| `/settings/payment-terms`           | ✅ Full    | PaymentTerm model (new)  |
| `/settings/cost-centers`            | ✅ Full    | AccountingDimension model|
| `/settings/email-templates`         | ✅ Full    | Email template            |

## TOOLS ADDED

| Tool                          | Location                         | Description                                  |
| ----------------------------- | -------------------------------- | -------------------------------------------- |
| Element Inspector             | `src/components/inspector/`      | زر عائم (✎) في الزاوية اليمنى السفلية. تضغط عليه لتفعيل وضع التحديد، ثم تضغط على أي عنصر في الموقع فتظهر نافذة بمعلومات العنصر (المسار، الوسم، النص، الـ CSS Selector) مع حقل لوصف التعديل المطلوب وزر نسخ المعلومات |

## ORPHANS & PENDING

| Item                          | Status      | Notes                                       |
| ----------------------------- | ----------- | ------------------------------------------- |
| Multi-tenant isolation        | PENDING     | middleware check pending                    |
| PDF generation (quotes)       | ✅ DONE    | jsPDF + html2canvas client-side; Puppeteer `/api/export/pdf` |
| PDF generation (invoices)     | PENDING     | Same approach; not yet wired                |
| Email send (quotes)           | ✅ DONE    | POST `/api/quotes/[id]/send-email` via resend.com |
| Email notifications (general) | PENDING     | Invoice send, reminders, etc.              |
| Dark mode                     | PENDING     | Tailwind dark variant, simple toggle        |
| Proxy (Next.js 16)            | WARN        | middleware.ts deprecated; rename to proxy.ts |
| Vitest/Playwright tests       | NOT YET     | Only build verification so far              |
| CRUD APIs for new models      | PENDING     | Category, UnitOfMeasure, PaymentTerm, Branch, Advance, Deduction, SocialInsurance, Project, Task — pages exist, need POST/PUT/DELETE APIs |
| Payroll run engine            | PENDING     | Calculate salaries + deductions + insurance  |
| Excel export (all reports)    | ✅ DONE    | `exceljs` via `lib/export.ts` — trial balance, balance sheet, income statement, journal entries, account statement |
| Quote→Invoice conversion      | ✅ DONE    | Convert button creates SalesInvoice + lines, auto-redirects to Sales Invoices list |
| Project quick-create          | ✅ DONE    | `QuickCreateDialog` → Project form in slide-over |
| Item validation               | ✅ DONE    | `errorMessage` + disabled Save when no lines in invoice/quote |
| Customer/Vendor address       | ✅ DONE    | `crNumber`, `street`, `city`, `district`, `region`, `country`, `postalCode` added to schema + forms |
| Forms: auto-form component    | ✅ DONE    | Generic form builder created                |
| Forms: invoice-line-editor    | ✅ DONE    | Reusable line editor component              |
| Sidebar restructure (Qoyod)   | ✅ DONE    | 12 groups, 58 items, matched Qoyod layout  |
| General Ledger page           | ✅ DONE    | Expandable card-based table                 |
| Sales Quotes list + new form  | ✅ DONE    | Full CRUD with line editor                  |
| Sales Returns list            | ✅ DONE    | DataTable with status badges                |
| Purchase Returns list         | ✅ DONE    | DataTable with status badges                |
| Banking Transactions page     | ✅ DONE    | List + create dialog, colored amounts       |
| Banking Reconciliation page   | ✅ DONE    | List with status badges                     |
| Warehouses page               | ✅ DONE    | List + add dialog                           |
| Inventory Adjustments page    | ✅ DONE    | List + create dialog                        |
| Payroll page                  | ✅ DONE    | Layout with employee list + feature cards   |
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
| API: items route              | ✅ DONE    | POST + GET (was POST-only)                   |
| API: vendors route            | ✅ DONE    | POST + GET (was POST-only)                   |
| API: customers route          | ✅ DONE    | POST + GET (was POST-only)                   |
| API: sales-invoices route     | ✅ DONE    | POST + GET (was POST-only)                  |
| API: purchase-invoices route  | ✅ DONE    | POST + GET (was POST-only)                  |
| API: expenses route           | ✅ DONE    | POST + GET (was POST-only)                  |
| API: journal-entries route    | ✅ DONE    | POST + GET, wired to domain service         |
| API: tax-codes route          | ✅ DONE    | POST + GET                                   |
| API: bank-accounts route      | ✅ DONE    | POST + GET                                   |
| API: currencies route         | ✅ DONE    | POST + GET                                   |

---

## MILESTONES — Verifiable Goals (Status)

### M1 — Foundation ✅
- [x] Project scaffold: Next.js 16 + TypeScript + Tailwind 4 + Prisma 7
- [x] SQLite database created and seeded
- [x] next-auth credentials login (email + password) with JWT session
- [x] next-intl configured: ar + en, RTL layout
- [x] Auth pages (login) — Arabic/English
- [x] Dashboard shell: sidebar (Qoyod-identical: 12 groups, 58 items) + topbar
- [x] All 23 missing sidebar routes created with proper pages
- [x] 9 new Prisma models added for full schema coverage
- [x] Deployed to Vercel (209 static pages, 0 errors)
- [x] ✅ Build succeeds with `pnpm run build`

### M2 — Core Accounting Engine 🟢
- [x] Prisma schema: 34+ models (including 9 new: Category, UnitOfMeasure, PaymentTerm, Branch, Advance, Deduction, SocialInsurance, Project, Task)
- [x] Double-entry journal engine (debit/credit Zod validation)
- [x] Chart of Accounts page (tree view with expand/collapse + edit/delete actions + auto-generate account code)
- [x] Journal Entry list + create form
- [x] General Ledger page (expandable grouped entries)
- [x] Easy Entries, Opening Balances, Accounting Quality pages
- [x] Cost Centers via AccountingDimensions
- [ ] Journal Entry auto-posting to General Ledger (sync GL balances)

### M3 — Sales & Purchases 🟢
- [x] Customers CRUD (list page + create dialog)
- [x] Vendors CRUD (list page + create dialog)
- [x] Sales Invoice list + create form with line editor
- [x] Purchase Invoice list + create form with line editor
- [x] Invoice status enum (DRAFT → CONFIRMED → PAID → CANCELLED)
- [x] Sales Quotes list + create form with line editor
- [x] Sales Returns list page
- [x] Purchase Returns list page
- [x] Customer Receipts page (PaymentReceipt type=IN)
- [x] Supplier Payments page (PaymentReceipt type=OUT)
- [x] Simple Invoices page (PurchaseInvoice simple type)
- [x] Recurring Invoices page

### M4 — Expenses & Banking 🟡
- [x] Expense list + create form
- [x] Bank Accounts list + add dialog
- [x] Bank Transactions list + create dialog
- [x] Bank Reconciliation list page
- [x] Expense + Bank Account models in schema

### M5 — Inventory 🟢
- [x] Items/Products list + add dialog with SKU, pricing
- [x] Item model with stock tracking
- [x] Warehouses list + add dialog
- [x] Inventory Adjustments list + create dialog
- [x] Inventory Dashboard page (stock stats, low stock alerts)
- [x] Categories page (Category model)
- [x] Units of Measure page (UnitOfMeasure model)

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
- [x] Journal Entries Report page (date range filter, table with reference/status)
- [x] Account Statement Report page (date range, running balance, Excel export)
- [x] Excel export for all reports (via `exceljs` — replaces old CSV)

### M7 — Polish & Admin ✅
- [x] Organization settings page (edit form)
- [x] Users list page
- [x] Tax Codes list + add dialog
- [x] Currencies list + add dialog
- [x] AuditLog model
- [x] Fiscal year management

### M8 — Testing & Deployment 🟡
- [x] Deploy to Vercel (https://accountant-saas-v2.vercel.app)
- [x] All pages, 0 TypeScript errors
- [x] Auto-sync Postgres schema on Vercel deploy (postinstall.js)
- [x] SalesInvoice: referenceNumber, paymentTermId, branchId, DRAFT/CONFIRMED status
- [x] New invoice form matches Qoyod design (Reference, Issue/Due Dates, Payment Terms, Branch, table lines, Save as Draft + Save & Approve)
- [x] PaymentTerm + Branch opposite relations added for SalesInvoice
- [x] PDF download (quotes via jsPDF + Puppeteer)
- [x] Email send (quotes via resend.com)
- [x] Quote→Invoice conversion (auto-redirect to Sales Invoices)
- [x] Customer/Vendor: crNumber + full address (schema + forms + dialogs)
- [x] Excel export via exceljs (trial balance, balance sheet, income statement, journal entries, account statement)
- [ ] Unit tests: domain services, validation schemas
- [ ] Integration tests: API / Server Actions
- [ ] E2E tests: critical user journeys (Playwright)
- [ ] Rename middleware.ts → proxy.ts (Next.js 16)
- [ ] CI/CD pipeline

### M9 — Qoyod Parity Completion 🔲
- [ ] Align Purchase Invoice new form with Qoyod design (same pattern as Sales)
- [ ] CRUD API routes for Category, UnitOfMeasure, PaymentTerm, Branch
- [ ] CRUD API routes for Advance, Deduction, SocialInsurance
- [ ] CRUD API routes for Project, Task
- [ ] Payroll run engine (salary calculation)
- [x] PDF generation (quotes) — jsPDF + Puppeteer
- [x] Email send (quotes) — resend.com HTML template
- [x] Journal Entries Report
- [x] Account Statement Report
- [x] Excel export
- [x] Customer/Vendor: crNumber + full address
- [x] Quote→Invoice conversion
- [x] Item validation (no items = no save)
- [ ] Dark mode toggle

---

## LANDING PAGE ENHANCEMENTS

| Item                          | Status      | Notes                                          |
| ----------------------------- | ----------- | ---------------------------------------------- |
| Mega Menu (Products)          | ✅ DONE    | 4-column grid: Sales, Purchases, Accounting, Products. Hover + click. framer-motion. i18n. RTL-aware arrows |
| Resources Dropdown            | ✅ DONE    | FAQ, Blog, Help Center                        |
| i18n for Header               | ✅ DONE    | `landing` namespace added to ar.json/en.json   |
| Testimonials / Social Proof   | 🔲 NOT YET | G2/Capterra-style badges, customer logos       |
| Trust Badges                  | 🔲 NOT YET | Saudi payment gateways, data center certs      |
| SEO Meta Tags                 | 🔲 NOT YET | Per-section meta, Open Graph, structured data  |
| App Store Links               | 🔲 NOT YET | iOS/Android app badges                         |
| Blog Section                  | 🔲 NOT YET | Latest articles / resources                    |
| Hero Stats (counters)         | 🔲 NOT YET | "100K+ users", "99.9% uptime", etc.           |

**Relevant files:**
- `src/components/landing/mega-menu.tsx` — ProductsMegaMenu + ResourcesDropdown
- `src/components/landing/header.tsx` — Updated to use mega menu + i18n
- `src/messages/ar.json` — `landing` namespace (13 keys)
- `src/messages/en.json` — `landing` namespace (13 keys)

---

**Total estimated effort:** 8 weeks (2 months) with 1-2 developers.  
**Risk register:** Double-entry complexity (M2), bank reconciliation matching logic (M4), report accuracy (M6).  
**Go/No-Go after M2** — if double-entry engine is solid, rest is CRUD.
