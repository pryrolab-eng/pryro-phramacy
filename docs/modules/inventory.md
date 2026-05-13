# Inventory Module

## Purpose

The Inventory module is the central stock management system for Pryrox. It allows pharmacy staff to track every drug and product in the pharmacy, manage stock levels, record purchases from suppliers, transfer stock between locations, and receive automated alerts when items run low or approach expiry.

The module is built around two linked database tables: `medications` (the drug master catalogue) and `inventory` (the per-batch stock records). Each inventory record ties a specific batch of a medication to a quantity, cost, selling price, expiry date, and minimum stock threshold. This separation allows a single medication to have multiple active batches with different expiry dates and costs.

The page is accessible at `/inventory` and is protected by `middleware.ts`, which redirects unauthenticated users to `/sign-in`.

---

## Key Files

### Page (`src/app/(dashboard)/inventory/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/inventory` | Single-page client component (~700 lines). Renders the full inventory UI: product table, analytics charts, stock adjustment dialogs, purchase dialogs, transfer dialogs, barcode generator, and Excel import/export. Fetches data from `/api/inventory`, `/api/categories`, `/api/inventory/suppliers`, and `/api/inventory/analytics` on mount. Subscribes to real-time updates via `useRealtimeUpdates`. |

### API Routes (`src/app/api/inventory/`)

| Route File | HTTP Methods | Description |
|---|---|---|
| `route.ts` | `GET`, `POST` | List all inventory items for the authenticated user's pharmacy (with `medications` join). Create a new inventory record directly (requires `medication_id`). |
| `[id]/route.ts` | `PUT`, `DELETE` | Update `quantity_in_stock`, `selling_price`, and `minimum_stock_level` for a specific inventory record. Delete an inventory record. |
| `add/route.ts` | `POST` | High-level add endpoint used by the UI. Accepts a product name and category string, looks up or creates the `medications` record, then creates the `inventory` record. Handles the category-string-to-enum mapping. |
| `adjustment/route.ts` | `POST` | Increase or decrease `quantity_in_stock` by a given amount with a reason. Enforces a floor of 0 on decreases. |
| `purchase/route.ts` | `POST` | Record a stock purchase: adds `quantity` to `quantity_in_stock` and optionally updates `unit_cost`. Does not create a purchase order record. |
| `transfers/route.ts` | `GET`, `POST` | List all `inventory_transfers` records. Create a transfer: deducts stock from the source inventory item and inserts an `inventory_transfers` record with `from_branch_id` and `to_branch_id`. |
| `analytics/route.ts` | `GET` | Returns `stockByCategory` (stock count and value per medication category) and `inventoryTrend` (estimated monthly inventory value trend based on current value). |
| `expiry-alerts/route.ts` | `GET` | **Stub — returns hardcoded data.** Returns a static array of three expiry alert objects. Not connected to the database. |
| `suppliers/route.ts` | `GET`, `POST` | List active suppliers from the `suppliers` table. Create a new supplier record scoped to the authenticated pharmacy. |

### Related API Routes

| Route File | HTTP Methods | Description |
|---|---|---|
| `src/app/api/categories/route.ts` | `GET`, `POST` | List categories visible to the pharmacy (global categories where `is_global = true` plus pharmacy-specific categories). Create a new pharmacy-specific category. |
| `src/app/api/categories/[id]/route.ts` | `PUT`, `DELETE` | Update or delete a pharmacy-specific category. Enforces `pharmacy_id` ownership — cannot modify global categories. |
| `src/app/api/drugs/route.ts` | `GET`, `POST` | **Stub — returns hardcoded data.** Returns a static array of three drug objects. Not connected to the database. Must be removed before production. |
| `src/app/api/stock-alerts/route.ts` | `GET` | Returns all inventory items for the pharmacy with computed `expires_in` (days). Splits results into `lowStock` (items at or below `minimum_stock_level`) and `expiring` (items expiring within 60 days). |
| `src/app/api/settings/locations/route.ts` | `GET`, `POST` | List and create `stock_locations` records for the pharmacy. Falls back to four hardcoded default locations if the `stock_locations` table does not exist. |

### Hooks and Utilities

