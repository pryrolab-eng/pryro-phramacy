# Patients & Prescriptions Module

## Purpose

The Patients & Prescriptions module covers two closely related but distinct concerns in Pryrox:

1. **Patients** — A read-only view of customer records that surfaces patient-specific information (allergies, medical conditions, insurance) for pharmacy staff. There is no separate `patients` database table; the `/patients` page reads from the `customers` table via `/api/customers`.

2. **Prescriptions** — A full CRUD workflow for managing prescription records: creation, status progression (`pending` → `completed` → `dispensed`), and deletion. Prescriptions are stored in a dedicated `prescriptions` table and are accessible to both pharmacists (via the Pharmacist Dashboard and `/prescriptions` page) and pharmacy owners (via the pharmacy sidebar).

Together these two areas support the clinical side of pharmacy operations: receiving a doctor's prescription, verifying it, preparing the medications, and dispensing them to the patient.

---

## Key Files

### Pages (`src/app/(dashboard)/`)

| File | Route | Description |
|---|---|---|
| `prescriptions/page.tsx` | `/prescriptions` | Full prescription management page. Lists all prescriptions with status/priority badges, search and filter controls, inline status-transition buttons (Process → Dispense), a "New Prescription" dialog, and an Analytics tab with bar and pie charts. Client component; fetches from `/api/prescriptions`. Falls back to hardcoded mock data if the API call fails. |
| `patients/page.tsx` | `/patients` | Patient records view. Displays a list of customers with name, phone, email, status badge, and last-visit date. Fetches from `/api/customers` (not a dedicated patients API). Includes summary stat cards (Total, Active, New This Month). The "Add Patient" button renders but has no `onClick` handler — it is non-functional. |

### API Routes (`src/app/api/prescriptions/`)

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/prescriptions` | `GET` | Yes (session cookie) | Returns all prescriptions for the authenticated user's pharmacy, ordered by `created_at` descending. Formats the response to match the frontend `Prescription` interface (maps `patient_name` → `patient`, `doctor_name` → `doctor`, etc.). |
| `/api/prescriptions` | `POST` | Yes (session cookie) | Creates a new prescription. Accepts `patient`, `doctor`, `medications` (array), `priority`, `insurance`, and `notes`. Sets `status` to `'pending'` on creation. **Bug:** `pharmacy_id` is hardcoded to the string `'userPharmacy.pharmacy_id'` instead of the authenticated user's actual pharmacy ID — new prescriptions are not tenant-isolated. |
| `/api/prescriptions/[id]` | `PUT` | Yes (session cookie) | Updates any field on a prescription by ID. Used by the UI to advance status (`pending` → `completed` → `dispensed`). Also accepts full field updates (patient, doctor, medications, priority, insurance, notes). |
| `/api/prescriptions/[id]` | `DELETE` | Yes (session cookie) | Deletes a prescription by ID. No soft-delete; the row is permanently removed. |

### Pharmacist-Specific API Routes (`src/app/api/pharmacist/prescriptions/`)

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/pharmacist/prescriptions` | `GET` | Yes (session cookie) | Returns only `pending` prescriptions, ordered by `priority` descending then `created_at` ascending (highest-priority, oldest-first). Used by the Pharmacist Dashboard's "Pending Prescriptions" tab. |
| `/api/pharmacist/prescriptions` | `POST` | Yes (session cookie) | Handles two prescription workflow actions: `start` (inserts a row into `prescription_processing` to track when processing began) and `dispense` (marks `prescription_processing.completed_at` and sets `prescriptions.status = 'dispensed'`). **Note:** The `prescription_processing` table is referenced here but has no migration file — it may not exist in the database. |

