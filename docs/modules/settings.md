# Settings Module

## Purpose

The Settings module provides configuration management for two distinct audiences:

- **Pharmacy-level settings** (`/settings`) — accessible to `pharmacy_owner`, `pharmacist`, `cashier`, and `staff` roles. Covers pharmacy profile information, branding/logo upload, API key management, stock location management, security (IP whitelist, 2FA), and subscription/billing.
- **Platform-level settings** (`/admin/settings`) — accessible to `superadmin` only. Covers global platform configuration: tenant limits, multi-branch toggles, API rate limits, SSO, audit logging, maintenance mode, and platform analytics.

Settings data is persisted across three primary tables (`system_settings`, `ip_whitelist`, `stock_locations`) and two secondary tables (`pharmacy_settings`, `api_keys`). Branding data is stored directly on the `pharmacies` table and in Supabase Storage.

---

## Key Files

### Pages

| File | Route | Role Access | Description |
|---|---|---|---|
| `src/app/(dashboard)/settings/page.tsx` | `/settings` | All authenticated roles | Pharmacy-level settings. Eight-tab layout: General, Integrations, Analytics, Security, Billing, Notifications, Compliance, Operations. Manages pharmacy info, branding, API keys, stock locations, IP whitelist, 2FA, and subscription upgrades. |
| `src/app/(dashboard)/admin/settings/page.tsx` | `/admin/settings` | `superadmin` | Platform-level settings. **Original version.** Uses `alert()` for feedback. Contains a "Custom Settings" card with placeholder fields (`customSetting`, `featureFlag`) that are development scaffolding. |
| `src/app/(dashboard)/admin/settings/page-improved.tsx` | `/admin/settings` | `superadmin` | **Refactored version** of `page.tsx`. Replaces `alert()` calls with inline `error`/`success` state banners. Adds a Refresh button and a loading spinner on the Save button. Removes the placeholder "Custom Settings" card. **This file should replace `page.tsx`** — see Known Limitations. |

### API Routes — Pharmacy Settings

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/pharmacy/settings` | `GET` | Yes | Returns pharmacy profile: `name`, `license`, `location`, `phone`, `email`, `subscription`, `currency`, `language`. Reads from `pharmacies` table. |
| `/api/pharmacy/settings` | `PUT` | Yes | Updates `name`, `phone`, `email`, `city`, `province` on the `pharmacies` table. Validates required fields. |
| `/api/pharmacy/branding` | `GET` | Yes | Returns `logoUrl`, `primaryColor`, `customDomain` from `pharmacies.logo_url`, `pharmacies.primary_color`, `pharmacies.custom_domain`. |
| `/api/pharmacy/branding` | `PUT` | Yes | Updates branding fields on the `pharmacies` table. |
| `/api/pharmacy/branding/upload` | `POST` | Yes | Accepts a `multipart/form-data` file upload. Stores the file in the `pharmacy-logos` Supabase Storage bucket as `{pharmacy_id}-{timestamp}.{ext}`. Returns the public URL. |

### API Routes — Settings Sub-modules

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/settings/api-keys` | `GET` | Yes | Lists all API keys for the authenticated user's pharmacy from the `api_keys` table. |
| `/api/settings/api-keys` | `POST` | Yes | Creates a new API key. Requires `name` and `key`. Stores `key_hash`, `key_prefix` (first 8 chars), and `created_by`. |
| `/api/settings/api-keys` | `PUT` | Yes | Updates an existing API key's `name`, `key_hash`, `key_prefix`, and `is_active` status. |
| `/api/settings/locations` | `GET` | Yes | Lists active stock locations for the pharmacy from `stock_locations`. Falls back to four hardcoded defaults if the table is missing. |
| `/api/settings/locations` | `POST` | Yes | Creates a new stock location with `name`, `description`, and `is_active = true`. |
| `/api/settings/security` | `GET` | Yes | Returns the pharmacy's security settings (e.g., `ip_whitelist_enabled`) from `pharmacy_settings` where `setting_key = 'security'`. |
| `/api/settings/security` | `PUT` | Yes | Upserts the security settings JSON blob into `pharmacy_settings`. |
| `/api/settings/security/2fa` | `GET` | Yes | Returns `{ enabled: boolean }` for the current user from `users.two_factor_enabled`. |
| `/api/settings/security/2fa` | `POST` | Yes | Disables 2FA by clearing `two_factor_secret`, `two_factor_enabled`, and `two_factor_backup_codes` on the `users` table. |
| `/api/settings/security/2fa/setup` | `POST` | Yes | Generates a TOTP secret, QR code data URL, and 10 backup codes. Stores the secret in `users` without enabling 2FA yet. |
| `/api/settings/security/2fa/verify` | `POST` | Yes | Verifies the TOTP token against the stored secret. On success, sets `users.two_factor_enabled = true`. |
| `/api/settings/security/ip-whitelist` | `POST` | Yes | Toggles IP whitelist enforcement on/off via `security_settings.ip_whitelist_enabled`. |
| `/api/settings/security/ip-whitelist/manage` | `GET` | Yes | Lists all IP whitelist entries for the pharmacy from `ip_whitelist`. |
| `/api/settings/security/ip-whitelist/manage` | `POST` | Yes | Adds a new IP address (`ip_address`, `description`) to `ip_whitelist`. |
| `/api/settings/security/ip-whitelist/manage` | `DELETE` | Yes | Removes an IP whitelist entry by `id`. |
| `/api/settings/security/sso` | `POST` | Yes | Toggles SSO on/off via `security_settings.sso_enabled`. |

