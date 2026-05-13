# Point of Sale (POS) Module

## Purpose

The POS module is the primary transaction interface for Pryrox pharmacies. It provides a real-time, browser-based point-of-sale terminal that allows cashiers and pharmacists to search inventory, build a cart, apply insurance coverage, process payments, and print receipts — all in a single-page layout without page navigation.

The module is designed for the Rwandan pharmacy context: it natively supports RSSB, RAMA, MMI, and Radiant insurance providers with per-item coverage calculations, and records all transactions in the `sales`, `sale_items`, and `insurance_claims` tables for downstream reporting and insurance reimbursement.

---

## Key Files

### Page

| File | Route | Description |
|---|---|---|
| `src/app/(dashboard)/pos/page.tsx` | `/pos` | Single-page POS terminal. Client component. Three-column layout: product search (left), cart + customer (centre), payment + actions (right). Loads products, fast-moving items, and categories on mount. Keyboard shortcut `F2` triggers sale processing when the cart is non-empty and a payment method is selected. |

### API Routes (`src/app/api/pos/`)

| Route file | Method(s) | Auth | Description |
|---|---|---|---|
| `route.ts` | `GET` | Yes (session) | Returns the 5 most recent sales for the authenticated user's pharmacy. Used to populate a "recent transactions" summary. Queries `sales` joined with `sale_items`. |
| `products/route.ts` | `GET` | Yes (session) | Returns all in-stock inventory items for the pharmacy, formatted for the POS product grid. Accepts `?fastMoving=true` to filter for fast-moving items. Queries `inventory` joined with `medications`. |
| `sale/route.ts` | `POST` | Yes (session) | Core sale-processing endpoint. Creates a `sales` record, inserts `sale_items`, decrements `inventory.quantity_in_stock` for each item, and creates an `insurance_claims` record when insurance is used. Returns `{ success, receiptNumber }`. |
| `customer-lookup/route.ts` | `GET` | No | **Stub — hardcoded data.** Accepts `?phone=` and returns matching customers from a static array. Not connected to the database. |
| `daily-close/route.ts` | `POST` | No | **Stub — no database write.** Accepts daily totals and returns a formatted daily-close summary object. Does not persist to any table. |
| `discounts/route.ts` | `GET`, `POST` | No (GET) / No (POST) | Reads and creates discount records in the `discounts` table. The `POST` handler has a bug: `pharmacy_id` is hardcoded to the string `'userPharmacy.pharmacy_id'` instead of the authenticated user's pharmacy. |
| `hold-sale/route.ts` | `GET`, `POST` | No | **Stub — in-memory only.** Holds a cart in a static response object. No database persistence; held sales are lost on server restart. |
| `invoice/route.ts` | `POST` | No | Generates a detailed insurance invoice with per-item coverage breakdown. Fetches pharmacy details, insurance provider data, and insurance prices. Contains a bug: `pharmacy_id` is hardcoded to the string `'userPharmacy.pharmacy_id'`. |
| `price-check/route.ts` | `GET` | No | **Stub — hardcoded data.** Accepts `?q=` and returns matching products from a static array. Not connected to the database. |
| `quick-add-category/route.ts` | `POST` | Yes (session) | Creates a new category in the `categories` table for the authenticated pharmacy. Used by the "+" button next to the category filter in the product search panel. |
| `quick-add-drug/route.ts` | `POST` | Yes (session) | Creates a new `medications` record and a corresponding `inventory` record in a single transaction. Used by the "+" button next to the product search input. |
| `quick-add-insurance/route.ts` | `POST` | Yes (session) | Creates a new `insurance_providers` record for the authenticated pharmacy. Used by the "+" button next to the insurance selector. |
| `quick-add-patient/route.ts` | `POST` | Yes (session) | Creates a new `customers` record for the authenticated pharmacy. Used by the "+" button next to the customer name field. |
| `returns/route.ts` | `POST` | No | Creates a record in the `returns` table. Contains a bug: `pharmacy_id` is hardcoded to the string `'userPharmacy.pharmacy_id'` instead of the authenticated user's pharmacy. Does not reverse inventory quantities. |
| `void-sale/route.ts` | `POST` | No | **Stub — no database write.** Returns a voided-sale object without updating the `sales` table or reversing inventory. |