### Patient-Related API Routes

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/customers` | `GET` | Yes (session cookie) | Used by the `/patients` page to fetch patient records. Returns full customer profiles when no search query is provided. Returns a slim `{ id, name, phone, insurance_number }` projection when a `?q=` search parameter is present (used by POS autocomplete). |
| `/api/customers` | `POST` | Yes (session cookie) | Creates a new customer/patient record. Accepts `name`, `phone`, `email`, and `insurance`/`insuranceNumber`. |
| `/api/pos/quick-add-patient` | `POST` | Yes (session cookie) | Convenience endpoint used by the POS to add a patient inline during a sale. Inserts into `customers` with `name`, `phone`, and `insurance_number`. |

### Hooks and Utilities

| File | Description |
|---|---|
| `src/hooks/useRealtimeUpdates.ts` | Used by the Pharmacist Dashboard to subscribe to Supabase Realtime events. When a `new_sale` or `inventory_update` event fires, the dashboard re-fetches prescription and stock data. The `prescriptions` table is enrolled in `supabase_realtime` publication (see migration). |
| `src/hooks/usePharmacyStore.ts` | Zustand store used by the Pharmacist Dashboard. Holds `inventory`, `sales`, and `alerts` state. Not directly used by the prescriptions page. |

---

## Database Tables

### `prescriptions`

Defined in `supabase/migrations/20241201000014_prescriptions_table.sql`.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `pharmacy_id` | `uuid` | Yes | Foreign key → `pharmacies.id` (CASCADE DELETE). Scopes the prescription to a tenant. |
| `patient_name` | `text` | No | Free-text patient name (not a foreign key to `customers`) |
| `doctor_name` | `text` | No | Free-text prescribing doctor name |
| `medications` | `text[]` | No | Array of medication strings (e.g., `['Amoxicillin 500mg', 'Paracetamol 500mg']`) |
| `priority` | `prescription_priority` | Yes | Enum: `low`, `medium`, `high`, `urgent`. Default: `medium` |
| `status` | `prescription_status` | Yes | Enum: `pending`, `dispensed`, `completed`, `cancelled`. Default: `pending` |
| `insurance_provider` | `text` | Yes | Free-text insurance provider name (e.g., `'RSSB'`, `'MMI'`, `'None'`) |
| `notes` | `text` | Yes | Optional clinical notes |
| `created_at` | `timestamptz` | No | Record creation timestamp |
| `updated_at` | `timestamptz` | No | Auto-updated by trigger on every `UPDATE` |

**Enum types:**
- `prescription_status`: `pending`, `dispensed`, `completed`, `cancelled`
- `prescription_priority`: `low`, `medium`, `high`, `urgent`

**Indexes:** `idx_prescriptions_pharmacy_id`, `idx_prescriptions_status`, `idx_prescriptions_priority`

**Realtime:** The table is enrolled in `supabase_realtime` publication, enabling live updates on the Pharmacist Dashboard.

**RLS:** No explicit RLS policies are defined in the migration. The API routes use the anon-key client (`createClient()`), so access is controlled by the session cookie. There is no row-level tenant isolation enforced at the database layer for this table.

---

### `customers` (used as the patients data source)

Defined in `supabase/migrations/20240322000004_saas_extensions.sql` and extended in `supabase/migrations/20241201000015_missing_tables.sql`.

The `/patients` page and `/api/pos/quick-add-patient` route treat `customers` as the patient registry. There is no separate `patients` table.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | Primary key |
| `pharmacy_id` | `uuid` | Yes | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `name` | `text` | No | Patient/customer full name |
| `phone` | `text` | Yes | Phone number |
| `email` | `text` | Yes | Email address |
| `date_of_birth` | `date` | Yes | Date of birth |
| `gender` | `text` | Yes | Gender |
| `address` | `text` | Yes | Physical address |
| `insurance_provider_id` | `uuid` | Yes | Foreign key → `insurance_providers.id` |
| `insurance_number` | `text` | Yes | Insurance membership number (e.g., `'RSSB-123456789'`) |
| `allergies` | `text[]` | Yes | Array of known allergens |
| `medical_conditions` | `text[]` | Yes | Array of chronic conditions |
| `emergency_contact_name` | `text` | Yes | Emergency contact name |
| `emergency_contact_phone` | `text` | Yes | Emergency contact phone |
| `is_active` | `boolean` | No | Whether the record is active. Default: `true` |
| `created_at` | `timestamptz` | No | Record creation timestamp |
| `updated_at` | `timestamptz` | No | Auto-updated by trigger |

**Indexes:** `idx_customers_pharmacy_id`, `idx_customers_phone`

---

### `prescription_processing` (referenced but not migrated)

The `/api/pharmacist/prescriptions` `POST` handler references a `prescription_processing` table to track when a pharmacist starts and finishes processing a prescription. No migration file for this table exists in `supabase/migrations/`. Calls to `start` and `dispense` actions will fail with a Supabase error if the table does not exist.

---

## User Roles and Access

### Prescriptions (`/prescriptions`)

| Role | Access | Notes |
|---|---|---|
| `pharmacist` | ✅ Full access | Listed in `PharmacistSidebar` and `pharmacistNavigation` in `sidebar.tsx`. Primary user of this page. |
| `pharmacy_owner` | ⚠️ Route accessible, not in sidebar | The route is not blocked by middleware or the dashboard layout for pharmacy owners. However, `/prescriptions` does not appear in `PharmacySidebar` navigation — owners must navigate directly. |
| `cashier` / `staff` | ⚠️ Route accessible, not in sidebar | Same as pharmacy owner — no sidebar link, but the route is not protected against these roles. |
| `superadmin` | ❌ Not applicable | Superadmin operates at the platform level and has no pharmacy context. |

### Patients (`/patients`)

| Role | Access | Notes |
|---|---|---|
| `pharmacy_owner` | ✅ Full access | Listed in `PharmacySidebar` navigation. |
| `cashier` / `staff` | ⚠️ Route accessible, not in sidebar | No sidebar link, but the route is not blocked. |
| `pharmacist` | ⚠️ Route accessible, not in sidebar | Not listed in `PharmacistSidebar`. Pharmacists access patient data through the Customers page (`/customers`) instead. |
| `superadmin` | ❌ Not applicable | No pharmacy context. |

---

## Features

### Prescription Creation

A pharmacist or authorized user opens the "New Prescription" dialog from the `/prescriptions` page header. The form collects:

- **Patient Name** — free-text input
- **Doctor** — free-text input
- **Medications** — comma-separated text, split into an array on submission
- **Priority** — dropdown: High / Medium / Low
- **Insurance** — dropdown: RSSB / MMI / Radiant / None

On submit, the form calls `POST /api/prescriptions`. The new prescription is created with `status: 'pending'` and the page re-fetches the full list.

### Status Workflow

Prescriptions follow a linear three-step workflow:

```
pending  ──►  completed  ──►  dispensed
```

| Status | Meaning | Triggered By |
|---|---|---|
| `pending` | Prescription received, awaiting pharmacist review | Set on creation |
| `completed` | Pharmacist has verified and prepared the medications | "Process" / "Complete" button in UI → `PUT /api/prescriptions/[id]` with `{ status: 'completed' }` |
| `dispensed` | Medications handed to the patient | "Dispense" button in UI → `PUT /api/prescriptions/[id]` with `{ status: 'dispensed' }` |

The `cancelled` status exists in the database enum but is not exposed in the UI — there is no cancel button or workflow.

The Pharmacist Dashboard (`/pharmacist-dashboard`) provides an alternative workflow via `/api/pharmacist/prescriptions`:
- **Start** — records the processing start time in `prescription_processing`
- **Dispense** — marks `prescription_processing.completed_at` and sets `prescriptions.status = 'dispensed'`

### Search and Filtering

The `/prescriptions` page "All Prescriptions" tab provides:
- **Text search** — filters by patient name, doctor name, or any medication string (client-side, case-insensitive)
- **Status filter** — dropdown to show All / Pending / Completed / Dispensed

Filtering is performed entirely client-side on the already-fetched prescription list.

### Analytics Tab

The `/prescriptions` page includes an Analytics tab with two charts (both use hardcoded static data, not live database queries):

- **Prescription Trends** — bar chart showing daily prescription volume (Mon–Sun), hardcoded to values between 10 and 20
- **Status Distribution** — donut pie chart showing the live count of pending / completed / dispensed prescriptions from the fetched list

### Patient Records View

The `/patients` page provides a searchable list of customer records with:
- Summary stat cards: Total Patients, Active Patients, New This Month
- Search by name or phone number (client-side)
- Per-record display: name, phone, email, status badge, last-visit date

"New This Month" is calculated by comparing `lastVisit` (mapped from `customers.created_at`) to the current month — this is not a true "new patient" count.

### Realtime Updates

The `prescriptions` table is enrolled in the Supabase Realtime publication. The Pharmacist Dashboard subscribes to realtime events via `useRealtimeUpdates`. When a `new_sale` event fires, the dashboard re-fetches pending prescriptions and stats. Direct prescription table change events are not explicitly handled — the hook triggers on sale events, not prescription mutations.

---

## Data Flow

### Creating a Prescription

```
User fills "New Prescription" dialog
        │
        ▼
