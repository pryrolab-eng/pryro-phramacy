# Database Reference — Pryrox

> **Source:** Derived from all 36 migration files under `supabase/migrations/`, read in chronological order.
> **Last updated:** Reflects schema state through migration `20250101000001_subscription_expiry_functions.sql`.

---

## Migration File Notes

Two migration files use non-standard naming conventions (no timestamp prefix):

| File | Notes |
|---|---|
| `add_2fa_support.sql` | Adds 2FA columns to `users` and creates `two_factor_sessions`. No timestamp — applied manually. |
| `initial-setup.sql` | Creates the `users` public mirror table and auth triggers. No timestamp — likely the very first setup script. |

All other 34 files follow the `YYYYMMDDHHMMSS_description.sql` convention.

---

## Summary Table

| Table | Group |
|---|---|
| `users` | Auth & Users |
| `two_factor_sessions` | Auth & Users |
| `pharmacies` | Pharmacy & Tenancy |
| `pharmacy_users` | Pharmacy & Tenancy |
| `pharmacy_settings` | Pharmacy & Tenancy |
| `subscription_plans` | Subscriptions & Billing |
| `subscriptions` | Subscriptions & Billing |
| `invoices` | Subscriptions & Billing |
| `payments` | Subscriptions & Billing |
| `payment_methods` | Subscriptions & Billing |
| `payment_transactions` | Subscriptions & Billing |
| `payment_logs` | Subscriptions & Billing |
| `medications` | Inventory & Products |
| `inventory` | Inventory & Products |
| `categories` | Inventory & Products |
| `suppliers` | Inventory & Products |
| `stock_movements` | Inventory & Products |
| `inventory_transfers` | Inventory & Products |
| `purchase_orders` | Inventory & Products |
| `purchase_order_items` | Inventory & Products |
| `backups` | Settings & Configuration |
| `sales` | Sales & POS |
| `sale_items` | Sales & POS |
| `discounts` | Sales & POS |
| `returns` | Sales & POS |
| `return_items` | Sales & POS |
| `customers` | Customers & Patients |
| `customer_loyalty` | Customers & Patients |
| `patients` | Customers & Patients |
| `prescriptions` | Prescriptions & Insurance |
| `insurance_providers` | Prescriptions & Insurance |
| `insurance_claims` | Prescriptions & Insurance |
| `insurance_templates` | Prescriptions & Insurance |
| `global_insurance_providers` | Prescriptions & Insurance |
| `pharmacy_insurance_providers` | Prescriptions & Insurance |
| `staff` | Staff & Roles |
| `audit_logs` | Staff & Roles |
| `notifications` | Staff & Roles |
| `alerts` | Staff & Roles |
| `api_keys` | Settings & Configuration |
| `webhooks` | Settings & Configuration |
| `webhook_deliveries` | Settings & Configuration |
| `system_settings` | Settings & Configuration |
| `ip_whitelist` | Settings & Configuration |
| `report_cache` | Settings & Configuration |
| `mobile_sessions` | Settings & Configuration |
| `global_categories` | Settings & Configuration |
| `branches` | Branches & Locations |

---
## Group 1 — Auth & Users

### `users`

**Purpose:** Public mirror of `auth.users`. Created by the `initial-setup.sql` migration via an `AFTER INSERT` trigger on `auth.users`. Stores display-friendly profile data alongside the Supabase auth record.

**Migration:** `initial-setup.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. Matches `auth.users.id`. |
| `user_id` | `text` | Unique. String cast of `auth.users.id`. |
| `email` | `text` | User email address. |
| `name` | `text` | From `raw_user_meta_data->>'name'`. |
| `full_name` | `text` | From `raw_user_meta_data->>'full_name'`. |
| `avatar_url` | `text` | Profile picture URL. |
| `token_identifier` | `text` | Not null. Set to email on creation. |
| `image` | `text` | Alternate image field. |
| `two_factor_secret` | `text` | TOTP secret (added by `add_2fa_support.sql`). |
| `two_factor_enabled` | `boolean` | Whether 2FA is active. Default `false`. |
| `two_factor_backup_codes` | `text[]` | Array of one-time backup codes. |
| `created_at` | `timestamptz` | Not null. UTC timestamp. |
| `updated_at` | `timestamptz` | Nullable. Updated by auth trigger. |

**Foreign Keys:** None (root table).

**RLS Policies:**
- `Users can view own data` — SELECT allowed where `auth.uid()::text = user_id`.

**Triggers:**
- `on_auth_user_created` — Inserts a row here after every new `auth.users` insert.
- `on_auth_user_updated` — Syncs email/name/avatar after `auth.users` update.

---

### `two_factor_sessions`

**Purpose:** Tracks in-progress 2FA verification sessions. A session is created when a user passes password auth but has not yet verified their TOTP code. Verified sessions grant full access.

**Migration:** `add_2fa_support.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE. |
| `session_token` | `text` | Unique random token passed to the client. |
| `verified` | `boolean` | `false` until TOTP code is confirmed. |
| `expires_at` | `timestamptz` | Not null. Session TTL. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `user_id` → `auth.users(id)`.

**RLS Policies:**
- `Users can view own 2FA sessions` — SELECT where `auth.uid() = user_id`.
- `Users can insert own 2FA sessions` — INSERT where `auth.uid() = user_id`.
- `Users can delete own 2FA sessions` — DELETE where `auth.uid() = user_id`.

---

## Group 2 — Pharmacy & Tenancy

### `pharmacies`

**Purpose:** Core multi-tenant table. Each row represents one pharmacy (tenant). All other tenant-scoped tables reference this via `pharmacy_id`.

**Migration:** `20240322000001_pharmacy_management_schema.sql`; columns added by `20241204000001_branding_settings.sql`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `name` | `text` | Not null. Display name. |
| `license_number` | `text` | Unique. Regulatory license. |
| `owner_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE. |
| `address` | `text` | Street address. |
| `phone` | `text` | Contact phone. |
| `email` | `text` | Contact email. |
| `city` | `text` | City. |
| `district` | `text` | Administrative district. |
| `province` | `text` | Province. |
| `status` | `pharmacy_status` | Enum: `active`, `inactive`, `suspended`, `trial`. Default `trial`. |
| `subscription_plan` | `subscription_plan` | Enum: `trial`, `standard`, `premium`. Default `trial`. |
| `subscription_expires_at` | `timestamptz` | When the current plan expires. |
| `rra_tin` | `text` | Rwanda Revenue Authority TIN. |
| `logo_url` | `text` | Branding: uploaded logo URL (Supabase Storage). |
| `primary_color` | `text` | Branding: hex color. Default `#3b82f6`. |
| `custom_domain` | `text` | Optional white-label domain. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `owner_id` → `auth.users(id)`.