### Payments API (`src/app/api/payments/`)

| Route file | Method(s) | Auth | Description |
|---|---|---|---|
| `route.ts` | `GET` | No | Returns all sales records formatted as a payments list. No tenant filtering — returns data across all pharmacies. |
| `route.ts` | `POST` | Yes (session) | Manages subscription plan changes. Accepts `{ plan, useKPay }`. For free/trial plans or when `useKPay = false`, updates `pharmacies.subscription_plan` directly. For paid plans with KPay, creates a `subscriptions` record and returns a `subscriptionId` for the KPay payment flow. Role-restricted to `pharmacy_owner` and `admin`. |

### Components

| File | Description |
|---|---|
| `src/components/insurance-selector.tsx` | Dropdown component that fetches active insurance providers from `/api/insurance` and renders them as selectable options with coverage percentage badges. Falls back to "Cash (No Insurance)" if the API call fails. |

### Hooks and State

| File | Description |
|---|---|
| `src/hooks/usePharmacyStore.ts` | Zustand store. The POS page imports `addSale` and `updateStock` from this store, but these calls are **not executed** in the current `processSale` implementation — the store is imported but the calls are dead code. All persistence goes through the API routes. |

---

## Database Tables

### `sales`

The primary transaction record. One row per completed sale.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE). Tenant isolation. |
| `cashier_id` | `uuid` | FK → `auth.users.id`. The user who processed the sale. |
| `customer_name` | `text` | Customer display name. Defaults to `'Walk-in Customer'` when not provided. |
| `customer_phone` | `text` | Customer phone number (nullable). |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers.id` (nullable). Set when insurance is used. |
| `subtotal` | `decimal(10,2)` | Sum of all line items at their insurance-adjusted prices. |
| `insurance_amount` | `decimal(10,2)` | Amount covered by the insurance provider. |
| `customer_amount` | `decimal(10,2)` | Amount the patient pays (subtotal − insurance_amount). |
| `total_amount` | `decimal(10,2)` | Gross total (equals `subtotal` in current implementation). |
| `payment_method` | `payment_method` enum | `cash`, `card`, `mobile_money`, `insurance`, or `mixed`. |
| `status` | `sale_status` enum | `completed`, `pending`, `cancelled`, or `refunded`. |
| `receipt_number` | `text` | Auto-generated receipt identifier (`RCP-<timestamp>`). |
| `rra_invoice_number` | `text` | Rwanda Revenue Authority invoice number (nullable; not populated by current code). |
| `notes` | `text` | Free-text notes. Used to store the insurance number when insurance is applied. |
| `created_at` | `timestamptz` | Sale timestamp. |
| `updated_at` | `timestamptz` | Last update timestamp. |

**Indexes:** `idx_sales_pharmacy_id` on `pharmacy_id`.

**RLS:** Enabled. Users can only read and insert sales for their own pharmacy.

**Audit trigger:** `audit_sales` — every INSERT, UPDATE, and DELETE is logged to `audit_logs`.

**Realtime:** `sales` is added to `supabase_realtime` publication.

---

### `sale_items`

Line items for each sale. One row per product per sale.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `sale_id` | `uuid` | FK → `sales.id` (CASCADE DELETE). |
| `inventory_id` | `uuid` | FK → `inventory.id`. Links back to the specific batch sold. |
| `medication_name` | `text` | Denormalised product name at time of sale (preserved even if the medication record changes). |
| `quantity` | `integer` | Number of units sold. |
| `unit_price` | `decimal(10,2)` | Price per unit at time of sale (may differ from current `inventory.selling_price`). |
| `total_price` | `decimal(10,2)` | `quantity × unit_price`. |
| `batch_number` | `text` | Batch number at time of sale (denormalised for audit purposes). |
| `expiry_date` | `date` | Expiry date at time of sale (denormalised). |
| `created_at` | `timestamptz` | Record creation timestamp. |

**Realtime:** `sale_items` is added to `supabase_realtime` publication.

---

### `customers`

Customer profiles used for autocomplete in the cart panel and for quick-add from the POS.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE). |
| `name` | `text` | Customer full name. |
| `phone` | `text` | Phone number. Used as the primary search key in the customer autocomplete. |
| `email` | `text` | Email address (nullable). |
| `date_of_birth` | `date` | Date of birth (nullable). |
| `gender` | `text` | Gender (nullable; present in `saas_extensions` migration). |
| `address` | `text` | Physical address (nullable). |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers.id` (nullable). |
| `insurance_number` | `text` | Insurance membership number (nullable). Pre-fills the insurance number field in the cart when a customer is selected. |
| `allergies` | `text[]` | Array of known allergens (nullable). |
| `medical_conditions` | `text[]` | Array of medical conditions (nullable). |
| `is_active` | `boolean` | Whether the customer record is active (default `true`). |
| `created_at` | `timestamptz` | Record creation timestamp. |
| `updated_at` | `timestamptz` | Last update timestamp. |

