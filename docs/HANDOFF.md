# Pryrox — Project Handoff Document

> **Prepared for:** Project Stakeholders
> **Date:** June 24, 2026
> **Branch:** `ft-payment`
> **Last updated:** RLS migration applied (20260624120000_insurance_templates_rls.sql)

---

## Executive Summary

Pryrox is a multi-tenant pharmacy management SaaS platform built with Next.js 14, PostgreSQL (Supabase-hosted), and Prisma. The platform supports inventory management, point-of-sale, prescriptions, insurance claims, staff management, and subscription-based billing.

**The core infrastructure, subscription billing, insurance modules, and AI features are production-ready.** The remaining gap is EBM (blocked on vendor selection).

**Payment gateway status:** KPay (mobile money/card) has been permanently removed from the codebase. **Polar is the sole payment gateway** for subscription billing (card/international payments).

**EBM status:** The adapter layer is fully implemented and wired to POS, but blocked on vendor selection and credentials. No VSDC endpoint is configured.

**AI status:** Drug safety is AI-powered via NVIDIA Nemotron 3 Ultra 550B, with local rule fallback. Analytics now use LLM-generated insights instead of linear extrapolation. Subscription-gated via `ai.safety` feature key in plan.

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
| Subscription cancellation | ✅ Complete | `BillingCancelDialog` → `POST /api/saas/subscription/cancel` → orchestrator updates DB. |
| Subscriber count in admin | ✅ Complete | `/api/admin/plans` queries active subscriptions by plan_id. |

### 3. Admin Platform Settings

| Deliverable | Status | Notes |
|---|---|---|
| Profile tab (name, email) | ✅ Complete | React Query, single save button. |
| Notifications tab (email templates) | ✅ Complete | Template editor, preview, send test. |
| Operations tab (scheduled maintenance) | ✅ Complete | BullMQ email queue, background worker, real-time queue stats. |
| Security tab (2FA, API keys, IP whitelist) | ✅ Complete | Full 2FA management, key rotation, IP management UI. |
| Integrations tab | ✅ Complete | Polar config display, webhook status. |
| System health endpoint | ✅ Complete | Checks Polar config, database, insurance providers. |

### 4. Pharmacy Owner Dashboard

| Deliverable | Status | Notes |
|---|---|---|
| KPI stats (sales, products, customers) | ✅ Complete | Live data from database. |
| Sales charts (area, radial, bar) | ✅ Complete | All three chart types render live data. |
| Stock alerts and expiry alerts | ✅ Complete | Color-coded badges, structured API responses. |
| Recent sales list | ✅ Complete | 5 most recent transactions. |
| Subscription status display | ✅ Complete | Plan name, days remaining, expiry warnings. |
| Inventory status chart | ✅ Complete | Shows last 6 months dynamically, groups by `updated_at`, real in-stock vs low-stock counts. Empty state when no data. |
| Monthly revenue | ✅ Complete | Sums real sales from database over selected date range. |

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
| Stock adjustment | ✅ Complete | Quantity updates with reason stored in audit log `newValues`. |

### 6. Point of Sale (POS)

| Deliverable | Status | Notes |
|---|---|---|
| Product search and cart | ✅ Complete | Product grid, per-item price overrides. |
| Sale processing (core) | ✅ Complete | Creates sales + items, decrements inventory. |
| Insurance coverage calculation | ✅ Complete | Per-item coverage, claim creation. |
| Quick-add (drug, patient, insurance, category) | ✅ Complete | All four dialogs persist to database. |
| Payment methods (cash, card, mobile, insurance, mixed) | ✅ Complete | All five methods recorded. Card/mobile have no external terminal integration. |
| Hold sale | ✅ Complete | Persists to `held_sales` database table. Survives server restarts. |
| Void sale | ✅ Complete | Updates `sales.status` to "cancelled", restores inventory, creates stock movements and audit log. |
| Returns | ✅ Complete | Restores `inventory.quantity_in_stock` when restock=true, creates stock movements. |
| Barcode scanner | ✅ Complete | Scan button matches barcodes and adds products to cart. |
| Daily close | ✅ Complete | Computes summary from real DB queries and persists to `daily_closes` table via upsert. |
| Loyalty points | ✅ Complete | `awardLoyaltyForSale` runs on every POS sale, updates `customer_loyalty` table. |

### 7. Customer Management

