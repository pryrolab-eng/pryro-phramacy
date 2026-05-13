# API Reference

This document provides a comprehensive reference for all API endpoints in the Pryrox pharmacy management system.

## Authentication

All authenticated routes use **Supabase JWT validation** via `createClient()` from `@supabase/ssr`. The authentication flow:

1. Client sends request with Supabase session cookie
2. Server calls `supabase.auth.getUser()` to verify the session
3. If authenticated, the route proceeds; otherwise, returns `401 Unauthorized`

Routes that require authentication are marked with 🔒 below.

---

## Auth

### POST `/api/auth/login`
**Authentication:** None  
**Description:** Mock login endpoint (returns hardcoded test users)  
**Methods:** POST

### GET `/api/auth/signout`
**Authentication:** None  
**Description:** Signs out the current user and redirects to sign-in page  
**Methods:** GET

### POST `/api/auth/verify-2fa`
**Authentication:** None  
**Description:** Verifies a 2FA token or backup code for a pending session  
**Methods:** POST

### POST `/api/auth/complete-2fa`
**Authentication:** None  
**Description:** Completes 2FA verification and generates an OTP token for sign-in  
**Methods:** POST

---

## Pharmacy & Admin

### GET `/api/admin/backups` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all database backups  
**Methods:** GET, POST

### GET `/api/admin/categories` 🔒
**Authentication:** Uses service role key (bypasses RLS)  
**Description:** Fetches all global categories (superadmin-level)  
**Methods:** GET, POST

### PUT `/api/admin/categories/[id]` 🔒
**Authentication:** Uses service role key  
**Description:** Updates or deletes a global category by ID  
**Methods:** PUT, DELETE

### GET `/api/admin/insurance-templates` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all insurance invoice templates  
**Methods:** GET, POST

### GET `/api/admin/pharmacies` 🔒
**Authentication:** Uses service role key (bypasses RLS)  
**Description:** Fetches all pharmacies (superadmin-level)  
**Methods:** GET, POST

### PUT `/api/admin/pharmacies/[id]` 🔒
**Authentication:** Uses service role key  
**Description:** Updates or deletes a pharmacy by ID  
**Methods:** PUT, DELETE

### GET `/api/admin/plans` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all subscription plans  
**Methods:** GET, POST

### PUT `/api/admin/plans/[id]` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Updates a subscription plan by ID  
**Methods:** PUT

### GET `/api/admin/stores` 🔒
**Authentication:** None (returns mock data)  
**Description:** Returns mock pharmacy store data  
**Methods:** GET

### GET `/api/admin/system-settings` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`) + superadmin role check  
**Description:** Fetches system-wide settings (superadmin only)  
**Methods:** GET, PUT

---

## Inventory

### GET `/api/inventory` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all inventory items for the authenticated user's pharmacy  
**Methods:** GET, POST

### POST `/api/inventory/add` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Adds a new medication and inventory item  
**Methods:** POST

### POST `/api/inventory/adjustment` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Adjusts inventory stock (increase or decrease)  
**Methods:** POST

### GET `/api/inventory/analytics` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns inventory analytics (stock by category, inventory trend)  
**Methods:** GET

### GET `/api/inventory/expiry-alerts`
**Authentication:** None (returns mock data)  
**Description:** Returns mock expiry alert data  
**Methods:** GET

### POST `/api/inventory/purchase` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Records a purchase and updates inventory stock  
**Methods:** POST

### GET `/api/inventory/suppliers` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all active suppliers  
**Methods:** GET, POST

### GET `/api/inventory/transfers` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all inventory transfers between branches  
**Methods:** GET, POST

### PUT `/api/inventory/[id]` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Updates or deletes an inventory item by ID  
**Methods:** PUT, DELETE

---

## POS & Sales

### GET `/api/pos` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches recent sales for the POS dashboard  
**Methods:** GET

### POST `/api/pos/sale` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Processes a new sale, creates sale items, updates inventory, and creates insurance claims if applicable  
**Methods:** POST