handleAddPrescription() (prescriptions/page.tsx)
        │  POST /api/prescriptions
        │  { patient, doctor, medications: string[], priority, insurance }
        ▼
/api/prescriptions route.ts (POST)
        │
        ├─ createClient() → session-based Supabase client
        ├─ supabase.from('prescriptions').insert({
        │    pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',  ← BUG
        │    patient_name, doctor_name, medications, priority,
        │    status: 'pending', insurance_provider, notes
        │  })
        └─ Returns { success: true, prescription }
        │
        ▼
fetchPrescriptions() re-fetches full list
```

### Advancing Prescription Status

```
User clicks "Process" (pending → completed) or "Dispense" (completed → dispensed)
        │
        ▼
updatePrescriptionStatus(id, newStatus) (prescriptions/page.tsx)
        │  PUT /api/prescriptions/[id]
        │  { status: 'completed' | 'dispensed' }
        ▼
/api/prescriptions/[id] route.ts (PUT)
        │
        ├─ supabase.from('prescriptions').update({ status }).eq('id', id)
        └─ Returns { success: true, prescription }
        │
        ▼
fetchPrescriptions() re-fetches full list
```

### Fetching Patients

```
/patients page mounts
        │
        ▼
fetchPatients() (patients/page.tsx)
        │  GET /api/customers  (no query param → full list)
        ▼
