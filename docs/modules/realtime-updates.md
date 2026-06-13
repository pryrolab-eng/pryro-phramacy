> **Stack:** Prisma (`DATABASE_URL`) for data; native JWT auth (`getAuthUser()`, cookies `pryrox_session` / `pryrox_refresh`). SQL migrations live in `supabase/migrations/` (`npm run db:sql:push`).

# Realtime Updates Module

## Purpose

The Realtime Updates module provides live data synchronization across Pryrox dashboard pages. When inventory changes or new sales are recorded, subscribed UI components automatically refresh their data without requiring a manual page reload.

**Important:** Despite the module name and the "Live" indicator UI, the implementation uses **HTTP polling** only — `useRealtimeUpdates` calls `/api/realtime/updates` on an interval. There is no WebSocket subscription. Historical migrations may still add tables to `supabase_realtime`, but the app does not consume that publication.

This distinction is critical for understanding the system's actual behavior, latency characteristics, and server load profile.

---

## Key Files

### Hook

| File | Description |
|---|---|
| `src/hooks/useRealtimeUpdates.ts` | Core client-side hook. Sets up a 5-second polling interval that calls `GET /api/realtime/updates`. Exposes a `connected` boolean (set to `true` on the first successful response) and accepts an `onUpdate` callback that is invoked for each update object returned by the API. |

### API Route

| File | Route | Method | Auth Required | Description |
|---|---|---|---|---|
| `src/app/api/realtime/updates/route.ts` | `/api/realtime/updates` | `GET` | Yes (`getAuthUser()`) | Prisma queries on `inventory` and `sales` for the session pharmacy since `lastUpdateTime`. Returns `inventory_update` / `new_sale` payloads. |

### Component

| File | Description |
|---|---|
| `src/components/RealtimeStatus.tsx` | Small status badge rendered in the Superadmin Dashboard header. Calls `useRealtimeUpdates` with a no-op callback solely to read the `connected` state. Displays a green "Live" badge with a `Wifi` icon when connected, or a red "Offline" badge with a `WifiOff` icon when the last poll failed. |

---

## How It Works

### Polling Flow

```
Client Component mounts
        │
        ▼
useRealtimeUpdates(onUpdate) called
        │
        ▼
setInterval fires every 5,000 ms
        │
        ▼
fetch('/api/realtime/updates')
        │
        ├─ Network error → setConnected(false)
        │
        └─ 200 OK → setConnected(true)
                    updates.forEach(onUpdate)
                    │
                    ├─ update.type === 'inventory_update'
                    │       → subscriber calls fetchInventory() / fetchStockAlerts()
                    │
                    └─ update.type === 'new_sale'
                            → subscriber calls fetchStats() / fetchRecentSales()
```

### API Route Logic

```
GET /api/realtime/updates
        │
        ▼
getAuthUser() → [] if missing
requireSessionPharmacyId()
        │
        ├─ prisma.inventory.findMany
        │     pharmacy_id + updated_at >= lastUpdateTime
        │     → { type: 'inventory_update', data: [...] }
        │
        ├─ prisma.sales.findMany
        │     pharmacy_id + created_at >= lastUpdateTime
        │     → { type: 'new_sale', data: [...] }
        │
        ├─ lastUpdateTime = new Date()  (module-level; per server instance)
        │
        └─ NextResponse.json(updates)
```

---

## Update Types

The `RealtimeUpdate` interface (defined in `useRealtimeUpdates.ts`) declares four update types, but only two are currently produced by the API route:

| `type` | Produced by API | Description |
|---|---|---|
| `inventory_update` | ✅ Yes | One or more `inventory` rows have `updated_at >= lastUpdateTime` |
| `new_sale` | ✅ Yes | One or more `sales` rows have `created_at >= lastUpdateTime` |
| `stock_alert` | ❌ No | Declared in the TypeScript interface but never emitted |
| `prescription_update` | ❌ No | Declared in the TypeScript interface but never emitted |

---

## Database Tables Queried

| Table | Column Checked | Condition | Update Type Emitted |
|---|---|---|---|
| `inventory` | `updated_at` | `>= lastUpdateTime` | `inventory_update` |
| `sales` | `created_at` | `>= lastUpdateTime` | `new_sale` |

No other tables are polled. The `stock_alert` and `prescription_update` types are defined in the TypeScript interface but have no corresponding database queries in the API route.

---

## UI Components That Subscribe

Four pages call `useRealtimeUpdates`. Each page registers a callback that triggers specific data-refresh functions when an update arrives.

### 1. Superadmin Dashboard (`src/app/(dashboard)/superadmin/page.tsx`)

```typescript
useRealtimeUpdates((update) => {
  if (update.type === 'new_sale' || update.type === 'inventory_update') {
    fetchDashboardStats()   // GET /api/superadmin/dashboard
    fetchPharmacies()       // GET /api/superadmin/pharmacies
  }
})
```

This page also renders the `<RealtimeStatus />` component in its header, making it the only page that visually exposes the connection state to the user.

