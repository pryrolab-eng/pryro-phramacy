# Pharmacist Dashboard Module

## Purpose

The Pharmacist Dashboard is the primary workspace for users with the `pharmacist` role. It provides a clinical-operations overview focused on the day-to-day workflow of a dispensing pharmacist: monitoring prescription queues, tracking stock health, recording activity, and navigating quickly to the POS and inventory modules.

The dashboard is a **client-side rendered** page (`'use client'`) that fetches data from five dedicated API endpoints in parallel on mount. It subscribes to realtime-style updates via a polling hook (`useRealtimeUpdates`) and maintains lightweight in-memory state through the shared `usePharmacyStore` Zustand-like context.

---

## Key Files

### Page (`src/app/(dashboard)/pharmacist-dashboard/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/pharmacist-dashboard` | Single-page dashboard. Renders four KPI cards, a four-tab panel (Overview, Prescriptions, Alerts, Analytics), and a Recent Activities feed. Fetches all data on mount with a 2-second parallel timeout and falls back to mock values if the API is slow or unavailable. |

### API Routes (`src/app/api/pharmacist/`)

| File | Route | Method(s) | Description |
|---|---|---|---|
| `route.ts` | `/api/pharmacist` | `POST` | Creates a new pharmacist user. Uses the **service role key** to call `supabase.auth.admin.createUser`, then inserts a `pharmacy_users` record with `role = 'pharmacist'`. Called by staff-management flows, not by the dashboard page itself. |
| `dashboard/route.ts` | `/api/pharmacist/dashboard` | `GET` | Returns the eight KPI stats for the dashboard header cards. Resolves the caller's `pharmacy_id` from `pharmacy_users`, then queries `prescriptions`, `sales`, `prescription_processing`, `inventory_checks`, and `alert_actions`. Falls back to hardcoded mock values on any error. |
| `prescriptions/route.ts` | `/api/pharmacist/prescriptions` | `GET`, `POST` | `GET`: Returns all `pending` prescriptions for the pharmacy, ordered by priority (descending) then creation time (ascending). `POST`: Accepts `{ prescriptionId, action }` where `action` is `'start'` (inserts a `prescription_processing` row) or `'dispense'` (marks processing complete and sets `prescriptions.status = 'dispensed'`). |
| `activities/route.ts` | `/api/pharmacist/activities` | `GET` | Returns the four most recent sales records formatted as activity feed items (`type: 'sale'`). |
| `track-activity/route.ts` | `/api/pharmacist/track-activity` | `POST` | Writes audit records for pharmacist actions. Accepts `{ type, data }` where `type` is one of `prescription_start`, `prescription_complete`, `inventory_check`, or `alert_action`. Inserts into `prescription_processing`, `inventory_checks`, or `alert_actions` accordingly. |
| `chart-data/route.ts` | `/api/pharmacist/chart-data` | `GET` | Returns hourly prescription and customer (sale) counts for today, bucketed from 09:00 to 17:00. Used by the Analytics tab line chart. |

### Shared API Route (used by this module)

| File | Route | Method | Description |
|---|---|---|---|
| `src/app/api/stock-alerts/route.ts` | `/api/stock-alerts` | `GET` | Returns three arrays: `all` (all inventory items with expiry/stock data), `lowStock` (items where `quantity_in_stock ≤ minimum_stock_level`), and `expiring` (items expiring within 60 days). Scoped to the caller's pharmacy via `pharmacy_users`. |

### Sidebar Component (`src/components/`)

| File | Description |
|---|---|
| `pharmacist-sidebar.tsx` | `PharmacistSidebar` — rendered by the dashboard layout when `pharmacy_users.role = 'pharmacist'`. Provides navigation to Dashboard, Prescriptions, Inventory, POS, Customers, and Settings. Displays the authenticated user's name and subscription expiry in the footer. Shows a red "Suspended" banner when the pharmacy subscription is expired or the pharmacy status is `suspended`. |

### Hooks (`src/hooks/`)

| File | Export | Description |
|---|---|---|
| `usePharmacyStore.ts` | `usePharmacyStore` | React context-based store (not Zustand). Holds `inventory`, `sales`, `alerts`, and `stats` arrays in memory. The dashboard uses `setAlerts` to cache the latest stock-alert payload and `addSale` to append new sales. Must be used inside `<PharmacyProvider>`. |
| `useRealtimeUpdates.ts` | `useRealtimeUpdates` | Polls `/api/realtime/updates` every 5 seconds and calls the provided callback with each update. The dashboard uses this to re-fetch stock alerts on `inventory_update` events and re-fetch stats/activities on `new_sale` events. |

### Dashboard Layout (`src/app/(dashboard)/`)

