# Admin Dashboard Module

## Purpose

The Admin Dashboard is the **pharmacy-owner-level** management interface in Pryrox. It is accessible to users with the `pharmacy_owner` role (and, in practice, also to `superadmin` users who can navigate to any route). The dashboard provides a unified view of platform-level operations: pharmacy registration and management, subscription plan administration, global product category management, insurance provider setup, insurance claim template design, business analytics, and platform-wide system settings.

> **Note on naming:** The route group is `src/app/(dashboard)/admin/`, but this is the *admin* view for a pharmacy owner or platform operator — not the superadmin view. The superadmin dashboard lives at `src/app/(dashboard)/superadmin/`. The two are distinct modules with different scopes.

---

## Key Files

### Pages (`src/app/(dashboard)/admin/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/admin` | Overview dashboard. Fetches live stats (total pharmacies, expired subscriptions, plan distribution, subscription revenue) and renders a custom SVG analytics chart with hover tooltips. |
| `categories/page.tsx` | `/admin/categories` | Global category management. Lists all `is_global = true` categories from the `categories` table. Supports create, edit, and delete via modal dialogs. |
| `insurance-templates/page.tsx` | `/admin/insurance-templates` | Dual-purpose page: (1) Add new insurance providers via a form that calls `POST /api/insurance`; (2) Design drag-and-drop insurance claim document templates using a canvas-based editor with pre-built template presets (Rwanda Medical Claim, Official Certificate, Ministry Health Report). Templates are not persisted to the database from this page — the Save button only updates local state. |
| `reports/page.tsx` | `/admin/reports` | Business analytics. Queries the `payments`, `pharmacies`, `pharmacy_users`, and `subscription_plans` tables directly via the Supabase browser client. Displays total revenue, active pharmacies, total users, monthly revenue chart, plan revenue breakdown, and a list of downloadable report types (UI only — download buttons are not wired to actual export logic). |
| `settings/page.tsx` | `/admin/settings` | **Current active settings page.** Platform configuration UI with 9 setting cards: Platform Configuration, Multi-Tenant Settings, API & Integration Limits, Security & Access, Compliance & Audit, System Operations, System Management, Stock Locations, Platform Analytics, and a "Custom Settings" card with placeholder fields (`customSetting`, `featureFlag`). Uses `alert()` for success/error feedback. |
| `settings/page-improved.tsx` | `/admin/settings` *(not active)* | **Refactored version of `page.tsx`.** Replaces `alert()` calls with inline `setError`/`setSuccess` state banners. Adds a Refresh button and a loading spinner on the Save button. Removes the placeholder "Custom Settings" card. **See cleanup recommendation below.** |
| `stores/page.tsx` | `/admin/stores` | Pharmacy management. Lists all registered pharmacies fetched from `/api/admin/pharmacies`. Supports full CRUD: add a new pharmacy (creates a Supabase Auth user + `pharmacies` record + optional `profiles` and `pharmacy_users` records), edit pharmacy details and owner credentials, delete a pharmacy. |
| `subscriptions/page.tsx` | `/admin/subscriptions` | Subscription plan management. Lists plans from `subscription_plans` table. Supports create and edit via modal dialogs. Subscriber counts are fetched but always display `0` (the `users` field is hardcoded to `0` with a `TODO` comment). Falls back to hardcoded mock data if the API call fails. |

