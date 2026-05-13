# Module: Superadmin Dashboard

## Purpose

The Superadmin Dashboard is the platform-level control centre for Pryrox. It gives the single superadmin account a bird's-eye view of the entire multi-tenant platform: how many pharmacies are registered, how many users exist across all tenants, aggregate platform revenue, and month-over-month growth. From this dashboard the superadmin can also create new pharmacy tenants and manage global insurance providers.

This module is intentionally separate from the per-tenant Admin Dashboard (`/admin`). The superadmin operates above the tenant boundary — they are not scoped to any single pharmacy.

---

## Role Access

| Role | Access |
|---|---|
| `superadmin` | ✅ Full access |
| `pharmacy_owner` | ❌ No access |
| `pharmacist` | ❌ No access |
| `cashier` | ❌ No access |
| `staff` | ❌ No access |

### How Access Is Enforced

Access is enforced at two layers:

1. **`supabase/middleware.ts`** — The `/superadmin` path prefix is listed in `protectedPaths`. Any unauthenticated request is redirected to `/sign-in`.

2. **`src/app/(dashboard)/layout.tsx`** — This server component reads `pharmacy_users.role` for the authenticated user. If the role is `superadmin`, it renders `<SuperadminSidebar />`. Other roles receive the pharmacy-scoped sidebars. There is **no hard redirect** for non-superadmin users who navigate directly to `/superadmin` — the layout renders the wrong sidebar but does not block the page. This is a known gap.

> **Note:** Role detection in `src/components/sidebar.tsx` and `src/components/live-sidebar-test.tsx` uses a hardcoded email check (`abdousentore@gmail.com`) rather than the database role. This is legacy code from before the `pharmacy_users` table was introduced and should be removed.

---

## Key Files

### Pages

| File | Description |
|---|---|
| `src/app/(dashboard)/superadmin/page.tsx` | The single page for this module. Client component. Renders platform stats, pharmacy list, insurance provider list, and the "Add Pharmacy" / "Add Insurance" dialogs. Also renders the **hardcoded test credentials card** (see Security Issues below). |

### API Routes

| File | Method | Description |
|---|---|---|
| `src/app/api/superadmin/dashboard/route.ts` | `GET` | Returns aggregate platform stats: total pharmacies, active pharmacies, total revenue (sum of all `sales.total_amount`), total users, and new registrations this month. |
| `src/app/api/superadmin/pharmacies/route.ts` | `GET` | Returns all rows from the `pharmacies` table ordered by `created_at` descending. |
| `src/app/api/superadmin/pharmacies/route.ts` | `POST` | Creates a new pharmacy record in the `pharmacies` table. Does **not** create a Supabase Auth user for the owner — the `owner_password` field accepted by the page is not forwarded to the API. |

### Components

| File | Description |
|---|---|
| `src/components/superadmin-sidebar.tsx` | shadcn/ui `Sidebar` variant for the superadmin. Navigation links: Dashboard, Admin Panel, Pharmacy List, Categories, Subscriptions, Reports, Settings. Hardcodes the superadmin email in the `superadminData.user` object. |
| `src/components/RealtimeStatus.tsx` | Displays a live connection indicator. Rendered in the dashboard header. |
| `src/components/subscription-blocker.tsx` | Rendered by the dashboard layout. Skipped for `superadmin` role (superadmin is never subscription-blocked). |

### Hooks

| File | Description |
|---|---|
| `src/hooks/useRealtimeUpdates.ts` | Subscribes to Supabase Realtime. The superadmin page uses this to refresh stats and the pharmacy list when a `new_sale` or `inventory_update` event is received. |
| `src/hooks/usePharmacyStore.ts` | Zustand store. The superadmin page imports `inventory`, `sales`, and `alerts` from this store, though they are not visibly used in the rendered UI. |

---

## Database Tables Used

