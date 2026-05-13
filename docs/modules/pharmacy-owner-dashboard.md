# Pharmacy Owner Dashboard Module

## Purpose

The Pharmacy Owner Dashboard is the primary landing page for users with the `pharmacy_owner` role (and, by default, `cashier` and `staff` roles, which share the same sidebar). It provides a real-time operational overview of a single pharmacy tenant: today's revenue, inventory health, customer count, stock alerts, and expiring products. From this page the owner can also trigger quick actions — starting a new POS sale or adding a new pharmacist — without navigating away.

The dashboard is a **client component** (`'use client'`) that fetches live data from several API routes on mount and subscribes to real-time updates via a polling hook. It falls back to hardcoded mock data when any API call fails, ensuring the page always renders.

---

## Key Files

### Page

| File | Route | Description |
|---|---|---|
| `src/app/(dashboard)/pharmacy-dashboard/page.tsx` | `/pharmacy-dashboard` | Single-file client component. Renders the stats bar, tabbed content area (Overview / Sales / Inventory / Analytics), quick-action buttons, and the Add Pharmacist dialog. |

### Layout (shared)

| File | Description |
|---|---|
| `src/app/(dashboard)/layout.tsx` | Server component. Authenticates the user, reads `pharmacy_users.role`, selects the correct sidebar (`PharmacySidebar` for `pharmacy_owner` / `cashier` / `staff`), checks subscription expiry, and renders `SubscriptionBlocker` when the pharmacy is suspended. Wraps all children in `PharmacyProvider`. |

### API Routes (`src/app/api/pharmacy/`)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/pharmacy/dashboard` | `GET` | Yes (session) | Returns `PharmacyStats`: today's sales total, total product count, unique customer count, and estimated monthly revenue. Falls back to mock data on DB error. |
| `/api/pharmacy/sales-chart` | `GET` | Yes (session) | Returns last-6-months revenue grouped by month (`[{ month, revenue }]`). Used by the Sales tab area chart. |
| `/api/pharmacy/category-sales` | `GET` | Yes (session) | Returns sales totals grouped by medication category (`[{ category, sales, fill }]`). Used by `PharmacyRadialChart`. |
| `/api/pharmacy/weekly-sales` | `GET` | Yes (session) | Returns last-7-days sales split by prescription vs. OTC per day (`[{ date, prescription, otc }]`). Used by `PharmacyBarChart`. |
| `/api/pharmacy/inventory-chart` | `GET` | No auth check | Returns monthly in-stock vs. low-stock item counts (`[{ month, inStock, lowStock }]`). Used by `PharmacyInventoryChart`. ⚠️ See Known Limitations. |
| `/api/pharmacy/settings` | `GET` / `PUT` | Yes (session) | Reads and updates core pharmacy profile fields: `name`, `license_number`, `city`, `province`, `phone`, `email`, `subscription_plan`. |
| `/api/pharmacy/branding` | `GET` / `PUT` | Yes (session) | Reads and updates pharmacy branding: `logo_url`, `primary_color`, `custom_domain`. |
| `/api/pharmacy/invoice-template` | `GET` / `PUT` | No auth check | Reads and updates the `invoice_template` JSONB column on `pharmacies`. ⚠️ See Known Limitations. |

### Supporting API Routes (called by the dashboard page)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/stock-alerts` | `GET` | Yes (session) | Returns `{ all, lowStock, expiring }` arrays derived from the `inventory` table. `lowStock` = items where `quantity_in_stock <= minimum_stock_level`. `expiring` = items expiring within 60 days. |
| `/api/pos` | `GET` | — | Fetched on mount to populate the Recent Sales list. (See POS module for full documentation.) |
| `/api/pharmacist` | `POST` | Bearer token (manual) | Creates a new Supabase Auth user and inserts a `pharmacy_users` record with the specified role. Called by the Add Pharmacist dialog. Uses the service role key. |
| `/api/realtime/updates` | `GET` | — | Polled every 5 seconds by `useRealtimeUpdates`. Returns pending update events (`inventory_update`, `new_sale`, etc.) that trigger data refreshes. |

### Components

| File | Description |
|---|---|
| `src/components/pharmacy-sidebar.tsx` | Left navigation sidebar for `pharmacy_owner`, `cashier`, and `staff` roles. Displays subscription plan name, days remaining, and a Renew/Upgrade link. Shows an expired banner when `daysLeft === 0`. |
| `src/components/subscription-blocker.tsx` | Client component rendered by the dashboard layout. When `isExpired = true`, overlays a full-screen modal and redirects the user to `/settings` (the only accessible page). |
| `src/components/pharmacy-radial-chart.tsx` | Radial bar chart showing sales breakdown by medication category. Fetches from `/api/pharmacy/category-sales`. |
| `src/components/pharmacy-bar-chart.tsx` | Stacked bar chart showing weekly prescription vs. OTC sales. Fetches from `/api/pharmacy/weekly-sales`. |
| `src/components/pharmacy-inventory-chart.tsx` | Stacked bar chart showing monthly in-stock vs. low-stock item counts. Fetches from `/api/pharmacy/inventory-chart`. |