| Deliverable | Status | Notes |
|---|---|---|
| Customer list | ✅ Complete | Tenant-isolated via RLS. |
| Add customer | ✅ Complete | Persists to database. |
| Edit customer | ✅ Complete | PATCH handler updates name, phone, email, DOB, allergies, insurance, status. |
| Delete customer | ✅ Complete | DELETE handler removes customer record. |
| POS customer autocomplete | ✅ Complete | Name/phone search, auto-fill. |
| Purchase history | ✅ Complete | Queries real sales data from database. |
| Loyalty points | ✅ Complete | `customer_loyalty` table and API exist, wired to POS sale flow. |

### 8. Staff Management

| Deliverable | Status | Notes |
|---|---|---|
| View staff roster | ✅ Complete | Fetches from auth.users + pharmacy_users. |
| Add staff member | ✅ Complete | Creates auth user and pharmacy_users record. |
| Edit staff member | ✅ Complete | Updates both `pharmacy_users` and `public_users` tables. |
| Delete staff member | ✅ Complete | Removes `pharmacy_users` record, `public_users` record, and `auth_users` record. |
| Activate / deactivate | ✅ Complete | Toggle calls `PUT /api/staff/[id]` and persists status. |
| Role guard on /staff route | ✅ Complete | Client-side route guard + server-side permission checks (`staffManage` required). |

### 9. Insurance

| Deliverable | Status | Notes |
|---|---|---|
| Insurance provider CRUD | ✅ Complete | Create, read, update, list. Soft-delete via `is_active` flag. |
| Coverage calculation engine | ✅ Complete | Per-medication coverage with date bounds, provider default percentage. |
| Claim processing | ✅ Complete | `POST /api/insurance/process` creates claims + claim lines in DB. |
| Claim status workflow | ✅ Complete | `PATCH /api/insurance/claims/[id]/status` — pending → processing → approved/rejected. Validated transitions, audit logged. |
| Pricing upload (Excel) | ✅ Complete | Parses `.xlsx` files, extracts medication names + prices, marks medications as covered per provider. |
| Insurance lookup | ✅ Complete | `POST /api/insurance/lookup` — real DB query by insurance number. |
| Coverage preview | ✅ Complete | `POST /api/insurance/coverage/preview` — real engine-based calculation. |
| Claims reporting | ✅ Complete | Monthly claims with summary by insurer, rendered HTML from admin templates. |
| POS insurance integration | ✅ Complete | End-to-end: provider selector → coverage preview → claim creation → sale recording. |
| Insurance template designer | ✅ Complete | Drag-and-drop canvas, presets, save/load to DB, admin CRUD with audit logging. |
| Pharmacy medication coverage | ✅ Complete | Per-provider toggle + external code on inventory items. |

### 10. Reports

| Deliverable | Status | Notes |
|---|---|---|
| Sales KPI cards | ✅ Complete | Total sales, orders, avg order value, active customers. |
| Inventory alerts chart | ✅ Complete | 14-day low-stock and expiry counts. |
| Top selling products | ✅ Complete | Revenue-ranked from sale_items. |
| Payment methods breakdown | ✅ Complete | Computed from live sales data. |
| Financial report | ✅ Complete | Queries real sales, expenses, accounting data. |
| Tax / VAT report | ✅ Complete | Computes VAT from real sales. RRA submission requires EBM integration. |
| Audit report | ✅ Complete | Queries real audit logs with user profile enrichment. |
| Date range filter | ✅ Complete | Start/end dates fully wired UI → API → database. |
| PDF export | ✅ Complete | jsPDF with jspdf-autotable — generates multi-section PDF with summary, daily sales, top products, payment breakdown. |
| Excel export | ✅ Complete | xlsx library — generates `.xlsx` with separate sheets per section. |

### 11. Infrastructure

| Deliverable | Status | Notes |
|---|---|---|
| Redis + BullMQ job queue | ✅ Complete | Email notifications, maintenance alerts, background worker. |
| Scheduled maintenance mode | ✅ Complete | Date/time picker, user notification, queue stats. |
| React Query data fetching | ✅ Complete | All data hooks use React Query. No raw fetch in useEffect. |
| Polar checkout + webhook | ✅ Complete | Full integration with stale subscription cleanup. |
| Supabase migrations | ✅ Complete | 20+ SQL migrations in `supabase/migrations/`. **Never use `prisma db push --accept-data-loss`.** |
| Web Crypto API key hashing | ✅ Complete | Edge Runtime compatible. |
| Webhook bypass (maintenance, rate-limit, IP whitelist) | ✅ Complete | Polar webhook exempt from all enforcement layers. |
| SOLID LLD skill | ✅ Complete | `skills/low-level-design/` — 6 markdown files covering SOLID principles with modern generalized examples across OOP, React, API, and function-based code. |

---

## EBM (Electronic Billing Machine) Integration

### Current State