| File | Description |
|---|---|
| `src/hooks/usePharmacyStore.ts` | React context providing `inventory` array and `setInventory` / `updateStock` actions. The inventory page writes fetched data into this store so other components (e.g., POS) can read current stock without re-fetching. |
| `src/hooks/useRealtimeUpdates.ts` | Polls `/api/realtime/updates` every 5 seconds. When an `inventory_update` event is received, the inventory page calls `fetchInventory()` to refresh the list. Note: this is a polling stub, not a true Supabase Realtime WebSocket subscription. |

---

## Database Tables

### `medications`

The drug master catalogue. One row per unique drug/product per pharmacy.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE). Scopes the medication to a single tenant. |
| `name` | `text` | Drug or product name (e.g., "Paracetamol 500mg") |
| `generic_name` | `text` | Generic/INN name (nullable) |
| `brand_name` | `text` | Brand name (nullable) |
| `category` | `medication_category` enum | `prescription`, `otc`, `controlled`, `supplement`, `medical_device` |
| `dosage_form` | `text` | Tablet, syrup, injection, etc. (nullable) |
| `strength` | `text` | Dosage strength (nullable) |
| `manufacturer` | `text` | Manufacturer name (nullable) |
| `barcode` | `text` | Product barcode (nullable) |
| `description` | `text` | Free-text description (nullable) |
| `requires_prescription` | `boolean` | Whether a prescription is required (default `false`) |
| `is_active` | `boolean` | Soft-delete flag (default `true`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

**Indexes:** `idx_medications_pharmacy_id` on `pharmacy_id`, `idx_medications_barcode` on `barcode`.

**Realtime:** Enabled via `supabase_realtime` publication.

> **Note:** The design document and task spec refer to this table as both `medications` and `inventory_items`. The actual table name in the schema is `medications`. There is no separate `inventory_items` table.

---

### `inventory`

Per-batch stock records. One row per batch of a medication at a pharmacy.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE) |
| `medication_id` | `uuid` | FK → `medications.id` (CASCADE DELETE) |
| `supplier_id` | `uuid` | FK → `suppliers.id` (nullable) |
| `batch_number` | `text` | Batch/lot number (required) |
| `quantity_in_stock` | `integer` | Current stock count (default `0`) |
| `unit_cost` | `decimal(10,2)` | Purchase cost per unit (default `0.00`) |
| `selling_price` | `decimal(10,2)` | Retail selling price per unit (default `0.00`) |
| `minimum_stock_level` | `integer` | Low-stock alert threshold (default `0`) |
| `expiry_date` | `date` | Batch expiry date (nullable) |
| `manufacturing_date` | `date` | Manufacturing date (nullable) |
| `received_date` | `timestamptz` | When the batch was received (default `now()`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

**Indexes:** `idx_inventory_pharmacy_id` on `pharmacy_id`, `idx_inventory_medication_id` on `medication_id`, `idx_inventory_expiry_date` on `expiry_date`.

**Realtime:** Enabled via `supabase_realtime` publication.

**Stock deduction trigger:** `handle_sale_stock_update_trigger` fires `AFTER INSERT ON sale_items` and decrements `quantity_in_stock` automatically when a sale is recorded. It also inserts a `stock_movements` record.

---

### `categories`

Drug and product categories. Supports both platform-wide global categories (managed by the admin) and pharmacy-specific categories.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (nullable). `null` for global categories. |
| `name` | `text` | Category name |
| `description` | `text` | Optional description |
| `is_global` | `boolean` | `true` for platform-wide categories managed by the admin dashboard. Added via `add-global-categories.sql` (not in the official migrations directory). |
| `is_active` | `boolean` | Whether the category is visible (default `true`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

**Index:** `idx_categories_pharmacy_id` on `pharmacy_id`.

**Category visibility rule:** `GET /api/categories` returns rows where `is_global = true` OR `pharmacy_id = user's pharmacy`. This means every pharmacy sees the global categories plus their own custom categories.

---

### `stock_locations`

Named storage locations within a pharmacy (e.g., Main Store, Cold Storage, Warehouse). Used to assign inventory items to physical locations.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE). NOT NULL. |
| `name` | `varchar(100)` | Location name |
| `description` | `text` | Optional description |
| `is_active` | `boolean` | Whether the location is active (default `true`) |
| `created_at` | `timestamp` | Record creation timestamp |
| `updated_at` | `timestamp` | Last update timestamp |

**Indexes:** `idx_stock_locations_pharmacy` on `pharmacy_id`, `idx_stock_locations_active` on `is_active`.

**RLS:** Enabled. Users can only view, insert, and update locations belonging to their own pharmacy (via `pharmacy_users` lookup).

> **Note:** The `stock_locations` table is **not** in the official `supabase/migrations/` directory. It is defined in the root-level `create-stock-locations-table.sql` file. The `GET /api/settings/locations` route falls back to four hardcoded default locations if the table does not exist in the database.

---

### `suppliers`

Supplier records per pharmacy.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE) |
| `name` | `text` | Supplier name |
| `contact_person` | `text` | Contact person name (nullable) |
| `email` | `text` | Contact email (nullable) |
| `phone` | `text` | Contact phone (nullable) |
| `address` | `text` | Supplier address (nullable) |
| `is_active` | `boolean` | Soft-delete flag (default `true`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

---

### `inventory_transfers`

Records of stock moved between branches or locations.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE) |
| `medication_name` | `text` | Name of the transferred medication (denormalized) |
| `quantity` | `integer` | Number of units transferred |
| `from_branch_id` | `uuid` | FK → `branches.id` (nullable) |
| `to_branch_id` | `uuid` | FK → `branches.id` (nullable) |
| `status` | `text` | `pending`, `completed`, or `cancelled` (default `pending`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `completed_at` | `timestamptz` | When the transfer was completed (nullable) |

**Indexes:** `idx_inventory_transfers_pharmacy_id` on `pharmacy_id`, `idx_inventory_transfers_status` on `status`.

---

### `stock_movements`

Audit log of all stock changes. Automatically populated by the `handle_sale_stock_update_trigger` when a sale is recorded.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE) |
| `inventory_id` | `uuid` | FK → `inventory.id` (CASCADE DELETE) |
| `movement_type` | `text` | `in`, `out`, `adjustment`, `expired`, `damaged` |
| `quantity` | `integer` | Units moved |
| `reference_id` | `uuid` | FK to the source record (e.g., `sale_id`) |
| `reference_type` | `text` | `sale`, `purchase`, `adjustment`, etc. |
| `notes` | `text` | Free-text notes (nullable) |
| `created_by` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | Record creation timestamp |