**RLS Policies:**
- `Users can view their pharmacies` — SELECT for members, owners, and admins.
- `Pharmacy owners can update their pharmacies` — UPDATE for owner or admin.
- `Authenticated users can create pharmacies` — INSERT for any authenticated user.
- `Superadmin can view all pharmacies` — SELECT for superadmin email.
- `Superadmin can manage all pharmacies` — ALL for superadmin email.

**Triggers:** `update_pharmacies_updated_at`, `audit_pharmacies`.

---

### `pharmacy_users`

**Purpose:** Maps Supabase auth users to pharmacies with a specific role. This is the primary role-resolution table used by middleware and API routes. A user can belong to multiple pharmacies with different roles.

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE. |
| `role` | `user_role` | Enum: `admin`, `pharmacy_owner`, `pharmacist`, `cashier`, `staff`. Not null. |
| `is_active` | `boolean` | Default `true`. Soft-disable without deleting. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Constraints:** `UNIQUE(pharmacy_id, user_id)`.

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `user_id` → `auth.users(id)`.

**RLS Policies:**
- `Users can view pharmacy staff` — SELECT for members, self, or admin.
- `Pharmacy owners and admins can manage staff` — ALL for owners of that pharmacy or admin.

**Triggers:** `update_pharmacy_users_updated_at`, `audit_pharmacy_users`, `setup_all_users_trigger` (on `auth.users`).

---

### `pharmacy_settings`

**Purpose:** Key-value store for per-pharmacy configuration (currency, tax rate, receipt footer, low-stock threshold, etc.). Distinct from `system_settings` — this table was created in the SaaS extensions migration and uses `jsonb` values.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `setting_key` | `text` | Not null. E.g. `currency`, `tax_rate`. |
| `setting_value` | `jsonb` | The value (string, number, boolean, or object). |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Constraints:** `UNIQUE(pharmacy_id, setting_key)`.

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Pharmacy staff can view settings` — SELECT for pharmacy members.
- `Pharmacy staff can manage settings` — ALL for pharmacy members.

---

## Group 3 — Subscriptions & Billing

### `subscription_plans`

**Purpose:** Superadmin-managed catalogue of available billing plans. Displayed on the pricing/upgrade page. Three default plans: Free, Standard, Premium.

**Migration:** `20240323000001_subscription_plans_table.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `name` | `text` | Not null. E.g. `Free`, `Standard`, `Premium`. |
| `price` | `decimal(10,2)` | Monthly price in RWF. Default `0.00`. |
| `period` | `text` | Billing period label. Default `per month`. |
| `features` | `text[]` | Array of feature strings shown on pricing page. |
| `is_active` | `boolean` | Default `true`. |
| `is_popular` | `boolean` | Highlights the recommended plan. Default `false`. |
| `created_by` | `uuid` | FK → `auth.users(id)`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `created_by` → `auth.users(id)`.

**RLS Policies:** None defined in migrations (table is publicly readable via Supabase anon key in practice).

---

### `subscriptions`

**Purpose:** Records active and historical subscription periods for each pharmacy. Linked to `pharmacies.subscription_plan` and `pharmacies.subscription_expires_at` for runtime checks.

**Migration:** `20240322000001_pharmacy_management_schema.sql`; columns added by `20241203000002_add_expires_at_to_subscriptions.sql`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `plan` | `subscription_plan` | Enum: `trial`, `standard`, `premium`. Not null. |
| `start_date` | `timestamptz` | Default `now()`. |
| `end_date` | `timestamptz` | When this subscription period ends. |
| `expires_at` | `timestamptz` | Added later; mirrors `end_date` for expiry checks. |
| `is_active` | `boolean` | Default `true`. |
| `amount` | `decimal(10,2)` | Amount paid. Default `0.00`. |
| `currency` | `text` | Default `RWF`. |
| `payment_reference` | `text` | KPay TID or manual reference. |
| `payment_method` | `text` | Added later. E.g. `momo`, `cc`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Pharmacy owners can view subscriptions` — SELECT for pharmacy owners and admins.
- `Admins can manage subscriptions` — ALL for admins.

---

### `invoices`

**Purpose:** Billing invoices generated for subscription payments. Invoice numbers are auto-generated (`INV-YYYYMMDD-NNNNNN`).

**Migration:** `20241203000001_billing_system.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `invoice_number` | `text` | Unique. Auto-generated by trigger. |
| `amount` | `decimal(10,2)` | Not null. |
| `status` | `text` | Default `pending`. Values: `pending`, `paid`, `overdue`. |
| `due_date` | `date` | Not null. |
| `paid_date` | `date` | Nullable. Set when paid. |
| `plan_name` | `text` | Not null. Name of the plan being invoiced. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Users can view their pharmacy invoices` — SELECT for pharmacy members.

---

### `payments`

**Purpose:** Records individual payment transactions against invoices. Separate from `payment_transactions` (which is KPay-specific).

**Migration:** `20241203000001_billing_system.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `invoice_id` | `uuid` | FK → `invoices(id)` ON DELETE SET NULL. |
| `amount` | `decimal(10,2)` | Not null. |
| `payment_method` | `text` | Not null. E.g. `momo`, `cash`. |
| `payment_reference` | `text` | External reference number. |
| `status` | `text` | Default `completed`. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `invoice_id` → `invoices(id)`.

**RLS Policies:**
- `Users can view their pharmacy payments` — SELECT for pharmacy members.

---

### `payment_methods`

**Purpose:** Stores saved payment method configurations per pharmacy (e.g. default mobile money number).

**Migration:** `20241203000001_billing_system.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `method_type` | `text` | Not null. E.g. `momo`, `card`. |
| `details` | `jsonb` | Method-specific details (account number, etc.). |
| `is_default` | `boolean` | Default `false`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Users can view their pharmacy payment methods` — SELECT for pharmacy members.
- `Users can manage their pharmacy payment methods` — ALL for pharmacy members.

---

### `payment_transactions`

**Purpose:** KPay-specific payment transaction records. Tracks the full lifecycle of a KPay payment from checkout URL generation through webhook confirmation. Links to both `sales` and `subscriptions`.