### GET `/api/pos/products` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all products with stock > 0 for POS interface  
**Methods:** GET

### GET `/api/pos/customer-lookup`
**Authentication:** None (returns mock data)  
**Description:** Looks up customers by phone number (mock data)  
**Methods:** GET

### POST `/api/pos/daily-close`
**Authentication:** None (returns mock data)  
**Description:** Closes the day and generates a daily summary (mock)  
**Methods:** POST

### GET `/api/pos/discounts` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all active discounts  
**Methods:** GET, POST

### POST `/api/pos/hold-sale`
**Authentication:** None (returns mock data)  
**Description:** Holds a sale for later completion (mock)  
**Methods:** POST, GET

### POST `/api/pos/invoice` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Generates an insurance invoice with patient and insurance details  
**Methods:** POST

### GET `/api/pos/price-check`
**Authentication:** None (returns mock data)  
**Description:** Checks product prices by name or barcode (mock)  
**Methods:** GET

### POST `/api/pos/returns` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Processes a product return  
**Methods:** POST

### POST `/api/pos/void-sale`
**Authentication:** None (returns mock data)  
**Description:** Voids a sale (mock)  
**Methods:** POST

### POST `/api/pos/quick-add-drug` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Quickly adds a new drug to medications and inventory  
**Methods:** POST

### POST `/api/pos/quick-add-category` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Quickly adds a new category  
**Methods:** POST

### POST `/api/pos/quick-add-insurance` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Quickly adds a new insurance provider  
**Methods:** POST

### POST `/api/pos/quick-add-patient` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Quickly adds a new customer/patient  
**Methods:** POST

### GET `/api/sales` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all sales with stats (today, week, month totals)  
**Methods:** GET, POST

### GET `/api/sales/analytics` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns sales analytics (weekly sales, payment breakdown, hourly sales, monthly comparison, customer distribution, top categories)  
**Methods:** GET

---

## Customers

### GET `/api/customers` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all customers for the authenticated user's pharmacy (supports search query)  
**Methods:** GET, POST

### GET `/api/customers/history`
**Authentication:** None (returns mock data)  
**Description:** Returns customer purchase history (mock)  
**Methods:** GET

### GET `/api/customers/loyalty` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches customer loyalty data  
**Methods:** GET, POST

---

## Patients & Prescriptions

### GET `/api/prescriptions` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all prescriptions  
**Methods:** GET, POST

### PUT `/api/prescriptions/[id]` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Updates or deletes a prescription by ID  
**Methods:** PUT, DELETE

---

## Insurance

### GET `/api/insurance` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches insurance providers (global + pharmacy-specific; superadmin sees all)  
**Methods:** GET, POST

### POST `/api/insurance/lookup`
**Authentication:** None (returns mock data)  
**Description:** Looks up insurance details by insurance number (mock)  
**Methods:** POST

### GET `/api/insurance/pricing`
**Authentication:** None (returns mock data)  
**Description:** Returns insurance-specific pricing for products (mock)  
**Methods:** GET, POST

### POST `/api/insurance/process`
**Authentication:** None (returns mock data)  
**Description:** Processes an insurance claim (mock)  
**Methods:** POST

---

## Staff

### GET `/api/staff` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all staff members for the authenticated user's pharmacy  
**Methods:** GET, POST

### PUT `/api/staff/[id]` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Updates or deletes a staff member by ID  
**Methods:** PUT, DELETE

### POST `/api/pharmacist` 🔒
**Authentication:** Uses service role key  
**Description:** Creates a new pharmacist user and assigns them to a pharmacy  
**Methods:** POST

### GET `/api/pharmacist/dashboard` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns pharmacist dashboard stats (prescriptions, customers served, wait time, etc.)  
**Methods:** GET

### GET `/api/pharmacist/activities` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches recent pharmacist activities (sales as activities)  
**Methods:** GET

### GET `/api/pharmacist/chart-data` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns hourly chart data for prescriptions and customers  
**Methods:** GET

