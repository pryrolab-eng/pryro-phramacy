# Branches Module

## Purpose

The Branches module enables a pharmacy owner to manage multiple physical locations (branches) under a single Pryrox tenant. Each branch is a named, addressable location with its own contact details, manager assignment, and short identifier code. The module also exposes a stock-transfer dialog that allows users to initiate inventory movements between branches.

This module is part of the multi-branch expansion feature introduced alongside `multi_branch_schema.sql` and `add_branch_support.sql`. It is scoped to the `pharmacy_owner` role; pharmacists and cashiers do not have access to branch management.

---

## Key Files

### Page (`src/app/(dashboard)/branches/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/branches` | Client component. Fetches and displays all active branches as cards. Provides an "Add Branch" dialog (modal form) and a "Stock Transfer" dialog. Handles branch creation via `POST /api/branches` and branch inventory preview via `GET /api/branches/[id]`. Falls back to hardcoded mock data if the API call fails. |

### API Routes (`src/app/api/branches/`)

| File | Route | Methods | Description |
|---|---|---|---|
| `route.ts` | `/api/branches` | `GET`, `POST` | `GET` returns all active branches for the current pharmacy, formatted for the frontend. `POST` creates a new branch record. |
| `[id]/route.ts` | `/api/branches/[id]` | `GET`, `PUT` | `GET` returns branch inventory (currently returns hardcoded mock data). `PUT` updates a branch record (currently echoes the request body without persisting to the database). |

### Sidebar (`src/components/sidebar.tsx`)

The `pharmacyOwnerNavigation` array includes `{ name: 'Branches', href: '/branches', icon: Building2 }`. The Branches link is rendered only for users whose role resolves to `pharmacy_owner` (the default for any user not identified as `superadmin` or `pharmacist`).

### Schema Files (root-level, not in `supabase/migrations/`)

| File | Description |
|---|---|
| `multi_branch_schema.sql` | Defines the `branches` table with `code`, `manager_name`, and `is_main` columns; adds `branch_id` to `inventory`; defines `stock_transfers` table; includes RLS policies referencing `user_profiles`. |
| `add_branch_support.sql` | Adds `branch_id uuid REFERENCES branches(id)` column to `pharmacy_users`, enabling per-user branch assignment. |
| `create-stock-locations-table.sql` | Defines the `stock_locations` table (warehouse/storage areas within a pharmacy) with RLS policies. Seeds four default locations: Main Store, Branch, Cold Storage, Warehouse. |

---

## Database Tables

### `branches`

Defined in `supabase/migrations/20241201000015_missing_tables.sql`. Stores one record per physical pharmacy location.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `pharmacy_id` | `uuid` | Yes | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `name` | `text` | No | Human-readable branch name (e.g., "Remera Branch") |
| `address` | `text` | Yes | Full street address |
| `phone` | `text` | Yes | Branch contact phone number |
| `manager_id` | `uuid` | Yes | Foreign key → `auth.users.id`; the assigned branch manager |
| `is_active` | `boolean` | No | Whether the branch is currently operational (default `true`) |
| `created_at` | `timestamptz` | No | Record creation timestamp (default `now()`) |
| `updated_at` | `timestamptz` | No | Last update timestamp, maintained by `update_branches_updated_at` trigger |

**Indexes:** `idx_branches_pharmacy_id` on `(pharmacy_id)`.

**Trigger:** `update_branches_updated_at` — fires `BEFORE UPDATE` to set `updated_at = now()`.

**RLS:** No RLS policies are defined for `branches` in the official migrations. The `multi_branch_schema.sql` root file defines a `SELECT` policy referencing `user_profiles`, but this table name does not match the application's `pharmacy_users` table. The policy is not applied in the official migration history.

> **Note:** The `multi_branch_schema.sql` root file defines a richer schema for `branches` (adds `code text UNIQUE NOT NULL`, `manager_name text`, `is_main boolean`) that is not present in the official migration. The page component's `Branch` TypeScript interface (`code`, `manager_name`, `is_main`) matches the root-file schema, not the migration schema. This mismatch means the page may fail to display `code` and `manager_name` fields when reading from the actual database.

### `stock_locations`