Additionally, this page runs its own independent 30-second `setInterval` that calls `fetchInsurance()`, `fetchPharmacies()`, and `fetchDashboardStats()` regardless of realtime updates — a second polling loop layered on top of the realtime hook.

### 2. Pharmacy Owner Dashboard (`src/app/(dashboard)/pharmacy-dashboard/page.tsx`)

```typescript
useRealtimeUpdates((update) => {
  if (update.type === 'inventory_update') {
    fetchStockAlerts()    // GET /api/stock-alerts
  }
  if (update.type === 'new_sale') {
    fetchStats()          // GET /api/pharmacy/dashboard
    fetchRecentSales()    // GET /api/pos
  }
})
```

### 3. Pharmacist Dashboard (`src/app/(dashboard)/pharmacist-dashboard/page.tsx`)

```typescript
useRealtimeUpdates((update) => {
  if (update.type === 'inventory_update') {
    fetchStockAlerts()    // GET /api/stock-alerts
  }
  if (update.type === 'new_sale') {
    fetchDashboardStats() // GET /api/pharmacist/dashboard
    fetchRecentActivities() // GET /api/pharmacist/activities
  }
})
```

### 4. Inventory Page (`src/app/(dashboard)/inventory/page.tsx`)

```typescript
useRealtimeUpdates((update) => {
  if (update.type === 'inventory_update') {
    fetchInventory()  // GET /api/inventory (with auth header)
  }
})
```

---

## Role Access

The realtime hook is consumed by pages that are accessible to the following roles:

| Page | Roles With Access |
|---|---|
| Superadmin Dashboard | `superadmin` |
| Pharmacy Owner Dashboard | `pharmacy_owner`, `cashier`, `staff` |
| Pharmacist Dashboard | `pharmacist` |
| Inventory Page | `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |

The `/api/realtime/updates` endpoint uses `getAuthUser()` and `requireSessionPharmacyId()` — results are scoped to the caller's pharmacy. There is no role-based restriction beyond authentication; any pharmacy member receives the same poll payload for that tenant.

---

## Supabase Realtime Channels

**None.** The module does not use Supabase Realtime channels (`supabase.channel()`, `supabase.from().on()`, or `supabase.realtime`). All updates are delivered via HTTP polling against a Next.js API route.

The `RealtimeStatus` component's "Live" label refers to the polling connection being active, not to a WebSocket connection.

---

## Known Limitations

### 1. Polling, not WebSocket

The hook uses polling (`setInterval` 5s), not WebSockets. Updates can lag by up to 5 seconds. Each connected client issues one HTTP request every 5 seconds; the route runs two Prisma queries per poll.

### 2. Module-level `lastUpdateTime` is not tenant-aware

The `lastUpdateTime` variable in `src/app/api/realtime/updates/route.ts` is declared at module scope:

```typescript
let lastUpdateTime = new Date()
```

In a serverless deployment (Vercel), each function invocation may run in a separate cold-started instance, causing `lastUpdateTime` to reset to the current time on every cold start. This means updates that occurred before the cold start will never be delivered. In a warm instance, the variable is shared across all concurrent requests, which can cause race conditions where two simultaneous polls advance `lastUpdateTime` before either has fully processed the results.

### 3. `stock_alert` and `prescription_update` types are dead code

The `RealtimeUpdate` interface declares `stock_alert` and `prescription_update` as valid update types, but the API route never emits them. Any component that registers a handler for these types will never receive a callback.

### 4. `onUpdate` callback is not memoized

The `useRealtimeUpdates` hook lists `onUpdate` in its `useEffect` dependency array. If the calling component passes an inline arrow function (as all four subscriber pages do), the function reference changes on every render, causing the `useEffect` to tear down and re-create the polling interval on every render cycle. This is a React hook correctness issue that can cause the interval to reset unexpectedly.

### 5. No error recovery or backoff

When a poll fails (network error or non-OK response), the hook sets `connected = false` but immediately retries on the next 5-second tick. There is no exponential backoff, no maximum retry count, and no user notification beyond the `RealtimeStatus` badge turning red.

### 6. `RealtimeStatus` starts its own polling loop

`RealtimeStatus` calls `useRealtimeUpdates(() => {})` with a no-op callback. This means every page that renders `RealtimeStatus` runs **two** polling loops simultaneously — one from the page's own `useRealtimeUpdates` call and one from `RealtimeStatus`. Currently only the Superadmin Dashboard renders `RealtimeStatus`, so that page runs two 5-second polling loops plus the additional 30-second `setInterval` for a total of three concurrent polling loops.

### 7. Path to true push updates

To replace polling, options include:

1. **Postgres `LISTEN/NOTIFY`** or a job queue from sale/inventory writers.
2. **SSE** or **WebSocket** route scoped by pharmacy session.
3. **Client-side invalidation** via React Query `refetchOnWindowFocus` only (lighter, less realtime).

The `supabase_realtime` publication in SQL migrations is not consumed by this app after the Prisma migration.