| File | Description |
|---|---|
| `layout.tsx` | Server component. Reads `pharmacy_users.role` and renders `<PharmacistSidebar />` when the role is `pharmacist`. Also enforces subscription expiry via `<SubscriptionBlocker />`. |

---

## Database Tables

### `prescriptions`

The central table for this module. Defined in `supabase/migrations/20241201000014_prescriptions_table.sql`.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `patient_name` | `text` | Patient's full name |
| `doctor_name` | `text` | Prescribing doctor's name |
| `medications` | `text[]` | Array of medication names/dosages |
| `priority` | `prescription_priority` enum | `low`, `medium`, `high`, `urgent` |
| `status` | `prescription_status` enum | `pending`, `dispensed`, `completed`, `cancelled` |
| `insurance_provider` | `text` | Insurance provider name (nullable) |
| `notes` | `text` | Free-text notes (nullable) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

**Indexes:** `idx_prescriptions_pharmacy_id`, `idx_prescriptions_status`, `idx_prescriptions_priority`.

**Realtime:** Added to `supabase_realtime` publication — changes are broadcast to subscribed clients.

### `pharmacy_users`

Used by the dashboard API to resolve the caller's `pharmacy_id` and to scope all queries to the correct tenant.

| Column | Type | Description |
|---|---|---|
| `user_id` | `uuid` | Foreign key → `auth.users.id` |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `role` | `user_role` enum | `pharmacist` for this module |
| `is_active` | `boolean` | Whether the user's access is active |

### `sales`

Queried by the activities and chart-data endpoints to derive customer-served counts and activity feed items.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Tenant scope |
| `customer_name` | `text` | Customer name (nullable for walk-ins) |
| `total_amount` | `numeric` | Sale total in RWF |
| `created_at` | `timestamptz` | Sale timestamp |

### `inventory` (via `/api/stock-alerts`)

Queried by the stock-alerts endpoint. Joined with `medications` to produce human-readable drug names.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Tenant scope |
| `batch_number` | `text` | Batch identifier |
| `quantity_in_stock` | `integer` | Current stock level |
| `minimum_stock_level` | `integer` | Reorder threshold |
| `expiry_date` | `date` | Batch expiry date |

### `prescription_processing` ⚠️ Missing Migration

Referenced by `dashboard/route.ts`, `prescriptions/route.ts`, and `track-activity/route.ts` but **no migration file exists** for this table. The API routes will fail with a Supabase error if this table is not present in the database.

Expected schema (inferred from API code):

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key (implied) |
| `prescription_id` | `uuid` | Foreign key → `prescriptions.id` |
| `processing_time_minutes` | `integer` | Duration in minutes (nullable) |
| `started_at` | `timestamptz` | When processing began (nullable) |
| `completed_at` | `timestamptz` | When dispensing was completed (nullable) |
| `created_at` | `timestamptz` | Row creation timestamp |

### `inventory_checks` ⚠️ Missing Migration

Referenced by `dashboard/route.ts` and `track-activity/route.ts` but **no migration file exists**.

Expected schema (inferred from API code):

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key (implied) |
| `inventory_id` | `uuid` | Foreign key → `inventory.id` |
| `check_type` | `text` | `'routine'` or `'manual'` |
| `notes` | `text` | Optional notes |
| `created_at` | `timestamptz` | Check timestamp |

### `alert_actions` ⚠️ Missing Migration

Referenced by `dashboard/route.ts` and `track-activity/route.ts` but **no migration file exists**.

Expected schema (inferred from API code):

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key (implied) |
| `alert_type` | `text` | e.g., `'stock_low'`, `'expiring'` |
| `alert_reference_id` | `uuid` | ID of the inventory item or alert |
| `action_taken` | `text` | e.g., `'noted'` |
| `notes` | `text` | Optional notes |
| `created_at` | `timestamptz` | Action timestamp |

### `pharmacies`

Read by `PharmacistSidebar` to display subscription plan and expiry countdown in the sidebar footer.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `subscription_plan` | `text` | e.g., `'trial'`, `'standard'`, `'premium'` |
| `subscription_expires_at` | `timestamptz` | Subscription expiry date |
| `status` | `text` | `'active'` or `'suspended'` |

---

## Role Access

| Role | Access |
|---|---|
| `pharmacist` | **Primary user.** The dashboard layout renders `PharmacistSidebar` and routes to `/pharmacist-dashboard`. Full access to all features on this page. |
| `pharmacy_owner` | Uses `PharmacySidebar` and navigates to `/pharmacy-dashboard` instead. No access to this route by default. |
| `cashier` | Uses `PharmacySidebar`. No access to this route. |
| `staff` | Uses `PharmacySidebar`. No access to this route. |
| `superadmin` | Uses `SuperadminSidebar`. No access to this route. |