### Hooks

| File | Description |
|---|---|
| `src/hooks/usePharmacyStore.ts` | React Context-based in-memory store (`PharmacyProvider` + `usePharmacyStore`). Holds `inventory`, `sales`, `alerts`, and `stats` in component state. The dashboard writes fetched data into this store so other components in the same layout tree can read it without re-fetching. |
| `src/hooks/useRealtimeUpdates.ts` | Polls `/api/realtime/updates` every 5 seconds. On `inventory_update` events, re-fetches stock alerts. On `new_sale` events, re-fetches stats and recent sales. Returns `{ connected: boolean }`. |

---

## Database Tables

### `pharmacies`

The tenant record for the pharmacy. The dashboard reads this table (via `pharmacy_users.pharmacy_id`) to populate stats, branding, settings, and subscription status.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Pharmacy display name |
| `license_number` | `text` | Regulatory license number |
| `city` | `text` | City |
| `province` | `text` | Province / region |
| `phone` | `text` | Contact phone |
| `email` | `text` | Contact email |
| `status` | `text` | `active` or `suspended` |
| `subscription_plan` | `text` | `trial`, `standard`, or `premium` |
| `subscription_expires_at` | `timestamptz` | Subscription expiry date; checked by layout and sidebar |
| `logo_url` | `text` | URL of the pharmacy logo (Supabase Storage) |
| `primary_color` | `text` | Hex color for branding (default `#3b82f6`) |
| `custom_domain` | `text` | Optional custom domain |
| `invoice_template` | `jsonb` | Invoice layout configuration (see `/api/pharmacy/invoice-template`) |

### `pharmacy_users`