Defined in `create-stock-locations-table.sql` (root-level; not in `supabase/migrations/`). Represents named storage areas within a pharmacy (e.g., Main Store, Cold Storage, Warehouse). Used by the Settings module to let pharmacy owners configure where stock is physically kept.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `pharmacy_id` | `uuid` | No | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `name` | `varchar(100)` | No | Location name (e.g., "Cold Storage") |
| `description` | `text` | Yes | Free-text description of the location |
| `is_active` | `boolean` | No | Whether the location is in use (default `true`) |
| `created_at` | `timestamp` | No | Record creation timestamp |
| `updated_at` | `timestamp` | No | Last update timestamp |

**Indexes:** `idx_stock_locations_pharmacy` on `(pharmacy_id)`, `idx_stock_locations_active` on `(is_active)`.

**RLS policies:**
- `"Users can view their pharmacy locations"` — `SELECT` allowed when `pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)`.
- `"Users can insert locations for their pharmacy"` — `INSERT` allowed under the same condition.
- `"Users can update their pharmacy locations"` — `UPDATE` allowed under the same condition.

**Default seed data:** Four locations are inserted for every existing pharmacy on first run: Main Store, Branch, Cold Storage, Warehouse.

### `inventory_transfers`

Defined in `supabase/migrations/20241201000017_transfers_loyalty.sql`. Records inter-branch stock movement requests.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `pharmacy_id` | `uuid` | Yes | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `medication_name` | `text` | No | Name of the medication being transferred |
| `quantity` | `integer` | No | Number of units to transfer |
| `from_branch_id` | `uuid` | Yes | Foreign key → `branches.id`; source branch |
| `to_branch_id` | `uuid` | Yes | Foreign key → `branches.id`; destination branch |
| `status` | `text` | No | Transfer status: `pending`, `completed`, `cancelled` (default `pending`) |
| `created_at` | `timestamptz` | No | Record creation timestamp |
| `completed_at` | `timestamptz` | Yes | Timestamp when the transfer was completed |

**Indexes:** `idx_inventory_transfers_pharmacy_id`, `idx_inventory_transfers_status`.

### `pharmacy_users` (branch assignment column)

`add_branch_support.sql` adds a `branch_id uuid REFERENCES branches(id)` column to `pharmacy_users`. This allows individual staff members (particularly pharmacists) to be assigned to a specific branch, while pharmacy owners retain access to all branches.

---

## User Roles and Access

| Role | Access |
|---|---|
| `pharmacy_owner` | Full access — Branches link appears in sidebar. Can view all branches, create new branches, edit existing branches, view branch stock, and initiate stock transfers. |
| `pharmacist` | No access — Branches link is not in `pharmacistNavigation`. The `/branches` route is protected by middleware (redirects unauthenticated users) but there is no server-side role check on the page itself. |
| `cashier` | No access — Cashiers use the `pharmacyOwnerNavigation` sidebar (same as `pharmacy_owner`), so the Branches link is visible to cashiers as well. This appears to be unintentional. |
| `staff` | No access — Same sidebar as `pharmacy_owner`; Branches link is visible. |
| `superadmin` | No access — Superadmin uses `superAdminNavigation`, which does not include Branches. |

> **Note:** The sidebar role resolution defaults any user who is not `superadmin` or `pharmacist` to `pharmacyOwnerNavigation`. This means `cashier` and `staff` roles see the Branches link and can navigate to `/branches`. There is no server-side role guard on the page or API routes to prevent this.

---

## Features

### Branch Listing

On page load, `BranchesPage` calls `GET /api/branches`. The API queries `branches WHERE is_active = true ORDER BY created_at DESC` and returns a formatted array. Each branch is displayed as a card showing:

- Branch name and short code
- Active/Inactive badge; blue border for the main branch
- Address, phone number, and manager name
- "Edit" and "View Stock" action buttons

If the API call throws (network error or non-OK response), the component falls back to two hardcoded mock branches (Main Branch and Remera Branch).

### Branch Creation

Clicking "Add Branch" opens a modal dialog with fields for:

- Branch Name and Branch Code (auto-uppercased)
- Address
- Phone and Manager Name
- "Main Branch" checkbox

On submit, the page calls `POST /api/branches` with the form data. The API inserts a row into `branches` using the `pharmacy_id` from the request body. On success, the branch list is refreshed.

> **Limitation:** The `POST` handler uses `body.pharmacy_id || 'userPharmacy.pharmacy_id'` as a fallback — the string literal `'userPharmacy.pharmacy_id'` is used verbatim if no `pharmacy_id` is provided. The page sends `pharmacy_id: 'current-pharmacy-id'` (another placeholder string). Neither value is the actual authenticated user's pharmacy ID. Branch creation will insert rows with invalid `pharmacy_id` values unless the client is updated to pass the real ID.

