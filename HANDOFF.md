# Pryrox — Project Handoff Document

> **Prepared for:** Project Stakeholders
> **Date:** June 23, 2026
> **Branch:** `ft-payment`
> **Last Commit:** `0770a7c` — remove KPay payment gateway

---

## Executive Summary

Pryrox is a multi-tenant pharmacy management SaaS platform built with Next.js 14, PostgreSQL (Supabase-hosted), and Prisma. The platform supports inventory management, point-of-sale, prescriptions, insurance claims, staff management, and subscription-based billing.

**The core infrastructure and subscription billing system are production-ready.** The application layer (POS, reports, insurance, customer management) has significant gaps — many features are UI-complete but backed by hardcoded stubs or missing database logic.

**Payment gateway status:** KPay (mobile money/card) has been permanently removed from the codebase. **Polar is the sole payment gateway** for subscription billing (card/international payments).

---

## What Was Delivered

### 1. Authentication & Authorization

| Deliverable | Status | Notes |
|---|---|---|
| Native JWT authentication (bcryptjs) | ✅ Complete | No Supabase SDK dependency. Custom `/api/auth/*` routes. |
| Sign-in with email/password | ✅ Complete | Works with 2FA branching. |
| Two-Factor Authentication (TOTP) | ✅ Complete | Full flow: QR code, verification, backup codes, login enforcement. |
| Google OAuth sign-in | ✅ Complete | Optional — configured via env vars. |
| Session management + middleware | ✅ Complete | JWT refresh on every request, protected-path enforcement. |
| API key management (SHA-256 hashed) | ✅ Complete | Create, edit, rotate, deactivate. Display-prefix only. |
| Password reset | ✅ Complete | `ForgotPasswordForm` → React Query mutation → `POST /api/auth/recovery-email` → sends reset email. |
| Sign-up (self-registration) | ✅ Complete | `signUpAction` exported from `actions.ts`, wired to form via `formAction`. |

### 2. Subscription & Billing (Polar)

| Deliverable | Status | Notes |
|---|---|---|
| Subscription plan management (CRUD) | ✅ Complete | Admin can create, edit, sync plans to Polar. |
| Polar checkout integration | ✅ Complete | Checkout creation, webhook fulfillment, status polling. |
| Pending payment flow | ✅ Complete | Access block system, "Pay now" banner, context-aware upgrade dialog. |
| Subscription lifecycle management | ✅ Complete | Orchestrator handles upgrades, downgrades, pending changes, expiry. |
| Billing page (React Query) | ✅ Complete | Current plan, invoices, plan catalog, usage metrics. |
| Branch addon subscriptions | ✅ Complete | Additional branch slots per plan. |
| Admin billing dashboard | ✅ Complete | Revenue KPIs, transaction history, plan analytics. |
| Entitlements / feature gating | ✅ Complete | Sidebar hiding, in-page locks, API enforcement. |
| KPay mobile money | ❌ Removed | Service discontinued. All KPay code deleted from codebase. |
| Subscription cancellation | ✅ Complete | `BillingCancelDialog` → `POST /api/saas/subscription/cancel` → orchestrator updates DB. Auth + role check enforced. |
| Subscriber count in admin | ✅ Complete | `/api/admin/plans` queries active subscriptions by plan_id, enriches response with `active_subscriber_count`. Displayed in admin subscriptions panel. |

**Why incomplete:** KPay was removed because the service is no longer available. Polar is fully operational.

### 3. Admin Platform Settings

| Deliverable | Status | Notes |
|---|---|---|
| Profile tab (name, email) | ✅ Complete | React Query, single save button. |
| Notifications tab (email templates) | ✅ Complete | Template editor, preview, send test. |
| Operations tab (scheduled maintenance) | ✅ Complete | BullMQ email queue, background worker, real-time queue stats. |
| Security tab (2FA, API keys, IP whitelist) | ✅ Complete | Full 2FA management, key rotation, IP management UI. |
| Integrations tab | ✅ Complete | Polar config display, webhook status. |
| System health endpoint | ✅ Complete | Checks Polar config, database, insurance providers. |