**Migration:** `20240325000001_kpay_integration.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `sale_id` | `uuid` | FK → `sales(id)` ON DELETE SET NULL. Nullable. |
| `subscription_id` | `uuid` | FK → `subscriptions(id)` ON DELETE SET NULL. Nullable. |
| `kpay_tid` | `text` | Unique. KPay transaction ID (assigned after payment). |
| `kpay_refid` | `text` | Unique. Not null. Merchant-generated reference ID. |
| `kpay_authkey` | `text` | KPay auth key returned at checkout. |
| `kpay_checkout_url` | `text` | Redirect URL for the payment page. |
| `amount` | `decimal(10,2)` | Not null. |
| `currency` | `text` | Default `RWF`. |
| `payment_method` | `text` | Not null. Values: `momo`, `cc`, `bank`, `spenn`, `smartcash`. |
| `bank_id` | `text` | Bank identifier for bank transfers. |
| `bank_name` | `text` | Bank name. |
| `customer_name` | `text` | Not null. |
| `customer_phone` | `text` | Nullable. |
| `customer_email` | `text` | Nullable. |
| `customer_number` | `text` | Customer account number. |
| `status` | `text` | Default `pending`. Values: `pending`, `processing`, `completed`, `failed`, `cancelled`. |
| `kpay_status_id` | `text` | KPay status code from webhook. |
| `kpay_status_desc` | `text` | KPay status description. |
| `mom_transaction_id` | `text` | Mobile money transaction ID. |
| `pay_account` | `text` | Account that made the payment. |
| `payment_details` | `text` | Raw payment details string. |
| `error_message` | `text` | Error description if failed. |
| `webhook_received_at` | `timestamptz` | When the KPay webhook arrived. |
| `completed_at` | `timestamptz` | Set by trigger when status → `completed`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `sale_id` → `sales(id)`, `subscription_id` → `subscriptions(id)`.

**RLS Policies:** None defined (accessed via service role in API routes).

**Triggers:** `handle_payment_completion_trigger` — on status change to `completed`, updates the linked `sales` or `subscriptions` record.

---

### `payment_logs`

**Purpose:** Debug log for every KPay API call and webhook event. Stores raw request/response payloads for troubleshooting.

**Migration:** `20240325000001_kpay_integration.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `transaction_id` | `uuid` | FK → `payment_transactions(id)` ON DELETE CASCADE. |
| `event_type` | `text` | Not null. Values: `request`, `response`, `webhook`, `status_check`. |
| `payload` | `jsonb` | Outgoing request payload. |
| `response` | `jsonb` | Incoming response payload. |
| `error_message` | `text` | Error if the call failed. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `transaction_id` → `payment_transactions(id)`.

**RLS Policies:** None defined (accessed via service role).

---
## Group 4 — Inventory & Products

### `medications`

**Purpose:** Master catalogue of drug/product definitions per pharmacy. Each medication can have multiple inventory batches. Tracks clinical metadata (generic name, dosage form, prescription requirement).

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. Display name. |
| `generic_name` | `text` | INN/generic name. |
| `brand_name` | `text` | Trade/brand name. |
| `category` | `medication_category` | Enum: `prescription`, `otc`, `controlled`, `supplement`, `medical_device`. Default `otc`. |
| `dosage_form` | `text` | E.g. `Tablet`, `Capsule`, `Syrup`. |
| `strength` | `text` | E.g. `500mg`, `100ml`. |
| `manufacturer` | `text` | Manufacturer name. |
| `barcode` | `text` | Barcode for scanning. |
| `description` | `text` | Free-text description. |
| `requires_prescription` | `boolean` | Default `false`. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Pharmacy staff can view medications` — SELECT for pharmacy members.
- `Pharmacy staff can manage medications` — ALL for pharmacy members.

**Triggers:** `update_medications_updated_at`, `audit_inventory` (on `inventory`).

---

### `inventory`

**Purpose:** Batch-level stock records. Each row is one batch of a medication at a pharmacy. Tracks quantity, pricing, expiry, and supplier. The `quantity_in_stock` is decremented automatically when a sale item is inserted.

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `medication_id` | `uuid` | FK → `medications(id)` ON DELETE CASCADE. |
| `supplier_id` | `uuid` | FK → `suppliers(id)`. Nullable. |
| `batch_number` | `text` | Not null. Lot/batch identifier. |
| `quantity_in_stock` | `integer` | Default `0`. Decremented by sale trigger. |
| `unit_cost` | `decimal(10,2)` | Purchase cost per unit. Default `0.00`. |
| `selling_price` | `decimal(10,2)` | Retail price per unit. Default `0.00`. |
| `minimum_stock_level` | `integer` | Reorder threshold. Default `0`. |
| `expiry_date` | `date` | Batch expiry date. |
| `manufacturing_date` | `date` | Batch manufacturing date. |
| `received_date` | `timestamptz` | Default `now()`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `medication_id` → `medications(id)`, `supplier_id` → `suppliers(id)`.

**RLS Policies:**
- `Pharmacy staff can view inventory` — SELECT for pharmacy members.
- `Pharmacy staff can manage inventory` — ALL for pharmacy members.

**Triggers:** `update_inventory_updated_at`, `handle_sale_stock_update_trigger` (on `sale_items` INSERT — decrements `quantity_in_stock` and creates a `stock_movements` record).

---

### `categories`

**Purpose:** Per-pharmacy product categories for organising medications in the UI. Separate from `global_categories` (which are superadmin-managed).

**Migration:** `20241201000015_missing_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. |
| `description` | `text` | Optional description. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:** None defined in migrations (accessed via service role or inherits pharmacy membership check in API routes).

---

### `suppliers`