Maps authenticated users to pharmacies with a role. Every API route under `/api/pharmacy/` resolves the caller's `pharmacy_id` from this table using `auth.uid()`.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `user_id` | `uuid` | Foreign key → `auth.users.id` |
| `role` | `user_role` enum | `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |
| `is_active` | `boolean` | Whether the user's access is active |

### `sales`

POS transaction records. The dashboard reads this table to compute today's sales total and monthly revenue estimate, and to populate the Recent Sales list.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (tenant isolation) |
| `total_amount` | `numeric` | Transaction total in RWF |
| `customer_name` | `text` | Customer name (used for unique customer count) |
| `payment_method` | `text` | `Cash`, `Mobile Money`, `Insurance`, etc. |
| `created_at` | `timestamptz` | Transaction timestamp |

### `sale_items`

Line items within a sale. Used by `/api/pharmacy/category-sales` and `/api/pharmacy/weekly-sales` to break down revenue by medication category.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `sale_id` | `uuid` | Foreign key → `sales.id` |
| `total_price` | `numeric` | Line item total |

### `medications`

Drug/product master records. Joined by `inventory` and `sale_items` to provide category and name information for charts and alerts.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `name` | `text` | Medication name |
| `category` | `text` | Category (e.g., `prescription`, `otc`, `supplement`) |

### `inventory`

Stock records per medication batch. The dashboard reads this table (via `/api/stock-alerts`) to identify low-stock and expiring items.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `batch_number` | `text` | Batch identifier |
| `quantity_in_stock` | `integer` | Current stock level |
| `minimum_stock_level` | `integer` | Reorder threshold |
| `expiry_date` | `date` | Product expiry date |

---

## User Roles That Can Access This Module

| Role | Access Level |
|---|---|
| `pharmacy_owner` | Full access. Sees all stats, charts, and alerts for their pharmacy. Can add pharmacists via the quick-action dialog. Can renew/upgrade subscription. |
| `cashier` | Rendered with the same `PharmacySidebar` and can navigate to `/pharmacy-dashboard`. No role-level restriction is enforced on the page itself; all data is scoped to the pharmacy by `pharmacy_id`. |
| `staff` | Same as `cashier` — shares the `PharmacySidebar` and can view the dashboard. |
| `pharmacist` | Uses `PharmacistSidebar` (different sidebar). Does **not** navigate to `/pharmacy-dashboard` by default. |
| `superadmin` | Uses `SuperadminSidebar`. Does not use this module. |

> **Note:** The dashboard page does not perform its own role check. Access control relies entirely on the middleware (session required) and the layout (subscription check). Any authenticated user with a valid `pharmacy_users` record can reach `/pharmacy-dashboard`.

---

## Features

### Overview Stats Bar

Five KPI cards rendered at the top of the page, populated from `/api/pharmacy/dashboard` and `/api/stock-alerts`:

| Card | Metric | Source |
|---|---|---|
| Today's Sales | Sum of `sales.total_amount` for the current calendar day | `/api/pharmacy/dashboard` |
| Total Products | Count of `medications` rows for the pharmacy | `/api/pharmacy/dashboard` |
| Customers | Count of `sales` rows (unique customer proxy) | `/api/pharmacy/dashboard` |
| Low Stock | Count of inventory items where `quantity_in_stock <= minimum_stock_level` | `/api/stock-alerts` |
| Expiring Soon | Count of inventory items expiring within 60 days | `/api/stock-alerts` |

The stats bar uses hardcoded fallback values (`totalProducts: 1250`, `todaySales: 145000`, etc.) when the API call fails, so the page always renders with plausible numbers even if the database is unreachable.

### Tabbed Content Area

The main content area is organized into four tabs:

#### Overview Tab

Three scrollable cards rendered side by side:

- **Recent Sales** — List of recent transactions from `/api/pos`. Each row shows customer avatar (initials), customer name, item count, time, amount in RWF, and payment method badge.
- **Stock Alerts** — Items where `current_stock <= min_stock`, shown with an amber background. Each row displays a progress bar showing `current_stock / min_stock` ratio.
- **Expiring Soon** — Items expiring within 60 days, shown with a red background. Items expiring within 30 days receive a `destructive` badge variant.

#### Sales Tab

Two charts side by side:

- **Sales Performance** (`SalesChart`) — Area chart of monthly revenue for the last 6 months. Data from `/api/pharmacy/sales-chart`.
- **Sales by Category** (`PharmacyRadialChart`) — Radial bar chart breaking down sales by medication category (prescription, OTC, supplements, medical devices, other). Data from `/api/pharmacy/category-sales`.

#### Inventory Tab

Two charts side by side:

- **Weekly Sales** (`PharmacyBarChart`) — Stacked bar chart comparing prescription vs. OTC sales for each day of the last 7 days. Data from `/api/pharmacy/weekly-sales`.
- **Inventory Status** (`PharmacyInventoryChart`) — Stacked bar chart showing monthly in-stock vs. low-stock item counts. Data from `/api/pharmacy/inventory-chart`.

#### Analytics Tab

A single horizontal bar chart (`BarChart` with `layout="vertical"`) showing monthly revenue with inline labels. Data from `/api/pharmacy/sales-chart`.

### Quick Actions

Three action buttons in the page header:

| Button | Action |
|---|---|
| Export Report | Calls `window.print()` to trigger the browser print dialog |
| Add Pharmacist | Opens a `Dialog` form to create a new pharmacist account |
| New Sale | Navigates to `/pos` |

### Add Pharmacist Dialog

A modal form that collects full name, email, phone, and password for a new pharmacist. On submit, it:

1. Retrieves the current session from the Supabase browser client.
2. Looks up the caller's `pharmacy_id` from `pharmacy_users`.
3. `POST /api/pharmacist` with the credentials and `pharmacy_id`.
4. The API route uses the Supabase Admin API (`auth.admin.createUser`) to create the Supabase Auth user with `email_confirm: true`, then inserts a `pharmacy_users` record with `role: 'pharmacist'`.
5. On success, shows an `alert()` with the new login credentials for the owner to share manually.

### Subscription Status Display

The `PharmacySidebar` footer shows the current subscription plan and days remaining. Three visual states:

| State | Condition | Display |
|---|---|---|
| Active | `daysLeft > 7` | Plan name + days badge + "Upgrade to Premium" or "Manage Plan" link |
| Expiring Soon | `0 < daysLeft <= 7` | Amber warning + "Renew Subscription" link |
| Expired | `daysLeft === 0` | Red "Expired" banner + "Renew" button |

When the subscription is expired, the `SubscriptionBlocker` component (rendered by the layout) overlays a full-screen modal and redirects the user to `/settings`. The only accessible page while suspended is `/settings`.

The sidebar also auto-updates `pharmacies.status` to `'suspended'` client-side when it detects `daysLeft === 0` and the current status is not already `'suspended'`.

### Real-Time Updates

`useRealtimeUpdates` polls `/api/realtime/updates` every 5 seconds. The dashboard registers a callback that:

- On `inventory_update` → re-fetches `/api/stock-alerts` and updates the Stock Alerts and Expiring Soon cards.
- On `new_sale` → re-fetches `/api/pharmacy/dashboard` (stats) and `/api/pos` (recent sales list).

---

## Data Flow

```
PharmacyDashboard (client component)
        │
        ├─ useEffect (on mount)
        │       ├─ GET /api/pharmacy/dashboard  → setLocalStats, setStats (store)
        │       ├─ GET /api/pos                 → setRecentSales
        │       ├─ GET /api/stock-alerts        → setStockAlerts, setLowStockItems,
        │       │                                  setExpiringItems, setAlerts (store)
        │       └─ GET /api/pharmacy/sales-chart → setSalesChartData
        │
        ├─ useRealtimeUpdates (polling every 5s)
        │       ├─ inventory_update → re-fetch /api/stock-alerts
        │       └─ new_sale         → re-fetch /api/pharmacy/dashboard + /api/pos
        │
        └─ Chart components (self-fetching on mount)
                ├─ PharmacyRadialChart   → GET /api/pharmacy/category-sales
                ├─ PharmacyBarChart      → GET /api/pharmacy/weekly-sales
                └─ PharmacyInventoryChart → GET /api/pharmacy/inventory-chart
