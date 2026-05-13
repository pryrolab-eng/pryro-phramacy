# Staff Management Module

## Purpose

The Staff Management module allows a `pharmacy_owner` (or `superadmin`) to manage the human resources of their pharmacy tenant. It covers the full lifecycle of a staff member: creating a Supabase Auth account, assigning a role, viewing the staff roster, editing profile details, toggling active/inactive status, and deleting a member.

Staff accounts are not self-registered — they are provisioned by the pharmacy owner and given credentials to share with the employee. The module is scoped strictly to the current pharmacy; a user can only see and manage staff belonging to their own `pharmacy_id`.

---

## Key Files

### Page (`src/app/(dashboard)/staff/`)

| File | Route | Description |
|---|---|---|
| `page.tsx` | `/staff` | Client component. Renders the staff roster as a card grid. Provides dialogs for adding a new pharmacist, editing an existing member, and confirming deletion. Calls `/api/staff` (GET) for the roster and `/api/pharmacist` (POST) for creation. |

### API Routes

| File | Route | Methods | Description |
|---|---|---|---|
| `src/app/api/staff/route.ts` | `/api/staff` | `GET`, `POST` | `GET` returns the active staff roster for the caller's pharmacy, enriched with display names and emails from `auth.users` via the Admin API. `POST` is a stub that redirects callers to `/api/pharmacist`. |
| `src/app/api/staff/[id]/route.ts` | `/api/staff/:id` | `PUT`, `DELETE` | `PUT` updates name, phone, and role for a staff member; optionally resets their password via the Admin API. `DELETE` removes the `pharmacy_users` record (does **not** delete the Supabase Auth user). |
| `src/app/api/pharmacist/route.ts` | `/api/pharmacist` | `POST` | Creates a new Supabase Auth user (`email_confirm: true`, no email sent) and inserts a `pharmacy_users` record with the specified role. This is the actual staff-creation endpoint. |

### Supabase Utilities

| File | Description |
|---|---|
| `supabase/server.ts` | Server-side Supabase client (anon key). Used in `GET /api/staff` to resolve the caller's `pharmacy_id`. |
| `supabase/client.ts` | Browser-side Supabase client. Used in `page.tsx` to resolve the current user's `pharmacy_id` before submitting the add-staff form. |

---

## API Endpoint Reference

### `GET /api/staff`

Returns the active staff roster for the authenticated user's pharmacy.

**Authentication:** Required (session cookie). Uses the anon-key client to resolve `pharmacy_id`, then switches to the service-role client to call `auth.admin.getUserById` for each member.

**Response (200):**
```json
[
  {
    "id": "<pharmacy_users.id>",
    "name": "Jane Pharmacist",
    "email": "jane@example.com",
    "phone": "+250788123457",
    "role": "pharmacist",
    "status": "active",
    "joinDate": "1/15/2024"
  }
]
```

**Error responses:**
- `401 Unauthorized` — no valid session
- `403 Forbidden` — no `pharmacy_users` record for the caller
- `500 Internal Server Error` — database or Admin API failure

**Note:** Only records where `is_active = true` are returned. Inactive staff are not shown in the UI.

---

### `POST /api/pharmacist`

Creates a new staff member (Supabase Auth user + `pharmacy_users` record).