**Purpose:** Supplier/vendor directory per pharmacy. Referenced by `inventory` and `purchase_orders`.

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. |
| `contact_person` | `text` | Primary contact name. |
| `email` | `text` | Contact email. |
| `phone` | `text` | Contact phone. |
| `address` | `text` | Supplier address. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Pharmacy staff can view suppliers` — SELECT for pharmacy members.
- `Pharmacy staff can manage suppliers` — ALL for pharmacy members.

---

### `stock_movements`

**Purpose:** Immutable audit trail of every inventory quantity change. Movement types: `in` (received stock), `out` (sold), `adjustment` (manual correction), `expired`, `damaged`. Rows are inserted automatically by the sale trigger and can also be inserted manually.

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `inventory_id` | `uuid` | FK → `inventory(id)` ON DELETE CASCADE. |
| `movement_type` | `text` | Not null. Values: `in`, `out`, `adjustment`, `expired`, `damaged`. |
| `quantity` | `integer` | Not null. Positive for in, negative for out. |
| `reference_id` | `uuid` | Nullable. ID of the triggering record (e.g. `sale_id`). |
| `reference_type` | `text` | Nullable. E.g. `sale`, `purchase`, `adjustment`. |
| `notes` | `text` | Optional notes. |
| `created_by` | `uuid` | FK → `auth.users(id)`. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `inventory_id` → `inventory(id)`, `created_by` → `auth.users(id)`.

**RLS Policies:**
- `Pharmacy staff can view stock movements` — SELECT for pharmacy members.
- `Pharmacy staff can create stock movements` — INSERT for pharmacy members.

---

### `inventory_transfers`

**Purpose:** Records inter-branch stock transfers within a pharmacy. Tracks which branch sent stock and which received it.

**Migration:** `20241201000017_transfers_loyalty.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `medication_name` | `text` | Not null. Denormalised name for display. |
| `quantity` | `integer` | Not null. |
| `from_branch_id` | `uuid` | FK → `branches(id)`. Source branch. |
| `to_branch_id` | `uuid` | FK → `branches(id)`. Destination branch. |
| `status` | `text` | Default `pending`. Values: `pending`, `completed`, `cancelled`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `completed_at` | `timestamptz` | Nullable. Set when transfer is completed. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `from_branch_id` → `branches(id)`, `to_branch_id` → `branches(id)`.

**RLS Policies:** None defined in migrations.

---

### `purchase_orders`

**Purpose:** Formal purchase orders sent to suppliers. PO numbers are auto-generated (`PO-YYYYMMDD-NNNN`). Tracks order lifecycle from `pending` through `received`.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `supplier_id` | `uuid` | FK → `suppliers(id)`. |
| `po_number` | `text` | Unique. Auto-generated. |
| `status` | `text` | Default `pending`. Values: `pending`, `sent`, `received`, `cancelled`. |
| `order_date` | `timestamptz` | Default `now()`. |
| `expected_delivery_date` | `date` | Nullable. |
| `actual_delivery_date` | `date` | Nullable. |
| `subtotal` | `decimal(10,2)` | Default `0.00`. |
| `tax_amount` | `decimal(10,2)` | Default `0.00`. |
| `total_amount` | `decimal(10,2)` | Default `0.00`. |
| `notes` | `text` | Optional notes. |
| `created_by` | `uuid` | FK → `auth.users(id)`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `supplier_id` → `suppliers(id)`, `created_by` → `auth.users(id)`.

**RLS Policies:**
- `Pharmacy staff can view purchase orders` — SELECT for pharmacy members.
- `Pharmacy staff can manage purchase orders` — ALL for pharmacy members.

---

### `purchase_order_items`

**Purpose:** Line items for each purchase order. Tracks ordered vs. received quantities per medication batch.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `purchase_order_id` | `uuid` | FK → `purchase_orders(id)` ON DELETE CASCADE. |
| `medication_id` | `uuid` | FK → `medications(id)`. |
| `quantity_ordered` | `integer` | Not null. |
| `quantity_received` | `integer` | Default `0`. Updated on delivery. |
| `unit_cost` | `decimal(10,2)` | Not null. |
| `total_cost` | `decimal(10,2)` | Not null. |
| `batch_number` | `text` | Batch assigned on receipt. |
| `expiry_date` | `date` | Expiry of received batch. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `purchase_order_id` → `purchase_orders(id)`, `medication_id` → `medications(id)`.

**RLS Policies:**
- `Pharmacy staff can view purchase order items` — SELECT via purchase order membership.
- `Pharmacy staff can manage purchase order items` — ALL via purchase order membership.

---
## Group 5 — Sales & POS

### `sales`

**Purpose:** Header record for each POS transaction. Stores totals, payment method, insurance split, and receipt number. Line items are in `sale_items`.

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `cashier_id` | `uuid` | FK → `auth.users(id)`. The user who processed the sale. |
| `customer_name` | `text` | Walk-in customer name (denormalised). |
| `customer_phone` | `text` | Walk-in customer phone. |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers(id)`. Nullable. |
| `subtotal` | `decimal(10,2)` | Pre-insurance total. Default `0.00`. |
| `insurance_amount` | `decimal(10,2)` | Amount covered by insurance. Default `0.00`. |
| `customer_amount` | `decimal(10,2)` | Amount paid by customer. Default `0.00`. |
| `total_amount` | `decimal(10,2)` | Grand total. Default `0.00`. |
| `payment_method` | `payment_method` | Enum: `cash`, `card`, `mobile_money`, `insurance`, `mixed`. Default `cash`. |
| `status` | `sale_status` | Enum: `completed`, `pending`, `cancelled`, `refunded`. Default `completed`. |
| `rra_invoice_number` | `text` | Rwanda Revenue Authority invoice number. |
| `receipt_number` | `text` | Human-readable receipt ID (e.g. `RCP-20240110-001`). |
| `notes` | `text` | Optional notes. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `cashier_id` → `auth.users(id)`, `insurance_provider_id` → `insurance_providers(id)`.

**RLS Policies:**
- `Pharmacy staff can view sales` — SELECT for pharmacy members.
- `Pharmacy staff can create sales` — INSERT for pharmacy members.
- `Pharmacy staff can update sales` — UPDATE for pharmacy members.

**Triggers:** `update_sales_updated_at`, `audit_sales`.

---

### `sale_items`

**Purpose:** Line items for each sale. Each row is one medication sold in a transaction. Inserting a row here automatically decrements `inventory.quantity_in_stock` and creates a `stock_movements` record.

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `sale_id` | `uuid` | FK → `sales(id)` ON DELETE CASCADE. |
| `inventory_id` | `uuid` | FK → `inventory(id)`. Nullable (if item no longer in inventory). |
| `medication_name` | `text` | Not null. Denormalised for receipt display. |
| `quantity` | `integer` | Not null. |
| `unit_price` | `decimal(10,2)` | Not null. Price at time of sale. |
| `total_price` | `decimal(10,2)` | Not null. `quantity × unit_price`. |
| `batch_number` | `text` | Batch sold from. |
| `expiry_date` | `date` | Expiry of the batch sold. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `sale_id` → `sales(id)`, `inventory_id` → `inventory(id)`.

**RLS Policies:**
- `Pharmacy staff can view sale items` — SELECT via sale membership.
- `Pharmacy staff can manage sale items` — ALL via sale membership.

**Triggers:** `handle_sale_stock_update_trigger` — AFTER INSERT, decrements inventory and logs stock movement.

---

### `discounts`

**Purpose:** Configurable discount definitions per pharmacy. Applied at POS checkout. Supports percentage and fixed-amount types.

**Migration:** `20241201000016_pos_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. Display name. |
| `type` | `text` | Not null. Values: `percentage`, `fixed_amount`. |
| `value` | `decimal(10,2)` | Not null. Percentage (0–100) or fixed RWF amount. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:** None defined in migrations.

