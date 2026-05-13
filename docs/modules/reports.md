# Reports Module

## Purpose

The Reports module provides pharmacy staff with analytics and operational reporting across two primary domains: **sales performance** and **inventory health**. It is the primary observability surface for pharmacy owners and managers, surfacing KPI cards, time-series charts, top-product rankings, and payment-method breakdowns drawn from live Supabase data.

The module also exposes five additional API-only report types — financial summaries, tax/VAT reports, audit logs, and insurance-claims reports — that are not yet wired into the dashboard UI.

---

## Key Files

### Page (`src/app/(dashboard)/reports/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/reports` | Single-page client component. Fetches data from `/api/reports/sales` and `/api/reports/inventory` on mount and every 30 seconds. Renders KPI cards, a Sales & Orders area chart, an Inventory Alerts line chart, a Top Selling Products list, and a Payment Methods breakdown. Includes a filter panel (report type, date range) and an Export PDF button. |

### API Routes (`src/app/api/reports/`)

| Route file | HTTP method | Auth required | Description |
|---|---|---|---|
| `sales/route.ts` | `GET` | Yes (session) | Returns daily sales totals for the last 30 days, top 4 products by revenue, payment-method breakdown with percentages, total sales amount, total order count, and unique active customer count. All data is scoped to the authenticated user's pharmacy via `pharmacy_users`. |
| `inventory/route.ts` | `GET` | Yes (session) | Returns a daily time-series of low-stock item counts and expiring-soon item counts for the last 14 days, derived from the `inventory` table joined to `medications`. |
| `financial/route.ts` | `GET` | No | **Stub.** Returns a hardcoded financial report object (revenue, expenses, profit/loss, cash flow). Not connected to the database. |
| `tax/route.ts` | `GET` | No | **Stub.** Returns a hardcoded VAT summary and RRA submission status object. Not connected to the database. |
| `audit/route.ts` | `GET` | No | **Stub.** Returns a hardcoded array of three audit log entries. Not connected to the database. |
| `insurance-claims/route.ts` | `GET` | No | **Stub.** Accepts `?month=` and `?year=` query parameters. Returns a hardcoded array of two insurance claims with a summary breakdown by insurer (RAMA, MMI, RSSB). Not connected to the database. |

---

## Database Tables

### `sales`

The primary source for all sales-based report data.

| Column | Type | Used by reports for |
|---|---|---|
| `id` | `uuid` | Order count (`salesData.length`) |
| `pharmacy_id` | `uuid` | Tenant isolation — all queries filter by `pharmacy_users.pharmacy_id` |
| `total_amount` | `decimal` | Daily revenue aggregation, payment-method totals, overall `totalSales` |
| `payment_method` | `text` | Payment breakdown (`cash`, `mobile_money`, `insurance`, card) |
| `customer_name` | `text` | Unique active customer count (distinct non-null values) |
| `created_at` | `timestamptz` | Date bucketing for daily sales series; 30-day window filter |

### `sale_items`

Used to compute the top-selling products report.

| Column | Type | Used by reports for |
|---|---|---|
| `medication_name` | `text` | Product name grouping key |
| `total_price` | `decimal` | Revenue per product |
| `quantity` | `integer` | Units sold per product |
| `sales` (FK join) | — | Inner join to filter by `pharmacy_id` and date range |

### `inventory`

Used by the inventory alerts report.

| Column | Type | Used by reports for |
|---|---|---|
| `quantity_in_stock` | `integer` | Compared against `minimum_stock_level` to flag low-stock items |
| `minimum_stock_level` | `integer` | Low-stock threshold |
| `expiry_date` | `date` | Items expiring within 60 days are counted as "expiring soon" |
| `created_at` | `timestamptz` | Date bucketing for the 14-day alert time-series |

### `medications`

Joined to `inventory` to apply the pharmacy-scoping filter.

| Column | Type | Used by reports for |
|---|---|---|
| `pharmacy_id` | `uuid` | Tenant isolation for inventory alerts |
| `name` | `text` | Not directly used in reports output; join key only |
| `category` | `text` | Not used in reports output |