> **Note:** Two migrations define the `customers` table (`20240322000004_saas_extensions.sql` and `20241201000015_missing_tables.sql`). The `saas_extensions` version is the canonical schema; it includes `insurance_provider_id`, `insurance_number`, `allergies`, `medical_conditions`, and `gender`. The later migration uses `CREATE TABLE IF NOT EXISTS`, so it only applies if the table does not already exist.

**Indexes:** `idx_customers_pharmacy_id` on `pharmacy_id`; `idx_customers_phone` on `phone`.

**Realtime:** `customers` is added to `supabase_realtime` publication.

---

### `insurance_claims`

Pending reimbursement claims created automatically when a sale uses insurance.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE). |
| `sale_id` | `uuid` | FK → `sales.id` (CASCADE DELETE). |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers.id`. |
| `claim_number` | `text` | Unique claim identifier (nullable; not populated by current code). |
| `patient_name` | `text` | Patient name at time of claim. |
| `patient_id_number` | `text` | Insurance membership number (nullable). |
| `claim_amount` | `decimal(10,2)` | Amount being claimed from the insurer. |
| `approved_amount` | `decimal(10,2)` | Amount approved by the insurer (default `0.00`; updated externally). |
| `status` | `insurance_claim_status` enum | `pending`, `approved`, `rejected`, or `processing`. New claims are always `pending`. |
| `submitted_at` | `timestamptz` | Claim submission timestamp. |
| `processed_at` | `timestamptz` | When the claim was processed (nullable). |
| `notes` | `text` | Free-text notes (nullable). |

---

### `stock_movements`

Audit trail for inventory changes. A row is written for each sale item when inventory is decremented.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE). |
| `inventory_id` | `uuid` | FK → `inventory.id` (CASCADE DELETE). |
| `movement_type` | `text` | `'in'`, `'out'`, `'adjustment'`, `'expired'`, or `'damaged'`. POS writes `'out'`. |
| `quantity` | `integer` | Units moved (positive for `'out'`). |
| `reference_id` | `uuid` | FK to the originating record (e.g., `sale_id`). |
| `reference_type` | `text` | Type of the originating record (e.g., `'sale'`). |
| `notes` | `text` | Free-text notes (nullable). |
| `created_by` | `uuid` | FK → `auth.users.id`. The user who triggered the movement. |
| `created_at` | `timestamptz` | Movement timestamp. |

> **Note:** The `POS_TEST_RESULTS.md` report lists `stock_movements` as updated during sales. However, the current `sale/route.ts` implementation only updates `inventory.quantity_in_stock` directly; it does **not** insert into `stock_movements`. The table exists in the schema but is not written by the POS sale endpoint.

---

## User Roles

| Role | Access | Notes |
|---|---|---|
| `pharmacist` | Full POS access | Can process sales, apply insurance, quick-add drugs, patients, and insurance providers. |
| `cashier` | Full POS access | Same capabilities as pharmacist within the POS terminal. No role-level restriction differentiates cashier from pharmacist in the current implementation. |
| `pharmacy_owner` | Full POS access | Has access to all POS features plus subscription management via `/api/payments`. |
| `staff` | Full POS access | No role-level restriction in the POS page or API routes. |
| `superadmin` | Not applicable | Superadmin operates at the platform level and does not use the pharmacy POS. |

> **Note:** The POS page and all `/api/pos/*` routes check only that the user has an active session and a valid `pharmacy_users` record. There is no role-level gate — any authenticated user belonging to a pharmacy can access the POS terminal.

---

## Features

### Cart Management

The cart is managed entirely in React state (`useState`). Products are added by clicking a product card or pressing `F2` (process sale shortcut). Each cart item displays the product name, batch number, expiry warning (shown when `daysToExpiry ≤ 30`), unit price, and a quantity stepper.

Per-item price overrides are supported: the price field in the product grid is an editable input. Changing it stores the override in `priceAdjustments` state and applies it to the cart item. The original price is shown as a strikethrough when overridden.

### Customer Lookup and Quick-Add

The customer name field triggers an autocomplete search against `/api/customers?q=<query>` after 2 characters are typed. Selecting a suggestion pre-fills the customer's phone number and insurance number, and auto-selects the insurance type if an `insurance_number` is present.

The "+" button next to the customer field opens a quick-add dialog that calls `POST /api/pos/quick-add-patient` to create a new `customers` record without leaving the POS screen.

### Payment Methods

The POS supports five payment methods, matching the `payment_method` enum in the database:

| Method | Enum value | Notes |
|---|---|---|
| Cash | `cash` | Cashier enters the cash amount; change is calculated client-side. |
| Card | `card` | No card terminal integration; the method is recorded but no external call is made. |
| Mobile Money | `mobile_money` | No MoMo API integration; the method is recorded but no external call is made. |
| Insurance | `insurance` | Requires a customer with an insurance type selected. Coverage is calculated per item. |
| Mixed (Cash + Insurance) | `mixed` | Cashier enters both a cash amount and an insurance amount. |

### Insurance Application

When an insurance type is selected in the cart panel, the POS fetches per-item insurance pricing from `/api/insurance/pricing?insurance=<type>&product=<id>` for each cart item. The cart totals panel then shows three lines: subtotal, insurance coverage (green), and patient amount (blue).

The `InsuranceSelector` component (`src/components/insurance-selector.tsx`) fetches active providers from `/api/insurance` and renders them with their coverage percentage. Built-in coverage defaults are applied client-side when the API does not return a price: RAMA 100%, RSSB 90%, MMI 85%, Radiant 80%.

When a sale is processed with insurance, `sale/route.ts` looks up the `insurance_providers` record by name and creates an `insurance_claims` row with `status = 'pending'`.

### Receipt Generation

Receipts are generated client-side using `window.open` and `window.print()`. The `printInvoice` function in `page.tsx` builds an HTML string with pharmacy name, receipt number, date/time, cashier name, customer details, line items, totals, and payment method, then opens a 400×600 print window.

> **Note:** The cashier name is hardcoded to `'muzungu'` in the receipt template. It is not read from the authenticated user's profile.

### Quick-Add Actions

From the POS screen, users can add new records without navigating away:

| Action | Dialog trigger | API endpoint | Table written |
|---|---|---|---|
| Add new drug | "+" next to product search | `POST /api/pos/quick-add-drug` | `medications`, `inventory` |
| Add new patient/customer | "+" next to customer name | `POST /api/pos/quick-add-patient` | `customers` |
| Add new insurance provider | "+" next to insurance selector | `POST /api/pos/quick-add-insurance` | `insurance_providers` |
| Add new category | "+" next to category filter | `POST /api/pos/quick-add-category` | `categories` |

### Fast-Moving Products Tab

A "Fast Moving" tab in the product search panel fetches products with `?fastMoving=true`. The `products/route.ts` handler does not currently implement any filtering logic for this flag — it returns the same result set as the standard product list. The tab renders but shows the same products as the "All Products" tab.

### Expiry Warnings

Products with `daysToExpiry ≤ 30` display a red `AlertTriangle` badge in both the product grid and the cart. This is a client-side calculation based on the `expiry_date` returned by the products API.

### AI Safety Check

The POS page includes an "AI Safety" button (Brain icon) that opens a dialog (`aiSafetyOpen` state). The dialog and its `aiSafetyResult` state are wired up in the component, but the `fetchAiSafety` function is not implemented in the current code. The button is visible in the UI but non-functional.

---

## Sale Processing Flow

```
Cashier builds cart and selects payment method
        │
        ▼
processSale() called (or F2 pressed)
        │
        ├─ Validate: cart non-empty, payment method selected
        │
        ▼
POST /api/pos/sale
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ pharmacy_users → resolve pharmacy_id
        │
        ├─ If insurance: lookup insurance_providers by name
        │
        ├─ INSERT INTO sales (receipt_number = 'RCP-<timestamp>')
        │
        ├─ INSERT INTO sale_items (one row per cart item)
        │
        ├─ For each item: UPDATE inventory SET quantity_in_stock = quantity_in_stock - item.quantity
        │
        ├─ If insurance and coverage > 0: INSERT INTO insurance_claims (status = 'pending')
        │
        └─ Return { success: true, receiptNumber }
        │
        ▼
Client: printInvoice() → window.open() → window.print()
        │
        ▼
Cart cleared, customer reset, payment fields cleared
```

---

## Known Limitations

### 1. Several API routes are stubs with hardcoded data

The following routes do not connect to the database and return static or in-memory data:

- `customer-lookup/route.ts` — returns a hardcoded two-customer array
- `daily-close/route.ts` — returns a formatted object without writing to any table
- `hold-sale/route.ts` — held sales exist only in the response; they are not persisted
- `price-check/route.ts` — returns a hardcoded two-product array
- `void-sale/route.ts` — returns a voided-sale object without updating `sales.status` or reversing inventory

### 2. `pharmacy_id` hardcoded in three routes

`discounts/route.ts`, `invoice/route.ts`, and `returns/route.ts` all contain the literal string `'userPharmacy.pharmacy_id'` where the authenticated user's actual pharmacy UUID should be. Any records created by these routes will have an invalid `pharmacy_id` and will fail foreign-key constraints or be invisible to the correct tenant.

### 3. `stock_movements` table is not written

The `POS_TEST_RESULTS.md` report states that `stock_movements` is updated during sales. The current `sale/route.ts` implementation only decrements `inventory.quantity_in_stock` directly; it does not insert into `stock_movements`. The audit trail for inventory changes from POS sales is incomplete.

### 4. `void-sale` does not reverse inventory

Voiding a sale via `POST /api/pos/void-sale` does not update `sales.status` in the database and does not restore the inventory quantities that were decremented when the sale was processed. Voided sales remain as completed records in the database.

### 5. `returns` route does not restore inventory

`POST /api/pos/returns` creates a `returns` record but does not increment `inventory.quantity_in_stock` for the returned items. Returned stock is not reflected in available inventory.

### 6. Receipt cashier name is hardcoded

The `printInvoice` function in `page.tsx` hardcodes the cashier name as `'muzungu'`. It should read the authenticated user's display name from the session or `pharmacy_users` table.

### 7. Fast-moving products filter is not implemented

`GET /api/pos/products?fastMoving=true` returns the same result as `GET /api/pos/products`. The `fastMoving` query parameter is not handled in the route handler.

### 8. Loyalty points are not implemented

The `customers` table does not have a `loyalty_points` column. No loyalty point accumulation or redemption logic exists in any API route or page component. The feature is referenced in the task specification but is absent from the codebase.

### 9. `/api/payments` GET has no tenant filtering

`GET /api/payments/route.ts` queries `sales` without a `pharmacy_id` filter and without verifying the user's session. It returns sales records from all pharmacies to any caller.

### 10. No barcode scanner integration

The product search input accepts barcode strings and filters by `product.barcode`, but there is no Web Serial API or USB HID integration for a physical barcode scanner. The Scan button in the UI is rendered but has no `onClick` handler.

### 11. `usePharmacyStore` calls are dead code

`addSale` and `updateStock` are imported from `usePharmacyStore` and destructured in the component, but neither is called in `processSale`. All persistence is handled by the API routes. The store imports can be removed.

### 12. `alert()` used for user feedback

Sale success, validation errors, and processing errors are communicated via `window.alert()`. This blocks the UI thread and is not accessible. A toast or modal notification system should be used instead.
