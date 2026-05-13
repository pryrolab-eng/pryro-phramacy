# Customers Module

## Purpose

The Customers module manages the pharmacy's customer/patient registry. It provides a searchable directory of customer profiles that stores contact details, allergy information, insurance numbers, and purchase history. The module serves two distinct use cases:

1. **Standalone customer management** — pharmacy staff browse, add, and review customer records at `/customers`.
2. **POS integration** — the customer search API (`GET /api/customers?q=`) is called inline from the Point of Sale page to auto-fill customer details (name, phone, insurance number) when processing a sale.

The module also exposes a loyalty-points sub-system (`/api/customers/loyalty`) that tracks cumulative spend and assigns Bronze / Silver / Gold tiers.

> **Naming note:** The UI labels this section "Patient Management" and uses the word "patient" throughout the page headings and dialog titles, but the underlying database table, API routes, and data model all use the term `customers`. Both terms refer to the same entity.

---

## Key Files

### Page (`src/app/(dashboard)/customers/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/customers` | Client component. Displays summary stat cards (total, active, new this month), a paginated list of customer records, and an "Add Patient" dialog. Fetches data from `GET /api/customers` on mount and after each mutation. |

### API Routes (`src/app/api/customers/`)

| File | Route | Methods | Description |
|---|---|---|---|
| `route.ts` | `/api/customers` | `GET`, `POST` | Core CRUD. `GET` returns all customers for the authenticated user's pharmacy, or a filtered short-list (id, name, phone, insurance_number) when a `?q=` search query is provided. `POST` creates a new customer record. |
| `history/route.ts` | `/api/customers/history` | `GET` | Returns purchase history for a customer by `?customerId=`. **Currently a hardcoded stub** — data is not read from the database. |
| `loyalty/route.ts` | `/api/customers/loyalty` | `GET`, `POST` | `GET` returns all loyalty records for the pharmacy ordered by points descending. `POST` adds or subtracts points for a customer and recalculates their tier. Reads/writes the `customer_loyalty` table. |

### Related API Routes (other modules)

| File | Route | Description |
|---|---|---|
| `src/app/api/pos/quick-add-patient/route.ts` | `/api/pos/quick-add-patient` | `POST` — Creates a new customer record directly from the POS page without navigating away. Inserts into the `customers` table. |
| `src/app/api/pos/customer-lookup/route.ts` | `/api/pos/customer-lookup` | `GET` — Phone-based customer lookup from the POS page. **Currently a hardcoded stub** — not connected to the database. |

### Sidebar Navigation

| Component | Roles That See the Link |
|---|---|
| `src/components/pharmacy-sidebar.tsx` | `pharmacy_owner`, `cashier`, `staff` |
| `src/components/pharmacist-sidebar.tsx` | `pharmacist` |
| `src/components/sidebar.tsx` (legacy) | All pharmacy roles |

---

## Database Tables

### `customers`

The primary customer registry. Defined in two migrations with slightly different schemas (see Known Limitations §1).

**Canonical schema** (from `supabase/migrations/20240322000004_saas_extensions.sql`):

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `pharmacy_id` | `uuid` | No | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `name` | `text` | No | Customer's full name |
| `phone` | `text` | Yes | Phone number (used for POS search) |
| `email` | `text` | Yes | Email address |
| `date_of_birth` | `date` | Yes | Date of birth |
| `gender` | `text` | Yes | Gender |
| `address` | `text` | Yes | Physical address |
| `insurance_provider_id` | `uuid` | Yes | Foreign key → `insurance_providers.id` |
| `insurance_number` | `text` | Yes | Insurance membership / policy number |
| `allergies` | `text[]` | Yes | Array of known allergens (e.g. `['Penicillin', 'Aspirin']`) |
| `medical_conditions` | `text[]` | Yes | Array of chronic conditions (e.g. `['Hypertension']`) |
| `emergency_contact_name` | `text` | Yes | Emergency contact full name |
| `emergency_contact_phone` | `text` | Yes | Emergency contact phone number |
| `is_active` | `boolean` | No | Whether the customer record is active (default `true`) |
| `created_at` | `timestamptz` | No | Record creation timestamp |
| `updated_at` | `timestamptz` | No | Last update timestamp (auto-maintained by trigger) |

**Indexes:** `idx_customers_pharmacy_id` on `pharmacy_id`; `idx_customers_phone` on `phone`.

**Trigger:** `update_customers_updated_at` — sets `updated_at = now()` on every `UPDATE`.

**RLS policies** (from `supabase/migrations/20240322000005_rls_policies.sql`):

| Policy | Operation | Condition |
|---|---|---|
| `Pharmacy staff can view customers` | `SELECT` | `pharmacy_id = ANY(get_user_pharmacy_ids())` |
| `Pharmacy staff can manage customers` | `ALL` (INSERT, UPDATE, DELETE) | `pharmacy_id = ANY(get_user_pharmacy_ids())` |