### `pharmacy_users`

Used by both `sales/route.ts` and `inventory/route.ts` to resolve the authenticated user's `pharmacy_id`.

| Column | Type | Used by reports for |
|---|---|---|
| `user_id` | `uuid` | Matched against `auth.getUser().id` |
| `pharmacy_id` | `uuid` | Propagated to all downstream queries as the tenant filter |

---

## User Roles

The `/reports` route is accessible to all authenticated users who have a `pharmacy_users` record. The middleware does not restrict this route to specific roles. In practice, the sidebar navigation exposes the Reports link to `pharmacy_owner`, `pharmacist`, `cashier`, and `staff` roles.

| Role | Access |
|---|---|
| `superadmin` | Not shown in the superadmin sidebar; accessible by direct URL |
| `pharmacy_owner` | Full access — primary intended audience |
| `pharmacist` | Full access |
| `cashier` | Full access |
| `staff` | Full access |

All data returned is automatically scoped to the user's own pharmacy by the API routes. There is no cross-pharmacy data leakage.

---

## Features

### KPI Summary Cards

Four metric cards are displayed at the top of the page when the report type is `all` or `sales`:

| Card | Value source | Description |
|---|---|---|
| Total Sales | `reportsData.totalSales` | Sum of all `sales.total_amount` in the last 30 days |
| Total Orders | `reportsData.totalOrders` | Count of `sales` rows in the last 30 days |
| Avg Order Value | Computed: `totalSales / totalOrders` | Mean transaction value in RWF |
| Active Customers | `reportsData.activeCustomers` | Count of distinct non-null `customer_name` values in the last 30 days |

The percentage-change badges shown on each card (`+12.5% from last period`, etc.) are **hardcoded strings** — they are not computed from real data.

### Sales & Orders Area Chart (Recharts)

An `AreaChart` from Recharts renders the `dailySales` array returned by `/api/reports/sales`. Each data point represents one calendar day with two stacked areas:

- **Sales (RWF)** — blue (`#3b82f6`)
- **Orders** — dark blue (`#1d4ed8`)

A time-range selector allows filtering to the last 7, 14, or 30 days. The filter is applied client-side by slicing the `dailySales` array; it does not trigger a new API call.

The X-axis formats dates as `MMM D` (e.g., `Apr 1`). A `ChartTooltip` shows both values on hover.