---

### `returns`

**Purpose:** Records product return transactions. Links back to the original sale and tracks the refund amount and reason.

**Migration:** `20241201000016_pos_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `sale_id` | `uuid` | FK → `sales(id)`. Original sale being returned. |
| `reason` | `text` | Not null. Return reason. |
| `refund_amount` | `decimal(10,2)` | Not null. |
| `status` | `text` | Default `processed`. |
| `processed_by` | `uuid` | FK → `auth.users(id)`. Staff who processed the return. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `sale_id` → `sales(id)`, `processed_by` → `auth.users(id)`.

**RLS Policies:** None defined in migrations.

---

### `return_items`

**Purpose:** Line items for each return transaction.

**Migration:** `20241201000016_pos_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `return_id` | `uuid` | FK → `returns(id)` ON DELETE CASCADE. |
| `medication_name` | `text` | Not null. |
| `quantity` | `integer` | Not null. |
| `unit_price` | `decimal(10,2)` | Not null. |
| `total_price` | `decimal(10,2)` | Not null. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `return_id` → `returns(id)`.

**RLS Policies:** None defined in migrations.

---

## Group 6 — Customers & Patients

### `customers`

**Purpose:** Customer profiles for loyalty tracking, insurance linkage, and purchase history. Two versions of this table exist in migrations (`20240322000004_saas_extensions.sql` and `20241201000015_missing_tables.sql`); the later migration uses `IF NOT EXISTS` and adds `total_purchases`, `last_visit`, and `status` columns while dropping the array-based `allergies`/`medical_conditions` fields.

**Migration:** `20240322000004_saas_extensions.sql` (original); `20241201000015_missing_tables.sql` (extended).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. |
| `phone` | `text` | Contact phone. |
| `email` | `text` | Contact email. |
| `date_of_birth` | `date` | Nullable. |
| `gender` | `text` | Nullable. |
| `address` | `text` | Nullable. |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers(id)`. Nullable. |
| `insurance_number` | `text` | Insurance membership number. |
| `allergies` | `text` / `text[]` | Known allergies (type varies by migration version). |
| `medical_conditions` | `text[]` | Known conditions (original version only). |
| `emergency_contact_name` | `text` | Emergency contact (original version only). |
| `emergency_contact_phone` | `text` | Emergency contact phone (original version only). |
| `total_purchases` | `decimal(10,2)` | Cumulative spend. Default `0.00` (extended version). |
| `last_visit` | `date` | Date of last purchase (extended version). |
| `status` | `text` | Default `active` (extended version). |
| `is_active` | `boolean` | Default `true` (original version). |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `insurance_provider_id` → `insurance_providers(id)`.

**RLS Policies:**
- `Pharmacy staff can view customers` — SELECT for pharmacy members.
- `Pharmacy staff can manage customers` — ALL for pharmacy members.

---

### `customer_loyalty`

**Purpose:** Loyalty programme tracking per customer. Stores points balance, tier (Bronze/Silver/Gold), and total spend. One record per customer per pharmacy.

**Migration:** `20241201000017_transfers_loyalty.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `customer_id` | `uuid` | FK → `customers(id)` ON DELETE CASCADE. |
| `points` | `integer` | Default `0`. |
| `tier` | `text` | Default `Bronze`. Values: `Bronze`, `Silver`, `Gold`. |
| `total_spent` | `decimal(10,2)` | Default `0.00`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `customer_id` → `customers(id)`.

**RLS Policies:** None defined in migrations.

---

### `patients`

**Note:** No dedicated `patients` table was found in the migration files. Patient data is stored within `prescriptions` as denormalised text fields (`patient_name`). The design document references a `patients` table but it was not created in any migration. The `prescriptions` table serves as the patient record in the current schema.

---

## Group 7 — Prescriptions & Insurance

### `prescriptions`

**Purpose:** Prescription records linked to a pharmacy. Tracks patient name, prescribing doctor, list of medications, priority, and dispensing status. Note: medications are stored as a text array (denormalised), not as FK references to `medications`.