### API Routes (`src/app/api/admin/`)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/admin/pharmacies` | `GET` | Service role (no user auth check) | Returns all rows from `pharmacies` ordered by `created_at` descending. Uses the service role key directly — no session check. |
| `/api/admin/pharmacies` | `POST` | Service role (no user auth check) | Creates a Supabase Auth user, inserts a `pharmacies` record, and optionally creates `profiles` and `pharmacy_users` records. |
| `/api/admin/pharmacies/[id]` | `PUT` | Service role (no user auth check) | Updates pharmacy fields. Optionally updates the owner's password and email via `supabase.auth.admin.updateUserById`. |
| `/api/admin/pharmacies/[id]` | `DELETE` | Service role (no user auth check) | Deletes the pharmacy record. Does **not** delete the associated Supabase Auth user. |
| `/api/admin/categories` | `GET` | Service role (no user auth check) | Returns all `categories` where `is_global = true` and `is_active = true`. |
| `/api/admin/categories` | `POST` | Service role (no user auth check) | Inserts a new global category (`is_global = true`, `pharmacy_id = null`). |
| `/api/admin/categories/[id]` | `PUT` | Service role (no user auth check) | Updates a global category's name, description, and active status. |
| `/api/admin/categories/[id]` | `DELETE` | Service role (no user auth check) | Deletes a global category. |
| `/api/admin/plans` | `GET` | Supabase SSR session | Returns active `subscription_plans` ordered by price ascending. |
| `/api/admin/plans` | `POST` | Supabase SSR session | Inserts a new subscription plan. |
| `/api/admin/plans/[id]` | `PUT` | Supabase SSR session | Updates a subscription plan's name, price, period, features, and popularity flag. |
| `/api/admin/system-settings` | `GET` | Supabase SSR session + `superadmin` role check | Returns all platform-level `system_settings` (where `pharmacy_id IS NULL`) plus live analytics (active pharmacies, total users, new users in last 30 days). |
| `/api/admin/system-settings` | `PUT` | Supabase SSR session + `superadmin` role check | Upserts each key-value pair in the request body into `system_settings`. |
| `/api/admin/backups` | `GET` | Supabase SSR session | Returns all rows from the `backups` table. |
| `/api/admin/backups` | `POST` | Supabase SSR session | Inserts a new backup record. The `pharmacy_id` field is hardcoded to the string `'userPharmacy.pharmacy_id'` — this is a bug. |
| `/api/admin/insurance-templates` | `GET` | Supabase SSR session | Returns all rows from `insurance_templates`. |
| `/api/admin/insurance-templates` | `POST` | Supabase SSR session | Inserts a new insurance template. The `pharmacy_id` field is hardcoded to the string `'userPharmacy.pharmacy_id'` — this is a bug. |
| `/api/admin/stores` | `GET` | None | Returns a **hardcoded** array of two mock pharmacy objects. This route is not connected to the database and should be removed or replaced. |

### Settings API Routes (also used by admin settings page)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/settings/locations` | `GET` | Supabase SSR session | Returns stock locations for the current pharmacy. |
| `/api/settings/locations` | `POST` | Supabase SSR session | Creates a new stock location. |

---

## Database Tables

### `pharmacies`

The primary tenant table. Each row represents one registered pharmacy.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Pharmacy display name |
| `address` | `text` | Physical address |
| `phone` | `text` | Contact phone number |
| `email` | `text` | Contact / owner email |
| `license_number` | `text` | Pharmacy license identifier |
| `owner_id` | `uuid` | Foreign key → `auth.users.id` |
| `owner_name` | `text` | Owner's full name |
| `owner_email` | `text` | Owner's email (may differ from `email`) |
| `subscription_plan` | `text` | `'free'`, `'trial'`, `'standard'`, `'premium'` |
| `subscription_expires_at` | `timestamptz` | Subscription expiry; used by `SubscriptionBlocker` |
| `status` | `text` | `'active'`, `'suspended'`, etc. |
| `is_active` | `boolean` | Whether the pharmacy is active |
| `created_at` | `timestamptz` | Record creation timestamp |

### `subscription_plans`

Platform-defined billing plans available to pharmacies.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Plan name (e.g., `'Free'`, `'Standard'`, `'Premium'`) |
| `price` | `numeric` | Price in RWF |
| `period` | `text` | Billing period (e.g., `'per month'`) |
| `features` | `text[]` | Array of feature strings displayed on the plan card |
| `is_popular` | `boolean` | Whether to show the "Most Popular" badge |
| `is_active` | `boolean` | Whether the plan is available for selection |

### `categories`

Product/drug categories. Global categories (`is_global = true`, `pharmacy_id = null`) are managed here and are visible to all pharmacies. Pharmacy-specific categories have a non-null `pharmacy_id`.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Category name |
| `description` | `text` | Optional description |
| `is_global` | `boolean` | `true` for platform-wide categories managed by admin |
| `pharmacy_id` | `uuid` | `null` for global categories; FK → `pharmacies.id` for tenant categories |
| `is_active` | `boolean` | Whether the category is visible |

### `system_settings`