**Authentication:** Uses the service-role key directly (no session check). The caller must supply `pharmacy_id` in the request body.

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "secret123",
  "full_name": "Jane Pharmacist",
  "phone": "+250788123457",
  "role": "pharmacist",
  "pharmacy_id": "<uuid>"
}
```

**Behaviour:**
1. Calls `supabase.auth.admin.createUser` with `email_confirm: true` — the account is immediately usable without an email confirmation step.
2. Inserts a row into `pharmacy_users` linking the new `auth.users.id` to the supplied `pharmacy_id` with the given role.

**Response (200):**
```json
{ "success": true, "message": "Pharmacist created successfully", "userId": "<uuid>" }
```

**Error responses:**
- `400 Bad Request` — `pharmacy_id` missing
- `500 Internal Server Error` — duplicate email, weak password, or database error

---

### `PUT /api/staff/:id`

Updates a staff member's profile and optionally resets their password.

**Authentication:** Uses the anon-key server client (session required). The `:id` parameter is the `pharmacy_users.id` (not `auth.users.id`).

**Request body:**
```json
{
  "name": "Jane Updated",
  "email": "jane@example.com",
  "phone": "+250788000000",
  "role": "cashier",
  "password": "newpassword"
}
```

**Behaviour:**
1. Updates `name`, `full_name`, and `phone` in the `users` table (application profile table).
2. Updates `role` in `pharmacy_users` where `user_id = :id`.
3. If `password` is non-empty, calls `supabase.auth.admin.updateUserById` to reset the password.

**Known issue:** The `:id` parameter is used as both `pharmacy_users.id` (for the role update) and as `users.id` (for the profile update). These are different UUIDs — `pharmacy_users.id` is the record's own primary key, while `users.id` is the auth user's UUID. This mismatch means the `users` table update will silently fail for most records. See Known Limitations §1.

**Response (200):**
```json
{ "success": true }
```

---

### `DELETE /api/staff/:id`

Removes a staff member from the pharmacy by deleting their `pharmacy_users` record.

**Authentication:** Uses the service-role key directly (no session check on the route itself).

**Behaviour:** Deletes the row from `pharmacy_users` where `id = :id`. The corresponding `auth.users` record is **not** deleted — the user's Supabase Auth account remains active and could be re-added to a pharmacy.

**Response (200):**
```json
{ "success": true }
```

---

## Database Tables

### `pharmacy_users`

The primary table for staff management. Each row represents one user's membership in one pharmacy with a specific role.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key (used as the staff record identifier in the UI) |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `user_id` | `uuid` | Foreign key → `auth.users.id` (CASCADE DELETE) |
| `role` | `user_role` enum | One of: `admin`, `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |
| `is_active` | `boolean` | Whether the user's access is currently active (default `true`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

**Unique constraint:** `(pharmacy_id, user_id)` — a user can only hold one role per pharmacy.

**`user_role` enum values** (defined in `20240322000001_pharmacy_management_schema.sql`):
```sql
CREATE TYPE user_role AS ENUM ('admin', 'pharmacy_owner', 'pharmacist', 'cashier', 'staff');
```

Note: `superadmin` is not part of this enum. Superadmin access is determined by a separate check in the dashboard layout (`users.role = 'superadmin'`).

---

### `staff`