**Migration:** `20241201000014_prescriptions_table.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `patient_name` | `text` | Not null. |
| `doctor_name` | `text` | Not null. |
| `medications` | `text[]` | Not null. Array of medication names/doses. Default `{}`. |
| `priority` | `prescription_priority` | Enum: `low`, `medium`, `high`, `urgent`. Default `medium`. |
| `status` | `prescription_status` | Enum: `pending`, `dispensed`, `completed`, `cancelled`. Default `pending`. |
| `insurance_provider` | `text` | Insurance provider name (denormalised). |
| `notes` | `text` | Optional clinical notes. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:** None defined in migrations (accessed via service role in API routes).

---

### `insurance_providers`

**Purpose:** Per-pharmacy insurance provider configurations. Stores coverage percentage and contact details. Can also hold global (pharmacy_id = NULL) providers inserted by the superadmin. RLS was revised multiple times across migrations to support both pharmacy-scoped and global records.

**Migration:** `20240322000001_pharmacy_management_schema.sql` (original); `20241201000021_insurance_providers.sql` (recreated with RLS); `20241202000000_fix_insurance_rls.sql` (RLS revised).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. Nullable for global providers. |
| `name` | `text` | Not null. E.g. `RSSB`, `Radiant Insurance`. |
| `coverage_percentage` | `decimal(5,2)` | Default `80.00`. Percentage covered by insurer. |
| `contact_email` | `text` | Claims contact email. |
| `contact_phone` | `text` | Claims contact phone. |
| `policy_number` | `text` | Policy/contract reference. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies (final state after `20241202000000_fix_insurance_rls.sql`):**
- `view_active_insurance_providers` — SELECT for active providers, pharmacy members, or superadmin.
- `superadmin_manage_insurance` — ALL for superadmin.
- `pharmacy_manage_insurance` — ALL for pharmacy members (their own providers).

---

### `insurance_claims`

**Purpose:** Insurance claim records submitted against sales. Tracks claim lifecycle from `pending` through `approved`/`rejected`. Claim numbers are auto-generated (`CLM-YYYYMMDD-NNNN`).

**Migration:** `20240322000001_pharmacy_management_schema.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `sale_id` | `uuid` | FK → `sales(id)` ON DELETE CASCADE. |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers(id)`. |
| `claim_number` | `text` | Unique. Auto-generated by trigger. |
| `patient_name` | `text` | Not null. |
| `patient_id_number` | `text` | National ID or insurance membership number. |
| `claim_amount` | `decimal(10,2)` | Not null. Amount claimed. |
| `approved_amount` | `decimal(10,2)` | Default `0.00`. Amount approved by insurer. |
| `status` | `insurance_claim_status` | Enum: `pending`, `approved`, `rejected`, `processing`. Default `pending`. |
| `submitted_at` | `timestamptz` | Default `now()`. |
| `processed_at` | `timestamptz` | Nullable. When insurer responded. |
| `notes` | `text` | Optional notes. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `sale_id` → `sales(id)`, `insurance_provider_id` → `insurance_providers(id)`.

**RLS Policies:**
- `Pharmacy staff can view insurance claims` — SELECT for pharmacy members.
- `Pharmacy staff can manage insurance claims` — ALL for pharmacy members.

**Triggers:** `generate_claim_number_trigger` — BEFORE INSERT, generates `CLM-YYYYMMDD-NNNN` using `claim_number_seq`.

---

### `insurance_templates`

**Purpose:** HTML/CSS print templates for insurance claim forms, customised per pharmacy and insurance provider.

**Migration:** `20241201000020_insurance_templates.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. Template display name. |
| `insurance_provider` | `text` | Not null. Provider name this template is for. |
| `template_html` | `text` | HTML markup of the template. |
| `template_css` | `text` | CSS styles for the template. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:** None defined in migrations.

---

### `global_insurance_providers`

**Purpose:** Superadmin-managed global list of insurance providers. Pharmacies can reference these instead of creating their own. Readable by all authenticated users; writable only by superadmin.

**Migration:** `20241201000013_global_entities.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `name` | `text` | Not null. |
| `coverage_percentage` | `decimal(5,2)` | Default `0.00`. |
| `contact_email` | `text` | Nullable. |
| `contact_phone` | `text` | Nullable. |
| `policy_number` | `text` | Nullable. |
| `is_active` | `boolean` | Default `true`. |
| `created_by` | `uuid` | FK → `auth.users(id)`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `created_by` → `auth.users(id)`.

**RLS Policies:**
- `Anyone can view global insurance providers` — SELECT where `is_active = true`.
- `Superadmin can manage global insurance providers` — ALL for superadmin email.

---

### `pharmacy_insurance_providers`

**Purpose:** Junction table linking pharmacies to both local and global insurance providers. Allows a pharmacy to "subscribe" to a global provider without duplicating its data.

**Migration:** `20241201000013_global_entities.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `insurance_provider_id` | `uuid` | FK → `insurance_providers(id)` ON DELETE CASCADE. Nullable. |
| `global_insurance_provider_id` | `uuid` | FK → `global_insurance_providers(id)` ON DELETE CASCADE. Nullable. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |

**Constraints:** `UNIQUE(pharmacy_id, insurance_provider_id)`, `UNIQUE(pharmacy_id, global_insurance_provider_id)`.

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `insurance_provider_id` → `insurance_providers(id)`, `global_insurance_provider_id` → `global_insurance_providers(id)`.

**RLS Policies:**
- `Pharmacy staff can view their insurance relationships` — SELECT for pharmacy members.
- `Pharmacy staff can manage their insurance relationships` — ALL for pharmacy members.

---
## Group 8 — Staff & Roles

### `staff`

**Purpose:** Extended staff profile table. Complements `pharmacy_users` (which handles auth roles) with HR data: employee ID, full name, position, department, hire date, and salary. A staff member must also have a `pharmacy_users` record for login access.

**Migration:** `20241201000015_missing_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE. |
| `employee_id` | `text` | Optional HR employee identifier. |
| `first_name` | `text` | Not null. |
| `last_name` | `text` | Not null. |
| `email` | `text` | Work email. |
| `phone` | `text` | Work phone. |
| `position` | `text` | Job title. |
| `department` | `text` | Department name. |
| `hire_date` | `date` | Default `CURRENT_DATE`. |
| `salary` | `decimal(10,2)` | Monthly salary in RWF. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `user_id` → `auth.users(id)`.

**RLS Policies:** None defined in migrations (accessed via service role in API routes).

---

### `audit_logs`

**Purpose:** Compliance and security audit trail. Records every INSERT, UPDATE, and DELETE on key tables (`pharmacies`, `sales`, `inventory`, `pharmacy_users`). Stores old and new values as JSONB for full change history.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `user_id` | `uuid` | FK → `auth.users(id)`. Who made the change. |
| `action` | `text` | Not null. Values: `INSERT`, `UPDATE`, `DELETE`. |
| `table_name` | `text` | Name of the affected table. |
| `record_id` | `uuid` | ID of the affected record. |
| `old_values` | `jsonb` | Previous state (for UPDATE/DELETE). |
| `new_values` | `jsonb` | New state (for INSERT/UPDATE). |
| `ip_address` | `inet` | Client IP address. |
| `user_agent` | `text` | Client user agent string. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `user_id` → `auth.users(id)`.

**RLS Policies:**
- `Pharmacy staff can view audit logs` — SELECT for pharmacy members.

**Triggers:** `audit_pharmacies`, `audit_sales`, `audit_inventory`, `audit_pharmacy_users` — all call `create_audit_log()` AFTER INSERT/UPDATE/DELETE.

---

### `notifications`

**Purpose:** In-app notification records. Can be targeted to a specific user or broadcast to all pharmacy staff. Types: `info`, `warning`, `error`, `success`. Defined in two migrations; the later one (`20241201000015_missing_tables.sql`) drops the `action_url` and `metadata` columns.

**Migration:** `20240322000004_saas_extensions.sql` (original); `20241201000015_missing_tables.sql` (simplified).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `user_id` | `uuid` | FK → `auth.users(id)`. Nullable for broadcast notifications. |
| `title` | `text` | Not null. |
| `message` | `text` | Not null. |
| `type` | `text` | Default `info`. Values: `info`, `warning`, `error`, `success`. |
| `is_read` | `boolean` | Default `false`. |
| `action_url` | `text` | Deep-link URL (original version only). |
| `metadata` | `jsonb` | Extra data (original version only). |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `user_id` → `auth.users(id)`.

**RLS Policies:**
- `Users can view their notifications` — SELECT for own user_id or pharmacy members.
- `Users can update their notifications` — UPDATE for own user_id (mark as read).

---

### `alerts`

**Purpose:** System-generated alerts for stock and expiry events. Separate from `notifications` — alerts are auto-created by business logic (low stock, expiry warning, out of stock) and can be resolved by staff.

**Migration:** `20241201000015_missing_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `type` | `text` | Not null. Values: `low_stock`, `expiry_warning`, `out_of_stock`. |
| `title` | `text` | Not null. |
| `message` | `text` | Not null. |
| `severity` | `text` | Default `medium`. Values: `low`, `medium`, `high`, `critical`. |
| `is_resolved` | `boolean` | Default `false`. |
| `resolved_at` | `timestamptz` | Nullable. When resolved. |
| `resolved_by` | `uuid` | FK → `auth.users(id)`. Who resolved it. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `resolved_by` → `auth.users(id)`.