Key-value store for platform-level configuration. Rows with `pharmacy_id IS NULL` are global settings managed by the admin settings page.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `setting_key` | `text` | Setting identifier (e.g., `'platformName'`, `'maxPharmacies'`) |
| `setting_value` | `jsonb` | Setting value (any JSON-serializable type) |
| `pharmacy_id` | `uuid` | `null` for global settings; FK → `pharmacies.id` for tenant settings |
| `updated_at` | `timestamptz` | Last update timestamp |

### `stock_locations`

Warehouse and branch locations per pharmacy. Managed from the Stock Locations card in the admin settings page.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Location name (e.g., `'Downtown Branch'`) |
| `description` | `text` | Optional description |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |

### `insurance_providers`

Insurance companies that pharmacies can accept. Created via the Insurance Templates page.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Provider name (e.g., `'RSSB'`, `'MMI'`) |
| `coverage_percentage` | `numeric` | Default coverage rate (0–100) |
| `contact_email` | `text` | Provider contact email |
| `contact_phone` | `text` | Provider contact phone |
| `policy_number` | `text` | Policy reference number |
| `is_active` | `boolean` | Whether the provider is active |

### `insurance_templates`

Saved insurance claim document templates. Created via the drag-and-drop canvas editor on the Insurance Templates page.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `name` | `text` | Template name |
| `insurance_provider` | `text` | Associated insurance provider name |
| `template_html` | `text` | Serialized HTML layout |
| `template_css` | `text` | Associated CSS styles |
| `is_active` | `boolean` | Whether the template is in use |

### `payments`

Payment transaction records. Queried by the admin reports page to calculate total revenue and monthly breakdowns.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `amount` | `numeric` | Payment amount in RWF |
| `status` | `text` | `'completed'`, `'pending'`, `'failed'` |
| `created_at` | `timestamptz` | Transaction timestamp |

### `backups`

Backup job records. Managed via `/api/admin/backups`.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `name` | `text` | Backup display name |
| `type` | `text` | Backup type (e.g., `'full'`, `'incremental'`) |
| `file_size` | `text` | Human-readable file size |
| `status` | `text` | `'completed'`, `'in_progress'`, `'failed'` |
| `created_at` | `timestamptz` | Backup creation timestamp |

---

## Role Access

| Role | Access Level |
|---|---|
| `superadmin` | Full access to all admin routes and API endpoints. The `system-settings` API explicitly checks for `superadmin` role before allowing reads or writes. |
| `pharmacy_owner` | Intended primary user of this dashboard. Can manage their pharmacy's settings, categories, subscriptions, and insurance providers. |
| `pharmacist` | No access. The dashboard layout renders a `PharmacistSidebar` that does not include admin routes. |
| `cashier` | No access. |
| `staff` | No access. |

> **Security gap:** The `/api/admin/pharmacies`, `/api/admin/categories`, and `/api/admin/pharmacies/[id]` routes use the Supabase service role key directly and perform **no authentication or authorization checks**. Any authenticated (or even unauthenticated) caller who can reach these endpoints can read, create, update, or delete pharmacy records. See Known Limitations.

---

## Features

### 1. Overview Dashboard (`/admin`)

The landing page aggregates live data from multiple API calls on mount:

- **Total Shops** — count of all `pharmacies` rows
- **Expired Businesses** — pharmacies where `subscription_expires_at < now()`
- **Plan Subscriptions** — sum of all `subscription_plans.price` values (not actual revenue)
- **Total Categories** — count from `/api/categories`
- **Total Plans** — count of active subscription plans
- **Platform Analytics chart** — custom SVG line chart showing estimated monthly revenue (calculated as `pharmacy_count × 75,000 RWF`) and pharmacy growth over the trailing 12 months
- **Subscription Plan Overview** — distribution of pharmacies across Free / Standard / Premium plans
- **Finance Overview** — estimated revenue per plan tier (Premium: 120,000 RWF/pharmacy, Standard: 50,000 RWF/pharmacy, Free: 0)
- **New Registered Users** — the four most recently created pharmacies

### 2. Pharmacy Management (`/admin/stores`)

Full CRUD interface for registered pharmacies:

- **List** all pharmacies with name, license number, address, status badge, and subscription plan badge
- **Add** a new pharmacy: creates a Supabase Auth user for the owner, inserts the `pharmacies` record, and optionally creates `profiles` and `pharmacy_users` records. Supports assigning insurance providers with adjustable coverage percentages at creation time.
- **Edit** an existing pharmacy: updates all fields including owner name, email, and optionally resets the owner's password via `supabase.auth.admin.updateUserById`
- **Delete** a pharmacy: removes the `pharmacies` row but does **not** delete the associated Supabase Auth user

### 3. Subscription Plan Management (`/admin/subscriptions`)

- **List** all active plans with price, features, and subscriber count (subscriber count always shows `0` — see Known Limitations)
- **Create** a new plan with name, price (RWF), and comma-separated features
- **Edit** an existing plan's name, price, features, and popularity flag
- Visual analytics bar chart showing subscriber distribution across plans

### 4. Global Category Management (`/admin/categories`)

- **List** all global categories (`is_global = true`) with name, description, and active/inactive status
- **Create** a new global category visible to all pharmacies
- **Edit** a category's name, description, and active status
- **Delete** a global category
- Summary cards showing total, active, and inactive category counts

### 5. Insurance Template Designer (`/admin/insurance-templates`)

A dual-purpose page combining insurance provider registration with a visual template editor:

**Insurance Provider Registration:**
- Form to add a new insurance provider (name, coverage percentage, contact email, contact phone, policy number)
- Calls `POST /api/insurance` (not `/api/admin/insurance-templates`)

**Template Canvas Editor:**
- Three pre-built template presets: Rwanda Medical Claim, Official Certificate, Ministry Health Report
- Drag-and-drop component palette: Text, Title, Variable, Date, Amount, Patient, Image, Line
- Canvas with dot-grid background; elements are positioned absolutely
- Click-to-select with blue border highlight; drag-to-move; resize handle on selected elements
- Properties panel for editing text, font size, font weight, image URL, and line color of the selected element
- Print Preview button triggers `window.print()`
- **Save Template button does not persist to the database** — it only updates local state

### 6. Business Reports (`/admin/reports`)

- **Summary metrics:** Total revenue (from `payments` table), active pharmacies, total users, conversion rate (hardcoded at 78%)
- **Revenue Analytics chart:** Monthly revenue and pharmacy count from `payments` grouped by month
- **Revenue Breakdown:** Revenue per subscription plan from `subscriptions` joined with `subscription_plans`
- **Available Reports list:** Four report types (Revenue Report, User Activity, Pharmacy Performance, Subscription Analytics) with Generate buttons — the buttons are not wired to any export logic

### 7. Platform Settings (`/admin/settings`)

Nine configuration cards, all persisted to `system_settings` via `PUT /api/admin/system-settings`:

| Card | Settings |
|---|---|
| Platform Configuration | Platform name, admin email, maximum pharmacies |
| Multi-Tenant Settings | Max users per pharmacy, enable multi-branch, white-label features |
| API & Integration Limits | API rate limit (requests/hour), integration health status display |
| Security & Access | Enable new registrations, SSO integration, data encryption |
| Compliance & Audit | Data retention days, audit logging, compliance report download (UI only) |
| System Operations | Maintenance mode, enable notifications, system health dashboard (UI only) |
| System Management | Automatic backups, automatic updates, system load display (hardcoded at 45%) |
| Stock Locations | List existing locations; add new location via dialog (calls `/api/settings/locations`) |
| Platform Analytics | Active pharmacies, total users, new users (30d), API usage (hardcoded at 78%) |

The active `page.tsx` also includes a **Custom Settings** card with a `customSetting` text input and a `featureFlag` toggle — these are development scaffolding with no backend meaning.

---

## Duplicate File: `settings/page.tsx` vs `settings/page-improved.tsx`

Two versions of the admin settings page exist in the same directory:

| | `page.tsx` (active) | `page-improved.tsx` (inactive) |
|---|---|---|
| Error handling | `alert()` calls | Inline `setError` / `setSuccess` state banners |
| Save button | No loading state | Spinner + "Saving…" text while request is in flight |
| Refresh | No refresh button | Refresh button to reload settings from API |
| Custom Settings card | Present (placeholder fields) | Removed |
| Analytics display | 2 metrics (active pharmacies, total users) | 4 metrics (adds total pharmacies, new users 30d) |