```

Each API route resolves the caller's `pharmacy_id` from `pharmacy_users` using the session cookie, ensuring all data is scoped to the authenticated user's pharmacy (tenant isolation via RLS).

---

## Dependencies

| Package | Purpose |
|---|---|
| `recharts` | `AreaChart`, `BarChart`, `RadialBarChart` for all dashboard charts |
| `@/components/ui/chart` | `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` — shadcn/ui chart wrappers |
| `@/components/ui/card`, `badge`, `button`, `dialog`, `input`, `label`, `select`, `tabs`, `progress`, `separator`, `scroll-area`, `avatar` | shadcn/ui primitives used throughout the page |
| `lucide-react` | Icons (`Package`, `DollarSign`, `Users`, `AlertTriangle`, `Clock`, `ShoppingCart`, `Pill`, `Calendar`, etc.) |
| `@supabase/supabase-js` | Browser Supabase client used in the Add Pharmacist dialog to retrieve the session |

---

## Known Limitations

### 1. Monthly revenue is an estimate

`/api/pharmacy/dashboard` calculates `monthlyRevenue` as `todayTotal * 30`. This is a rough approximation, not an actual sum of the current month's sales. The value will be inaccurate on any day other than the first of the month.

### 2. `activeStaff` and `pendingOrders` are hardcoded

The `stats` object returned by `/api/pharmacy/dashboard` always sets `activeStaff: 8` and `pendingOrders: 0`. These values are not queried from the database.

### 3. `/api/pharmacy/inventory-chart` has a broken pharmacy filter

The route contains a literal string `'userPharmacy.pharmacy_id'` instead of the actual variable value in the Supabase query:

```typescript
.eq('medications.pharmacy_id', 'userPharmacy.pharmacy_id')  // ← bug: string literal
```

This means the query returns data for all pharmacies (or no data, depending on RLS), not just the authenticated user's pharmacy. The route also does not call `supabase.auth.getUser()`, so it has no session-based tenant isolation.

### 4. `/api/pharmacy/invoice-template` has a broken pharmacy filter

Same issue as above — the route uses the string `'userPharmacy.pharmacy_id'` as a literal value in both `GET` and `PUT` operations. Invoice template reads and writes will fail silently or affect the wrong record.

### 5. `/api/pharmacy/invoice-template` and `/api/pharmacy/inventory-chart` have no authentication

Neither route calls `supabase.auth.getUser()`. Any unauthenticated request can read or overwrite invoice template data.

### 6. Add Pharmacist uses `alert()` for credential delivery

After successfully creating a pharmacist, the dashboard displays the new user's plaintext password in a browser `alert()` dialog. This is not a secure credential delivery mechanism and the password is visible in the browser's JavaScript call stack.

### 7. Real-time updates use polling, not WebSockets

`useRealtimeUpdates` simulates real-time behavior by polling `/api/realtime/updates` every 5 seconds. Supabase Realtime (WebSocket-based) is not used. This means updates have up to a 5-second delay and generate continuous HTTP traffic even when there is nothing to update.

### 8. No role enforcement on the page

The dashboard page does not verify that the authenticated user has the `pharmacy_owner` role. A `cashier` or `staff` user can access the same page and see all stats, including the Add Pharmacist quick action. The Add Pharmacist API route (`/api/pharmacist`) also does not check the caller's role.

### 9. Fallback mock data masks real errors

All API calls in the `useEffect` catch block silently fall back to hardcoded mock data. Errors are only logged to the console. A user will see plausible-looking numbers even when the database is completely unreachable, with no visible error state.

### 10. `useRealtimeUpdates` callback causes infinite re-render risk

The `onUpdate` callback is passed inline to `useRealtimeUpdates`, which uses it inside a `useEffect` dependency array. Because the callback is recreated on every render, this can cause the polling interval to be cleared and restarted on every render cycle. The current implementation avoids this only because the `useEffect` in `useRealtimeUpdates` does not list `onUpdate` in its dependency array (which is itself a lint warning).