**Why incomplete:** The notifications, compliance, and analytics tabs in the pharmacy settings panel have placeholder content. The admin settings page-improved.tsx exists but is not active (superseded by the provider-based approach).

### 4. Pharmacy Owner Dashboard

| Deliverable | Status | Notes |
|---|---|---|
| KPI stats (sales, products, customers) | ✅ Complete | Live data from database. |
| Sales charts (area, radial, bar) | ✅ Complete | All three chart types render live data. |
| Stock alerts and expiry alerts | ✅ Complete | Color-coded badges, structured API responses. |
| Recent sales list | ✅ Complete | 5 most recent transactions. |
| Subscription status display | ✅ Complete | Plan name, days remaining, expiry warnings. |
| Inventory status chart | ❌ Bug | Uses string literal `'userPharmacy.pharmacy_id'` instead of actual ID. |
| Monthly revenue | ⚠️ Estimate | Calculated as `todayTotal × 30`, not real monthly sum. |

**Why incomplete:** The inventory chart bug is a placeholder string that was never replaced with the actual pharmacy ID resolution logic.

### 5. Inventory Management

| Deliverable | Status | Notes |
|---|---|---|
| View inventory (search, filter, sort) | ✅ Complete | Client-side search and category filter. |
| Add drug / product | ✅ Complete | Medication lookup/creation + inventory record. |
| Delete drug | ✅ Complete | Hard-delete with medication preservation. |
| Edit drug | ✅ Complete | Supports quantity, price, min stock, unit cost, and stock location. |
| Barcode generation and printing | ✅ Complete | JsBarcode CODE128, single and bulk print. |
| Excel import/export | ✅ Complete | Row-level error reporting on import. |
| Stock location assignment | ✅ Complete | Inventory rows reference stock_locations. |
| Stock transfer | ✅ Complete | Branch-to-branch transfers with UUID-based validation, stock checks, and audit trail. |
| Expiry alerts API | ✅ Complete | Queries real database with configurable `withinDays` parameter. |
| Stock adjustment | ⚠️ Partial | Quantity updates correctly, but adjustment reason is not stored in the database. |

### 6. Point of Sale (POS)

| Deliverable | Status | Notes |
|---|---|---|
| Product search and cart | ✅ Complete | Product grid, per-item price overrides. |
| Sale processing (core) | ✅ Complete | Creates sales + items, decrements inventory. |
| Insurance coverage calculation | ✅ Complete | Per-item coverage, claim creation. |
| Quick-add (drug, patient, insurance, category) | ✅ Complete | All four dialogs persist to database. |
| Payment methods (cash, card, mobile, insurance, mixed) | ✅ Complete | All five methods recorded in database. Card/mobile have no external terminal integration. |
| Hold sale | ✅ Complete | Persists to `held_sales` database table. Survives server restarts. |
| Void sale | ✅ Complete | Updates `sales.status` to "cancelled", restores inventory quantities, creates stock movement records and audit log. |
| Returns | ✅ Complete | Restores `inventory.quantity_in_stock` when restock=true, creates stock movement records. |
| Barcode scanner | ✅ Complete | Scan button has working `onClick` handler that matches barcodes and adds products to cart. |
| Daily close | ⚠️ Partial | Computes and returns summary from real database queries, but does not persist the close record to a database table. |
| Loyalty points | ⚠️ Partial | `customer_loyalty` table exists with API, but not wired to POS sale flow or customer UI. |

### 7. Customer Management