| Table | Operations | Purpose |
|---|---|---|
| `pharmacies` | `SELECT *`, `INSERT` | Primary data source. Stats card counts rows; pharmacy list displays them; "Add Pharmacy" inserts a new row. |
| `pharmacy_users` | `SELECT id, created_at` | Used by the dashboard API to count total platform users. |
| `sales` | `SELECT total_amount` | Used by the dashboard API to compute aggregate platform revenue. |
| `subscriptions` | `SELECT plan_name, pharmacy_id` | Used by the Admin Reports page (accessible via the superadmin sidebar) to break down subscribers by plan. Not queried directly by the superadmin dashboard page itself. |
| `insurance_providers` | `SELECT *`, `INSERT` | The insurance card on the dashboard reads from `/api/insurance` (shared endpoint). The "Add Insurance" dialog POSTs to the same endpoint. |

### Key Column Reference

**`pharmacies`**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Pharmacy display name |
| `address` | `text` | Physical address |
| `phone` | `text` | Contact phone |
| `email` | `text` | Contact email |
| `owner_id` | `uuid` | FK to Supabase Auth user (not always populated) |
| `owner_name` | `text` | Denormalised owner name |
| `status` | `text` | `active` \| `suspended` |
| `subscription_plan` | `text` | `free` \| `standard` \| `premium` |
| `subscription_expires_at` | `timestamptz` | Expiry date for subscription blocker |
| `license_number` | `text` | Auto-generated as `LIC-<timestamp>` on creation |
| `created_at` | `timestamptz` | Row creation timestamp |

**`pharmacy_users`**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK to `auth.users` |
| `pharmacy_id` | `uuid` | FK to `pharmacies` |
| `role` | `text` | `superadmin` \| `pharmacy_owner` \| `pharmacist` \| `cashier` \| `staff` |
| `is_active` | `boolean` | Soft-delete flag |
| `created_at` | `timestamptz` | Row creation timestamp |

**`subscriptions`**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK to `pharmacies` |
| `plan_id` | `uuid` | FK to `subscription_plans` |
| `plan_name` | `text` | Denormalised plan name |
| `status` | `text` | `active` \| `expired` \| `cancelled` |
| `expires_at` | `timestamptz` | Subscription expiry |

---

## Features

### Platform Stats Cards

Four summary cards rendered at the top of the page:

| Card | Data Source | Notes |
|---|---|---|
| Total Pharmacies | `GET /api/superadmin/pharmacies` (count) | Also shows active count |
| Platform Revenue | `GET /api/superadmin/dashboard` | Sum of all `sales.total_amount` across all tenants, in RWF |
| Total Users | `GET /api/superadmin/dashboard` | Count of all `pharmacy_users` rows |
| Growth Rate | `GET /api/superadmin/dashboard` | `monthlyGrowth` is hardcoded to `15.2` — not computed from real data |

### Pharmacy List

Displays the five most recently registered pharmacies. Each card shows pharmacy name, location, status badge (`active` / `inactive`), and subscription plan. The full list is fetched from `GET /api/superadmin/pharmacies`.

**Known limitation:** The `owner` field displayed in the UI is populated from `p.owner_id` (a UUID), not a human-readable name. The API comment acknowledges this: `// You may want to join with users table`. Owner names are not resolved.

### Add Pharmacy Dialog

A modal form that collects: pharmacy name, location, owner name, owner email, owner phone, owner password, subscription plan (free / standard / premium), and insurance provider assignments with adjustable coverage percentages.

**Known limitation:** The `owner_password` field is accepted by the form but is **not sent to the API**. The `POST /api/superadmin/pharmacies` handler does not create a Supabase Auth user for the new owner. The pharmacy record is created but the owner cannot log in. This is an incomplete implementation.

After creation, the page broadcasts a `pharmacy_created` event via `POST /api/notifications/broadcast`.

### Insurance Provider Management

Displays all global insurance providers from `GET /api/insurance`. Each entry shows the provider name, coverage percentage, and active/inactive status.

The "Add Insurance" dialog collects: name, coverage percentage, contact email, contact phone, policy number, and invoice template (default / RSSB / MMI / Radiant / custom). Custom templates open `/admin/insurance-templates` in a new tab.

### Subscription Oversight

Subscription plan management is accessible via the superadmin sidebar under **Subscriptions** (`/admin/subscriptions`). This page (documented in the Subscription & Billing module) allows creating and editing subscription plans and viewing subscriber counts per plan.

### Realtime Updates