### API Routes — Admin (Platform-Level) Settings

| Route | Method | Auth | Role Required | Description |
|---|---|---|---|---|
| `/api/admin/system-settings` | `GET` | Yes | `superadmin` | Reads all global `system_settings` rows where `pharmacy_id IS NULL`. Also returns platform analytics (active pharmacies, total users, new users in 30 days). |
| `/api/admin/system-settings` | `PUT` | Yes | `superadmin` | Upserts each key-value pair from the request body into `system_settings` with `pharmacy_id = NULL`. |

### API Routes — Integrations

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/integrations/mobile-money` | `POST` | Yes | Stub for mobile money payment initiation. Looks up the pharmacy's `Mobile Money API` key from `api_keys`. The actual MTN/Airtel API call is a `TODO` — currently returns a mock transaction object. |
| `/api/integrations/rra-ebm` | `POST` | Yes | Stub for Rwanda Revenue Authority Electronic Billing Machine (RRA EBM) invoice submission. Looks up the pharmacy's `RRA EBM API` key from `api_keys`. The actual RRA API call is a `TODO` — currently returns a mock submission object. |

---

## Database Tables

### `system_settings`

Stores platform-level configuration as key-value pairs. When `pharmacy_id IS NULL`, the row is a global platform setting (managed by superadmin). When `pharmacy_id` is set, the row is a per-pharmacy setting.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (nullable; `NULL` = global setting) |
| `setting_key` | `text` | Setting identifier (e.g., `platformName`, `maxPharmacies`) |
| `setting_value` | `jsonb` | Setting value (any JSON type) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

**Unique constraint:** `(pharmacy_id, setting_key)` — one value per key per pharmacy (or globally).

**Indexes:** `idx_system_settings_pharmacy_id`, `idx_system_settings_key`.

**RLS:** Users can read/write settings for their own pharmacy. Superadmins can read/write global settings (`pharmacy_id IS NULL`). Enforced by policies in `20241205000001_fix_system_settings_admin_access.sql`.

> **Note:** There is also a `pharmacy_settings` table (created in `20240322000004_saas_extensions.sql`) with an identical structure. The security settings route (`/api/settings/security`) writes to `pharmacy_settings`, while the admin settings route writes to `system_settings`. These two tables serve overlapping purposes and should be consolidated.

### `ip_whitelist`

Stores allowed IP addresses per pharmacy for access control enforcement.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (NOT NULL, CASCADE DELETE) |
| `ip_address` | `text` | IPv4 or IPv6 address string |
| `description` | `text` | Human-readable label (nullable) |
| `is_active` | `boolean` | Whether this entry is enforced (default `true`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

**Index:** `idx_ip_whitelist_pharmacy` on `pharmacy_id`.

**RLS:** Full CRUD policies scoped to the authenticated user's pharmacy via `pharmacy_users`. Defined in `20241202000001_ip_whitelist_table.sql`.

> **Known gap:** The IP whitelist is stored and managed through the UI, but there is no middleware or API-layer enforcement that actually blocks requests from non-whitelisted IPs. The feature is UI-complete but not functionally enforced.

### `stock_locations`

Stores named physical locations (warehouses, branches, cold storage) for inventory tracking within a pharmacy.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (NOT NULL, CASCADE DELETE) |
| `name` | `varchar(100)` | Location name (e.g., "Main Store", "Cold Storage") |
| `description` | `text` | Optional description |
| `is_active` | `boolean` | Whether the location is active (default `true`) |
| `created_at` | `timestamp` | Record creation timestamp |
| `updated_at` | `timestamp` | Last update timestamp |

**Indexes:** `idx_stock_locations_pharmacy` on `pharmacy_id`, `idx_stock_locations_active` on `is_active`.

**RLS:** SELECT, INSERT, and UPDATE policies scoped to the authenticated user's active pharmacy membership. Defined in `create-stock-locations-table.sql`.

> **Note:** `create-stock-locations-table.sql` is a loose root-level file, not an official migration under `supabase/migrations/`. The table may not exist in all environments. The `/api/settings/locations` route falls back to four hardcoded default locations if the table is missing.

### `api_keys`

Stores integration API keys per pharmacy. Used by the mobile money and RRA EBM integration routes to look up credentials.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `name` | `text` | Key name (e.g., "Mobile Money API", "RRA EBM API") |
| `key_hash` | `text` | The API key value (stored as plain text despite the column name) |
| `key_prefix` | `text` | First 8 characters of the key (for display) |
| `permissions` | `text[]` | Array of permission strings (default `{}`) |
| `is_active` | `boolean` | Whether the key is active (default `true`) |
| `last_used_at` | `timestamptz` | Last usage timestamp (nullable) |
| `expires_at` | `timestamptz` | Expiry timestamp (nullable) |
| `created_by` | `uuid` | Foreign key → `auth.users.id` |
| `created_at` | `timestamptz` | Record creation timestamp |

**RLS:** `pharmacy_owner` role can view and manage API keys for their pharmacy. Defined in `20240322000005_rls_policies.sql`.

> **Security note:** The `key_hash` column name implies hashing, but the API route stores the raw key value directly (`key_hash: body.key`). API keys are not hashed at rest.

### `pharmacies` (branding columns)

Branding settings are stored directly on the `pharmacies` table rather than in a separate settings table.

| Column | Type | Description |
|---|---|---|
| `logo_url` | `text` | Public URL of the pharmacy logo in Supabase Storage |
| `primary_color` | `text` | Hex color code for the pharmacy's brand color (default `#3b82f6`) |
| `custom_domain` | `text` | Custom domain for white-label deployments (nullable) |