**Note:** The `/pharmacist-dashboard` route is protected by `middleware.ts` (redirects unauthenticated users to `/sign-in`), but there is **no server-side role check** on the page itself or its API routes. Any authenticated user who navigates directly to `/pharmacist-dashboard` will see the page regardless of their role. The API routes (`/api/pharmacist/dashboard`, `/api/pharmacist/prescriptions`, etc.) authenticate the caller via `supabase.auth.getUser()` but do not verify that the caller holds the `pharmacist` role.

---

## Features

### 1. KPI Header Cards

Four summary cards rendered at the top of the page, populated from `/api/pharmacist/dashboard`:

| Card | Metric | Source |
|---|---|---|
| Prescriptions Today | Count of `prescriptions` created today for the pharmacy | `prescriptions` table |
| Customers Served | Count of `sales` created today | `sales` table |
| Avg Wait Time | Mean `processing_time_minutes` from today's `prescription_processing` rows; falls back to `8` if no data | `prescription_processing` table |
| Completed Tasks | Count of today's sales; sub-label shows `alert_actions` count | `sales`, `alert_actions` tables |

Each card includes a `<Progress>` bar with a hardcoded percentage value (not derived from data).

### 2. Overview Tab — Clinical Overview

The default tab. Displays three cards side by side:

- **Stock Alerts** — A scrollable list of low-stock and out-of-stock items from `/api/stock-alerts`. Each item shows drug name, current vs. minimum stock, and a badge (`Low` / `Out`). A checkmark button calls `POST /api/pharmacist/track-activity` with `type: 'alert_action'`.
- **Expiration Alerts** — A scrollable list of items expiring within 60 days from `/api/stock-alerts`. Each item shows drug name, batch number, and days until expiry. Items expiring within 7 days show a destructive (red) badge.
- **Quick Actions** — Four shortcut buttons: Open POS (`/pos`), Add Drug (`/inventory`), New Prescription (`/prescriptions`), Check Inventory (calls `track-activity` with `type: 'inventory_check'`).

### 3. Prescriptions Tab — Prescription Queue

Displays all `pending` prescriptions for the pharmacy, fetched from `GET /api/pharmacist/prescriptions`. Each prescription card shows:

- Patient name and prescribing doctor
- Up to two medication names (with a "+N more" badge for longer lists)
- Priority badge (`high` / `medium` / `low`) with colour coding (red / yellow / green)
- Insurance provider name
- Two action buttons: **Start** and **Dispense**, both calling `POST /api/pharmacist/prescriptions`

**Start** inserts a `prescription_processing` row (begins timing).  
**Dispense** marks `prescription_processing.completed_at` and sets `prescriptions.status = 'dispensed'`.

### 4. Alerts Tab — Stock Alerts (Detailed View)

A two-column layout showing the same stock and expiration alert data as the Overview tab, but with additional detail:

- Stock alerts include a `<Progress>` bar showing `(currentStock / minStock) * 100` as a visual fill level.
- Expiration alerts include batch number, quantity, and the full expiry date string.

### 5. Analytics Tab — Performance Charts

Two Recharts charts rendered inside shadcn/ui `<ChartContainer>` wrappers:

- **Daily Activity Trend** (line chart) — Hourly prescription and customer counts for today, from `GET /api/pharmacist/chart-data`. X-axis: hour (09:00–17:00). Two lines: prescriptions (blue `#3b82f6`) and customers (light blue `#60a5fa`).
- **Performance Metrics** (bar chart) — Weekly prescription counts comparing this week vs. last week. Data is **hardcoded** in the component (`Mon–Sun`, `thisWeek` and `lastWeek` values). Not fetched from the API.

### 6. Recent Activities Feed

A scrollable list at the bottom of the page, populated from `GET /api/pharmacist/activities`. Each item shows an icon (based on activity type), a description, a timestamp, and a `completed` / `pending` badge. Currently only `sale` type activities are returned by the API (the most recent four sales).

### 7. Realtime Updates

`useRealtimeUpdates` polls `GET /api/realtime/updates` every 5 seconds. When an `inventory_update` event arrives, `fetchStockAlerts()` is called. When a `new_sale` event arrives, `fetchDashboardStats()` and `fetchRecentActivities()` are called. This provides near-realtime refresh without a persistent WebSocket connection.

---

## Data Flow

```
PharmacistDashboard mounts
        │
        ▼
Promise.race([
  Promise.all([
    GET /api/pharmacist/dashboard      → setStats()
    GET /api/pharmacist/prescriptions  → setPendingPrescriptions()
    GET /api/stock-alerts              → setStockAlerts(), setExpirationAlerts(), setAlerts()
    GET /api/pharmacist/activities     → setRecentActivities()
    GET /api/pharmacist/chart-data     → setChartData()
  ]),
  2-second timeout
])
        │
        ▼
Page renders with live or fallback data
        │
        ▼
useRealtimeUpdates polls /api/realtime/updates every 5s
        │
        ├─ inventory_update → fetchStockAlerts()
        └─ new_sale         → fetchDashboardStats() + fetchRecentActivities()
```