| Deliverable | Status | Notes |
|---|---|---|
| Customer list | ✅ Complete | Tenant-isolated via RLS. |
| Add customer | ✅ Complete | Persists to database. |
| Edit customer | ✅ Complete | PATCH handler updates name, phone, email, DOB, allergies, insurance, status. |
| Delete customer | ✅ Complete | DELETE handler removes customer record. |
| POS customer autocomplete | ✅ Complete | Name/phone search, auto-fill. |
| Purchase history | ✅ Complete | Queries real sales data from database, not hardcoded stubs. |
| Loyalty points | ⚠️ Partial | `customer_loyalty` table and API exist but not wired to UI or POS. |

### 8. Staff Management

| Deliverable | Status | Notes |
|---|---|---|
| View staff roster | ✅ Complete | Fetches from auth.users + pharmacy_users. |
| Add staff member | ✅ Complete | Creates auth user and pharmacy_users record. Role is configurable from the form (defaults to pharmacist if not provided). |
| Edit staff member | ✅ Complete | Updates both `pharmacy_users` and `public_users` tables with correct ID resolution. |
| Delete staff member | ⚠️ Partial | Removes `pharmacy_users` record but Supabase Auth user and `public_users` record persist. UI acknowledges this. |
| Activate / deactivate | ✅ Complete | Toggle calls `PUT /api/staff/[id]` and persists status to database. |
| Role guard on /staff route | ✅ Complete | Client-side route guard in dashboard layout + server-side permission checks on API endpoints (`staffManage` permission required). |

### 9. Reports

| Deliverable | Status | Notes |
|---|---|---|
| Sales KPI cards | ✅ Complete | Total sales, orders, avg order value, active customers. |
| Inventory alerts chart | ✅ Complete | 14-day low-stock and expiry counts. |
| Top selling products | ✅ Complete | Revenue-ranked from sale_items. |
| Payment methods breakdown | ✅ Complete | Computed from live sales data. |
| Financial report | ✅ Complete | Queries real sales, expenses, accounting data from database. |
| Tax / VAT report | ✅ Complete | Computes VAT from real sales data. RRA submission requires EBM integration (acknowledged gap). |
| Audit report | ✅ Complete | Queries real audit logs from database with user profile enrichment. |
| Date range filter | ✅ Complete | Start/end dates fully wired from UI → HTTP layer → API routes → database queries. |
| PDF export | ⚠️ Partial | Uses `window.print()` (browser print dialog). jsPDF is installed but not used for true PDF generation. |
| Excel export | ❌ Not implemented | xlsx library installed but no export button on the reports page. |

### 10. Infrastructure

| Deliverable | Status | Notes |
|---|---|---|
| Redis + BullMQ job queue | ✅ Complete | Email notifications, maintenance alerts, background worker. |
| Scheduled maintenance mode | ✅ Complete | Date/time picker, user notification, queue stats. |
| React Query data fetching | ✅ Complete | All data hooks use React Query. No raw fetch in useEffect. |
| Polar checkout + webhook | ✅ Complete | Full integration with stale subscription cleanup. |
| Prisma schema + migrations | ✅ Complete | 20+ SQL migrations, Prisma client generation. |
| Web Crypto API key hashing | ✅ Complete | Edge Runtime compatible. |
| Webhook bypass (maintenance, rate-limit, IP whitelist) | ✅ Complete | Polar webhook exempt from all enforcement layers. |

---

## What Is Not Complete and Why

### Critical Pre-Production Blockers

| # | Issue | Severity | Reason Not Done |
|---|---|---|---|
| 1 | Debug/test routes exposed (9 routes) | 🔴 Critical | Development routes left in codebase. Must be deleted before production. |
| 2 | Unauthenticated admin API routes | 🔴 Critical | `/api/admin/pharmacies`, `/api/admin/categories` have no auth checks. |
| 3 | Hardcoded test credentials in `/api/auth/login` | 🔴 Critical | Returns mock JWT. Must be deleted. |
| 4 | Public HTML test files in `public/` | 🟡 Medium | `check-user.html`, `test-insurance.html` accessible without auth. |