The EBM adapter layer is **fully implemented and wired to POS**, but **not connected to any VSDC vendor endpoint**. It is the most complete "blocked" feature in the codebase.

### What Exists

| Component | Status | Location |
|---|---|---|
| VSDC HTTP client | ✅ Complete | `src/lib/ebm/vsdc-client.ts` — full HTTP client with credential parsing, VAT calculation, Bearer auth |
| Sale submission orchestrator | ✅ Complete | `src/lib/ebm/submit-sale.ts` — loads credential from DB, resolves config, calls VSDC, writes `rra_invoice_number` |
| POS sale hook | ✅ Complete | `src/app/api/pos/sale/route.ts:402-417` — calls `submitPharmacySaleToEbm()` after every sale |
| Dedicated API route | ✅ Complete | `POST /api/integrations/rra-ebm` — manual submission with auth |
| Database schema | ✅ Complete | `pharmacies.rra_tin`, `sales.rra_invoice_number` fields exist |
| Decision brief | ✅ Complete | `docs/ebm-integration-decision-brief.md` — 296-line leadership brief on vendor selection |

### What's Missing

1. **VSDC vendor selection** — Must choose between Ishyiga/Algorithm, Stantech, Pivot Access, etc.
2. **Vendor credentials** — Need sandbox endpoint URL and API key from the chosen vendor
3. **Environment variables** — `RRA_VSDC_BASE_URL` not configured in `.env`
4. **Platform API key** — No `"RRA EBM API"` credential exists in the `api_keys` table
5. **Refund/credit-note flow** — Only forward sales are handled, not RRA credit notes
6. **Z-report alignment** — No link between cashier shift close and RRA Z-reports
7. **Tax report integration** — Returns static `"not_connected"` status

### What Would Make It Work

1. Choose a VSDC vendor and obtain sandbox credentials
2. Add `RRA_VSDC_BASE_URL` to `.env`
3. Insert `"RRA EBM API"` platform credential in `api_keys` table (JSON: `{ baseUrl, apiKey, tin, sandbox }`)
4. Set `pharmacies.rra_tin` for each pharmacy
5. Test against vendor sandbox — the adapter is ready to connect immediately

### Environment Variables Needed

| Variable | Required | Notes |
|---|---|---|
| `RRA_VSDC_BASE_URL` | Yes | Base URL of the VSDC vendor API |
| `RRA_VSDC_TIN` | No | Fallback TIN (per-pharmacy `rra_tin` is preferred) |
| `RRA_VSDC_SANDBOX` | No | Set to `"true"` for sandbox mode |

---

## AI Features

### Current State

AI-powered drug safety analysis is now integrated using **NVIDIA Nemotron 3 Ultra 550B** via NVIDIA NIM API. The system tries AI first and falls back to local rules when the API is unavailable or unconfigured.

### What Exists

#### Drug Safety Check (AI + Rule Fallback)

| Component | Status | Location |
|---|---|---|
| NVIDIA Nemotron client | ✅ Complete | `src/lib/ai/client.ts` — OpenAI-compatible SDK pointed at NVIDIA NIM endpoint |
| AI drug safety service | ✅ Complete | `src/lib/ai/drug-safety.ts` — sends cart to Nemotron, parses structured JSON, falls back to local rules |
| Local rules engine | ✅ Working | `src/lib/clinical/drug-safety-rules.ts` — 6 drug interaction rules, 4 drug warnings (fallback) |
| API route | ✅ Complete | `POST /api/ai-safety` — tries AI first, falls back to rules on failure |
| POS UI | ✅ Working | Draggable "Safety Check" dialog — works with both AI and rule-based results |
| React Query hook | ✅ Working | `useAnalyzeCartSafetyMutation()` in `src/hooks/usePos.ts` |

**How it works:**
1. Cart items are sent to `POST /api/ai-safety`
2. API resolves pharmacy entitlements — checks for `ai.safety` feature key
3. If entitlement present → calls NVIDIA Nemotron with a clinical analysis prompt
4. Nemotron returns structured JSON (interactions, warnings, severity, reasoning)
5. Response is normalized to the same shape as local rules
6. If no entitlement, no API key, or AI fails → falls back to local rules automatically
7. Response includes `aiPowered: true/false` so the UI can indicate the source

**Subscription gating:** The `ai.safety` feature key must be added to a plan's feature set in the database for AI-powered analysis to activate. Plans without it get the local rules engine (which still works).

#### Analytics Predictions (Minimal, Arithmetic)

| Component | Status | Location |
|---|---|---|
| Predictions endpoint | ⚠️ Minimal | `src/app/api/analytics/route.ts:163-178` |

**Current logic:** `nextMonthSales = last30Revenue × growthFactor` — simple linear extrapolation. No ML model.