---

## Role Access

| Feature | `superadmin` | `pharmacy_owner` | `pharmacist` | `cashier` | `staff` |
|---|---|---|---|---|---|
| `/settings` page | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/admin/settings` page | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit pharmacy profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload/change logo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage API keys | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage stock locations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure IP whitelist | ✅ | ✅ | ✅ | ✅ | ✅ |
| Configure 2FA | ✅ | ✅ | ✅ | ✅ | ✅ |
| Platform configuration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Platform analytics | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Note:** The `/settings` page does not enforce role-based restrictions within the page itself — all authenticated users with a valid `pharmacy_users` record can access all tabs. Role enforcement for the `/admin/settings` page is done at the API layer (`/api/admin/system-settings` checks `pharmacy_users.role = 'superadmin'`), but the page component itself does not perform a role check before rendering.

---

## Features

### General — Pharmacy Profile

The General tab displays pharmacy information (name, license number, location, phone, email) fetched from `/api/pharmacy/settings`. An Edit button toggles an inline form that saves changes via `PUT /api/pharmacy/settings`. Currency and language fields are present in the UI state but are not persisted to the database (the PUT handler only updates `name`, `phone`, `email`, `city`, `province`).

### General — Branding / Logo Upload

The General tab includes a Branding card with:
- **Logo upload:** A file input that calls `POST /api/pharmacy/branding/upload`. The file is stored in the `pharmacy-logos` Supabase Storage bucket as `{pharmacy_id}-{timestamp}.{ext}`. The returned public URL is saved to `pharmacies.logo_url` via `PUT /api/pharmacy/branding`.
- **Primary color:** A color picker that updates `pharmacies.primary_color`.
- **Custom domain:** A text field for white-label domain configuration stored in `pharmacies.custom_domain`.

### Integrations Tab

The Integrations tab is rendered in the UI but its content is not fully implemented. The tab exists in the `TabsList` but the corresponding `TabsContent` for integrations is not visible in the truncated source. The integration API routes (`/api/integrations/mobile-money` and `/api/integrations/rra-ebm`) are stubs with `TODO` comments where the actual third-party API calls should be.

### Security — IP Whitelist

The Security tab includes an IP Whitelist section with:
- A toggle switch to enable/disable IP whitelist enforcement (calls `PUT /api/settings/security`).
- A dialog to view, add, and delete IP entries (calls `GET`, `POST`, `DELETE /api/settings/security/ip-whitelist/manage`).

> **Limitation:** The whitelist is stored in the database but is not enforced at the middleware or API layer. Enabling the toggle updates a flag in `pharmacy_settings` but no code reads that flag to block requests.

### Security — Two-Factor Authentication (2FA)

The Security tab includes a 2FA section with a three-step setup flow:

1. **QR step:** Calls `POST /api/settings/security/2fa/setup` to generate a TOTP secret, QR code, and 10 backup codes. The QR code is displayed for the user to scan with an authenticator app.
2. **Verify step:** User enters the 6-digit TOTP code. Calls `POST /api/settings/security/2fa/verify` to confirm the code and activate 2FA (`users.two_factor_enabled = true`).
3. **Backup step:** Displays the 10 single-use backup codes for the user to save.

Disabling 2FA calls `POST /api/settings/security/2fa` with `{ enabled: false }`, which clears the secret and backup codes.

### Security — SSO

A toggle for SSO is present in the admin settings page. The `POST /api/settings/security/sso` route stores the `sso_enabled` flag in `security_settings`. No actual SSO provider integration is implemented.

### Operations — Stock Location Management

Both the pharmacy settings page (`/settings`) and the admin settings page (`/admin/settings`) include a Stock Locations card. Users can view existing locations and add new ones via a dialog form. Both pages call the same `/api/settings/locations` endpoints.

### API Key Management

The Security tab (pharmacy settings) includes an API Keys section. Users can:
- View existing keys (name, prefix, status).
- Add a new key via a dialog (name + key value).
- Edit an existing key's name, value, and active status.

Keys are stored in the `api_keys` table and are used by the integration routes to authenticate with third-party services.

### Billing / Subscription Upgrade

The Billing tab displays the current subscription plan, next billing date, and invoice history. Users can upgrade their plan by selecting a paid plan, which opens a payment dialog. The upgrade flow:
1. Validates the phone number via `POST /api/test-validation`.
2. Creates a subscription record via `POST /api/subscriptions/upgrade`.
3. Initiates a KPay payment via `POST /api/kpay/initiate`.
4. For mobile money: polls `GET /api/kpay/status` every 5 seconds for up to 5 minutes.
5. For card payments: redirects to the KPay checkout URL.

### Platform Configuration (Admin Only)

The `/admin/settings` page manages global platform settings stored in `system_settings` with `pharmacy_id = NULL`:

| Setting Key | Type | Description |
|---|---|---|
| `platformName` | `string` | Platform display name |
| `adminEmail` | `string` | Platform admin contact email |
| `maxPharmacies` | `number` | Maximum number of tenant pharmacies |
| `enableRegistrations` | `boolean` | Allow new pharmacy sign-ups |
| `enableNotifications` | `boolean` | Enable system-wide notifications |
| `maintenanceMode` | `boolean` | Put platform in maintenance mode |
| `backupEnabled` | `boolean` | Enable automatic daily backups |
| `autoUpdates` | `boolean` | Enable automatic system updates |
| `maxUsersPerPharmacy` | `number` | Per-tenant user limit |
| `apiRateLimit` | `number` | API requests per hour limit |
| `enableWhiteLabel` | `boolean` | Allow per-tenant custom branding |
| `enableMultiBranch` | `boolean` | Allow multi-branch pharmacies |
| `dataRetentionDays` | `number` | Data retention period in days |
| `enableAuditLogs` | `boolean` | Enable audit logging |
| `ssoEnabled` | `boolean` | Enable SSO integration |
| `encryptionEnabled` | `boolean` | Enable AES-256 data encryption |

---

## `page.tsx` vs. `page-improved.tsx` Duplicate

`src/app/(dashboard)/admin/settings/` contains two versions of the admin settings page:

| File | Status | Key Differences |
|---|---|---|
| `page.tsx` | Active (currently served) | Uses `alert()` for all feedback. Contains a "Custom Settings" card with placeholder `customSetting` text field and `featureFlag` toggle — development scaffolding with no backend purpose. Does not fetch analytics for `total_pharmacies` or `new_users_30d`. |
| `page-improved.tsx` | Inactive (not routed) | Replaces `alert()` with inline error/success banners using `setError`/`setSuccess` state. Adds a Refresh button. Adds a loading spinner on the Save button. Removes the placeholder "Custom Settings" card. Shows all four analytics metrics. |

**Recommended action (from `docs/cleanup-plan.md`):** Rename `page-improved.tsx` to `page.tsx` (replacing the original). The improved version is strictly better: it has proper error handling, no placeholder scaffolding, and a better UX. The old `page.tsx` should be deleted.

---

## Data Flow

### Pharmacy Settings Save Flow

```
User edits pharmacy info in /settings → General tab
        │
        ▼