### Branch Editing

Clicking "Edit" on a branch card pre-fills the "Add Branch" dialog with the branch's current values and re-opens it. However, the submit handler always calls `POST /api/branches` (create), not `PUT /api/branches/[id]` (update). Editing a branch creates a duplicate record rather than updating the existing one.

### Branch Inventory Preview

Clicking "View Stock" on a branch card calls `GET /api/branches/[id]`. The `[id]` route handler returns a hardcoded array of two mock inventory items (Paracetamol 500mg × 100, Amoxicillin 250mg × 50) regardless of which branch is selected. The result is displayed in a browser `alert()` dialog.

### Stock Transfer Dialog

Clicking "Stock Transfer" opens a modal with:

- From Branch / To Branch dropdowns (populated from the loaded branch list)
- Product search input
- Quantity input
- Notes input

Clicking "Submit Transfer" shows a browser `alert('Transfer request submitted!')` and closes the dialog. No API call is made; no `inventory_transfers` record is created.

---

## Data Flow

```
User navigates to /branches
        │
        ▼
BranchesPage (client component)
        │  useEffect → fetchBranches()
        │  fetch('GET /api/branches')
        ▼
/api/branches GET handler
        │  createClient() → supabase server client
        │  supabase.from('branches').select('*').eq('is_active', true)
        │  Maps rows to frontend-compatible shape
        ▼
Branch cards rendered in 3-column grid
        │
        ├─ "Add Branch" button → Dialog → POST /api/branches
        │       └─ supabase.from('branches').insert({...}).select().single()
        │
        ├─ "View Stock" button → GET /api/branches/[id]
        │       └─ Returns hardcoded mock inventory (not real data)
        │
        └─ "Stock Transfer" button → Dialog → alert() only (no API call)
```

---

## Known Limitations

### 1. Schema mismatch between migration and page component

The official migration (`20241201000015_missing_tables.sql`) defines `branches` without `code`, `manager_name`, or `is_main` columns. The page component's `Branch` TypeScript interface and the `multi_branch_schema.sql` root file include these columns. If the database was provisioned from the official migrations only, the `code` and `manager_name` fields will be `undefined` for every branch, and the "Main Branch" badge will never appear.

### 2. Branch creation uses placeholder `pharmacy_id`

`POST /api/branches` receives `pharmacy_id: 'current-pharmacy-id'` from the page. The API handler uses this value directly without resolving the authenticated user's actual pharmacy. New branches are inserted with an invalid `pharmacy_id` and will not be visible to any real pharmacy tenant.

### 3. Edit branch creates a duplicate instead of updating

The "Edit" button pre-fills the form but submits via `POST` (create) rather than `PUT /api/branches/[id]` (update). Every edit produces a new branch record.

### 4. `PUT /api/branches/[id]` does not persist changes

The `PUT` handler echoes the request body as `{ success: true, branch: { id, ...body } }` without calling Supabase. No database write occurs.

### 5. Branch inventory is hardcoded mock data

`GET /api/branches/[id]` always returns the same two mock items regardless of branch ID. It does not query the `inventory` or `medications` tables.

### 6. Stock transfer dialog is non-functional

The stock transfer form collects input but does not call any API. No `inventory_transfers` record is created. The feature is UI-only scaffolding.

### 7. No server-side authentication or role check on API routes

Neither `/api/branches` nor `/api/branches/[id]` calls `supabase.auth.getUser()` to verify the session. Any unauthenticated request that bypasses the middleware (e.g., direct API call) can read or write branch data. The `GET /api/branches` handler also does not filter by the authenticated user's `pharmacy_id`, so it returns all active branches across all tenants.

### 8. No RLS on `branches` table in official migrations

The `branches` table has no Row Level Security policies in `supabase/migrations/`. The RLS policy in `multi_branch_schema.sql` references `user_profiles` (a table that does not exist in the application schema) and is not part of the official migration history. Tenant isolation for branches relies entirely on application-layer filtering, which is currently absent.

### 9. `cashier` and `staff` roles can access `/branches`

The sidebar defaults non-superadmin, non-pharmacist users to `pharmacyOwnerNavigation`, which includes the Branches link. There is no page-level or API-level guard preventing cashiers or staff from viewing and creating branches.

### 10. `stock_locations` table is not in official migrations

`create-stock-locations-table.sql` is a root-level loose file, not a versioned migration under `supabase/migrations/`. The `stock_locations` table may not exist in all environments. The Settings module references this table for stock location management.