**Cleanup recommendation:** Rename `page-improved.tsx` to `page.tsx` (replacing the original), and delete the old `page.tsx`. This is the superior implementation. The placeholder "Custom Settings" card in the original should not be carried forward. This action is documented in `docs/cleanup-plan.md`.

---

## Data Flow

```
Admin user navigates to /admin/*
        │
        ▼
Client component mounts → useEffect fires
        │
        ├─ fetch('/api/admin/pharmacies')   → GET pharmacies table (service role)
        ├─ fetch('/api/admin/plans')        → GET subscription_plans (SSR session)
        ├─ fetch('/api/admin/categories')   → GET global categories (service role)
        └─ fetch('/api/admin/system-settings') → GET system_settings + analytics (SSR session + superadmin check)
        │
        ▼
API Route Handler
        │
        ├─ createClient() → Supabase server client (SSR) or direct service role client
        ├─ [some routes] supabase.auth.getUser() → verify session
        ├─ [system-settings only] check pharmacy_users.role = 'superadmin'
        └─ supabase.from('table').select/insert/update/delete
        │
        ▼
PostgreSQL (Supabase) → RLS policies
        │
        ▼
JSON response → React state update → UI re-renders
```

---

## Known Limitations

### 1. Missing authentication on pharmacy and category API routes

`/api/admin/pharmacies`, `/api/admin/pharmacies/[id]`, `/api/admin/categories`, and `/api/admin/categories/[id]` use the Supabase service role key directly and perform no session or role checks. Any request that reaches these endpoints — including unauthenticated requests — can read all pharmacy data or create/modify/delete pharmacies and categories. This is a significant security gap.

### 2. Subscriber counts always show zero

In `subscriptions/page.tsx`, the `users` field for each plan is hardcoded to `0` with a `TODO` comment. The subscription analytics chart and plan cards always display `0 active subscribers` regardless of actual data.

### 3. `page-improved.tsx` is not the active route

Next.js App Router only serves `page.tsx` as the route handler. `page-improved.tsx` is never rendered in production. The improved version with proper error handling exists but is unreachable. See the cleanup recommendation above.

### 4. Insurance template save does not persist

The "Save Template" button in the insurance template designer updates local React state only. No API call is made to `/api/admin/insurance-templates`. Designed templates are lost on page navigation.

### 5. `/api/admin/stores` returns hardcoded mock data

`src/app/api/admin/stores/route.ts` returns a static array of two fake pharmacies. It is not connected to the database. The `stores/page.tsx` page calls `/api/admin/pharmacies` (not `/api/admin/stores`), so this route appears to be dead code.

### 6. Backup and insurance-template routes have hardcoded `pharmacy_id`

Both `/api/admin/backups` (POST) and `/api/admin/insurance-templates` (POST) set `pharmacy_id` to the literal string `'userPharmacy.pharmacy_id'` — a copy-paste artifact from a refactor. Records created through these routes will have an invalid `pharmacy_id`.

### 7. Pharmacy deletion does not clean up auth users

`DELETE /api/admin/pharmacies/[id]` removes the `pharmacies` row but does not call `supabase.auth.admin.deleteUser()`. The Supabase Auth user for the pharmacy owner remains active and can still sign in after the pharmacy is deleted.

### 8. Reports page uses browser Supabase client directly

`reports/page.tsx` imports `createClient` from `supabase/client.ts` (the browser client) and queries the database directly from the client component. This bypasses the API route layer and exposes the query logic to the browser. It also means the queries run with the anon key and are subject to RLS policies, which may return empty results if the authenticated user does not have the appropriate role.

### 9. `page.tsx` Custom Settings card contains placeholder fields

The `customSetting` and `featureFlag` fields in the active settings page are development scaffolding. They are included in the `PUT /api/admin/system-settings` payload and will be persisted to `system_settings` if the user saves, polluting the settings table with meaningless keys.

### 10. Revenue calculations are estimates, not actuals

The overview dashboard calculates subscription revenue as `sum(plan.price)` across all plans — not as actual collected payments. The finance overview uses hardcoded per-pharmacy revenue estimates (Premium: 120,000 RWF, Standard: 50,000 RWF). These figures are approximations and do not reflect real transaction data.