**RLS Policies:** None defined in migrations.

---

## Group 9 — Settings & Configuration

### `system_settings`

**Purpose:** Key-value settings store used by the admin settings UI. Supports both pharmacy-scoped settings (`pharmacy_id` set) and global platform settings (`pharmacy_id IS NULL`). The table was created twice in migrations; the later version (`20241202000003_complete_system_settings.sql`) is authoritative. RLS was revised in `20241205000001_fix_system_settings_admin_access.sql` to allow admins to read/write global settings.

**Migration:** `20241201000019_system_settings.sql`; `20241202000003_complete_system_settings.sql`; RLS updated by `20241202000002_system_settings_rls.sql` and `20241205000001_fix_system_settings_admin_access.sql`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. Nullable for global settings. |
| `setting_key` | `text` | Not null. |
| `setting_value` | `jsonb` | Not null. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Constraints:** `UNIQUE(pharmacy_id, setting_key)`.

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies (final state after `20241205000001`):**
- `Users can view settings` — SELECT for pharmacy members OR `pharmacy_id IS NULL` (global).
- `Users can insert settings` — INSERT for pharmacy members; admins can insert global settings.
- `Users can update settings` — UPDATE for pharmacy members; admins can update global settings.

---

### `ip_whitelist`

**Purpose:** Per-pharmacy IP address allowlist for security. When populated, only requests from listed IPs are permitted for that pharmacy's admin operations.

**Migration:** `20241202000001_ip_whitelist_table.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | Not null. FK → `pharmacies(id)` ON DELETE CASCADE. |
| `ip_address` | `text` | Not null. IPv4 or IPv6 address. |
| `description` | `text` | Optional label (e.g. `Office`, `Home`). |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Users can view their pharmacy's IP whitelist` — SELECT for pharmacy members.
- `Users can insert IP whitelist for their pharmacy` — INSERT for pharmacy members.
- `Users can update their pharmacy's IP whitelist` — UPDATE for pharmacy members.
- `Users can delete their pharmacy's IP whitelist` — DELETE for pharmacy members.

---

### `api_keys`

**Purpose:** API key management for third-party integrations. Keys are stored as hashes; only the prefix is stored in plaintext for display. Supports scoped permissions and expiry.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. Descriptive label. |
| `key_hash` | `text` | Not null. Bcrypt/SHA hash of the full key. |
| `key_prefix` | `text` | Not null. First 8 chars shown in UI. |
| `permissions` | `text[]` | Default `{}`. Scoped permission strings. |
| `is_active` | `boolean` | Default `true`. |
| `last_used_at` | `timestamptz` | Nullable. Updated on each API call. |
| `expires_at` | `timestamptz` | Nullable. Key expiry. |
| `created_by` | `uuid` | FK → `auth.users(id)`. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `created_by` → `auth.users(id)`.

**RLS Policies:**
- `Pharmacy owners can view API keys` — SELECT for pharmacy owners and admins.
- `Pharmacy owners can manage API keys` — ALL for pharmacy owners and admins.

---

### `webhooks`

**Purpose:** Webhook endpoint configurations for event-driven integrations. Supports retry logic and secret-key signing.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `event_type` | `text` | Not null. E.g. `sale.completed`, `stock.low`. |
| `endpoint_url` | `text` | Not null. HTTPS endpoint to POST to. |
| `secret_key` | `text` | HMAC signing secret. |
| `is_active` | `boolean` | Default `true`. |
| `retry_count` | `integer` | Default `3`. Max delivery attempts. |
| `last_triggered_at` | `timestamptz` | Nullable. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Pharmacy owners can view webhooks` — SELECT for pharmacy owners and admins.
- `Pharmacy owners can manage webhooks` — ALL for pharmacy owners and admins.

---

### `webhook_deliveries`

**Purpose:** Delivery log for each webhook attempt. Stores the event payload, HTTP response status, and response body for debugging.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `webhook_id` | `uuid` | FK → `webhooks(id)` ON DELETE CASCADE. |
| `event_data` | `jsonb` | Not null. The event payload sent. |
| `response_status` | `integer` | HTTP status code received. |
| `response_body` | `text` | Response body. |
| `delivered_at` | `timestamptz` | Default `now()`. |
| `retry_count` | `integer` | Default `0`. |

**Foreign Keys:** `webhook_id` → `webhooks(id)`.

**RLS Policies:**
- `Pharmacy owners can view webhook deliveries` — SELECT via webhook ownership.

---

### `report_cache`

**Purpose:** Caches generated report data to avoid expensive re-computation. Stores report type, parameters, and result data with an expiry timestamp.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `report_type` | `text` | Not null. E.g. `daily_sales`, `inventory_summary`. |
| `parameters` | `jsonb` | Query parameters used to generate the report. |
| `data` | `jsonb` | Not null. Cached report data. |
| `generated_at` | `timestamptz` | Default `now()`. |
| `expires_at` | `timestamptz` | Nullable. Cache TTL. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Pharmacy staff can view report cache` — SELECT for pharmacy members.
- `Pharmacy staff can manage report cache` — ALL for pharmacy members.

---

### `mobile_sessions`

**Purpose:** Mobile app session tracking. Stores device information and push notification tokens for iOS/Android clients.