A secondary HR-oriented table defined in `20241201000015_missing_tables.sql`. It stores richer employee data (employee ID, department, salary, hire date) and is described in the migration as extending `pharmacy_users`.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` (CASCADE DELETE) |
| `user_id` | `uuid` | Foreign key → `auth.users.id` (CASCADE DELETE) |
| `employee_id` | `text` | Optional human-readable employee identifier |
| `first_name` | `text` | First name (required) |
| `last_name` | `text` | Last name (required) |
| `email` | `text` | Contact email |
| `phone` | `text` | Contact phone |
| `position` | `text` | Job title / position |
| `department` | `text` | Department name |
| `hire_date` | `date` | Date of hire (default: current date) |
| `salary` | `decimal(10,2)` | Monthly salary |
| `is_active` | `boolean` | Active status (default `true`) |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

**Important:** The `staff` table is **not used** by any current API route or UI component. All staff management operations read from and write to `pharmacy_users` only. The `staff` table exists in the schema but is effectively dead code. See Known Limitations §2.

---

## Role Access

### Who can access `/staff`

The `/staff` route is listed as a protected path in `supabase/middleware.ts`. Any authenticated user is redirected to `/sign-in` if they lack a session. However, there is **no role-based guard** on the route itself — any authenticated user with a valid session can navigate to `/staff`.

In practice, the sidebar navigation controls visibility: only the `PharmacySidebar` (rendered for `pharmacy_owner`, `cashier`, and `staff` roles) includes a link to `/staff`. The `SuperadminSidebar` and `PharmacistSidebar` do not.

### RLS policies on `pharmacy_users`

Two RLS policies govern the `pharmacy_users` table (defined in `20240322000005_rls_policies.sql`):

| Policy | Operation | Condition |
|---|---|---|
| `Users can view pharmacy staff` | `SELECT` | `pharmacy_id = ANY(get_user_pharmacy_ids())` OR `user_id = auth.uid()` OR `is_admin()` |
| `Pharmacy owners and admins can manage staff` | `ALL` (INSERT, UPDATE, DELETE) | `pharmacy_id IN (SELECT id FROM pharmacies WHERE owner_id = auth.uid())` OR `is_admin()` |

The `GET /api/staff` route bypasses these policies by using the **service-role key**, which has unrestricted access. The route manually enforces tenant isolation by filtering on `pharmacy_id` from the caller's `pharmacy_users` record.

The `DELETE /api/staff/:id` route also uses the service-role key with no session verification, meaning any request with knowledge of a `pharmacy_users.id` can delete that record. See Known Limitations §3.

### Intended role access summary

| Role | Can view staff list | Can add staff | Can edit staff | Can delete staff |
|---|---|---|---|---|
| `superadmin` | ✅ (via service role) | ✅ | ✅ | ✅ |
| `pharmacy_owner` | ✅ | ✅ | ✅ | ✅ |
| `pharmacist` | ✅ (sidebar hidden) | ✅ (no UI guard) | ✅ (no UI guard) | ✅ (no UI guard) |
| `cashier` | ✅ (sidebar visible) | ✅ (no UI guard) | ✅ (no UI guard) | ✅ (no UI guard) |
| `staff` | ✅ (sidebar visible) | ✅ (no UI guard) | ✅ (no UI guard) | ✅ (no UI guard) |

---

## Features

### View Staff Roster

`GET /api/staff` returns all `pharmacy_users` records where `is_active = true` for the caller's pharmacy. For each record, the route calls `auth.admin.getUserById` to retrieve the display name and email from `auth.users.user_metadata`. The UI renders each member as a card showing name, role badge, email, phone, and join date.

**Fallback behaviour:** If the API call fails, `page.tsx` falls back to two hardcoded mock staff members (`pharmacist@test.com`, `cashier@test.com`). This means the UI will never show an empty state or an error — it silently displays stale test data on failure.

### Add Staff Member (Invite)

The "Add Staff Member" button opens a dialog that collects full name, email, phone, and password. The role is hardcoded to `pharmacist` in the form state and in the API call — the role selector visible in the form's JSX is present but its `onChange` handler updates `newStaff.role`, which is then ignored; the POST body always sends `role: 'pharmacist'`.

On success, the UI displays an `alert()` containing the new account's email and password in plaintext so the owner can share them with the employee. There is no email delivery mechanism.

### Edit Staff Member

The "Edit" button opens a dialog pre-populated with the member's current name, email, phone, and role. The role selector allows changing to `pharmacist`, `cashier`, or `staff`. An optional password field allows resetting the account password.

On save, `PUT /api/staff/:id` is called. Due to the ID mismatch bug (see Known Limitations §1), the `users` table update will silently fail, but the role update in `pharmacy_users` will succeed if the `user_id` matches.

### Activate / Deactivate Staff

The "Deactivate" / "Activate" toggle button calls `toggleStaffStatus` in the client component. This function **only updates local React state** — it does not call any API endpoint or modify `pharmacy_users.is_active` in the database. The status change is lost on page refresh.

### Delete Staff Member

The "Delete" button shows a browser `confirm()` dialog. On confirmation, `DELETE /api/staff/:id` removes the `pharmacy_users` record. The `auth.users` account is preserved.

---

## Data Flow

```
pharmacy_owner opens /staff
        │
        ▼
page.tsx mounts → fetchUserPharmacy() + fetchStaff() run in parallel
        │
        ├─ fetchUserPharmacy()
        │     supabase (browser client) → pharmacy_users WHERE user_id = auth.uid()
        │     stores pharmacy_id in component state (used for add-staff form)
        │
        └─ fetchStaff()
              GET /api/staff
                    │
                    ├─ createServerClient() → auth.getUser() → verify session
                    ├─ pharmacy_users WHERE user_id = caller → get pharmacy_id
                    ├─ service role client → pharmacy_users WHERE pharmacy_id = ? AND is_active = true
                    └─ for each record: auth.admin.getUserById(user_id) → get name + email
              │
              └─ render staff cards