PUT /api/pharmacy/settings  { name, phone, email, location }
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ pharmacy_users → resolve pharmacy_id
        ├─ pharmacies.update({ name, phone, email, city, province })
        └─ { success: true }
```

### Logo Upload Flow

```
User selects file in Branding card
        │
        ▼
POST /api/pharmacy/branding/upload  (multipart/form-data)
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ pharmacy_users → resolve pharmacy_id
        ├─ supabase.storage.from('pharmacy-logos').upload(fileName, buffer)
        └─ Returns { url: publicUrl }
        │
        ▼
PUT /api/pharmacy/branding  { logoUrl: publicUrl, primaryColor, customDomain }
        │
        └─ pharmacies.update({ logo_url, primary_color, custom_domain })
```

### Admin Settings Save Flow

```
Superadmin edits settings in /admin/settings
        │
        ▼
PUT /api/admin/system-settings  { platformName, maxPharmacies, ... }
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ pharmacy_users → check role = 'superadmin'
        ├─ For each key-value pair:
        │     ├─ SELECT from system_settings WHERE setting_key = key AND pharmacy_id IS NULL
        │     ├─ If exists: UPDATE setting_value
        │     └─ If not: INSERT { setting_key, setting_value, pharmacy_id: null }
        └─ { success: true, updated: N }
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `otplib` | TOTP secret generation and code verification for 2FA setup |
| `qrcode` | QR code data URL generation for 2FA setup |
| `crypto` | Backup code generation (Node built-in) |
| `@supabase/supabase-js` | Supabase Storage client for logo uploads |
| `recharts` | Sparkline charts in the settings summary cards |

