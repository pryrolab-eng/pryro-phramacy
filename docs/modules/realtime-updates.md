# Realtime Updates Module

## Purpose

The Realtime Updates module provides live data synchronization across Pryrox dashboard pages. When inventory changes or new sales are recorded, subscribed UI components automatically refresh their data without requiring a manual page reload.

**Important:** Despite the module's name and the presence of a `RealtimeStatus` component that displays a "Live" indicator, the current implementation does **not** use Supabase Realtime (WebSocket-based `supabase.channel()` subscriptions). Instead, it uses **HTTP polling** — a `setInterval` loop that calls a REST API endpoint every 5 seconds. The comment in the hook source code explicitly acknowledges this: `// Simulate WebSocket with polling for now`.

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
| `src/app/api/realtime/updates/route.ts` | `/api/realtime/updates` | `GET` | Yes (Supabase session) | Queries the `inventory` and `sales` tables for rows updated/created since the last poll. Returns an array of update objects. Maintains a module-level `lastUpdateTime` variable to track the polling window. |

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
createClient() → Supabase server client
        │
        ├─ SELECT id, quantity_in_stock, updated_at
        │   FROM inventory
        │   WHERE updated_at >= lastUpdateTime
        │   → if rows found: push { type: 'inventory_update', data: [...] }
        │
        ├─ SELECT id, total_amount, created_at
        │   FROM sales
        │   WHERE created_at >= lastUpdateTime
        │   → if rows found: push { type: 'new_sale', data: [...] }
        │
        ├─ lastUpdateTime = new Date()
        │
        └─ return NextResponse.json(updates)  // [] if nothing changed
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

The `/api/realtime/updates` endpoint itself uses `createClient()` (the anon-key Supabase client) and relies on the caller's session cookie for authentication. Any authenticated user whose session is valid can call this endpoint. There is no role-based restriction at the API route level — the route returns the same data regardless of the caller's role.

---

## Supabase Realtime Channels

**None.** The module does not use Supabase Realtime channels (`supabase.channel()`, `supabase.from().on()`, or `supabase.realtime`). All updates are delivered via HTTP polling against a Next.js API route.

The `RealtimeStatus` component's "Live" label refers to the polling connection being active, not to a WebSocket connection.

---

## Known Limitations

### 1. Polling, not WebSocket

The hook comment explicitly states: `// Simulate WebSocket with polling for now`. The 5-second polling interval means updates are delivered with up to 5 seconds of latency. Under load, each connected client generates one HTTP request every 5 seconds to the Next.js server, which in turn makes two Supabase database queries. With many concurrent users, this creates significant and predictable database load.

### 2. Module-level `lastUpdateTime` is not tenant-aware

The `lastUpdateTime` variable in `src/app/api/realtime/updates/route.ts` is declared at module scope:

```typescript
let lastUpdateTime = new Date()
```

In a serverless deployment (Vercel), each function invocation may run in a separate cold-started instance, causing `lastUpdateTime` to reset to the current time on every cold start. This means updates that occurred before the cold start will never be delivered. In a warm instance, the variable is shared across all concurrent requests, which can cause race conditions where two simultaneous polls advance `lastUpdateTime` before either has fully processed the results.

### 3. No tenant isolation in the API route

The `/api/realtime/updates` route queries `inventory` and `sales` without filtering by `pharmacy_id`. It relies entirely on Supabase Row Level Security (RLS) to scope results to the authenticated user's pharmacy. If RLS policies on these tables are misconfigured, a user could receive update notifications for another pharmacy's data.

### 4. `stock_alert` and `prescription_update` types are dead code

The `RealtimeUpdate` interface declares `stock_alert` and `prescription_update` as valid update types, but the API route never emits them. Any component that registers a handler for these types will never receive a callback.

### 5. `onUpdate` callback is not memoized

The `useRealtimeUpdates` hook lists `onUpdate` in its `useEffect` dependency array. If the calling component passes an inline arrow function (as all four subscriber pages do), the function reference changes on every render, causing the `useEffect` to tear down and re-create the polling interval on every render cycle. This is a React hook correctness issue that can cause the interval to reset unexpectedly.

### 6. No error recovery or backoff

When a poll fails (network error or non-OK response), the hook sets `connected = false` but immediately retries on the next 5-second tick. There is no exponential backoff, no maximum retry count, and no user notification beyond the `RealtimeStatus` badge turning red.

### 7. `RealtimeStatus` starts its own polling loop

`RealtimeStatus` calls `useRealtimeUpdates(() => {})` with a no-op callback. This means every page that renders `RealtimeStatus` runs **two** polling loops simultaneously — one from the page's own `useRealtimeUpdates` call and one from `RealtimeStatus`. Currently only the Superadmin Dashboard renders `RealtimeStatus`, so that page runs two 5-second polling loops plus the additional 30-second `setInterval` for a total of three concurrent polling loops.

### 8. Path to true Supabase Realtime

To replace polling with genuine WebSocket-based updates, the implementation would need to:

1. Remove the `setInterval` in `useRealtimeUpdates.ts` and replace it with a `supabase.channel()` subscription using `postgres_changes` events.
2. Remove or repurpose `src/app/api/realtime/updates/route.ts`.
3. Ensure the Supabase project has Realtime enabled for the `inventory` and `sales` tables (via the Supabase dashboard → Database → Replication).
4. Handle channel cleanup in the `useEffect` return function.

Example of what the hook would look like with true Supabase Realtime:

```typescript
// Future implementation — not currently in use
import { createClient } from '@/supabase/client'

export function useRealtimeUpdates(onUpdate: (update: RealtimeUpdate) => void) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('pharmacy-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        onUpdate({ type: 'inventory_update', data: null })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, () => {
        onUpdate({ type: 'new_sale', data: null })
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [onUpdate])

  return { connected }
}
```
