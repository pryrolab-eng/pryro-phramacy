# Pryrox — Feature Status

> **Assessment method:** Static analysis of source files under `src/`, cross-referenced with module documentation in `docs/modules/` and ad-hoc test reports in the project root.
> **Last updated:** 2025
> **Legend:** ✅ Working · ⚠️ Partial · ❌ Broken/Incomplete · 🔒 Remove Before Production · ❌ Security Issue

---

## Table of Contents

1. [Core Application Features](#1-core-application-features)
2. [Duplicate and Conflicting Implementations](#2-duplicate-and-conflicting-implementations)
3. [Debug and Test Routes](#3-debug-and-test-routes)
4. [Security Issues](#4-security-issues)

---

## 1. Core Application Features

The table below covers all 17 feature areas required by Requirement 3.2. Each entry is assessed based on static analysis of the source files and evidence from test/result markdown files in the project root.

### 1.1 Authentication

| Sub-feature | Status | Notes |
|---|---|---|
| Sign-in (email + password) | ✅ Working | signInAction calls supabase.auth.signInWithPassword, sets a session cookie, and redirects to /dashboard. Role resolution and 2FA branching work correctly. |
| Sign-up (self-registration) | ❌ Broken/Incomplete | signUpAction is imported by sign-up/page.tsx but is **not exported** from src/app/actions.ts. The form submits but nothing happens. Users cannot self-register. |
| Two-Factor Authentication (2FA) | ✅ Working | Full TOTP flow implemented: setup (/api/settings/security/2fa/setup), QR code generation, verification (/api/settings/security/2fa/verify), backup codes, and login verification (/api/auth/verify-2fa + /api/auth/complete-2fa). The magic-link session restoration is functional but fragile (see auth module docs). |
| Password Reset | ❌ Broken/Incomplete | forgotPasswordAction is imported by forgot-password/page.tsx but is **not exported** from src/app/actions.ts. The form submits but nothing happens. Password reset is non-functional. |
| Session management / middleware | ✅ Working | supabase/middleware.ts refreshes sessions on every request and enforces protected-path redirects correctly. |
| Rate limiting on auth endpoints | ❌ Broken/Incomplete | No rate limiting on the custom 2FA verification endpoints (/api/auth/verify-2fa, /api/auth/complete-2fa). Supabase's built-in rate limiting covers signInWithPassword only. |
| @test.com auto-provisioning | ❌ Broken/Incomplete | signInAction contains hardcoded logic that auto-creates users and pharmacy_users records for any @test.com email. This test scaffolding is present in production code and must be removed. |

**Module docs:** [docs/modules/authentication.md](modules/authentication.md)

### 1.2 Superadmin Dashboard

| Sub-feature | Status | Notes |
|---|---|---|
| Platform stats (pharmacies, revenue, users) | ⚠️ Partial | Stats are fetched from live database tables (pharmacies, pharmacy_users, sales). However, monthlyGrowth is hardcoded to 15.2% and is never computed from real data. |
| Pharmacy list | ✅ Working | Fetches all pharmacies from GET /api/superadmin/pharmacies. Displays name, location, status, and plan. Owner name is resolved from owner_name column (not joined from auth.users). |
| Add Pharmacy | ⚠️ Partial | Creates a pharmacies record. However, POST /api/superadmin/pharmacies does **not** create a Supabase Auth user for the owner — the owner_password field is collected by the form but not forwarded to the API. The pharmacy record is created but the owner cannot log in. |
| Insurance provider management | ✅ Working | Lists providers from GET /api/insurance. Add Insurance dialog calls POST /api/insurance and persists to the database. |
| Role-based page guard | ⚠️ Partial | The /superadmin path is protected by middleware (session required). However, there is no hard redirect for non-superadmin authenticated users who navigate directly to /superadmin — they see the page with the wrong sidebar. |
| Realtime updates | ⚠️ Partial | Uses HTTP polling (5-second interval) via useRealtimeUpdates, not true Supabase Realtime WebSockets. The RealtimeStatus badge shows "Live" but reflects polling connectivity, not a WebSocket connection. |

**Module docs:** [docs/modules/superadmin-dashboard.md](modules/superadmin-dashboard.md)

### 1.3 Admin Dashboard

| Sub-feature | Status | Notes |
|---|---|---|
| Overview stats and analytics chart | ⚠️ Partial | Stats are fetched from live data. Revenue figures are **estimates** (sum of plan prices, not actual collected payments). The SVG analytics chart uses a formula-based projection, not historical transaction data. |
| Pharmacy management (CRUD) | ⚠️ Partial | Full CRUD works. However, DELETE /api/admin/pharmacies/[id] does not delete the associated Supabase Auth user. The pharmacy API routes use the service role key with **no authentication or authorization checks** — any caller can read, create, or delete pharmacy records. |
| Subscription plan management | ⚠️ Partial | Create and edit plans work. Subscriber counts always display 0 (hardcoded TODO). |
| Global category management | ✅ Working | Full CRUD for global categories via /api/admin/categories. |
| Insurance template designer | ⚠️ Partial | The drag-and-drop canvas editor renders and allows template design. The **Save Template button does not persist to the database** — it only updates local React state. Templates are lost on page navigation. |
| Business reports | ⚠️ Partial | Revenue and pharmacy stats are fetched from live data. Report download buttons (Generate buttons) are not wired to any export logic. |
| Platform settings | ⚠️ Partial | Settings are read from and written to system_settings via PUT /api/admin/system-settings. The active page.tsx uses lert() for feedback and contains placeholder "Custom Settings" fields (customSetting, eatureFlag) that pollute the settings table. The improved version (page-improved.tsx) is not active. |
| Stock location management | ✅ Working | Stock locations can be listed and created via /api/settings/locations. Falls back to hardcoded defaults if the stock_locations table is missing. |

**Module docs:** [docs/modules/admin-dashboard.md](modules/admin-dashboard.md)

### 1.4 Pharmacy Owner Dashboard

| Sub-feature | Status | Notes |
|---|---|---|
| KPI stats (today's sales, products, customers, low stock, expiring) | ⚠️ Partial | Today's sales, product count, and customer count are fetched from live data. ctiveStaff is hardcoded to 8 and pendingOrders to 0. Monthly revenue is estimated as 	odayTotal * 30 (not a real monthly sum). |
| Sales charts (area, radial, bar) | ✅ Working | All three chart components fetch from dedicated API routes and render live data. |
| Inventory status chart | ❌ Broken/Incomplete | /api/pharmacy/inventory-chart uses the string literal 'userPharmacy.pharmacy_id' instead of the authenticated user's actual pharmacy ID. The chart returns data for all pharmacies or no data, depending on RLS. |
| Stock alerts and expiry alerts | ✅ Working | /api/stock-alerts correctly queries the inventory table and returns lowStock and expiring arrays scoped to the pharmacy. |
| Recent sales list | ✅ Working | Fetched from /api/pos (GET). Displays the 5 most recent transactions. |
| Add Pharmacist quick action | ⚠️ Partial | Creates a Supabase Auth user and pharmacy_users record. Credentials are displayed in a plaintext lert() dialog — no email delivery. Role is hardcoded to pharmacist regardless of the form selection. |
| Subscription status display | ✅ Working | Sidebar shows plan name, days remaining, and expiry warnings. SubscriptionBlocker correctly intercepts expired subscriptions. |
| Realtime updates | ⚠️ Partial | HTTP polling (5-second interval), not WebSocket. See Realtime Updates section. |

**Module docs:** [docs/modules/pharmacy-owner-dashboard.md](modules/pharmacy-owner-dashboard.md)

### 1.5 Pharmacist Dashboard

| Sub-feature | Status | Notes |
|---|---|---|
| KPI cards (prescriptions today, customers served, avg wait time, completed tasks) | ⚠️ Partial | Prescriptions today and customers served are fetched from live data. verageWaitTime requires the prescription_processing table which has **no migration file** — it will always fall back to 8 min. consultationsGiven is estimated as completedSales * 0.4. |
| Prescription queue (pending prescriptions) | ⚠️ Partial | Fetches pending prescriptions from GET /api/pharmacist/prescriptions. Start and Dispense actions require the prescription_processing table (missing migration) — these actions will fail with a 500 error in production. |
| Stock alerts and expiry alerts | ✅ Working | Correctly fetches from /api/stock-alerts. Low-stock and expiring items are displayed with progress bars and badges. |
| Analytics charts | ⚠️ Partial | The "Daily Activity Trend" line chart fetches real hourly data from /api/pharmacist/chart-data. The "Performance Metrics" bar chart uses **hardcoded** weekly data — not fetched from the database. |
| Recent activities feed | ⚠️ Partial | Only sale type activities are returned. prescription_start, inventory_check, and lert_action types require missing tables (prescription_processing, inventory_checks, lert_actions). |
| Quick actions (Open POS, Add Drug, New Prescription, Check Inventory) | ✅ Working | Navigation shortcuts work. "Check Inventory" calls 	rack-activity which will silently fail if inventory_checks table is missing. |
| Realtime updates | ⚠️ Partial | HTTP polling (5-second interval), not WebSocket. |

**Module docs:** [docs/modules/pharmacist-dashboard.md](modules/pharmacist-dashboard.md)

### 1.6 Inventory Management

| Sub-feature | Status | Notes |
|---|---|---|
| View inventory list (search, filter, sort) | ✅ Working | Fetches from /api/inventory with medications join. Client-side search and category filter work. |
| Add drug / product | ✅ Working | POST /api/inventory/add looks up or creates a medications record and inserts an inventory record. Validation is client-side only. |
| Edit drug | ⚠️ Partial | Only quantity_in_stock, selling_price, and minimum_stock_level can be edited. Name, category, batch number, and expiry date cannot be changed after creation. |
| Delete drug | ✅ Working | Hard-deletes the inventory record. The associated medications record is preserved. |
| Stock adjustment | ⚠️ Partial | Quantity is updated correctly. The adjustment reason is **not stored** — no stock_movements record is created for manual adjustments. |
| Purchase / restock | ⚠️ Partial | Quantity is added to stock. The supplier field is accepted but **not linked** to the suppliers table. No purchase order record is created. |
| Stock transfer | ❌ Broken/Incomplete | The transfer form sends free-text location names, but inventory_transfers.from_branch_id and 	o_branch_id are typed as uuid FK references to ranches. Passing non-UUID strings causes a PostgreSQL type error. Transfers are effectively broken. |
| Low-stock alerts | ✅ Working | Color-coded badges in the inventory table. /api/stock-alerts returns structured lowStock and expiring arrays. |
| Expiry alerts (UI badges) | ✅ Working | Color-coded expiry badges in the inventory table based on expiry_date. |
| Expiry alerts (API endpoint) | ❌ Broken/Incomplete | GET /api/inventory/expiry-alerts returns **hardcoded** static data (3 items with fixed January 2024 dates). Not connected to the database. |
| Barcode generation and printing | ✅ Working | JsBarcode renders CODE128 barcodes on canvas. Single and bulk print via window.print() work. |
| Excel export | ✅ Working | xlsx library generates a correctly formatted .xlsx file from the current inventory array. |
| Excel import | ⚠️ Partial | Import reads the file and calls POST /api/inventory/add per row. Sequential with no rollback — failed rows are silently skipped. No partial-import report. |
| Analytics charts | ⚠️ Partial | "Stock by Category" bar chart uses live data from /api/inventory/analytics. "Inventory Trend" area chart is **synthetic** — generated by scaling current total value across months, not from historical data. |
| Pagination | ❌ Broken/Incomplete | The Pagination component is rendered but not wired to any state. All items are displayed simultaneously regardless of page number. |
| Stock location assignment | ❌ Broken/Incomplete | The stock location field in the Add Product dialog is stored in UI state only. The inventory table has no stock_location_id column — the selected location is never persisted. |
| Multi-tenancy isolation | ⚠️ Partial | API routes correctly scope by pharmacy_id. However, a critical multi-tenancy fix (ix-inventory-isolation-complete.sql) is a root-level loose file, not in supabase/migrations/. A fresh deployment may have RLS gaps. |

**Module docs:** [docs/modules/inventory.md](modules/inventory.md)

### 1.7 Point of Sale (POS)

| Sub-feature | Status | Notes |
|---|---|---|
| Product search and cart management | ✅ Working | Product grid fetches from /api/pos/products. Cart is managed in React state. Per-item price overrides work. |
| Customer lookup and autocomplete | ⚠️ Partial | GET /api/customers?q= correctly searches the database. However, GET /api/pos/customer-lookup (the "Lookup" button) is a **hardcoded stub** returning 2 fictional customers. |
| Payment methods (cash, card, mobile money, insurance, mixed) | ⚠️ Partial | All five payment methods are recorded in the database. Card and mobile money have **no external terminal or API integration** — the method is recorded but no payment is processed externally. |
| Insurance coverage calculation | ✅ Working | Coverage is calculated per item using provider coverage_percentage. Insurance claims are created with status = 'pending' on sale completion. |
| Sale processing (core) | ✅ Working | POST /api/pos/sale creates sales and sale_items records and decrements inventory.quantity_in_stock. Receipt number is generated as RCP-<timestamp>. |
| Receipt printing | ⚠️ Partial | Receipt is generated via window.open + window.print(). Cashier name is **hardcoded** to 'muzungu' — not read from the authenticated user's profile. |
| Quick-add (drug, patient, insurance, category) | ✅ Working | All four quick-add dialogs call their respective API routes and persist to the database. |
| Fast-moving products tab | ❌ Broken/Incomplete | GET /api/pos/products?fastMoving=true returns the same result as the standard product list. The astMoving query parameter is not handled in the route handler. |
| Hold sale | ❌ Broken/Incomplete | POST /api/pos/hold-sale stores the cart in a static in-memory response object. No database persistence — held sales are lost on server restart. |
| Void sale | ❌ Broken/Incomplete | POST /api/pos/void-sale returns a voided-sale object without updating sales.status in the database or restoring inventory quantities. |
| Returns | ❌ Broken/Incomplete | POST /api/pos/returns creates a 
eturns record but does not restore inventory.quantity_in_stock. Also has a hardcoded pharmacy_id bug ('userPharmacy.pharmacy_id'). |
| Discounts | ❌ Broken/Incomplete | POST /api/pos/discounts has a hardcoded pharmacy_id bug ('userPharmacy.pharmacy_id'). Discount records will have an invalid pharmacy_id. |
| Daily close | ❌ Broken/Incomplete | POST /api/pos/daily-close returns a formatted summary object without writing to any database table. |
| Price check | ❌ Broken/Incomplete | GET /api/pos/price-check returns a **hardcoded** 2-product array. Not connected to the database. |
| AI Safety check | ❌ Broken/Incomplete | The AI Safety button is visible in the UI but etchAiSafety() is not implemented. The button does nothing. |
| Barcode scanner integration | ❌ Broken/Incomplete | The Scan button is rendered but has no onClick handler. No Web Serial API or USB HID integration. |
| Loyalty points | ❌ Broken/Incomplete | The customers table has no loyalty_points column. No loyalty accumulation or redemption logic exists in the POS sale flow. |
| stock_movements audit trail | ❌ Broken/Incomplete | POST /api/pos/sale decrements inventory.quantity_in_stock directly but does **not** insert into stock_movements. The audit trail for POS sales is incomplete. |

**Module docs:** [docs/modules/pos.md](modules/pos.md)

### 1.8 Sales History

| Sub-feature | Status | Notes |
|---|---|---|
| Sales list (20 most recent) | ✅ Working | GET /api/sales returns the 20 most recent sales for the pharmacy with correct tenant isolation. |
| Search and period filter | ⚠️ Partial | Filtering is client-side on the 20-record window. Selecting "This Month" only shows matching records from the most recent 20, not all sales in the month. |
| KPI summary cards | ⚠️ Partial | Today, week, and month totals are fetched from live data. Percentage-change labels (+15% from yesterday, etc.) are **hardcoded strings** — not computed from real data. |
| Item count per sale | ❌ Broken/Incomplete | GET /api/sales maps items: 2 for every sale (hardcoded). The actual item count requires a join to sale_items which is not performed. The Transactions table always shows "2 items". |
| Analytics charts (weekly, hourly, payment methods, categories) | ✅ Working | GET /api/sales/analytics computes all six datasets from live database queries. |
| Analytics — top categories join | ⚠️ Partial | The nested join (sale_items → sales → inventory → medications) may not work correctly with Supabase's PostgREST syntax, likely returning empty 	opCategories data and falling back to hardcoded sample data. |
| Export (CSV/PDF) | ❌ Broken/Incomplete | The Export button is rendered but has **no onClick handler**. CSV and PDF export are not implemented. |
| Receipt reprint | ❌ Broken/Incomplete | There is no mechanism to reprint a historical receipt from the Sales page. Receipt printing only occurs at the moment of sale in the POS module. |
| POST /api/sales stock deduction | ❌ Broken/Incomplete | POST /api/sales attempts to decrement inventory using supabase.raw() — a method that does not exist in supabase-js. Stock deduction via this route fails silently. Stock is only correctly decremented by the database-level handle_sale_stock_update_trigger. |
| Pharmacist access | ⚠️ Partial | The /sales route is accessible to pharmacists (RLS permits it), but the PharmacistSidebar does not include a link to /sales. Pharmacists must navigate directly. |

**Module docs:** [docs/modules/sales.md](modules/sales.md)

### 1.9 Customer Management

| Sub-feature | Status | Notes |
|---|---|---|
| Customer list | ✅ Working | GET /api/customers returns all customers for the pharmacy with correct tenant isolation via RLS. |
| Add customer | ✅ Working | POST /api/customers creates a new customer record. |
| Edit / delete customer | ❌ Broken/Incomplete | No PUT, PATCH, or DELETE handlers are implemented for /api/customers. There is no UI to edit or deactivate an existing customer record. |
| POS customer autocomplete | ✅ Working | GET /api/customers?q= searches by name and phone (case-insensitive ilike), returns up to 5 results, and auto-fills POS fields. |
| Purchase history | ❌ Broken/Incomplete | GET /api/customers/history is a **hardcoded stub** returning static data for 2 fictional customer IDs. Real purchase history is not accessible. |
| Loyalty points | ⚠️ Partial | The customer_loyalty table and /api/customers/loyalty API exist and read/write the database correctly. However, the loyalty UI is **not wired** into the customers page, and loyalty points are **not auto-awarded** when a sale is completed in the POS. |
| 	otalPurchases and lastVisit | ❌ Broken/Incomplete | GET /api/customers maps 	otalPurchases: 0 for every customer (not aggregated from sales). lastVisit is set to created_at (record creation date), not the date of the most recent sale. |
| "New This Month" stat | ❌ Broken/Incomplete | Calculated as Math.floor(totalCustomers * 0.1) — a rough 10% estimate, not a real database query. |
| Duplicate schema | ⚠️ Partial | The customers table is defined in two migration files with different schemas. The API reads insurance_number (full schema), but the simplified schema stores insurance (different column name). This mismatch may cause silent empty values. |

**Module docs:** [docs/modules/customers.md](modules/customers.md)

### 1.10 Patient & Prescription Management

| Sub-feature | Status | Notes |
|---|---|---|
| Patient list (/patients) | ⚠️ Partial | Reads from the customers table (no separate patients table). Displays name, phone, email, status, and last-visit date. The "Add Patient" button has **no onClick handler** — it is non-functional. |
| Prescription list | ✅ Working | GET /api/prescriptions returns all prescriptions for the pharmacy. Search and status filter work client-side. |
| Create prescription | ❌ Broken/Incomplete | POST /api/prescriptions has a critical bug: pharmacy_id falls back to the string literal 'userPharmacy.pharmacy_id' instead of the authenticated user's actual pharmacy ID. New prescriptions will fail with a foreign key constraint violation. |
| Status workflow (pending → completed → dispensed) | ✅ Working | PUT /api/prescriptions/[id] correctly updates the status. The UI provides "Process" and "Dispense" buttons. |
| Delete prescription | ✅ Working | DELETE /api/prescriptions/[id] hard-deletes the record. |
| Pharmacist dispense workflow | ❌ Broken/Incomplete | POST /api/pharmacist/prescriptions with ction: 'start' or 'dispense' requires the prescription_processing table, which has **no migration file**. These actions will fail with a 500 error. |
| Prescription analytics | ❌ Broken/Incomplete | The "Prescription Trends" bar chart uses **hardcoded** daily values. Quick Stats (85% completion rate, 12 min avg processing time) are hardcoded. Not computed from real data. |
| RLS on prescriptions table | ❌ Broken/Incomplete | No RLS policies are defined for the prescriptions table. GET /api/prescriptions fetches all prescriptions across all pharmacies without a pharmacy_id filter. Any authenticated user can read all prescriptions. |
| cancelled status | ❌ Broken/Incomplete | The prescription_status enum includes cancelled, but no UI action or API call sets this status. Prescriptions can only progress forward or be deleted. |

**Module docs:** [docs/modules/patients-prescriptions.md](modules/patients-prescriptions.md)

### 1.11 Insurance Management

| Sub-feature | Status | Notes |
|---|---|---|
| Insurance provider list | ✅ Working | GET /api/insurance returns global and pharmacy-specific providers. Unauthenticated callers receive global providers only. |
| Create insurance provider | ✅ Working | POST /api/insurance creates global providers (superadmin) or pharmacy-scoped providers (pharmacy owner). Role check is enforced. |
| Update / delete insurance provider | ❌ Broken/Incomplete | No PUT/PATCH or DELETE endpoints exist for insurance providers. Editing or deactivating a provider requires direct database access. |
| Insurance template designer (canvas) | ⚠️ Partial | The drag-and-drop canvas renders and allows template design with pre-built presets. The **Save Template button does not persist to the database** — it only updates local React state. |
| Insurance lookup | ❌ Broken/Incomplete | POST /api/insurance/lookup is a **hardcoded stub** with 3 entries. Not connected to the database. |
| Insurance pricing | ❌ Broken/Incomplete | GET /api/insurance/pricing returns **hardcoded** in-memory prices that reset on server restart. Not connected to the database. |
| Insurance claim processing | ❌ Broken/Incomplete | POST /api/insurance/process generates a mock claim with a random approval code. No database writes. |
| Insurance claims reporting | ❌ Broken/Incomplete | GET /api/reports/insurance-claims returns **hardcoded** sample claims. Not connected to the database. |
| RLS stability | ⚠️ Partial | The insurance_providers table went through 6 rounds of RLS rewrites. The current state (migration 20241202000000_fix_insurance_rls.sql) is stable, but the superadmin check is hardcoded to a specific email address (abdousentore@gmail.com). |
| insurance_templates RLS | ❌ Broken/Incomplete | The insurance_templates table has no RLS policies. Any authenticated user with direct database access can read or write all template records across all pharmacies. |
| insurance_claims migration | ❌ Broken/Incomplete | The insurance_claims table is referenced in TypeScript types but has **no official migration file**. It was likely created via the Supabase dashboard. |

**Module docs:** [docs/modules/insurance.md](modules/insurance.md)

### 1.12 Staff Management

| Sub-feature | Status | Notes |
|---|---|---|
| View staff roster | ⚠️ Partial | GET /api/staff returns active staff enriched with names/emails from auth.users. Falls back to 2 hardcoded test accounts on API failure — masking real errors. |
| Add staff member | ⚠️ Partial | POST /api/pharmacist creates a Supabase Auth user and pharmacy_users record. Role is **hardcoded to pharmacist** regardless of the form selection — cannot create cashier or staff roles through the UI. Credentials are displayed in a plaintext lert(). |
| Edit staff member | ⚠️ Partial | PUT /api/staff/:id updates the role in pharmacy_users. However, the users table update silently fails due to an ID mismatch bug (uses pharmacy_users.id where auth.users.id is expected). |
| Activate / deactivate staff | ❌ Broken/Incomplete | 	oggleStaffStatus updates React state only — it does **not** call any API or modify pharmacy_users.is_active in the database. The status change is lost on page refresh. |
| Delete staff member | ⚠️ Partial | DELETE /api/staff/:id removes the pharmacy_users record. The Supabase Auth user is **not deleted** and remains active. The route has **no authentication check** — any request with a known pharmacy_users.id can delete that record. |
| Role guard on /staff route | ❌ Broken/Incomplete | Any authenticated user (including pharmacist, cashier, staff) can navigate to /staff and perform all management actions. No server-side role enforcement. |
| staff table | ❌ Broken/Incomplete | The staff table (with richer HR fields: employee ID, department, salary, hire date) exists in the schema but is **not used** by any API route or UI component. Dead schema. |

**Module docs:** [docs/modules/staff-management.md](modules/staff-management.md)

### 1.13 Subscription & Billing (KPay)

| Sub-feature | Status | Notes |
|---|---|---|
| Subscription plan display | ✅ Working | Current plan, days remaining, and expiry countdown are fetched from GET /api/subscriptions/status and displayed in the sidebar and settings page. |
| Plan selection and upgrade UI | ✅ Working | Plan comparison grid renders correctly. Upgrade dialog collects phone/email and payment method. |
| KPay Mobile Money payment | ⚠️ Partial | The integration is code-complete: POST /api/kpay/initiate calls the KPay API, creates payment_transactions records, and logs to payment_logs. However, all test reports confirm KPay returns 
etcode: 600 (invalid credentials) with the current environment. **Live payments have not been verified.** |
| KPay card payment | ⚠️ Partial | Same as Mobile Money — code-complete but not verified with live credentials. |
| KPay webhook | ⚠️ Partial | POST /api/kpay/webhook processes callbacks and activates subscriptions. However, there is **no webhook signature verification** — a malicious actor who knows a valid 
efid could forge a webhook and activate a subscription without payment. |
| Subscription expiry enforcement | ✅ Working | SubscriptionBlocker correctly intercepts expired subscriptions and redirects to /settings. The layout's direct timestamp comparison works even if the check_expired_subscriptions() cron job is not running. |
| check_expired_subscriptions() cron | ❌ Broken/Incomplete | The database function is defined but **never called automatically**. No cron job or Supabase Edge Function scheduler invokes it. The pharmacies.status column will not be updated to suspended on expiry without manual intervention. |
| Subscriber counts in admin | ❌ Broken/Incomplete | The admin subscriptions page always shows 0 active subscribers for every plan (hardcoded TODO). |
| Free plan activation | ⚠️ Partial | Free plan activation is handled inconsistently across three different code paths (/api/subscriptions/status, /api/subscriptions/upgrade, /api/payments). The legacy /api/payments path does not create a subscriptions row for free plans. |
| Refund / cancellation | ❌ Broken/Incomplete | No API route or UI for processing refunds, cancelling a subscription mid-period, or handling chargebacks. |

**Module docs:** [docs/modules/subscription-billing.md](modules/subscription-billing.md)

### 1.14 Settings (Branding, API Keys, Security, Stock Locations)

| Sub-feature | Status | Notes |
|---|---|---|
| Pharmacy profile (name, phone, email, location) | ✅ Working | GET/PUT /api/pharmacy/settings reads and writes the pharmacies table correctly. |
| Currency and language settings | ❌ Broken/Incomplete | Currency and language fields are present in the UI but the PUT /api/pharmacy/settings handler does not include them in the database update. Changes are lost on page reload. |
| Branding / logo upload | ✅ Working | Logo upload stores the file in the pharmacy-logos Supabase Storage bucket and saves the public URL to pharmacies.logo_url. Primary color and custom domain are also persisted. |
| API key management | ⚠️ Partial | API keys can be listed, created, and edited. However, keys are stored in **plaintext** despite the column being named key_hash. No hashing or encryption at rest. |
| Stock location management | ⚠️ Partial | Locations can be listed and created. The stock_locations table is **not in official migrations** (create-stock-locations-table.sql is a root-level loose file). Falls back to 4 hardcoded defaults if the table is missing. |
| IP whitelist management | ⚠️ Partial | IP entries can be added and deleted via the UI. However, the whitelist is **not enforced** — no middleware or API route reads the ip_whitelist_enabled flag to block requests. The feature is UI-complete but functionally inert. |
| 2FA setup and management | ✅ Working | Full 3-step setup flow (QR code, verify, backup codes). Enable/disable works correctly. |
| SSO toggle | ❌ Broken/Incomplete | The SSO toggle stores a flag in security_settings but no SSO provider (SAML, OAuth, OIDC) is configured or integrated. Enabling SSO has no effect. |
| Mobile Money integration | ❌ Broken/Incomplete | /api/integrations/mobile-money is a stub with a TODO comment. Returns a mock transaction object. Not connected to any MTN/Airtel API. |
| RRA EBM integration | ❌ Broken/Incomplete | /api/integrations/rra-ebm is a stub with a TODO comment. Returns a mock submission object. Not connected to the Rwanda Revenue Authority API. |
| Admin platform settings | ⚠️ Partial | Settings are read from and written to system_settings. The active page.tsx uses lert() for feedback and contains placeholder "Custom Settings" fields. The improved page-improved.tsx is not active (see Section 2). |
| Notifications, Compliance, Analytics tabs | ❌ Broken/Incomplete | These tabs are defined in the TabsList but their TabsContent is not fully implemented. They render empty or with placeholder content. |

**Module docs:** [docs/modules/settings.md](modules/settings.md)

### 1.15 Reports

| Sub-feature | Status | Notes |
|---|---|---|
| Sales KPI cards (total sales, orders, avg order value, active customers) | ✅ Working | All four metrics are computed from live sales data scoped to the pharmacy. |
| Sales & Orders area chart | ⚠️ Partial | Daily sales amounts are real. The orders field per day is Math.floor(Math.random() * 50) + 100 — a **random number**, not the real order count. |
| Inventory alerts line chart | ✅ Working | Low-stock and expiring-soon counts are computed from live inventory data for the last 14 days. |
| Top selling products | ✅ Working | Ranked by revenue from sale_items joined to sales. |
| Payment methods breakdown | ✅ Working | Computed from live sales.payment_method data. |
| Date range filter | ❌ Broken/Incomplete | Start/end date inputs are present but **not passed to the API routes**. Both routes always return fixed 30-day (sales) or 14-day (inventory) windows regardless of filter inputs. |
| Percentage-change badges | ❌ Broken/Incomplete | All trend indicators (+12.5% from last period, etc.) are **hardcoded strings** — not computed from real data. |
| PDF export | ⚠️ Partial | Implemented via window.print(). jsPDF is installed but not used. Produces a basic browser-print PDF. |
| Excel export | ❌ Broken/Incomplete | Not implemented. The xlsx library is installed but not used in the reports module. |
| Financial report | ❌ Broken/Incomplete | GET /api/reports/financial is a **hardcoded stub**. Not connected to the database. |
| Tax / VAT report | ❌ Broken/Incomplete | GET /api/reports/tax is a **hardcoded stub**. Not connected to the database. |
| Audit log report | ❌ Broken/Incomplete | GET /api/reports/audit is a **hardcoded stub**. Not connected to the database. |
| Insurance claims report | ❌ Broken/Incomplete | GET /api/reports/insurance-claims is a **hardcoded stub**. Not connected to the database. |
| Admin business reports | ⚠️ Partial | Revenue and pharmacy stats are fetched from live data. Report download buttons (Generate) are not wired to any export logic. |

**Module docs:** [docs/modules/reports.md](modules/reports.md)

### 1.16 Branches

| Sub-feature | Status | Notes |
|---|---|---|
| Branch list | ⚠️ Partial | GET /api/branches fetches active branches from the database. Falls back to 2 hardcoded mock branches on API failure. |
| Add branch | ❌ Broken/Incomplete | POST /api/branches receives pharmacy_id: 'current-pharmacy-id' (a placeholder string) from the page. New branches are inserted with an invalid pharmacy_id and will not be visible to any real pharmacy tenant. |
| Edit branch | ❌ Broken/Incomplete | The Edit button pre-fills the form but submits via POST (create) instead of PUT /api/branches/[id] (update). Every edit creates a duplicate record. |
| PUT /api/branches/[id] | ❌ Broken/Incomplete | The PUT handler echoes the request body without calling Supabase. No database write occurs. |
| Branch inventory preview | ❌ Broken/Incomplete | GET /api/branches/[id] always returns the same 2 hardcoded mock items regardless of branch ID. Not connected to the database. |
| Stock transfer dialog | ❌ Broken/Incomplete | The stock transfer form collects input but makes **no API call**. No inventory_transfers record is created. The feature is UI-only scaffolding. |
| Authentication on branch API routes | ❌ Broken/Incomplete | Neither /api/branches nor /api/branches/[id] calls supabase.auth.getUser(). Unauthenticated requests can read or write branch data. GET /api/branches also does not filter by pharmacy_id — it returns all active branches across all tenants. |
| RLS on ranches table | ❌ Broken/Incomplete | No RLS policies are defined for ranches in the official migrations. Tenant isolation relies entirely on application-layer filtering, which is currently absent. |
| Schema mismatch | ❌ Broken/Incomplete | The official migration defines ranches without code, manager_name, or is_main columns. The page component's TypeScript interface expects these columns. They will be undefined in production. |

**Module docs:** [docs/modules/branches.md](modules/branches.md)

### 1.17 Realtime Updates

| Sub-feature | Status | Notes |
|---|---|---|
| Inventory update notifications | ⚠️ Partial | The polling API (GET /api/realtime/updates) correctly detects new/updated inventory rows and emits inventory_update events. Subscribed pages re-fetch their data on receipt. |
| New sale notifications | ⚠️ Partial | The polling API correctly detects new sales rows and emits 
ew_sale events. Subscribed pages re-fetch stats and recent sales on receipt. |
| stock_alert and prescription_update events | ❌ Broken/Incomplete | These event types are declared in the TypeScript interface but **never emitted** by the API route. Components that register handlers for these types will never receive a callback. |
| WebSocket / Supabase Realtime | ❌ Broken/Incomplete | The module uses **HTTP polling** (5-second interval), not Supabase Realtime WebSockets. The RealtimeStatus "Live" badge reflects polling connectivity, not a WebSocket connection. The hook source code explicitly states: // Simulate WebSocket with polling for now. |
| Polling latency | ⚠️ Partial | Updates are delivered with up to 5 seconds of latency. Under load, each connected client generates one HTTP request every 5 seconds, creating predictable database load. |
| lastUpdateTime race condition | ❌ Broken/Incomplete | The module-level lastUpdateTime variable is shared across concurrent requests and resets on serverless cold starts. Updates that occurred before a cold start will never be delivered. |
| Multiple polling loops on superadmin page | ❌ Broken/Incomplete | The Superadmin Dashboard runs 3 concurrent polling loops: the page's own useRealtimeUpdates, the RealtimeStatus component's useRealtimeUpdates, and a 30-second setInterval. This is redundant and wasteful. |

**Module docs:** [docs/modules/realtime-updates.md](modules/realtime-updates.md)

---

## 2. Duplicate and Conflicting Implementations

### 2.1 Admin Settings: page.tsx vs. page-improved.tsx

**Location:** src/app/(dashboard)/admin/settings/

| File | Status | Description |
|---|---|---|
| page.tsx | ⚠️ Active (currently served) | Uses lert() for all success/error feedback. Contains a "Custom Settings" card with placeholder customSetting text field and eatureFlag toggle — development scaffolding with no backend purpose. These placeholder fields are included in the PUT /api/admin/system-settings payload and will pollute the system_settings table if the user saves. |
| page-improved.tsx | ❌ Inactive (never rendered) | Refactored version. Replaces lert() with inline setError/setSuccess state banners. Adds a Refresh button and a loading spinner on the Save button. Removes the placeholder "Custom Settings" card. Shows all four analytics metrics. **This is the superior implementation but is unreachable in production.** |

**Recommended action:** Rename page-improved.tsx to page.tsx (replacing the original) and delete the old page.tsx. See docs/cleanup-plan.md.

---

### 2.2 Other Files with Version Suffixes

The following files were identified with -improved, -v2, -new, or -old suffixes indicating superseded or experimental versions:

| File | Status | Notes |
|---|---|---|
| src/app/(dashboard)/admin/settings/page-improved.tsx | ❌ Inactive | See §2.1 above. Should replace page.tsx. |
| src/app/actions-simple.ts | ❌ Dead code | A simplified version of src/app/actions.ts. Contains a basic signInAction implementation. Not imported by any page component. Should be removed. |

No other pages or components with -v2, -new, or -old suffixes were found in src/app/(dashboard)/ or src/components/.

---

### 2.3 Duplicate or Conflicting API Routes

| Route | Conflict | Notes |
|---|---|---|
| POST /api/staff vs. POST /api/pharmacist | Conflicting | POST /api/staff always returns 400 { error: 'Use /api/pharmacist to create staff' }. The route exists but serves no purpose. The actual staff creation endpoint is /api/pharmacist. |
| GET /api/admin/stores vs. GET /api/admin/pharmacies | Conflicting | GET /api/admin/stores returns a **hardcoded** array of 2 mock pharmacies. The stores/page.tsx page calls /api/admin/pharmacies (not /api/admin/stores), so /api/admin/stores is dead code. |
| pharmacy_settings table vs. system_settings table | Conflicting | Both tables serve overlapping purposes as key-value settings stores. The security settings route writes to pharmacy_settings; the admin settings route writes to system_settings. These should be consolidated. |

---

## 3. Debug and Test Routes

The following routes exist in the codebase and are accessible to unauthenticated users (the middleware does not protect them). They **must be removed before any production deployment**.

### 3.1 Debug and Test Page Routes

| Route | Source File | Status |
|---|---|---|
| /debug-auth | src/app/debug-auth/ | 🔒 Remove Before Production |
| /debug-rate-limit | src/app/debug-rate-limit/ | 🔒 Remove Before Production |
| /debug-supabase | src/app/debug-supabase/ | 🔒 Remove Before Production |
| /quick-test | src/app/quick-test/ | 🔒 Remove Before Production |
| /test-auth | src/app/test-auth/ | 🔒 Remove Before Production |
| /test-create | src/app/test-create/ | 🔒 Remove Before Production |
| /test-rls | src/app/test-rls/ | 🔒 Remove Before Production |
| /test-roles | src/app/test-roles/ | 🔒 Remove Before Production |
| /test-supabase | src/app/test-supabase/ | 🔒 Remove Before Production |

All 9 routes above are listed in the middleware source as explicitly **excluded** from protection, meaning they are reachable by unauthenticated users. They expose internal Supabase configuration, RLS policy behavior, and authentication internals.

### 3.2 Standalone Routes Outside the Dashboard Layout

| Route | Source File | Status | Notes |
|---|---|---|---|
| /pharmacist | src/app/pharmacist/ | 🔒 Remove Before Production | Standalone page outside the dashboard layout. No role enforcement. Likely a development prototype. |
| /pharmacy | src/app/pharmacy/ | 🔒 Remove Before Production | Standalone pharmacy overview page outside the dashboard layout. Displays subscription_plan from the pharmacies table. No role enforcement. |

### 3.3 Test API Routes

| Route | Source File | Status | Notes |
|---|---|---|---|
| POST /api/auth/login | src/app/api/auth/login/route.ts | 🔒 Remove Before Production | Hardcoded test stub with a static array of credentials (including abdousentore@gmail.com / admin123). Returns a mock JWT. Not connected to Supabase. |
| GET /api/admin/stores | src/app/api/admin/stores/route.ts | 🔒 Remove Before Production | Returns a hardcoded array of 2 mock pharmacies. Dead code — not called by any page. |
| GET /api/drugs | src/app/api/drugs/route.ts | 🔒 Remove Before Production | Returns a hardcoded array of 3 drugs. Not connected to the database. |

### 3.4 Public HTML Test Files

| File | Status | Notes |
|---|---|---|
| public/check-user.html | 🔒 Remove Before Production | Static HTML file in the public/ directory. Accessible at /check-user.html without authentication. Likely a development diagnostic tool. |
| public/test-insurance.html | 🔒 Remove Before Production | Static HTML file in the public/ directory. Accessible at /test-insurance.html without authentication. Likely a development diagnostic tool. |

---

## 4. Security Issues

### 4.1 Hardcoded Test Credentials in Production UI

❌ **Security Issue — Critical**

**File:** src/app/(dashboard)/superadmin/page.tsx

The Superadmin Dashboard renders a "Test User Credentials" card that displays **plaintext email and password combinations** for all test accounts directly in the UI. This card is visible to any authenticated superadmin user in production and is present in the page source code.

| Role | Email | Password |
|---|---|---|
| Super Admin | abdousentore@gmail.com | admin123 |
| Pharmacy Owner | pharmacy@test.com | pharmacy123 |
| Pharmacist | pharmacist@test.com | pharmacist123 |
| Cashier | cashier@test.com | cashier123 |

**Impact:** Any person who can authenticate as the superadmin (or who can view the page source) has access to all test account credentials, including the superadmin account itself. This creates a circular credential exposure: the superadmin password is visible to anyone who can log in as the superadmin.

**Required action:** Remove the entire "Test User Credentials" <Card> block from src/app/(dashboard)/superadmin/page.tsx before any production deployment.

---

### 4.2 Hardcoded Test Credentials in API Route

❌ **Security Issue — Critical**

**File:** src/app/api/auth/login/route.ts

This route contains a hardcoded array of test credentials (including abdousentore@gmail.com / admin123) and returns a mock JWT token. It is not connected to Supabase and bypasses all authentication logic.

**Required action:** Delete src/app/api/auth/login/route.ts entirely before any production deployment.

---

### 4.3 Unauthenticated Admin API Routes

❌ **Security Issue — High**

**Files:** src/app/api/admin/pharmacies/route.ts, src/app/api/admin/pharmacies/[id]/route.ts, src/app/api/admin/categories/route.ts, src/app/api/admin/categories/[id]/route.ts

These routes use the Supabase service role key directly and perform **no authentication or authorization checks**. Any request that reaches these endpoints — including unauthenticated requests — can read all pharmacy data or create, modify, and delete pharmacies and categories.

**Required action:** Add supabase.auth.getUser() session verification and a superadmin role check to all four routes.

---

### 4.4 API Keys Stored in Plaintext

❌ **Security Issue — High**

**File:** src/app/api/settings/api-keys/route.ts

Despite the column being named key_hash, the API route stores raw API key values directly (key_hash: body.key). API keys are not hashed or encrypted at rest. Any user with database access can read all API keys in plaintext.

**Required action:** Hash API keys before storage (e.g., using crypto.createHash('sha256')). Store only the hash and a display prefix.

---

### 4.5 @test.com Auto-Provisioning in Production Code

❌ **Security Issue — Medium**

**File:** src/app/actions.ts (signInAction)

signInAction contains logic that auto-creates users and pharmacy_users records for any email containing @test.com, assigning them to a hardcoded pharmacy UUID (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa). This test scaffolding is present in production code and allows anyone with a @test.com email address to gain pharmacy access.

**Required action:** Remove the @test.com auto-provisioning block from signInAction.

---

### 4.6 Hardcoded Superadmin Email in RLS Policies

⚠️ **Security Issue — Medium**

**Files:** src/app/api/insurance/route.ts, supabase/migrations/20241202000000_fix_insurance_rls.sql

The superadmin check in both the application code and the database RLS policies is hardcoded to the email address abdousentore@gmail.com. If the superadmin account email changes, or if a second superadmin needs to be added, both the application code and the database RLS policies must be updated manually.

**Required action:** Replace the email-based check with a role-based check against pharmacy_users.role = 'superadmin'.

---

### 4.7 No Webhook Signature Verification on KPay Webhook

⚠️ **Security Issue — Medium**

**File:** src/app/api/kpay/webhook/route.ts

The KPay webhook endpoint accepts any POST request that contains a valid 
efid matching a payment_transactions row. There is no HMAC signature or shared secret verification to confirm the request genuinely originates from KPay. A malicious actor who knows a valid 
efid could forge a webhook and activate a subscription without payment.

**Required action:** Implement KPay webhook signature verification before enabling live payments.

---

### 4.8 DELETE /api/staff/:id Has No Authentication

⚠️ **Security Issue — Medium**

**File:** src/app/api/staff/[id]/route.ts

The delete route uses the service role key and does not verify the caller's session or confirm that the record belongs to the caller's pharmacy. Any request with a known pharmacy_users.id can delete that record without authentication.

**Required action:** Add supabase.auth.getUser() session verification and a pharmacy ownership check.

---

### 4.9 POST /api/pharmacist Has No Authentication

⚠️ **Security Issue — Medium**

**File:** src/app/api/pharmacist/route.ts

The pharmacist creation endpoint uses SUPABASE_SERVICE_ROLE_KEY directly and does not verify that the caller is authenticated or holds an appropriate role. Any unauthenticated request with a valid JSON body can create a new Supabase Auth user.

**Required action:** Add session verification and a pharmacy_owner or superadmin role check.

---

## 5. Summary

### Feature Status Overview

| Status | Count | Feature Areas |
|---|---|---|
| ✅ Working | 3 | Core sign-in + 2FA, Global category management, Stock alerts |
| ⚠️ Partial | 10 | Superadmin Dashboard, Admin Dashboard, Pharmacy Owner Dashboard, Pharmacist Dashboard, Inventory Management, POS (core sale), Sales History, Customer Management, Subscription & Billing, Realtime Updates |
| ❌ Broken/Incomplete | 4 | Sign-up, Password Reset, Branches, Patient & Prescription Management (prescription creation) |

> **Note:** Most feature areas contain a mix of working and broken sub-features. The table above reflects the dominant status for each area. See the detailed sub-feature tables in Section 1 for the complete picture.

### Pre-Production Blocklist

The following items **must** be resolved before any production deployment:

1. ❌ Remove the "Test User Credentials" card from src/app/(dashboard)/superadmin/page.tsx
2. ❌ Delete src/app/api/auth/login/route.ts (hardcoded credentials + mock JWT)
3. ❌ Remove all 9 debug/test routes (/debug-auth, /debug-supabase, /debug-rate-limit, /quick-test, /test-auth, /test-create, /test-rls, /test-roles, /test-supabase)
4. ❌ Remove public/check-user.html and public/test-insurance.html
5. ❌ Add authentication to /api/admin/pharmacies, /api/admin/categories, and their [id] variants
6. ❌ Remove @test.com auto-provisioning from signInAction
7. ❌ Implement signUpAction and orgotPasswordAction (currently non-functional)
8. ❌ Fix POST /api/prescriptions pharmacy_id bug (string literal fallback)
9. ❌ Fix POST /api/branches pharmacy_id bug (placeholder string)
10. ❌ Verify KPay credentials and implement webhook signature verification before enabling live payments