### GET `/api/pharmacist/prescriptions` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches pending prescriptions for pharmacist  
**Methods:** GET, POST

### POST `/api/pharmacist/track-activity` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Tracks pharmacist activities (prescription start/complete, inventory checks, alert actions)  
**Methods:** POST

---

## Subscriptions & Billing

### GET `/api/subscriptions/status` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns current subscription status, plan details, and time remaining  
**Methods:** GET, POST

### POST `/api/subscriptions/upgrade` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Upgrades a pharmacy's subscription plan  
**Methods:** POST

### POST `/api/kpay/initiate` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Initiates a KPay payment (mobile money or card)  
**Methods:** POST

### GET `/api/kpay/status` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Checks the status of a KPay transaction  
**Methods:** GET

### POST `/api/kpay/webhook`
**Authentication:** Uses service role key  
**Description:** Webhook endpoint for KPay payment notifications  
**Methods:** POST

### GET `/api/plans` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all active subscription plans  
**Methods:** GET

### GET `/api/invoices` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches billing invoices and payment method  
**Methods:** GET, POST

### GET `/api/payments` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all payment transactions (formatted from sales)  
**Methods:** GET, POST

---

## Settings

### GET `/api/settings/api-keys` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all API keys for the authenticated user's pharmacy  
**Methods:** GET, POST, PUT

### GET `/api/settings/locations` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all stock locations for the authenticated user's pharmacy  
**Methods:** GET, POST

### GET `/api/settings/security` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches security settings (IP whitelist, etc.)  
**Methods:** GET, PUT

### POST `/api/settings/security/2fa` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Toggles 2FA on/off for the authenticated user  
**Methods:** POST, GET

### POST `/api/settings/security/ip-whitelist` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Toggles IP whitelist on/off  
**Methods:** POST

### POST `/api/settings/security/sso` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Toggles SSO on/off  
**Methods:** POST

### GET `/api/pharmacy/settings` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches pharmacy settings (name, license, location, etc.)  
**Methods:** GET, PUT

### GET `/api/pharmacy/branding` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches pharmacy branding (logo, primary color, custom domain)  
**Methods:** GET, PUT

### POST `/api/pharmacy/branding/upload` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Uploads a pharmacy logo to Supabase Storage  
**Methods:** POST

---

## Reports & Analytics

### GET `/api/reports/sales` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns sales report (daily sales, top products, payment breakdown, active customers)  
**Methods:** GET

### GET `/api/reports/financial`
**Authentication:** None (returns mock data)  
**Description:** Returns financial report (revenue, expenses, profit/loss, cash flow) (mock)  
**Methods:** GET

### GET `/api/reports/inventory` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns inventory report (daily alerts for low stock and expiring items)  
**Methods:** GET

### GET `/api/reports/audit`
**Authentication:** None (returns mock data)  
**Description:** Returns audit logs (mock)  
**Methods:** GET

### GET `/api/reports/insurance-claims`
**Authentication:** None (returns mock data)  
**Description:** Returns insurance claims report (mock)  
**Methods:** GET

### GET `/api/reports/tax`
**Authentication:** None (returns mock data)  
**Description:** Returns tax report (VAT summary, RRA submission status) (mock)  
**Methods:** GET

### GET `/api/analytics`
**Authentication:** None (returns mock data)  
**Description:** Returns analytics data (sales trends, top products, customer insights, predictions) (mock)  
**Methods:** GET

### GET `/api/accounting`
**Authentication:** None (returns mock data)  
**Description:** Returns accounting data (revenue, expenses, profit, monthly breakdown) (mock)  
**Methods:** GET

---

## Branches

### GET `/api/branches` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all active branches  
**Methods:** GET, POST

### PUT `/api/branches/[id]`
**Authentication:** None (returns mock data)  
**Description:** Updates a branch or fetches branch inventory (mock)  
**Methods:** PUT, GET

---

## Realtime

### GET `/api/realtime/updates` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns recent inventory and sales updates for realtime dashboard  
**Methods:** GET

---