**Known issue:** The `orders` field in each daily data point is generated with `Math.floor(Math.random() * 50) + 100` in the API route — it is a random number, not the real order count for that day. See [Known Limitations](#known-limitations).

### Inventory Alerts Line Chart (Recharts)

A `LineChart` from Recharts renders the `inventoryAlerts` array returned by `/api/reports/inventory`. Each data point represents one calendar day with two lines:

- **Low Stock Items** — red (`#ef4444`)
- **Expiring Soon** — amber (`#f59e0b`)

An item is counted as "low stock" when `quantity_in_stock <= minimum_stock_level`. An item is counted as "expiring soon" when its `expiry_date` is between 1 and 60 days from the current date.

The chart shows a 14-day window. There is no time-range selector for this chart.

### Top Selling Products

A ranked list of up to 4 products, sorted by total revenue in the last 30 days. Each entry shows the product name, units sold, and total revenue in RWF. Data is sourced from `sale_items` joined to `sales`.

### Payment Methods Breakdown

A list of payment methods with a horizontal progress bar showing each method's share of total revenue. Methods are normalised from database values: `cash` → `Cash`, `mobile_money` → `Mobile Money`, `insurance` → `Insurance`, anything else → `Card`.

### Report Type Filter

A dropdown allows the user to show/hide sections:

| Filter value | Sections shown |
|---|---|
| `all` | All sections |
| `sales` | KPI cards + Sales & Orders chart |
| `inventory` | Inventory Alerts chart |
| `products` | Top Selling Products |
| `payments` | Payment Methods |

### Date Range Filter

Start and end date inputs are present in the filter panel. Clicking "Apply Filters" calls `fetchReportsData()`, which re-fetches both API endpoints. However, the date values are **not passed to the API routes** — the API routes always return the last 30 days (sales) or last 14 days (inventory) regardless of the filter inputs. The date filter is non-functional.

### PDF Export

The "Export PDF" button calls `window.print()`. The page uses a `no-print` CSS class on the filter panel, header buttons, and sidebar trigger to hide interactive elements from the print output. This produces a basic browser-print PDF of the visible charts and tables.

**Note:** Despite `jsPDF` (`^4.0.0`) and `jspdf-autotable` (`^5.0.7`) being listed as dependencies in `package.json`, neither library is imported or used anywhere in the reports module. The PDF export is implemented entirely via `window.print()`.

### Excel Export

There is no Excel export in the reports module. The `xlsx` library (`^0.18.5`) is installed and used in the Inventory module (`src/app/(dashboard)/inventory/page.tsx`) but has not been wired into the reports page.

### Auto-Refresh

The page polls both API endpoints every 30 seconds via `setInterval`. The last-updated timestamp is displayed in the page header.

---

## Data Flow

```
ReportsPage mounts
        │
        ├─ fetchReportsData()
        │         │
        │         ├─ GET /api/reports/sales
        │         │         │
        │         │         ├─ supabase.auth.getUser()
        │         │         ├─ SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?
        │         │         ├─ SELECT total_amount, created_at FROM sales WHERE pharmacy_id = ? AND created_at >= 30d ago
        │         │         ├─ SELECT medication_name, total_price, quantity FROM sale_items JOIN sales WHERE pharmacy_id = ?
        │         │         ├─ SELECT payment_method, total_amount FROM sales WHERE pharmacy_id = ?
        │         │         └─ SELECT customer_name FROM sales WHERE pharmacy_id = ? AND customer_name IS NOT NULL
        │         │
        │         └─ GET /api/reports/inventory
        │                   │
        │                   ├─ supabase.auth.getUser()
        │                   ├─ SELECT pharmacy_id FROM pharmacy_users WHERE user_id = ?
        │                   └─ SELECT quantity_in_stock, minimum_stock_level, expiry_date, created_at
        │                        FROM inventory JOIN medications WHERE pharmacy_id = ? AND created_at >= 14d ago
        │
        ├─ setReportsData(salesData)
        ├─ setInventoryData(invData.inventoryAlerts)
        └─ setInterval(fetchReportsData, 30000)
```

---

## API Endpoint Reference

### `GET /api/reports/sales`

**Authentication:** Required (Supabase session cookie)

**Response shape:**

```json
{
  "dailySales": [
    { "date": "2024-04-01", "sales": 45000, "orders": 127 }
  ],
  "topProducts": [
    { "name": "Paracetamol 500mg", "sales": 120000, "quantity": 200 }
  ],
  "paymentBreakdown": [
    { "method": "Cash", "percentage": 49, "amount": 1200000 }
  ],
  "totalSales": 2450000,
  "totalOrders": 82,
  "activeCustomers": 34
}
```

**Error responses:**
- `401 Unauthorized` — no valid session
- `403 Forbidden` — authenticated user has no `pharmacy_users` record

On unexpected errors the route returns `200` with empty arrays and zero values (error is swallowed).

---

### `GET /api/reports/inventory`

**Authentication:** Required (Supabase session cookie)

**Response shape:**

```json
{
  "inventoryAlerts": [
    { "date": "2024-04-01", "lowStock": 12, "expiring": 8, "totalItems": 1250 }
  ]
}
```

On unexpected errors the route returns `200` with `{ "inventoryAlerts": [] }`.

---

### `GET /api/reports/financial` ⚠️ Stub

**Authentication:** None

Returns a hardcoded financial report. Not connected to the database. Intended for future implementation.

---

### `GET /api/reports/tax` ⚠️ Stub

**Authentication:** None

Returns a hardcoded VAT summary and RRA submission status. Not connected to the database.

---

### `GET /api/reports/audit` ⚠️ Stub

**Authentication:** None

Returns a hardcoded array of three audit log entries. Not connected to the database.

---

### `GET /api/reports/insurance-claims` ⚠️ Stub

**Authentication:** None

**Query parameters:** `?month=<1-12>&year=<YYYY>` (defaults to current month/year)

Returns a hardcoded array of two insurance claims with a summary by insurer. Not connected to the database.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `recharts` | — | `AreaChart` (sales trend), `LineChart` (inventory alerts), `ChartContainer`, `ChartTooltip`, `ChartLegend` from shadcn/ui chart wrappers |
| `jspdf` | `^4.0.0` | **Installed but not used in this module.** PDF export is via `window.print()`. |
| `jspdf-autotable` | `^5.0.7` | **Installed but not used in this module.** |
| `xlsx` | `^0.18.5` | **Installed but not used in this module.** Excel export is not implemented in reports. |
| `@supabase/ssr` | — | Server-side Supabase client for session verification and database queries |
| `lucide-react` | — | Icons: `TrendingUp`, `TrendingDown`, `DollarSign`, `Package`, `Users`, `ShoppingCart`, `RefreshCw`, `Download` |
| shadcn/ui | — | `Card`, `Select`, `Badge`, `Button`, `Input`, `SidebarTrigger`, `Spinner` |

---

## Known Limitations

### 1. Order count is randomised

In `src/app/api/reports/sales/route.ts`, the `orders` field in each daily data point is computed as `Math.floor(Math.random() * 50) + 100`. This is a placeholder — the actual order count for each day is not derived from the database. The Sales & Orders chart therefore shows fabricated order data.

### 2. Date range filter is non-functional

The start/end date inputs in the filter panel are read into component state but are never sent to the API routes. Both routes always return a fixed 30-day (sales) or 14-day (inventory) window. Clicking "Apply Filters" re-fetches data but the date parameters have no effect.

### 3. Percentage-change badges are hardcoded

The trend indicators on the KPI cards (`+12.5% from last period`, `+8.2% from last period`, etc.) are static strings in the JSX. They do not reflect real period-over-period comparisons.

### 4. Four API routes are stubs with no authentication

`/api/reports/financial`, `/api/reports/tax`, `/api/reports/audit`, and `/api/reports/insurance-claims` return hardcoded data and require no authentication. They are not connected to the database and are not surfaced in the dashboard UI. They should either be implemented or removed before production.

### 5. jsPDF and xlsx are installed but unused in this module

`jspdf` (`^4.0.0`), `jspdf-autotable` (`^5.0.7`), and `xlsx` (`^0.18.5`) are listed in `package.json` and are used in the Inventory module, but the Reports module does not import them. The PDF export is a browser print (`window.print()`), and there is no Excel export. Proper PDF/Excel export using these libraries has not been implemented for reports.

### 6. Inventory alerts query uses `created_at` instead of a snapshot table

The inventory alerts chart groups `inventory` rows by `created_at` date. This means it only reflects items that were *added* to the inventory table within the last 14 days, not the current stock state of all items on each day. A pharmacy with stable inventory (no new rows in 14 days) will see an empty chart.

### 7. Error handling swallows failures silently

Both `sales/route.ts` and `inventory/route.ts` catch all errors and return `200` with empty data rather than an appropriate HTTP error status. This makes it impossible for the client to distinguish between "no data" and "query failed".

### 8. No role-based access restriction

The `/reports` route and all its API endpoints are accessible to any authenticated user with a `pharmacy_users` record, regardless of role. There is no restriction preventing a `cashier` or `staff` member from viewing financial analytics.

### 9. `console.log` statements in production code

`page.tsx` contains `console.log('Sales API Status:', ...)`, `console.log('Sales Data:', ...)`, and `console.log('Inventory Data:', ...)` calls that will appear in browser developer tools in production.