Both policies use the `get_user_pharmacy_ids()` helper function, which returns the set of pharmacy IDs the authenticated user belongs to. This enforces strict tenant isolation — staff can only see and modify customers belonging to their own pharmacy.

---

### `customer_loyalty`

Tracks loyalty points and tier status per customer. Defined in `supabase/migrations/20241201000017_transfers_loyalty.sql`.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `pharmacy_id` | `uuid` | No | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `customer_id` | `uuid` | No | Foreign key → `customers.id` (CASCADE DELETE) |
| `points` | `integer` | No | Accumulated loyalty points (default `0`) |
| `tier` | `text` | No | Tier label: `Bronze`, `Silver`, or `Gold` (default `Bronze`) |
| `total_spent` | `decimal(10,2)` | No | Cumulative spend amount (default `0.00`) |
| `created_at` | `timestamptz` | No | Record creation timestamp |
| `updated_at` | `timestamptz` | No | Last update timestamp (auto-maintained by trigger) |

**Tier thresholds** (enforced in `loyalty/route.ts`):

| Tier | Minimum Points |
|---|---|
| Bronze | 0 |
| Silver | 200 |
| Gold | 500 |

**Indexes:** `idx_customer_loyalty_pharmacy_id` on `pharmacy_id`; `idx_customer_loyalty_customer_id` on `customer_id`.

**Trigger:** `update_customer_loyalty_updated_at` — sets `updated_at = now()` on every `UPDATE`.

> **Note:** No RLS policies are defined for `customer_loyalty` in the migration files. Access is controlled only at the API layer via session authentication.

---

## User Roles and Access

| Role | Access Level | Notes |
|---|---|---|
| `superadmin` | None | The superadmin dashboard does not include a customers link. Superadmins manage pharmacies, not individual customer records. |
| `pharmacy_owner` | Full read/write | Customers link appears in `pharmacy-sidebar.tsx`. Can view, add, and manage all customer records for their pharmacy. |
| `pharmacist` | Full read/write | Customers link appears in `pharmacist-sidebar.tsx`. Can view and add customer records. |
| `cashier` | Full read/write | Customers link appears in `pharmacy-sidebar.tsx`. Primarily uses the POS customer search to attach customers to sales. |
| `staff` | Full read/write | Customers link appears in `pharmacy-sidebar.tsx`. |

Access is enforced at two layers:
1. **API layer** — `GET /api/customers` and `POST /api/customers` call `supabase.auth.getUser()` and return an empty array / 401 if no session exists.
2. **Database layer** — RLS policies on the `customers` table restrict all operations to the authenticated user's pharmacy.

---

## Features

### Customer Profiles

Each customer record stores:
- Full name and phone number (required for creation)
- Email address and date of birth (optional)
- Known allergies (stored as a text array in the full schema; as a comma-separated string in the simplified schema)
- Medical conditions (full schema only)
- Emergency contact name and phone (full schema only)
- Active/inactive status

The `/customers` page renders each record as a card showing name, phone, insurance provider, allergies, total purchases (in RWF), last visit date, and an active/inactive badge.

### Insurance Number

The `insurance_number` column stores the customer's insurance membership or policy number (e.g. `RSSB-123456789`, `RAD-987654321`). This value is:
- Displayed in the customer list under the "Insurance" column.
- Returned by the `GET /api/customers?q=` search endpoint so the POS page can auto-fill the insurance field when a customer is selected.
- Stored in the `sales` table's `notes` field as `Insurance: <number>` when a sale is processed with insurance coverage.
- Passed to the `insurance_claims` table as `patient_id_number` when an insurance claim is created.

### Loyalty Points

The `customer_loyalty` table and `/api/customers/loyalty` route implement a points-based loyalty programme:

- **`GET /api/customers/loyalty`** — Returns all loyalty records for the pharmacy, sorted by points descending. Each record includes customer name (joined from `customers`), points, tier, and total spent.
- **`POST /api/customers/loyalty`** — Accepts `{ customerId, points, action }` where `action` is `"add"` or `"subtract"`. Updates the points balance and recalculates the tier automatically.

The loyalty UI is **not wired into the `/customers` page**. The loyalty API exists and reads/writes the database correctly, but there is no UI component that calls it from the customers page. It is also not called automatically when a sale is completed in the POS.

### Purchase History

The `/api/customers/history` route is intended to return a customer's past transactions. It accepts a `?customerId=` query parameter and returns an array of purchase records (date, items, amount, payment method).

**This endpoint is a hardcoded stub.** The data is defined as a static JavaScript object in the route file and is not connected to the `sales` or `sale_items` tables. Only two fictional customer IDs (`CUST001`, `CUST002`) return data; all other IDs return an empty array.

### POS Customer Search

The most actively used customer feature is the inline search in the POS page (`src/app/(dashboard)/pos/page.tsx`). When a cashier types at least 2 characters into the "Customer Name" field:

1. The POS page calls `GET /api/customers?q=<query>`.
2. The API searches `customers.name` and `customers.phone` using a case-insensitive `ilike` filter, limited to 5 results.
3. Results are returned as `{ id, name, phone, insurance_number }` — a minimal projection to avoid over-fetching.
4. The POS page renders a dropdown of suggestions; selecting one auto-fills the customer name, phone, and insurance number fields.

A "Quick Add Patient" button in the POS dialog calls `POST /api/pos/quick-add-patient` to create a new customer record without leaving the POS screen.

### Summary Statistics

The `/customers` page displays three stat cards:
- **Total Patients** — count of all records returned by `GET /api/customers`.
- **Active Patients** — count of records where `status === 'active'`.
- **New This Month** — approximated as `Math.floor(totalCustomers * 0.1)`. This is a placeholder calculation, not a real database query.

Each stat card includes a small sparkline chart using Recharts `AreaChart` with hardcoded historical data points.

---

## Data Flow

```
/customers page (client component)
        │
        │  GET /api/customers
        ▼
API route (route.ts)
        │  supabase.auth.getUser()
        │  SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?
        │  SELECT * FROM customers WHERE pharmacy_id = ?
        │  RLS enforces tenant isolation
        ▼
PostgreSQL (customers table)
        │
        ▼
Formatted response → page re-renders customer list

POST /api/customers (add new customer)
        │  supabase.auth.getUser()
        │  SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?
        │  INSERT INTO customers (pharmacy_id, name, phone, email, insurance_number)
        ▼
PostgreSQL → returns new record → page calls fetchCustomers() to refresh

POS page customer search
        │  GET /api/customers?q=<query>
        │  SELECT id, name, phone, insurance_number FROM customers
        │  WHERE pharmacy_id = ? AND (name ILIKE ? OR phone ILIKE ?)
        │  LIMIT 5
        ▼
Dropdown suggestions → user selects → POS fields auto-filled
```

---

## Known Limitations

### 1. Duplicate `customers` table definitions

The `customers` table is defined in **two separate migration files** with different schemas:

- `20240322000004_saas_extensions.sql` — Full schema with `insurance_provider_id` (FK), `allergies text[]`, `medical_conditions text[]`, `emergency_contact_name`, `emergency_contact_phone`, `is_active`.
- `20241201000015_missing_tables.sql` — Simplified schema with `allergies text DEFAULT 'None'`, `insurance text DEFAULT 'None'`, `total_purchases decimal`, `last_visit date`, `status text`. No `insurance_provider_id` FK, no `medical_conditions`, no emergency contact fields.

Both use `CREATE TABLE IF NOT EXISTS`, so whichever ran first wins. The API route (`route.ts`) reads `c.insurance_number` and `c.allergies` (array), which matches the full schema. The simplified schema stores `insurance` (not `insurance_number`) and `allergies` as a plain text string. This mismatch means the API may silently return empty values for `insurance_number` if the simplified schema is active.

### 2. Purchase history is a hardcoded stub

`src/app/api/customers/history/route.ts` returns static data for two fictional customer IDs. It does not query the `sales` or `sale_items` tables. Real purchase history is not accessible through this endpoint.

### 3. "New This Month" stat is an approximation

The "New This Month" counter on the customers page is calculated as `Math.floor(totalCustomers * 0.1)` — a rough 10% estimate of the total count. It does not filter by `created_at >= start of current month`.

### 4. Loyalty points not auto-awarded on sale completion

The `POST /api/customers/loyalty` endpoint exists and works correctly, but it is never called by the POS sale completion flow (`POST /api/pos/sale`). Loyalty points must be manually adjusted via the API. There is no UI on the customers page to view or manage loyalty points.

### 5. `customer_loyalty` has no RLS policies

Unlike the `customers` table, `customer_loyalty` has no Row Level Security policies defined in the migrations. Access is controlled only by the API route's session check. Direct database access (e.g., via the Supabase dashboard or a compromised service role key) would expose all loyalty records across all pharmacies.

### 6. `/api/pos/customer-lookup` is a hardcoded stub

`src/app/api/pos/customer-lookup/route.ts` returns a static array of two fictional customers filtered by phone number. It is not connected to the `customers` table. The POS page calls this endpoint from a "Lookup" button, but the results are always the same hardcoded data.

### 7. No customer edit or delete UI

The `/customers` page only supports adding new customers. There is no UI to edit an existing customer's details (e.g., update phone number, add allergies) or to deactivate/delete a record. The `POST /api/customers` route only handles creation; no `PUT`, `PATCH`, or `DELETE` handlers are implemented.

### 8. `totalPurchases` and `lastVisit` are not computed from sales data

The `GET /api/customers` response maps `totalPurchases: 0` for every customer — it does not aggregate from the `sales` table. The `lastVisit` field is set to `c.created_at` (the record creation date), not the date of the customer's most recent sale.

### 9. Page title mismatch

The page heading reads "Patient Management" and the add dialog says "Add New Patient", but the route is `/customers` and the module is documented as Customers. This inconsistency may confuse users who expect a separate Patients module (which also exists at `/patients` and calls the same `/api/customers` endpoint).
