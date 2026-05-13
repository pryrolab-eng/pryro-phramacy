# Insurance Module

## Purpose

The Insurance module manages insurance providers, coverage configuration, invoice template design, and insurance-based payment processing within Pryrox. It supports a two-tier provider model: **global providers** (created by the superadmin, available to all pharmacies) and **pharmacy-specific providers** (created by a pharmacy owner, scoped to their tenant).

Insurance providers are referenced at the Point of Sale when a customer pays with insurance. The `sales` table records the `insurance_provider_id` and `insurance_amount` for each insured transaction. A separate invoice template designer allows admins and pharmacy owners to build custom claim documents for submission to insurance companies.

The module has a documented history of Row Level Security (RLS) issues that required multiple fix migrations before reaching a stable state. See [Known Limitations](#known-limitations) for the full history.

---

## Key Files

### API Routes (`src/app/api/insurance/`)

| File | Route | Methods | Auth Required | Description |
|---|---|---|---|---|
| `route.ts` | `/api/insurance` | `GET`, `POST` | `GET`: No (returns global only) / Yes (returns pharmacy + global); `POST`: Yes | Core CRUD for insurance providers. `GET` returns global providers for unauthenticated users, pharmacy + global for authenticated users, and all providers for the superadmin. `POST` creates a new provider; superadmin creates global providers (`pharmacy_id = NULL`), pharmacy owners create tenant-scoped providers. |
| `lookup/route.ts` | `/api/insurance/lookup` | `POST` | No | **Stub.** Looks up an insurance number against a hardcoded in-memory map (`INS001` → RSSB 80%, `INS002` → Radiant 70%, `INS003` → MMI 90%). Not connected to the database. |
| `pricing/route.ts` | `/api/insurance/pricing` | `GET`, `POST` | No | **Stub.** Returns hardcoded per-drug prices for MMI, RSSB, and Radiant. `POST` updates the in-memory price map (resets on server restart). Not persisted to the database. |
| `process/route.ts` | `/api/insurance/process` | `POST` | No | **Stub.** Generates a mock insurance claim with a random approval code. No database writes; no real claim processing. |

### Reports API (`src/app/api/reports/insurance-claims/`)

| File | Route | Methods | Auth Required | Description |
|---|---|---|---|---|
| `route.ts` | `/api/reports/insurance-claims` | `GET` | No | **Stub.** Returns two hardcoded sample claims (RAMA and MMI). Accepts `month` and `year` query parameters but ignores them. Not connected to the database. |

### Sales API (insurance integration)

| File | Route | Description |
|---|---|---|
| `src/app/api/sales/route.ts` | `/api/sales` | Records `insurance_amount` and `insurance_provider_id` on each sale when payment method is `insurance` or `mixed`. |
| `src/app/api/sales/analytics/route.ts` | `/api/sales/analytics` | Segments customer distribution into Walk-in / Regular / Insurance based on whether `insurance_provider_id` is set on a sale. |

### Dashboard Pages

| File | Route | Description |
|---|---|---|
| `src/app/(dashboard)/admin/insurance-templates/page.tsx` | `/admin/insurance-templates` | **Insurance Template Designer.** Drag-and-drop canvas for building custom insurance invoice layouts. Also embeds an "Add Insurance Provider" form that calls `POST /api/insurance`. Accessible from the Admin and Pharmacy Owner sidebars as "Template Designer". |

### Components

| File | Description |
|---|---|
| `src/components/invoice-template.tsx` | Renders a formatted insurance invoice (FACTURE DES MEDICAMENTS) for print. Accepts `InvoiceData` (pharmacy info, patient info, line items with per-item insurance coverage) and an optional `TemplateConfig` (which fields to show, whether to show tax/insurance split, footer text). Used for generating printable claim documents. |

### Type Definitions

| File | Description |
|---|---|
| `src/types/supabase.ts` | Auto-generated Supabase types. Defines `insurance_providers` and `insurance_claims` table shapes, the `insurance_claim_status` enum (`pending`, `approved`, `rejected`, `processing`), and the `insurance` value in the `payment_method` enum. |
| `src/lib/database.types.ts` | Manual type definitions for `sales` table including `insurance_provider_id` and `insurance_amount` columns. |

### Migrations

| File | Description |
|---|---|
| `supabase/migrations/20241201000020_insurance_templates.sql` | Creates the `insurance_templates` table. |
| `supabase/migrations/20241201000021_insurance_providers.sql` | Creates the `insurance_providers` table, enables RLS, creates initial policies, and seeds four global providers (RSSB, MMI, Radiant Insurance, SONARWA). |
| `supabase/migrations/20241202000000_fix_insurance_rls.sql` | First RLS fix migration. Drops the original policies and replaces them with three new policies using the `get_user_pharmacy_ids()` helper function. |

### Root-Level Fix Scripts (candidates for removal)

These files in the project root are ad-hoc fix scripts applied outside the official migration history. Their content is now superseded by the migration files above.

| File | Status | Description |
|---|---|---|
| `fix_insurance_schema.sql` | Superseded | Made `pharmacy_id` nullable; added global SELECT policy; seeded default providers. |
| `fix_insurance_rls.sql` | Superseded | Added `invoice_template` and `template_config` columns; rewrote RLS policies. |
| `fix_insurance_rls_v2.sql` | Superseded | Simplified RLS removing `auth.users` dependency for SELECT. |
| `fix_insurance_rls_final.sql` | Superseded | Final RLS rewrite using separate SELECT/INSERT/UPDATE/DELETE policies. |
| `fix-insurance-rls-final.sql` | Superseded | Alternate final RLS version using `get_user_pharmacy_ids()` helper. |
| `fix-insurance-insert.sql` | Superseded | INSERT-specific policy fix. |
| `add_insurance_templates.sql` | Superseded | Added `invoice_template` and `template_config` columns to `insurance_providers`. |
| `check_insurance_before_fix.sql` | Diagnostic | Pre-fix diagnostic script; safe to remove. |
| `check-insurance-rls.js` | Diagnostic | Node.js script for testing RLS behavior; safe to remove. |
| `INSURANCE_FIX_REPORT.md` | Superseded | Ad-hoc report documenting the RLS issues; content captured in this document. |

---

## Database Tables

### `insurance_providers`

Stores insurance companies that can be associated with sales transactions. Supports both global providers (available to all pharmacies) and pharmacy-specific providers.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `pharmacy_id` | `uuid` | **Yes** | `NULL` | Foreign key → `pharmacies.id` (CASCADE DELETE). `NULL` means this is a global provider visible to all pharmacies. |
| `name` | `text` | No | — | Insurance company name (e.g., "RSSB", "MMI") |
| `coverage_percentage` | `decimal(5,2)` | Yes | `80.00` | Percentage of the sale amount covered by the insurer (0–100) |
| `contact_email` | `text` | Yes | `NULL` | Insurance company contact email |
| `contact_phone` | `text` | Yes | `NULL` | Insurance company contact phone |
| `policy_number` | `text` | Yes | `NULL` | Policy or contract reference number |
| `invoice_template` | `text` | Yes | `'default'` | Template identifier for invoice generation. Added via `add_insurance_templates.sql` (not in the original migration). |
| `template_config` | `jsonb` | Yes | `'{}'` | JSON configuration for the invoice template (field visibility, footer text, etc.). Added via `add_insurance_templates.sql`. |
| `is_active` | `boolean` | Yes | `true` | Soft-delete flag. Inactive providers are hidden from most queries. |
| `created_at` | `timestamptz` | Yes | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | Yes | `now()` | Last update timestamp (maintained by trigger) |

**Indexes:** `idx_insurance_providers_pharmacy_id`, `idx_insurance_providers_name`, `idx_insurance_providers_is_active`

**Relationships:**
- `insurance_providers.pharmacy_id` → `pharmacies.id` (CASCADE DELETE)
- `sales.insurance_provider_id` → `insurance_providers.id`
- `insurance_claims.insurance_provider_id` → `insurance_providers.id`

**Seeded global providers (from migration):**

| Name | Coverage |
|---|---|
| RSSB | 80% |
| MMI | 90% |
| Radiant Insurance | 85% |
| SONARWA | 75% |

### `insurance_templates`

Stores custom invoice template definitions per pharmacy. Each template is associated with a specific insurance provider name and contains raw HTML/CSS for rendering claim documents.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `pharmacy_id` | `uuid` | Yes | `NULL` | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `name` | `text` | No | — | Template display name |
| `insurance_provider` | `text` | No | — | Name of the insurance provider this template is for |
| `template_html` | `text` | Yes | `NULL` | Raw HTML content of the template |
| `template_css` | `text` | Yes | `NULL` | Raw CSS styles for the template |
| `is_active` | `boolean` | Yes | `true` | Whether this template is active |
| `created_at` | `timestamptz` | Yes | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | Yes | `now()` | Last update timestamp (maintained by trigger) |

**Indexes:** `idx_insurance_templates_pharmacy_id`, `idx_insurance_templates_provider`

> **Note:** The `insurance_templates` table is defined in the schema but the Template Designer page (`/admin/insurance-templates`) does not read from or write to this table. The drag-and-drop canvas operates entirely in React state and the "Save Template" button does not persist to the database. See [Known Limitations](#known-limitations).

### `insurance_claims`

Tracks insurance claim submissions linked to sales. Defined in the Supabase type definitions but **no migration file creates this table** in the official `supabase/migrations/` directory. The table appears to have been created outside the migration history.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key |
| `pharmacy_id` | `uuid` | Yes | Foreign key → `pharmacies.id` |
| `insurance_provider_id` | `uuid` | Yes | Foreign key → `insurance_providers.id` |
| `sale_id` | `uuid` | Yes | Foreign key → `sales.id` |
| `patient_id_number` | `text` | Yes | Patient's insurance ID number |
| `status` | `insurance_claim_status` enum | Yes | `pending`, `approved`, `rejected`, `processing` |
| `approved_amount` | `numeric` | Yes | Amount approved by the insurer |
| `notes` | `text` | Yes | Free-text notes |
| `submitted_at` | `timestamptz` | Yes | When the claim was submitted |
| `processed_at` | `timestamptz` | Yes | When the claim was processed |
| `created_at` | `timestamptz` | Yes | Record creation timestamp |
| `updated_at` | `timestamptz` | Yes | Last update timestamp |

### `sales` (insurance-relevant columns)

The `sales` table records insurance payment details for each transaction.

| Column | Type | Description |
|---|---|---|
| `insurance_provider_id` | `uuid` | Foreign key → `insurance_providers.id`. Set when `payment_method` is `insurance` or `mixed`. |
| `insurance_amount` | `numeric` | Amount covered by the insurer for this sale. |
| `customer_amount` | `numeric` | Amount paid by the customer (total minus insurance coverage). |
| `payment_method` | enum | Includes `insurance` and `mixed` as valid values alongside `cash`, `card`, `mobile_money`. |

---

## Row Level Security Policies

The final RLS configuration on `insurance_providers` (from `supabase/migrations/20241202000000_fix_insurance_rls.sql`) defines three policies:

| Policy Name | Operation | Rule |
|---|---|---|
| `view_active_insurance_providers` | `SELECT` | `is_active = true` OR `pharmacy_id = ANY(get_user_pharmacy_ids())` OR user is superadmin |
| `superadmin_manage_insurance` | `ALL` | User email = `abdousentore@gmail.com` (checked via `auth.users`) |
| `pharmacy_manage_insurance` | `ALL` | `pharmacy_id = ANY(get_user_pharmacy_ids())` |

> **Warning:** The superadmin check is hardcoded to a specific email address (`abdousentore@gmail.com`). This is a security anti-pattern — if the superadmin email changes, the RLS policies will silently stop working for that user. See [Known Limitations](#known-limitations).

The `insurance_templates` table has **no RLS policies** defined in the official migrations.

---

## User Role Access

| Role | `GET /api/insurance` | `POST /api/insurance` | Template Designer | Notes |
|---|---|---|---|---|
| Unauthenticated | Global providers only (`pharmacy_id IS NULL`, `is_active = true`) | ❌ 401 | ❌ | Public read of global providers is intentional for POS pre-login scenarios. |
| `superadmin` | All providers (all pharmacies + global) | ✅ Creates global provider (`pharmacy_id = NULL`) | ✅ | Uses service role client to bypass RLS. Superadmin check is email-based. |
| `pharmacy_owner` | Pharmacy-specific + global active providers | ✅ Creates pharmacy-scoped provider | ✅ | Role check: `pharmacy_users.role IN ('pharmacy_owner', 'admin')`. |
| `pharmacist` | Pharmacy-specific + global active providers | ❌ 403 | ✅ (sidebar link visible) | Can view but not create providers. |
| `cashier` | Pharmacy-specific + global active providers | ❌ 403 | ✅ (sidebar link visible) | Can view but not create providers. |
| `staff` | Pharmacy-specific + global active providers | ❌ 403 | ✅ (sidebar link visible) | Can view but not create providers. |

The Template Designer page (`/admin/insurance-templates`) is linked in both the Admin sidebar and the Pharmacy Owner sidebar under the label "Template Designer". It is accessible to any authenticated user who can reach those sidebars.

---

## Features

### 1. Provider Management

The `POST /api/insurance` endpoint creates insurance providers with the following fields:

- **Name** (required) — insurance company name
- **Coverage Percentage** (required) — decimal 0–100, stored as `decimal(5,2)`
- **Contact Email** (optional)
- **Contact Phone** (optional)
- **Policy Number** (optional)
- **Invoice Template** (optional, defaults to `'default'`)
- **Template Config** (optional, defaults to `{}`)

The `GET /api/insurance` endpoint returns providers filtered by the caller's authentication state and role (see [User Role Access](#user-role-access) above).

There is no `PUT`/`PATCH` or `DELETE` endpoint for insurance providers. Updates and deletions must be performed directly in the Supabase dashboard or via SQL.

### 2. Coverage Percentage

Each provider stores a `coverage_percentage` that represents the fraction of a sale's total amount that the insurer will pay. At the Point of Sale, this value is used to split the transaction into `insurance_amount` (insurer's portion) and `customer_amount` (patient's co-pay).

The `invoice-template.tsx` component renders per-item insurance coverage amounts and a summary split showing the insurer's percentage vs. the patient's percentage.

### 3. Template Management (Insurance Template Designer)

The `/admin/insurance-templates` page provides a drag-and-drop canvas for designing insurance invoice layouts. Features include:

- **Pre-built templates:** Three starter layouts — "Rwanda Medical Claim" (RSSB-style), "Official Certificate", and "Ministry Health Report" — that can be loaded onto the canvas with one click.
- **Component palette:** Eight draggable element types — Text, Title, Variable (data-bound field), Date, Amount, Patient, Image, and Line.
- **Canvas interaction:** Elements can be dragged to reposition and resized via a corner handle.
- **Property editor:** Selecting an element reveals a properties panel for editing text, font size, font weight, image URL, and background color.
- **Add Insurance Provider form:** Embedded in the left sidebar; calls `POST /api/insurance` to create a new provider without leaving the page.
- **Print Preview:** Triggers `window.print()` for the current canvas state.

> **Limitation:** The "Save Template" button does not persist the canvas state to the database. The `insurance_templates` table exists but is not wired to this UI. See [Known Limitations](#known-limitations).

### 4. Invoice Rendering (`InvoiceTemplate` component)

The `src/components/invoice-template.tsx` component renders a print-ready "FACTURE DES MEDICAMENTS" (Medication Invoice) document. It accepts:

- **`InvoiceData`** — pharmacy details, patient/beneficiary details, line items (each with `insuranceCoverage` and `patientPortion` amounts), totals, and insurance split amounts.
- **`TemplateConfig`** (optional) — controls which header/patient fields to display, whether to show the tax section, whether to show the insurance/patient split, and a custom footer text.

The component is designed for print output (`print:p-0` Tailwind class) and renders in French (column headers: "PRODUITS FOURNIS", "FACTURE DES MEDICAMENTS").

### 5. Insurance Claims Reporting

The `/api/reports/insurance-claims` endpoint is intended to return monthly insurance claim summaries. Currently it returns two hardcoded sample claims and does not query the database. The `insurance_claims` table exists in the type definitions but the reporting endpoint is not connected to it.

### 6. Insurance Lookup and Pricing (Stubs)

Two additional sub-routes exist under `/api/insurance/` but are not connected to the database:

- **`/api/insurance/lookup`** — Looks up an insurance number against a hardcoded map of three entries. Intended for patient insurance card verification at the POS.
- **`/api/insurance/pricing`** — Returns hardcoded per-drug prices for three insurers. Intended for insurance-specific drug pricing (different insurers may have negotiated different prices). The in-memory price map resets on every server restart.

---

## Data Flow

### Insurance Provider Creation (Superadmin)

```
Superadmin submits "Add Insurance Provider" form
  (on /admin/insurance-templates page)
        │
        ▼
POST /api/insurance  { name, coverage_percentage, ... }
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ isSuperAdmin = user.email === 'abdousentore@gmail.com'
        ├─ dbClient = createServiceClient()  ← bypasses RLS
        ├─ pharmacyId = null  ← global provider
        └─ INSERT INTO insurance_providers (pharmacy_id=NULL, ...)
        │
        ▼
Global provider visible to all pharmacies via GET /api/insurance
```

### Insurance Provider Creation (Pharmacy Owner)

```
Pharmacy owner submits "Add Insurance Provider" form
        │
        ▼
POST /api/insurance  { name, coverage_percentage, ... }
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ SELECT pharmacy_id, role FROM pharmacy_users WHERE user_id = ?
        ├─ role must be 'pharmacy_owner' or 'admin' → else 403
        ├─ pharmacyId = userPharmacy.pharmacy_id
        └─ INSERT INTO insurance_providers (pharmacy_id=<id>, ...)
        │
        ▼
Provider visible only to that pharmacy's users via GET /api/insurance
```

### Insurance Payment at POS

```
Cashier selects insurance provider at POS
        │
        ▼
GET /api/insurance → returns available providers for this pharmacy
        │
        ▼
Cashier selects provider, system calculates:
  insurance_amount = total × (coverage_percentage / 100)
  customer_amount  = total − insurance_amount
        │
        ▼
POST /api/sales  { insurance_provider_id, insurance_amount,
                   customer_amount, payment_method: 'insurance' }
        │
        └─ INSERT INTO sales (insurance_provider_id, insurance_amount, ...)
```

---

## Known Limitations

### 1. RLS Required Multiple Fix Migrations

The `insurance_providers` table went through at least **six rounds of RLS policy rewrites** before reaching a stable state. The root causes were:

1. **Original policy too restrictive** — The initial `"Anyone can view active insurance providers"` policy required `is_active = true` but did not allow unauthenticated access to global providers, causing the API to return empty arrays for unauthenticated requests even though data existed.
2. **Missing columns** — `invoice_template` and `template_config` columns were added to the API code before being added to the database schema, causing silent failures.
3. **`auth.users` dependency in RLS** — Several policy versions used `EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = '...')` for the superadmin check. This pattern can cause performance issues and intermittent failures in some Supabase configurations.
4. **Conflicting policies** — Multiple rounds of `DROP POLICY IF EXISTS` + `CREATE POLICY` left the table in inconsistent states between migrations.

The fix history is documented in `INSURANCE_FIX_REPORT.md` (root directory) and the following root-level SQL files: `fix_insurance_schema.sql`, `fix_insurance_rls.sql`, `fix_insurance_rls_v2.sql`, `fix_insurance_rls_final.sql`, `fix-insurance-rls-final.sql`.

The official migration `20241202000000_fix_insurance_rls.sql` represents the current authoritative state.

### 2. Superadmin Check Is Hardcoded to a Specific Email

Both the API route (`src/app/api/insurance/route.ts`) and the RLS policies check `user.email === 'abdousentore@gmail.com'` to identify the superadmin. If the superadmin account email changes, or if a second superadmin needs to be added, both the application code and the database RLS policies must be updated manually. A role-based check against `pharmacy_users.role = 'superadmin'` would be more maintainable.

### 3. Template Designer Does Not Persist to Database

The `/admin/insurance-templates` drag-and-drop canvas operates entirely in React component state. The "Save Template" button calls `setTemplate({...template, name: ...})` — updating local state only. No API call is made and nothing is written to the `insurance_templates` table. Refreshing the page loses all canvas work.

### 4. `insurance_templates` Table Has No RLS Policies

The `insurance_templates` table was created in migration `20241201000020_insurance_templates.sql` without any RLS policies. RLS is not enabled on this table, meaning any authenticated user with direct database access can read or write all template records across all pharmacies.

### 5. Lookup, Pricing, and Process Routes Are Stubs

Three of the four sub-routes under `/api/insurance/` are non-functional stubs:
- `/api/insurance/lookup` — hardcoded map of 3 entries; not connected to the database.
- `/api/insurance/pricing` — hardcoded in-memory price map; resets on server restart.
- `/api/insurance/process` — generates a mock claim with a random approval code; no database writes.

These routes are not protected by authentication and should either be implemented or removed.

### 6. Insurance Claims Reporting Is a Stub

`/api/reports/insurance-claims` returns two hardcoded sample claims regardless of the `month`/`year` parameters. The `insurance_claims` table exists in the type definitions but is not queried by any API route.

### 7. No Update or Delete Endpoints

The insurance API only supports `GET` (list) and `POST` (create). There are no `PUT`/`PATCH` or `DELETE` endpoints. Editing or deactivating an insurance provider requires direct database access via the Supabase dashboard.

### 8. `invoice_template` and `template_config` Columns Not in Original Migration

The `invoice_template` and `template_config` columns on `insurance_providers` were added via ad-hoc scripts (`add_insurance_templates.sql`, `fix_insurance_rls.sql`) rather than through a proper migration. The original migration `20241201000021_insurance_providers.sql` does not include these columns. The Supabase type definitions in `src/types/supabase.ts` also do not include these columns, meaning TypeScript will not catch type errors when reading or writing them.

### 9. `insurance_claims` Table Has No Official Migration

The `insurance_claims` table is referenced in `src/types/supabase.ts` (auto-generated from the live database) but there is no corresponding file in `supabase/migrations/`. The table was likely created via the Supabase dashboard or an ad-hoc SQL script, making it invisible to the migration history.

### 10. No Input Validation on Coverage Percentage

The `POST /api/insurance` route parses `coverage_percentage` with `parseFloat()` but does not validate that the value is between 0 and 100. A value of `150` or `-10` would be accepted and stored without error.

---

## i18n Support

The `src/lib/i18n.ts` file defines insurance-related translation keys for all four supported languages (EN, RW, FR, SW):

| Key | EN | RW | FR | SW |
|---|---|---|---|---|
| `insurance_name` | Insurance Name | Izina ry'Ubwishingizi | Nom de l'assurance | Jina la Bima |
| `coverage` | Coverage | Ubwishingizi | Couverture | Bima |
| `policy_number` | Policy Number | Nimero y'Ubwishingizi | Numéro de police | Nambari ya Bima |

However, as noted in the Internationalization module documentation, `i18n.ts` is not wired into any UI component. These translations are defined but not used.

---

## Dependencies

| Package | Purpose |
|---|---|
| `@supabase/ssr` | Server-side Supabase client for authenticated database access |
| `@supabase/supabase-js` | Supabase JS client |
| `next` | Next.js App Router (`NextRequest`, `NextResponse`) |
| `react` | React hooks (`useState`) used in the Template Designer page |
| `lucide-react` | Icons in the Template Designer UI (`FileText`, `Eye`, `Type`, etc.) |
| `@/components/ui/*` | shadcn/ui components (`Card`, `Button`, `Input`, `Label`) used in the Template Designer |