---

## Known Limitations

### 1. `page-improved.tsx` is not active

The improved admin settings page (`page-improved.tsx`) exists but is not served — Next.js App Router only serves `page.tsx`. The improved version must be manually promoted by renaming it to `page.tsx`. Until then, the admin settings page uses `alert()` for all feedback and includes placeholder "Custom Settings" fields.

### 2. IP whitelist is not enforced

The IP whitelist feature allows users to add and manage allowed IP addresses, and the `ip_whitelist_enabled` flag can be toggled. However, no middleware or API route reads this flag to actually block requests from non-whitelisted IPs. The feature is UI-complete but functionally inert.

### 3. `stock_locations` table is not in official migrations

The `stock_locations` table is defined in `create-stock-locations-table.sql` at the project root, not in `supabase/migrations/`. This means the table may not exist in fresh environments or after a migration reset. The `/api/settings/locations` route handles this gracefully by returning four hardcoded defaults, but new locations added through the UI will fail silently if the table is absent.

### 4. API keys are stored in plaintext

Despite the column being named `key_hash`, the `/api/settings/api-keys` route stores the raw API key value directly. Keys are not hashed or encrypted at rest. Any user with database access can read all API keys in plaintext.

### 5. Currency and language settings are not persisted

The pharmacy settings form includes `currency` and `language` fields in the UI state, but the `PUT /api/pharmacy/settings` handler does not include these fields in the database update. Changes to currency or language are lost on page reload.

### 6. Integration routes are stubs

Both `/api/integrations/mobile-money` and `/api/integrations/rra-ebm` contain `TODO` comments where the actual third-party API calls should be. They return mock response objects. The mobile money and RRA EBM integrations are not functional.

### 7. SSO toggle has no backend implementation

The SSO toggle in the admin settings page stores a flag in `security_settings`, but no SSO provider (SAML, OAuth, OIDC) is configured or integrated. Enabling SSO has no effect on the authentication flow.

### 8. `pharmacy_settings` and `system_settings` overlap

Two tables serve similar purposes: `pharmacy_settings` (from `20240322000004_saas_extensions.sql`) and `system_settings` (from `20241201000019_system_settings.sql`). The security settings route writes to `pharmacy_settings`; the admin settings route writes to `system_settings`. This split creates confusion about which table is authoritative for which settings.

### 9. No role enforcement on the `/settings` page itself

The `/settings` page is accessible to all authenticated roles, and all tabs (including API key management and security settings) are visible to `cashier` and `staff` roles. There is no per-tab or per-feature role check in the page component. Role enforcement relies entirely on RLS policies in the database.

### 10. Notifications, Compliance, and Analytics tabs are incomplete

The `/settings` page defines eight tabs in the `TabsList`, but the `TabsContent` for Notifications, Compliance, and Analytics tabs is not fully implemented in the visible source. These tabs may render empty or with placeholder content.