## Exports & Uploads

### POST `/api/exports`
**Authentication:** None (returns mock data)  
**Description:** Generates an export file (mock)  
**Methods:** POST

### POST `/api/uploads`
**Authentication:** None (returns mock data)  
**Description:** Uploads a file (mock)  
**Methods:** POST

---

## Dashboard

### GET `/api/dashboard` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns dashboard stats, alerts, and recent sales  
**Methods:** GET

### GET `/api/pharmacy/dashboard` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns pharmacy owner dashboard stats  
**Methods:** GET

### GET `/api/pharmacy/category-sales` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns sales by category chart data  
**Methods:** GET

### GET `/api/pharmacy/inventory-chart` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns inventory chart data (in stock vs low stock by month)  
**Methods:** GET

### GET `/api/pharmacy/invoice-template` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches or updates the pharmacy's invoice template  
**Methods:** GET, PUT

### GET `/api/pharmacy/sales-chart` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns sales chart data (monthly revenue)  
**Methods:** GET

### GET `/api/pharmacy/weekly-sales` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns weekly sales chart data (prescription vs OTC by day)  
**Methods:** GET

### GET `/api/superadmin/dashboard` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns superadmin dashboard stats (total pharmacies, revenue, users)  
**Methods:** GET

### GET `/api/superadmin/pharmacies` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all pharmacies (superadmin view)  
**Methods:** GET, POST

---

## Integrations

### POST `/api/integrations/mobile-money` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Processes a mobile money payment (mock)  
**Methods:** POST

### POST `/api/integrations/rra-ebm` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Submits an invoice to RRA EBM (mock)  
**Methods:** POST

### POST `/api/rra/invoice`
**Authentication:** None (returns mock data)  
**Description:** Generates an RRA invoice with QR code (mock)  
**Methods:** POST

---

## Miscellaneous

### GET `/api/categories` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all categories (global + pharmacy-specific)  
**Methods:** GET, POST

### PUT `/api/categories/[id]` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Updates or deletes a category by ID  
**Methods:** PUT, DELETE

### GET `/api/drugs`
**Authentication:** None (returns mock data)  
**Description:** Returns mock drug data  
**Methods:** GET, POST

### GET `/api/alerts` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns low stock and expiring product alerts  
**Methods:** GET

### GET `/api/stock-alerts` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Returns all stock alerts (low stock + expiring)  
**Methods:** GET

### GET `/api/notifications` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Fetches all notifications  
**Methods:** GET, POST

### POST `/api/notifications/broadcast`
**Authentication:** None (in-memory store)  
**Description:** Broadcasts a notification to all users  
**Methods:** POST, GET

### POST `/api/ai-safety`
**Authentication:** None  
**Description:** Checks for drug interactions and safety warnings  
**Methods:** POST

---

## Debug/Internal Routes

⚠️ **Remove Before Production**

### GET `/api/check-user` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Debug endpoint to check current user session  
**Methods:** GET

### POST `/api/fix-user` 🔒
**Authentication:** Yes (`supabase.auth.getUser()`)  
**Description:** Debug endpoint to fix user pharmacy access and add test data  
**Methods:** POST

### POST `/api/test-validation`
**Authentication:** None  
**Description:** Test endpoint for phone and card validation  
**Methods:** POST

---

## Notes

- **Requirements:** This API reference satisfies **Requirement 2.6** from the project audit specification.
- **Authentication:** All authenticated routes use Supabase JWT validation via `createClient()` from `@supabase/ssr`.
- **Tenant Isolation:** Most routes enforce tenant isolation by checking `pharmacy_users.pharmacy_id` for the authenticated user.
- **Superadmin Routes:** Routes under `/api/admin/` and `/api/superadmin/` use the service role key to bypass RLS policies.
- **Mock Routes:** Several routes return mock data and are placeholders for future implementation.
- **Debug Routes:** The three debug/internal routes (`/api/check-user`, `/api/fix-user`, `/api/test-validation`) should be removed before production deployment.