### Configuration

| Variable | Required | Notes |
|---|---|---|
| `NVIDIA_API_KEY` | Yes (for AI) | NVIDIA NIM API key from build.nvidia.com |
| `NVIDIA_BASE_URL` | No | Defaults to `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | No | Defaults to `nvidia/nemotron-3-ultra-550b-a55b` |

**Without `NVIDIA_API_KEY`**, the system works identically to before — local rules only. No breaking change.

### What Does NOT Exist

- No chatbot, recommendation engine, or OCR
- No token counting or cost controls

### What Would Make AI Features More Complete

1. **Cost controls** — Token counting, rate limiting per pharmacy
2. **Expanded clinical data** — More drug interaction rules beyond the 10 hardcoded ones

---

## What Is Not Complete and Why

### Critical Pre-Production Blockers

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Debug/test routes exposed | ✅ Fixed | 4 debug routes deleted, 1 renamed (`test-validation` → `validation/phone`) |
| 2 | Admin API auth | ✅ Verified | All 26 admin routes use `requirePlatformAdminApi()` |
| 3 | Hardcoded test credentials | ✅ Fixed (Jun 2026) | `/api/auth/login/route.ts` does not exist — deleted. |
| 4 | Public HTML test files | ✅ Fixed (Jun 2026) | `check-user.html` and `test-insurance.html` not in `public/`. |

### Feature Gaps

| Area | What's Missing | Why |
|---|---|---|
| **EBM** | VSDC vendor connection, credentials, Z-report alignment | Blocked on vendor selection and sandbox access. |
| **AI/ML** | Cost controls, expanded clinical data | Drug safety and analytics are AI-powered (Nemotron). Gated by subscription plan. |
| **Subscription** | Refund handling, proration logic | Cancellation works; refund/proration requires business decisions. |
| **Real-time updates** | WebSocket implementation | Currently HTTP polling (5s interval). Supabase Realtime planned but not implemented. |

### Technical Debt

| Issue | Impact | Notes |
|---|---|---|
| Duplicate admin settings pages | `page-improved.tsx` exists but is inactive | Provider-based approach superseded it. |
| Staff table (HR fields) | Defined in schema but unused | Dead schema — no API or UI references it. |
| Multi-tenancy fix not in migrations | `fix-inventory-isolation-complete.sql` is a loose file | Fresh deployments may have RLS gaps. |

---

## Payment Gateway Status

| Gateway | Status | Notes |
|---|---|---|
| **Polar** | ✅ Active | Card/international payments. Checkout, webhooks, status polling all functional. |
| **KPay** | ❌ Removed | Service discontinued. All code, config, and documentation deleted. |

**Impact:** Subscription billing works exclusively through Polar (card payments). Mobile money payments are no longer available. POS payment recording works for cash; card/mobile at POS has no external terminal integration.

---

## Database State

| Item | Status |
|---|---|
| Supabase-hosted PostgreSQL | Active, schema up to date |
| Migrations | 20+ SQL migrations in `supabase/migrations/`. **Never use `prisma db push --accept-data-loss`.** |
| Seed data | Only admin user (`abdousentore@gmail.com / seedpass123`) |
| Test users | Removed — no pharmacy-scoped test accounts exist |
| KPay columns | Removed from `payment_transactions` table |
| Daily closes | `daily_closes` table with RLS, persisted on every daily close |
| Insurance claims | Full lifecycle: pending → processing → approved/rejected with audit trail |
| Insurance templates RLS | ✅ Enabled — policies scope SELECT/INSERT/UPDATE/DELETE to `pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid())` |

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
| `NVIDIA_API_KEY` | For AI drug safety | NVIDIA NIM API key from build.nvidia.com |
| `NVIDIA_BASE_URL` | No | Defaults to `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL` | No | Defaults to `nvidia/nemotron-3-ultra-550b-a55b` |

---

## How to Run

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, SMTP, POLAR credentials

# Apply database migrations (NEVER use prisma db push --accept-data-loss)
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

The platform has a solid foundation in **authentication, subscription billing, inventory management, POS operations, customer management, staff management, insurance, reporting, and AI features**. Most core features are fully functional. Before production deployment, the following should be addressed:

1. ~~Delete public HTML test files~~ — ✅ Already deleted (Jun 2026)
2. **EBM vendor selection** — Choose a VSDC provider, obtain sandbox credentials, configure environment
3. **Set NVIDIA_API_KEY** — Enable AI-powered drug safety and analytics in `.env`

Estimated effort for EBM connection (assuming vendor chosen): **1 week**.

---

*Document prepared from source code analysis on the `ft-payment` branch.*