**Migration:** `20240322000004_saas_extensions.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `user_id` | `uuid` | FK → `auth.users(id)` ON DELETE CASCADE. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `device_id` | `text` | Not null. Unique device identifier. |
| `device_type` | `text` | Values: `ios`, `android`. |
| `app_version` | `text` | App version string. |
| `push_token` | `text` | FCM/APNs push notification token. |
| `is_active` | `boolean` | Default `true`. |
| `last_activity_at` | `timestamptz` | Default `now()`. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `user_id` → `auth.users(id)`, `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:**
- `Users can view their mobile sessions` — SELECT for own user_id.
- `Users can manage their mobile sessions` — ALL for own user_id.

---

### `global_categories`

**Purpose:** Superadmin-managed global product category list. Pharmacies can use these as a shared taxonomy instead of creating their own `categories` records.

**Migration:** `20241201000013_global_entities.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `name` | `text` | Not null. |
| `description` | `text` | Optional. |
| `is_active` | `boolean` | Default `true`. |
| `created_by` | `uuid` | FK → `auth.users(id)`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `created_by` → `auth.users(id)`.

**RLS Policies:**
- `Anyone can view global categories` — SELECT where `is_active = true`.
- `Superadmin can manage global categories` — ALL for superadmin email.

---

### `backups`

**Purpose:** Records of database backup operations. Tracks backup type (daily, weekly, manual), file size, and status. Backup files themselves are stored externally; this table is a metadata log.

**Migration:** `20241201000018_backups_table.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. Backup file name or label. |
| `type` | `text` | Not null. Values: `daily`, `weekly`, `manual`. |
| `file_size` | `text` | Human-readable size (e.g. `2.4 MB`). |
| `status` | `text` | Default `completed`. Values: `pending`, `completed`, `failed`. |
| `created_at` | `timestamptz` | Default `now()`. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`.

**RLS Policies:** None defined in migrations.

---

## Group 10 — Branches & Locations

### `branches`

**Purpose:** Multi-branch support. Each pharmacy can have multiple physical locations. Branches are referenced by `inventory_transfers` for inter-branch stock movements.

**Migration:** `20241201000015_missing_tables.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. |
| `pharmacy_id` | `uuid` | FK → `pharmacies(id)` ON DELETE CASCADE. |
| `name` | `text` | Not null. Branch display name. |
| `address` | `text` | Physical address. |
| `phone` | `text` | Branch phone number. |
| `manager_id` | `uuid` | FK → `auth.users(id)`. Branch manager. |
| `is_active` | `boolean` | Default `true`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Auto-updated by trigger. |

**Foreign Keys:** `pharmacy_id` → `pharmacies(id)`, `manager_id` → `auth.users(id)`.

**RLS Policies:** None defined in migrations (accessed via service role in API routes).

---

## Enums

The following PostgreSQL enum types are defined in the schema:

| Enum | Values |
|---|---|
| `user_role` | `admin`, `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |
| `pharmacy_status` | `active`, `inactive`, `suspended`, `trial` |
| `subscription_plan` | `trial`, `standard`, `premium` |
| `medication_category` | `prescription`, `otc`, `controlled`, `supplement`, `medical_device` |
| `sale_status` | `completed`, `pending`, `cancelled`, `refunded` |
| `insurance_claim_status` | `pending`, `approved`, `rejected`, `processing` |
| `payment_method` | `cash`, `card`, `mobile_money`, `insurance`, `mixed` |
| `prescription_status` | `pending`, `dispensed`, `completed`, `cancelled` |
| `prescription_priority` | `low`, `medium`, `high`, `urgent` |

---

## Helper Functions

| Function | Purpose |
|---|---|
| `get_user_pharmacy_ids()` | Returns array of `pharmacy_id` values for the current user. Used in RLS policies. |
| `is_admin()` | Returns `true` if the current user has `role = 'admin'` in any pharmacy. |
| `is_superadmin()` | Returns `true` if the current user's email is `abdousentore@gmail.com`. |
| `update_updated_at_column()` | Trigger function that sets `updated_at = now()` on every UPDATE. |
| `handle_new_user()` | Trigger on `auth.users` INSERT — mirrors user into `public.users`. |
| `handle_user_update()` | Trigger on `auth.users` UPDATE — syncs profile fields to `public.users`. |
| `setup_all_users()` | Trigger on `auth.users` INSERT — assigns test user roles to `pharmacy_users`. |
| `handle_sale_stock_update()` | Trigger on `sale_items` INSERT — decrements inventory and logs stock movement. |
| `handle_payment_completion()` | Trigger on `payment_transactions` UPDATE — updates sale/subscription on completion. |
| `create_audit_log()` | Trigger function — inserts a row into `audit_logs` for audited tables. |
| `generate_claim_number()` | Trigger on `insurance_claims` INSERT — generates `CLM-YYYYMMDD-NNNN`. |
| `generate_po_number()` | Trigger on `purchase_orders` INSERT — generates `PO-YYYYMMDD-NNNN`. |
| `generate_invoice_number()` | Trigger on `invoices` INSERT — generates `INV-YYYYMMDD-NNNNNN`. |
| `check_expired_subscriptions()` | Suspends pharmacies with expired `subscription_expires_at`. Run via cron. |
| `get_subscription_status(uuid)` | Returns subscription status details for a pharmacy (days remaining, expiry, etc.). |

---

## Storage Buckets

| Bucket | Public | Purpose |
|---|---|---|
| `pharmacy-logos` | Yes | Pharmacy branding logos uploaded via the Settings page. |

**Storage Policies:**
- Authenticated users can upload and update logos.
- Public (unauthenticated) users can view logos.
- Authenticated users can delete logos.

---

## Views

| View | Purpose |
|---|---|
| `pharmacy_dashboard_stats` | Aggregates today's sales count, revenue, low-stock items, expiring items, and active staff per pharmacy. |
| `inventory_alerts` | Lists inventory items that are low-stock, expiring within 30 days, or already expired. |
| `user_roles_view` | **View** (not a physical table). Joins `public.users`, `public.pharmacy_users`, and `public.pharmacies` for a flat “who / where / which role” report in SQL or Studio. `effective_role` treats `users.is_platform_admin` as platform `admin`. Authorization in the app uses base tables and RLS, not this view. |

---

## Sequences

| Sequence | Used By |
|---|---|
| `claim_number_seq` | `insurance_claims.claim_number` |
| `po_number_seq` | `purchase_orders.po_number` |
| `invoice_number_seq` | `invoices.invoice_number` |