---

## User Roles and Access

The `/inventory` route is protected by `middleware.ts`. Any authenticated user with a valid `pharmacy_users` record can access the page. There is no role-based restriction within the inventory page itself — all roles that can reach the dashboard can view and modify inventory.

| Role | Access |
|---|---|
| `superadmin` | Full access (platform-level; can view any pharmacy's inventory via the superadmin dashboard) |
| `pharmacy_owner` | Full access to their pharmacy's inventory |
| `pharmacist` | Full access to their pharmacy's inventory |
| `cashier` | Full access to their pharmacy's inventory (no role restriction in the UI) |
| `staff` | Full access to their pharmacy's inventory (no role restriction in the UI) |

> **Note:** The inventory API routes verify that the user has an active `pharmacy_users` record and scope all queries to that pharmacy's `pharmacy_id`. However, there is no role-level restriction — a `cashier` can add, edit, or delete inventory items the same as a `pharmacy_owner`. Role-based write restrictions are not implemented.

---

## Features

### Add Drug / Product

Triggered by the "Add Product" button. Opens a dialog with fields for:
- Product name, category (dropdown from `/api/categories`), batch number
- Purchase price, selling price, stock quantity, minimum stock level
- Expiry date, VAT rate, stock location, notes

On submit, `handleAddProduct` calls `POST /api/inventory/add`. The route:
1. Looks up the user's `pharmacy_id` from `pharmacy_users`.
2. Checks if a `medications` record with the same name already exists for the pharmacy.
3. If it exists and has an `inventory` record, increments `quantity_in_stock` instead of creating a duplicate.
4. If the medication is new, inserts into `medications` (mapping the category string to the `medication_category` enum), then inserts into `inventory`.

**Validation:** Required fields are `name`, `category`, `stock`, and `minStock`. Validation is client-side only (`alert()` calls) — there is no server-side field validation beyond type coercion.

---

### Edit Drug

Triggered by the Edit action in the row dropdown menu. Opens a dialog pre-populated with the item's current values. On submit, `handleEditProduct` calls `PUT /api/inventory/[id]` with `quantity`, `selling_price`, and `minimum_stock_level`.

**Limitation:** Only three fields can be edited via the UI. Name, category, batch number, expiry date, and other fields cannot be changed after creation.

---

### Delete Drug

Triggered by the Delete action in the row dropdown menu. Shows a confirmation `AlertDialog`. On confirm, `handleDeleteProduct` calls `DELETE /api/inventory/[id]`. The record is hard-deleted from the `inventory` table. The associated `medications` record is not deleted.

---

### Category Management

Categories are loaded from `GET /api/categories` on page mount. The inventory page provides a "Quick Add Category" inline form that calls `POST /api/categories` to create a pharmacy-specific category without leaving the page.

Full category management (create, edit, delete, view global categories) is available in the admin dashboard at `/admin/categories`.

---

### Stock Location Assignment

When adding a product, the user can select a stock location from a dropdown. The default value is `'main-store'`. The available locations are loaded from `GET /api/settings/locations`.

**Limitation:** The selected `stockLocation` value is stored in the UI form state but is **not persisted** to the `inventory` table. The `inventory` schema has no `stock_location_id` column. Stock location assignment is UI-only and is lost on page refresh.

---

### Stock Adjustment

Triggered by the "Adjust Stock" button. Opens a dialog to increase or decrease `quantity_in_stock` by a specified amount with a reason. Calls `POST /api/inventory/adjustment`.

The adjustment reason is accepted by the UI but is **not stored** in the database — the route only updates `quantity_in_stock`. No `stock_movements` record is created for manual adjustments (only sales trigger the movement trigger).

---

### Purchase / Restock

Triggered by the "Purchase" button. Opens a dialog to record a stock purchase from a supplier. Calls `POST /api/inventory/purchase` with `productId`, `quantity`, `costPrice`, and `supplier`.

The route adds the quantity to `quantity_in_stock` and optionally updates `unit_cost`. The `supplier` field is accepted but not stored — there is no purchase order table and no link to the `suppliers` table from this route.

---

### Stock Transfer

Triggered by the "Transfer" button. Opens a dialog to move stock between locations. Calls `POST /api/inventory/transfers`.

The route:
1. Checks that `quantity_in_stock >= transfer quantity`.
2. Deducts the quantity from the source inventory item.
3. Inserts an `inventory_transfers` record with `from_branch_id` and `to_branch_id`.

**Limitation:** The transfer form uses free-text location names (`fromLocation`, `toLocation`) rather than branch UUIDs. The route stores these strings in `from_branch_id` / `to_branch_id` columns that are typed as `uuid` FK references to `branches`. This will cause a database error if the values are not valid UUIDs matching existing `branches` records.

---

### Low-Stock Alerts

The inventory table displays a color-coded stock status badge per item:
- **Low Stock** (red): `stock <= minStock`
- **Medium** (secondary): `stock <= minStock * 2`
- **In Stock** (default): otherwise

The `GET /api/stock-alerts` endpoint provides a structured alert feed used by other parts of the dashboard (e.g., the pharmacist dashboard). It returns `lowStock` (items at or below threshold) and `expiring` (items expiring within 60 days).

---

### Expiry Alerts

The inventory table displays a color-coded expiry badge per item:
- **Red** (≤ 30 days): urgent
- **Secondary** (≤ 60 days): warning
- **Outline** (> 60 days): normal

The `GET /api/inventory/expiry-alerts` endpoint is a **stub** that returns three hardcoded items. It is not connected to the database and does not reflect real expiry data.

---

### Barcode Generation

Triggered by the QR code icon in the row actions. Opens a dialog with a `<canvas>` element. Uses `JsBarcode` (CODE128 format) to render a barcode for the selected product. The barcode value can be:
- Product name (default)
- Selling price
- Both (name + price)

A "Print" button opens a new browser window with the barcode image and triggers `window.print()`. Bulk barcode printing is available in bulk-select mode — select multiple products and print all barcodes in a 3-column grid layout.

---

### Excel Export

The "Export" button calls `exportToExcel()`, which uses the `xlsx` library to generate an `.xlsx` file from the current `inventory` array in the Zustand store. The exported columns are: Product Name, Category, Stock, Min Stock, Price (RWF), Expiry Date, Batch Number.

The file is named `inventory-YYYY-MM-DD.xlsx` and downloaded directly in the browser.

---

### Excel Import

The "Import" button opens a dialog for bulk product import from an `.xlsx` or `.xls` file. The flow:
1. User uploads a file; `handleExcelImport` reads it with `xlsx` and calls `validateAndPreview`.
2. `validateAndPreview` checks required columns (Product Name, Category, Stock, Min Stock, Price (RWF), Expiry Date, Batch Number) and shows a preview of the first three rows plus any validation errors.
3. If there are no errors, the user clicks "Import N Products". `confirmImport` calls `POST /api/inventory/add` sequentially for each row.

A "Download Sample" button generates a two-row sample `.xlsx` file to guide the user on the expected format.

**Limitation:** Import calls are made sequentially in a `for` loop with no error recovery. If one row fails, the loop continues but the failed row is silently skipped. There is no rollback or partial-import report.

---

### Analytics Charts

The inventory page includes a "Stock Analytics" section with two Recharts charts:
- **Stock by Category** (bar chart): `quantity_in_stock` and value per `medication_category`, sourced from `GET /api/inventory/analytics`.
- **Inventory Trend** (area chart): estimated monthly inventory value trend. The trend is **not derived from historical data** — it is computed by scaling the current total inventory value across the months of the current year using a linear interpolation formula.

---

### Search and Filter

A search input filters the displayed inventory list client-side by product name (case-insensitive substring match). A category dropdown filters by category. Both filters operate on the in-memory `localInventory` array — no server-side filtering is performed.

A `Command` palette (keyboard shortcut) provides quick product search across the full inventory list.

---

### Bulk Operations

A "Bulk Mode" toggle enables checkboxes on each row. Selected products can have their barcodes printed in bulk via `printBulkBarcodes()`. There is no bulk delete or bulk edit in the current implementation.

---

### Pagination

The inventory table includes a `Pagination` component from shadcn/ui. However, the pagination is **not wired to any state** — the page number display is present but clicking Previous/Next does not change which items are shown. All items are rendered in the table simultaneously.

---

## Data Flow

```
User opens /inventory
        │
        ▼
InventoryPage mounts (client component)
        │
        ├─ fetchInventory() → GET /api/inventory
        │       │  supabase.auth.getUser() → verify session
        │       │  pharmacy_users → resolve pharmacy_id
        │       │  inventory JOIN medications (inner) → filter by pharmacy_id
        │       └─ Returns formatted array → setLocalInventory + setInventory (store)
        │
        ├─ fetchCategories() → GET /api/categories
        │       └─ Returns global + pharmacy-specific categories
        │
        ├─ fetchSuppliers() → GET /api/inventory/suppliers
        │       └─ Returns active suppliers
        │
        ├─ fetchAnalytics() → GET /api/inventory/analytics
        │       └─ Returns stockByCategory + inventoryTrend
        │
        └─ useRealtimeUpdates → polls /api/realtime/updates every 5s
                └─ On inventory_update event → fetchInventory()

User adds product
        │
        ▼
handleAddProduct() → POST /api/inventory/add
        │  Lookup/create medications record
        │  Insert inventory record
        └─ fetchInventory() → refresh list

User edits product
        │
        ▼
handleEditProduct() → PUT /api/inventory/[id]
        └─ fetchInventory() → refresh list

User deletes product
        │
        ▼
handleDeleteProduct() → DELETE /api/inventory/[id]
        └─ fetchInventory() → refresh list

User adjusts stock
        │
        ▼
handleAdjustment() → POST /api/inventory/adjustment
        └─ fetchInventory() → refresh list

User records purchase
        │
        ▼
handlePurchase() → POST /api/inventory/purchase
        └─ fetchInventory() → refresh list

User transfers stock
        │
        ▼
handleTransfer() → POST /api/inventory/transfers
        └─ fetchInventory() → refresh list
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `xlsx` | Excel file reading (import) and writing (export) |
| `jsbarcode` | CODE128 barcode generation on `<canvas>` |
| `recharts` | `LineChart`, `BarChart`, `AreaChart` for analytics |
| `@supabase/ssr` | Server-side Supabase client in API routes |
| `supabase/client.ts` | Browser-side Supabase client (used in `fetchInventory` to get the session token) |

---

## Known Limitations

### 1. `GET /api/inventory/expiry-alerts` is a hardcoded stub

`src/app/api/inventory/expiry-alerts/route.ts` returns a static array of three items with fixed dates in January 2024. It is not connected to the database and does not reflect real expiry data. The actual expiry alert logic is implemented correctly in `GET /api/stock-alerts`, which queries the live `inventory` table.

### 2. `GET /api/drugs` is a hardcoded stub

`src/app/api/drugs/route.ts` returns a static array of three drugs and does not interact with the database. The `POST` handler creates an in-memory object that is never persisted. This route appears to be a development placeholder and must be removed before production.

### 3. Stock location assignment is not persisted

The "Stock Location" field in the Add Product dialog is stored in UI state only. The `inventory` table has no `stock_location_id` column, so the selected location is never saved to the database. The `stock_locations` table exists for the Settings module but is not linked to inventory records.

### 4. Stock transfer uses string location names instead of branch UUIDs

The transfer form sends `fromLocation` and `toLocation` as string values (e.g., `'main-store'`). The `inventory_transfers` table stores these in `from_branch_id` and `to_branch_id` columns typed as `uuid` FK references to `branches`. Passing non-UUID strings will cause a PostgreSQL type error. The transfer feature is effectively broken unless the user happens to enter a valid branch UUID.

### 5. Adjustment reason is not stored

The stock adjustment dialog accepts a `reason` field, but `POST /api/inventory/adjustment` only updates `quantity_in_stock`. The reason is discarded. No `stock_movements` record is created for manual adjustments, so there is no audit trail for manual stock changes.

### 6. Purchase does not link to the supplier

The purchase dialog accepts a `supplier` field, but `POST /api/inventory/purchase` ignores it. The purchase is not linked to the `suppliers` table and no purchase order record is created.

### 7. Pagination is not functional

The `Pagination` component is rendered in the inventory table but is not connected to any state. All inventory items are rendered simultaneously regardless of the current page number.

### 8. Inventory trend data is synthetic

The "Inventory Trend" chart in the analytics section does not query historical data. It generates trend values by scaling the current total inventory value across the months of the current year using a linear formula. The chart will always show a smooth upward curve regardless of actual stock history.

### 9. Multi-tenancy isolation required database fix

As documented in `INVENTORY_ISOLATION_COMPLETE_FIX.md`, there was a critical multi-tenancy bug where inventory items could be visible across pharmacies due to NULL `pharmacy_id` values and RLS policy gaps. The fix requires running `fix-inventory-isolation-complete.sql` (a root-level loose file, not in `supabase/migrations/`) to add NOT NULL constraints, recreate RLS policies, and add validation triggers. The API routes themselves are correctly scoped by `pharmacy_id`, but the database-level fix must be applied manually.

### 10. `is_global` column on `categories` is not in official migrations

The `is_global` column on the `categories` table is added by `add-global-categories.sql` (a root-level loose file). It is not part of the official `supabase/migrations/` history. A fresh database deployment from migrations alone will not have this column, causing `GET /api/categories` to fail with a PostgreSQL error on the `is_global.eq.true` filter.

### 11. `stock_locations` table is not in official migrations

The `stock_locations` table is defined in `create-stock-locations-table.sql` (a root-level loose file), not in `supabase/migrations/`. The `GET /api/settings/locations` route handles this gracefully by returning hardcoded defaults on error, but the table must be created manually for the feature to persist data.

### 12. Edit dialog only exposes three fields

The `PUT /api/inventory/[id]` route and the edit dialog only allow updating `quantity_in_stock`, `selling_price`, and `minimum_stock_level`. Fields such as `batch_number`, `expiry_date`, `unit_cost`, and the linked `medications` record (name, category, manufacturer) cannot be edited after creation.

### 13. Error handling uses `alert()` in the add product flow

`handleAddProduct` uses `alert()` for both success and error feedback instead of the `toast()` system used by the rest of the page. This is inconsistent and will block the UI thread.