/api/customers route.ts (GET)
        │
        ├─ supabase.auth.getUser() → verify session
        ├─ pharmacy_users → resolve pharmacy_id
        ├─ customers.select('*').eq('pharmacy_id', ...)
        └─ Returns formatted array:
             { id, name, phone, email, dateOfBirth, allergies,
               insurance, totalPurchases, lastVisit, status }
        │
        ▼
setPatients(data) → renders patient list
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `recharts` | Bar chart (prescription trends) and pie chart (status distribution) on the Analytics tab |
| `@/components/ui/chart` | shadcn/ui `ChartContainer` and `ChartTooltip` wrappers around Recharts |
| `@/hooks/useRealtimeUpdates` | Supabase Realtime subscription used by the Pharmacist Dashboard |
| `@/hooks/usePharmacyStore` | Zustand store for shared inventory/sales/alerts state on the Pharmacist Dashboard |
| `@/components/ui/spinner` | Loading spinner shown while prescriptions are being fetched |

---

## Known Limitations

### 1. `pharmacy_id` hardcoded bug in `POST /api/prescriptions`

The prescription creation route contains a critical bug:

```typescript
pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
```

The fallback value is the **string literal** `'userPharmacy.pharmacy_id'` — not the authenticated user's pharmacy ID. If the client does not send `pharmacy_id` in the request body (and the UI does not), every new prescription is inserted with this invalid UUID string. The insert will fail with a foreign key constraint violation unless Supabase silently ignores the constraint. This means prescription creation is effectively broken for all users who do not manually supply a `pharmacy_id`.

**Fix:** Replace with a server-side lookup of the authenticated user's pharmacy:
```typescript
const { data: userPharmacy } = await supabase
  .from('pharmacy_users')
  .select('pharmacy_id')
  .eq('user_id', user.id)
  .single()
pharmacy_id: userPharmacy.pharmacy_id
```

### 2. No RLS on the `prescriptions` table

The `prescriptions` migration does not define any Row Level Security policies. All authenticated users with a valid session can read and modify any prescription row across all pharmacies. Tenant isolation relies entirely on the application layer filtering by `pharmacy_id`, which is not enforced in the `GET /api/prescriptions` route (it fetches all rows without a `pharmacy_id` filter).

### 3. `prescription_processing` table is missing

The `/api/pharmacist/prescriptions` `POST` handler references a `prescription_processing` table for the `start` and `dispense` actions. No migration creates this table. The `start` action will fail with a Supabase error, and the `dispense` action will also fail before it can update `prescriptions.status`.

### 4. No dedicated `patients` table

The `/patients` page is titled "Patient Management" and describes itself as managing "patient records, prescriptions, and medical information," but it reads from the `customers` table. There is no separate `patients` table. Clinical fields like `allergies`, `medical_conditions`, and `medical_history` exist on `customers` but are not displayed on the patients page. The "Add Patient" button has no `onClick` handler and does nothing.

### 5. Prescription analytics use hardcoded data

The "Prescription Trends" bar chart on the Analytics tab uses a hardcoded array of daily values (`[12, 15, 18, 14, 20, 16, 10]`). It does not query the database. The "Quick Stats" card on the Overview tab also shows hardcoded percentages (85% completion rate, 12 min average processing time, 67% insurance claims). These metrics are not computed from real data.

### 6. `cancelled` status is unreachable from the UI

The `prescription_status` enum includes `cancelled`, but no button, action, or API call in the UI sets a prescription to `cancelled`. Once a prescription is created, it can only progress forward (`pending` → `completed` → `dispensed`) or be deleted.

### 7. Fallback to mock data on API failure

If `GET /api/prescriptions` returns a non-OK response, the prescriptions page silently falls back to three hardcoded mock prescriptions (Alice Mukamana, Jean Baptiste, Grace Mukamana). This means a broken API or database connection will show stale demo data rather than an error message, making failures invisible to the user.

### 8. No pagination

Both the prescriptions list and the patients list load all records in a single query with no pagination or virtual scrolling. For pharmacies with large prescription histories, this will cause slow page loads and high memory usage.

### 9. `GET /api/prescriptions` fetches across all pharmacies

The collection endpoint does not filter by `pharmacy_id`:

```typescript
const { data: prescriptions, error } = await supabase
  .from('prescriptions')
  .select('*')
  .order('created_at', { ascending: false })
```

Without RLS policies and without an application-layer `pharmacy_id` filter, this returns prescriptions from all pharmacies to any authenticated user.

### 10. `lastVisit` on the patients page is derived from `created_at`

The `/api/customers` route maps `lastVisit` to `c.created_at?.split('T')[0]`, which is the record creation date, not the patient's most recent visit. The "New This Month" stat card on the patients page therefore counts customers created this month, not patients who visited this month.