```
Pharmacist clicks "Dispense" on a prescription
        │
        ▼
POST /api/pharmacist/prescriptions  { prescriptionId, action: 'dispense' }
        │
        ├─ UPDATE prescription_processing SET completed_at = now()
        └─ UPDATE prescriptions SET status = 'dispensed'
        │
        ▼
fetchPendingPrescriptions() + fetchDashboardStats() re-run
```

```
Pharmacist clicks "✓" on a stock alert
        │
        ▼
POST /api/pharmacist/track-activity  { type: 'alert_action', data: { alertType, referenceId, action: 'noted' } }
        │
        └─ INSERT INTO alert_actions (alert_type, alert_reference_id, action_taken)
        │
        ▼
fetchDashboardStats() re-runs (updates alertsHandled count)
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `recharts` | `LineChart`, `BarChart` for the Analytics tab |
| `@/components/ui/chart` | shadcn/ui `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` wrappers |
| `@/components/ui/card`, `badge`, `button`, `tabs`, `progress`, `scroll-area`, `separator` | shadcn/ui primitives used throughout the page |
| `@/components/ui/sidebar` | `SidebarTrigger` in the page header |
| `@/components/loading-state` | `LoadingState`, `LoadingCard` (imported but not used in the current render path) |
| `@/components/ui/spinner` | Full-screen spinner shown while `isLoading = true` |
| `lucide-react` | Icons: `Pill`, `Users`, `Clock`, `CheckCircle`, `AlertCircle`, `Search`, `UserCheck`, `Calendar`, `ShoppingCart`, `Plus`, `Package`, `AlertTriangle`, `ArrowUpRight`, `Activity`, `TrendingUp` |
| `next/navigation` | `useRouter` for programmatic navigation to `/pos`, `/inventory`, `/prescriptions` |

---

## Known Limitations

### 1. Three audit tables have no migration files

`prescription_processing`, `inventory_checks`, and `alert_actions` are referenced by multiple API routes but do not have corresponding migration files under `supabase/migrations/`. If these tables do not exist in the database, the following will silently fail or return fallback data:

- `GET /api/pharmacist/dashboard` — `averageWaitTime` will always be `8`, `inventoryChecks` and `alertsHandled` will always be `0`.
- `POST /api/pharmacist/prescriptions` with `action: 'start'` or `'dispense'` — the `prescription_processing` insert/update will throw and the route will return a 500 error.
- `POST /api/pharmacist/track-activity` — all four activity types will fail silently (the route catches the error and returns `{ success: true }` regardless).

### 2. No role enforcement on the page or its API routes

The dashboard page and all `/api/pharmacist/*` routes (except `/api/pharmacist` POST, which uses the service role) authenticate the caller but do not verify the `pharmacist` role. Any authenticated user — including `cashier` or `staff` — can access these endpoints directly.

### 3. Performance metrics chart uses hardcoded data

The "Performance Metrics" bar chart in the Analytics tab renders hardcoded `Mon–Sun` data. It does not fetch historical prescription counts from the database. The chart is purely decorative in its current state.

### 4. `LoadingState` and `LoadingCard` are imported but unused

`LoadingState` and `LoadingCard` are imported from `@/components/loading-state` but never rendered. The page uses a full-screen `<Spinner>` instead. These imports are dead code.

### 5. Realtime is polling, not WebSocket

`useRealtimeUpdates` simulates realtime by polling `/api/realtime/updates` every 5 seconds. It does not use Supabase Realtime WebSocket subscriptions. The `prescriptions` table is added to the `supabase_realtime` publication in its migration, but this is not consumed by the dashboard. Under high load, polling adds unnecessary API calls.

### 6. `consultationsGiven` is a derived estimate

The dashboard stat `consultationsGiven` is calculated as `Math.floor(completedSales * 0.4)` — 40% of today's sales. There is no actual consultation tracking in the database.

### 7. `customersServed` equals `completedSales`

The `customersServed` KPI is set to the same value as `completedSales` (today's sale count). These are not independently tracked.

### 8. Fallback mock data in the dashboard API

`GET /api/pharmacist/dashboard` catches all errors and returns hardcoded mock values (`prescriptionsToday: 12`, `customersServed: 45`, etc.) instead of propagating the error. This means API failures are invisible to the client.

### 9. `POST /api/pharmacist` uses service role without authentication

The pharmacist creation endpoint (`POST /api/pharmacist`) uses `SUPABASE_SERVICE_ROLE_KEY` directly and does not verify that the caller is authenticated or holds an appropriate role (`pharmacy_owner` or `superadmin`). Any unauthenticated request with a valid JSON body can create a new user.