**Why these exist:** The application was developed incrementally with a focus on core flows (auth, POS, inventory, subscriptions). Debug routes were used during development and were never cleaned up.

### Feature Gaps

| Area | What's Missing | Why |
|---|---|---|
| **POS** | Daily close persistence, loyalty points integration | Daily close computes real data but doesn't persist. Loyalty table exists but isn't wired to POS. |
| **Reports** | Excel export, true PDF generation | xlsx and jsPDF libraries installed but not used on reports page. |
| **Insurance** | Claim processing, pricing, lookup, claims reporting | All endpoints are hardcoded stubs. No database integration. |
| **Staff** | Auth user cleanup on delete | Deleting a staff member removes pharmacy_users but leaves the auth account active. |
| **Subscription** | Refund handling, proration logic | Cancellation works; refund/proration requires business decisions. |
| **Real-time updates** | WebSocket implementation | Currently HTTP polling (5s interval). Supabase Realtime was planned but not implemented. |

### Technical Debt

| Issue | Impact | Notes |
|---|---|---|
| Duplicate admin settings pages | `page-improved.tsx` exists but is inactive | The provider-based approach superseded it. |
| Staff table (HR fields) | Defined in schema but unused | Dead schema — no API or UI references it. |
| Multi-tenancy fix not in migrations | `fix-inventory-isolation-complete.sql` is a loose file | Fresh deployments may have RLS gaps. |

---

## Payment Gateway Status

| Gateway | Status | Notes |
|---|---|---|
| **Polar** | ✅ Active | Card/international payments. Checkout, webhooks, status polling all functional. |
| **KPay** | ❌ Removed | Service discontinued. All code, config, and documentation deleted. |

**Impact:** Subscription billing now works exclusively through Polar (card payments). Mobile money payments are no longer available. POS payment recording still works for cash transactions; card/mobile money at POS has no external terminal integration.

---

## Database State

| Item | Status |
|---|---|
| Supabase-hosted PostgreSQL | Active, schema up to date |
| Prisma schema | 20+ migrations applied |
| Seed data | Only admin user (`abdousentore@gmail.com / seedpass123`) |
| Test users | Removed — no pharmacy-scoped test accounts exist |
| KPay columns | Removed from `payment_transactions` table schema |

---

## Environment Requirements

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `NATIVE_AUTH_ENABLED` | Yes | Must be `true` |
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL |
| `SMTP_*` | Yes | Email sending (sign-up, password reset, invites) |
| `POLAR_ACCESS_TOKEN` | Yes | Polar API token |
| `POLAR_WEBHOOK_SECRET` | Yes | Polar webhook verification |
| `REDIS_HOST` | For email queue | Required for BullMQ worker |
| `KPAY_*` | **Removed** | No longer needed |

---

## How to Run

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, SMTP, POLAR credentials

# Apply database migrations
npx supabase db push

# Start Redis (for email queue)
docker run -d --name pryrox-redis -p 6379:6379 redis:7-alpine

# Start development (server + worker)
npm run dev:all

# Or start server only
npm run dev
```

---

## Recommendation

The platform has a solid foundation in **authentication, subscription billing, inventory management, POS operations, customer management, staff management, and reporting**. Most core features are fully functional. Before production deployment, the following should be addressed:

1. **Delete debug routes** — Remove all 9 test/debug page routes, test API routes, and public HTML files
2. **Add auth to admin APIs** — Protect `/api/admin/pharmacies` and `/api/admin/categories` with session verification
3. **Staff delete cleanup** — Optionally delete auth user when removing staff member
4. **Daily close persistence** — Store daily close records in database for audit trail
5. **Reports Excel export** — Wire the xlsx library to the reports page export button

Estimated effort for the above: **1 week** for a single developer.

---

*Document prepared from source code analysis as of commit `c988d17` on the `ft-payment` branch.*