Add Staff:
        pharmacy_owner fills form → POST /api/pharmacist
                │
                ├─ auth.admin.createUser(email, password, metadata)
                └─ pharmacy_users INSERT (pharmacy_id, user_id, role)

Edit Staff:
        pharmacy_owner edits form → PUT /api/staff/:id
                │
                ├─ users UPDATE (name, phone) WHERE id = :id   ← bug: wrong id type
                ├─ pharmacy_users UPDATE (role) WHERE user_id = :id
                └─ [optional] auth.admin.updateUserById(:id, { password })

Delete Staff:
        pharmacy_owner confirms → DELETE /api/staff/:id
                │
                └─ pharmacy_users DELETE WHERE id = :id
```

---

## Known Limitations

### 1. ID mismatch in `PUT /api/staff/:id`

The `:id` URL parameter is `pharmacy_users.id` (the record's own UUID), but the `PUT` handler uses it as `users.id` when updating the `users` table (`WHERE id = :id`). These are different UUIDs. The `users` table update will silently fail (no matching row) for every staff member. Only the `pharmacy_users.role` update succeeds, because it correctly uses `WHERE user_id = :id` — but this also uses `pharmacy_users.id` as if it were `auth.users.id`, which is equally incorrect. In practice, role updates may silently no-op unless the IDs happen to collide.

**Fix:** The route should accept `pharmacy_users.id`, look up the corresponding `user_id`, and use that UUID for all `auth.users`-related operations.

### 2. `staff` table is unused

The `staff` table (defined in `20241201000015_missing_tables.sql`) provides richer HR fields (employee ID, department, salary, hire date) but is not read or written by any API route or UI component. All staff operations use `pharmacy_users` exclusively. The `staff` table is dead schema.

### 3. `DELETE /api/staff/:id` has no authentication check

The delete route uses the service-role key and does not verify the caller's session or confirm that the record belongs to the caller's pharmacy. Any request with a known `pharmacy_users.id` can delete that record without authentication.

### 4. Activate/Deactivate is client-side only

`toggleStaffStatus` in `page.tsx` updates React state but does not persist the change to the database. Deactivating a staff member has no effect on their ability to log in or access the system. The `pharmacy_users.is_active` column is never updated by this action.

### 5. Staff creation role is hardcoded to `pharmacist`

The "Add Staff Member" dialog includes a role field in the form state (`newStaff.role`) but the POST body always sends `role: 'pharmacist'` regardless of what the user selects. It is not possible to create a `cashier` or `staff` role member through this UI.

### 6. Credentials displayed in plaintext via `alert()`

After creating a staff member, the generated password is shown in a browser `alert()` dialog. There is no email delivery, no secure credential handoff, and no way to retrieve the password later. If the owner dismisses the alert without copying the credentials, they must reset the password manually.

### 7. Error state falls back to mock data

If `GET /api/staff` fails (network error, 401, 500), the UI silently renders two hardcoded test accounts (`pharmacist@test.com`, `cashier@test.com`) instead of showing an error. This masks API failures and could confuse pharmacy owners who see test data instead of their real staff.

### 8. No pagination or search

The staff roster renders all active members in a single grid with no search, filter, or pagination. For pharmacies with large staff counts this will become unwieldy.

### 9. `POST /api/staff` is a non-functional stub

`POST /api/staff` always returns `400 { error: 'Use /api/pharmacist to create staff' }`. The route exists but serves no purpose. It should either be removed or consolidated with `/api/pharmacist`.

### 10. No role guard on the `/staff` route

Any authenticated user (including `pharmacist`, `cashier`, and `staff` roles) can navigate directly to `/staff` and perform all management actions. The sidebar hides the link for `pharmacist` users, but there is no server-side enforcement preventing lower-privilege roles from adding, editing, or deleting staff members.