The page subscribes to Supabase Realtime via `useRealtimeUpdates`. On `new_sale` or `inventory_update` events, it re-fetches both the dashboard stats and the pharmacy list. A `<RealtimeStatus />` indicator in the header shows the live connection state.

The page also polls every 30 seconds via `setInterval` as a fallback.

---

## ❌ Security Issue: Hardcoded Test Credentials

The superadmin dashboard page renders a "Test User Credentials" card that displays **plaintext email and password combinations** for all test accounts:

| Role | Email | Password |
|---|---|---|
| Super Admin | `abdousentore@gmail.com` | `admin123` |
| Pharmacy Owner | `pharmacy@test.com` | `pharmacy123` |
| Pharmacist | `pharmacist@test.com` | `pharmacist123` |
| Cashier | `cashier@test.com` | `cashier123` |

This card is visible to any authenticated superadmin user in production. It exposes the superadmin account credentials to anyone who can view the page source or the rendered UI.

**File:** `src/app/(dashboard)/superadmin/page.tsx` (the `"Test User Credentials"` `<Card>` block)

**Required action:** Remove this card entirely before any production deployment. See [`docs/feature-status.md`](../feature-status.md) for the full security assessment.

---

## Known Limitations and Issues

| Issue | Severity | Details |
|---|---|---|
| Hardcoded test credentials card | 🔴 Critical | Exposes superadmin and test account passwords in the UI. Must be removed before production. |
| `monthlyGrowth` is hardcoded | 🟡 Medium | The growth rate stat is always `15.2%` regardless of actual data. |
| Owner user not created on pharmacy creation | 🟡 Medium | The "Add Pharmacy" form collects an owner password but the API does not create a Supabase Auth user. The pharmacy record is created but the owner cannot log in. |
| Owner name not resolved | 🟡 Medium | The pharmacy list shows the `owner_id` UUID instead of a human-readable name. |
| No role-based page guard | 🟡 Medium | The `/superadmin` page is only protected by the middleware session check. A non-superadmin authenticated user who navigates directly to `/superadmin` will see the page with the wrong sidebar. |
| Hardcoded email in sidebar | 🟠 Low | `src/components/superadmin-sidebar.tsx` hardcodes `abdousentore@gmail.com` in the `superadminData.user` object. The sidebar does not read the actual logged-in user's email. |
| Legacy email-based role detection | 🟠 Low | `src/components/sidebar.tsx` and `src/components/live-sidebar-test.tsx` detect the superadmin role by checking if the email equals `abdousentore@gmail.com`. This bypasses the `pharmacy_users` table and will break if the superadmin email changes. |
| `usePharmacyStore` imported but unused | 🟢 Minor | `inventory`, `sales`, and `alerts` are destructured from `usePharmacyStore` but not rendered anywhere in the superadmin page. |

---

## Data Flow

```
SuperAdminDashboard (client component)
    │
    ├── useEffect (on mount + 30s interval)
    │       ├── GET /api/superadmin/dashboard  →  pharmacies, pharmacy_users, sales tables
    │       ├── GET /api/superadmin/pharmacies →  pharmacies table
    │       └── GET /api/insurance            →  insurance_providers table
    │
    ├── useRealtimeUpdates (Supabase Realtime WebSocket)
    │       └── on new_sale / inventory_update → re-fetch stats + pharmacies
    │
    ├── "Add Pharmacy" dialog
    │       └── POST /api/superadmin/pharmacies  →  INSERT into pharmacies
    │           POST /api/notifications/broadcast (fire-and-forget)
    │
    └── "Add Insurance" dialog
            └── POST /api/insurance  →  INSERT into insurance_providers
                POST /api/notifications/broadcast (fire-and-forget)
```

---

## Navigation (Superadmin Sidebar)

The `SuperadminSidebar` component provides the following navigation links when the `superadmin` role is detected:

| Label | Route | Notes |
|---|---|---|
| Dashboard | `/superadmin` | This module |
| Admin Panel | `/admin` | Per-tenant admin overview |
| Pharmacy List | `/admin/stores` | Full pharmacy management table |
| Categories | `/admin/categories` | Global drug/product categories |
| Subscriptions | `/admin/subscriptions` | Subscription plan management |
| Reports | `/admin/reports` | Platform-wide analytics |
| Settings | `/admin/settings` | Platform settings |
