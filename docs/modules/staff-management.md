> **Stack:** Prisma (`DATABASE_URL`) for data; native JWT auth (`getAuthUser()`, cookies `pryrox_session` / `pryrox_refresh`). SQL migrations live in `supabase/migrations/` (`npm run db:sql:push`).

# Staff Management Module

## Purpose

The Staff Management module allows users with the `staff.manage` permission (typically `pharmacy_owner`) to manage pharmacy team members. It covers roster listing, inviting new users (native auth account + email), assigning roles, editing profiles, toggling active status, and removing pharmacy membership.

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
| `src/app/api/staff/route.ts` | `/api/staff` | `GET`, `POST` | `GET`: `getAuthUser()` + `requirePharmacyPermission(staff.manage)` → `storeListPharmacyStaff(pharmacyId)`. `POST` returns 400 — use `/api/pharmacist`. |
| `src/app/api/staff/[id]/route.ts` | `/api/staff/:id` | `PUT`, `DELETE` | Session + permission. `PUT` updates profile/role via `storeUpdateStaffMember`; optional `adminUpdateAuthUserPassword`. `DELETE` removes `pharmacy_users` row only (auth user remains). |
| `src/app/api/pharmacist/route.ts` | `/api/pharmacist` | `POST` | Staff invite: `adminCreateAuthUser()` + `storeCreatePharmacyMembership()` + `sendStaffInviteEmail()`. Requires session, `staff.manage`, and `staff.invite` entitlement. |

### Auth & data access

| File | Description |
|---|---|
| `src/lib/auth/get-auth-user.ts` | Resolves JWT session in API routes. |
| `src/lib/auth/admin-users.ts` | `adminCreateAuthUser`, `adminUpdateAuthUserPassword` (Prisma `auth.users`). |
| `src/lib/db/staff-store.ts` | `storeListPharmacyStaff`, `storeUpdateStaffMember`, `storeDeletePharmacyUser`. |
| `src/lib/rbac/require-pharmacy-permission.ts` | `PHARMACY_PERMISSIONS.staffManage` gate. |

---

## API Endpoint Reference

### `GET /api/staff`

Returns the active staff roster for the authenticated user's pharmacy.

**Authentication:** Required. `getAuthUser()` + `requirePharmacyPermission(staff.manage)` + `requireUserPharmacyId()`. Staff rows joined to `auth.users` / profile fields in `storeListPharmacyStaff`.

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

Creates a new team member (native auth user + `pharmacy_users` membership + invite email).

**Authentication:** Session required. `requirePharmacyPermission(staff.manage)` and `requirePharmacyEntitlement(staff.invite, users)`. Caller supplies `pharmacy_id` (page sends active pharmacy from context).

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
1. `assertStaffInviteEmailAllowed` — rejects duplicate email for same pharmacy.
2. `adminCreateAuthUser()` with `must_change_password` metadata when a temporary password is generated.
3. `storeCreatePharmacyMembership()` links user to `pharmacy_id` with role.
4. `sendStaffInviteEmail()` with temporary password (SMTP).

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

**Authentication:** Session + `staff.manage`. `:id` is `pharmacy_users.id`. Handler resolves `member.user_id` for auth updates.

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
1. `storeFindPharmacyUser(pharmacyUserId)` — 404 if not in caller's pharmacy.
2. `storeUpdateStaffMember()` — profile, role, `is_active` from `status`.
3. Optional password reset via `adminUpdateAuthUserPassword` + `must_change_password` metadata.

**Response (200):**
```json
{ "success": true }
```

---

### `DELETE /api/staff/:id`

Removes a staff member from the pharmacy by deleting their `pharmacy_users` record.

**Authentication:** Session + `staff.manage`. Verifies membership belongs to caller's pharmacy.

**Behaviour:** `storeDeletePharmacyUser(pharmacyUserId)`. The `auth.users` row is **not** deleted — the account can be re-invited to another pharmacy.

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

The `/staff` route is listed as a protected path in `src/lib/middleware/update-session.ts`. Any authenticated user is redirected to `/sign-in` if they lack a session. However, there is **no role-based guard** on the route itself — any authenticated user with a valid session can navigate to `/staff`.

In practice, the sidebar navigation controls visibility: only the `PharmacySidebar` (rendered for `pharmacy_owner`, `cashier`, and `staff` roles) includes a link to `/staff`. The `SuperadminSidebar` and `PharmacistSidebar` do not.

### RLS policies on `pharmacy_users`

Two RLS policies govern the `pharmacy_users` table (defined in `20240322000005_rls_policies.sql`):

| Policy | Operation | Condition |
|---|---|---|
| `Users can view pharmacy staff` | `SELECT` | `pharmacy_id = ANY(get_user_pharmacy_ids())` OR `user_id = auth.uid()` OR `is_admin()` |
| `Pharmacy owners and admins can manage staff` | `ALL` (INSERT, UPDATE, DELETE) | `pharmacy_id IN (SELECT id FROM pharmacies WHERE owner_id = auth.uid())` OR `is_admin()` |

API routes use Prisma with `DATABASE_URL` (not RLS). Tenant isolation is enforced in application code: `requireUserPharmacyId` / `storeFindPharmacyUser` checks that `pharmacy_id` matches the caller's session pharmacy. DB RLS may still exist from migrations but is not relied on by these routes.

### Intended role access summary

| Role | Can view staff list | Can add staff | Can edit staff | Can delete staff |
|---|---|---|---|---|
| `superadmin` | ✅ (if `staff.manage` granted) | ✅ | ✅ | ✅ |
| `pharmacy_owner` | ✅ | ✅ | ✅ | ✅ |
| `pharmacist` | ✅ (sidebar hidden) | ✅ (no UI guard) | ✅ (no UI guard) | ✅ (no UI guard) |
| `cashier` | ✅ (sidebar visible) | ✅ (no UI guard) | ✅ (no UI guard) | ✅ (no UI guard) |
| `staff` | ✅ (sidebar visible) | ✅ (no UI guard) | ✅ (no UI guard) | ✅ (no UI guard) |

---

## Features

### View Staff Roster

`GET /api/staff` returns active members via `storeListPharmacyStaff(pharmacyId)` (joins profile / auth metadata). The UI renders each member as a card showing name, role badge, email, phone, and join date.

**Fallback behaviour:** If the API call fails, `page.tsx` falls back to two hardcoded mock staff members (`pharmacist@test.com`, `cashier@test.com`). This means the UI will never show an empty state or an error — it silently displays stale test data on failure.

### Add Staff Member (Invite)

The "Add Staff Member" button opens a dialog that collects full name, email, phone, and password. The role is hardcoded to `pharmacist` in the form state and in the API call — the role selector visible in the form's JSX is present but its `onChange` handler updates `newStaff.role`, which is then ignored; the POST body always sends `role: 'pharmacist'`.

On success, the API sends `sendStaffInviteEmail` (SMTP). The UI may still show credentials in an `alert()` as a fallback when email delivery fails.

### Edit Staff Member

The "Edit" button opens a dialog pre-populated with the member's current name, email, phone, and role. The role selector allows changing to `pharmacist`, `cashier`, or `staff`. An optional password field allows resetting the account password.

On save, `PUT /api/staff/:id` is called with `pharmacy_users.id`. The handler resolves `member.user_id` before profile and password updates.

### Activate / Deactivate Staff

The "Deactivate" / "Activate" toggle button calls `toggleStaffStatus` in the client component. This function **only updates local React state** — it does not call any API endpoint or modify `pharmacy_users.is_active` in the database. The status change is lost on page refresh.

### Delete Staff Member

The "Delete" button shows a browser `confirm()` dialog. On confirmation, `DELETE /api/staff/:id` removes the `pharmacy_users` record. The `auth.users` account is preserved.

---

## Data Flow

```
User opens /staff
        │
        ▼
page.tsx → active pharmacy from context + GET /api/staff
        │
        └─ GET /api/staff
              ├─ getAuthUser()
              ├─ requirePharmacyPermission(staff.manage)
              ├─ requireUserPharmacyId()
              └─ storeListPharmacyStaff(pharmacyId)
        │
        └─ render staff cards

Add Staff:
        POST /api/pharmacist
              ├─ getAuthUser() + staff.manage + staff.invite entitlement
              ├─ adminCreateAuthUser()
              ├─ storeCreatePharmacyMembership()
              └─ sendStaffInviteEmail()

Edit Staff:
        PUT /api/staff/:pharmacyUserId
              ├─ storeFindPharmacyUser → member.user_id
              ├─ storeUpdateStaffMember()
              └─ optional adminUpdateAuthUserPassword

Delete Staff:
        DELETE /api/staff/:pharmacyUserId
              ├─ session + pharmacy scope check
              └─ storeDeletePharmacyUser()
```

---

## Known Limitations

### 1. `staff` table is unused

The `staff` table (defined in `20241201000015_missing_tables.sql`) provides richer HR fields (employee ID, department, salary, hire date) but is not read or written by any API route or UI component. All staff operations use `pharmacy_users` exclusively. The `staff` table is dead schema.

### 2. Activate/Deactivate is client-side only

`toggleStaffStatus` in `page.tsx` updates React state but does not persist the change to the database. Deactivating a staff member has no effect on their ability to log in or access the system. The `pharmacy_users.is_active` column is never updated by this action.

### 3. Staff creation role is hardcoded to `pharmacist`

The "Add Staff Member" dialog includes a role field in the form state (`newStaff.role`) but the POST body always sends `role: 'pharmacist'` regardless of what the user selects. It is not possible to create a `cashier` or `staff` role member through this UI.

### 4. Credentials may appear in plaintext via `alert()`

After creating a staff member, the generated password is shown in a browser `alert()` dialog. There is no email delivery, no secure credential handoff, and no way to retrieve the password later. If the owner dismisses the alert without copying the credentials, they must reset the password manually.

### 5. Error state falls back to mock data

If `GET /api/staff` fails (network error, 401, 500), the UI silently renders two hardcoded test accounts (`pharmacist@test.com`, `cashier@test.com`) instead of showing an error. This masks API failures and could confuse pharmacy owners who see test data instead of their real staff.

### 6. No pagination or search

The staff roster renders all active members in a single grid with no search, filter, or pagination. For pharmacies with large staff counts this will become unwieldy.

### 7. `POST /api/staff` is a non-functional stub

`POST /api/staff` always returns `400 { error: 'Use /api/pharmacist to create staff' }`. The route exists but serves no purpose. It should either be removed or consolidated with `/api/pharmacist`.

### 8. No role guard on the `/staff` route

Any authenticated user (including `pharmacist`, `cashier`, and `staff` roles) can navigate directly to `/staff` and perform all management actions. The sidebar hides the link for `pharmacist` users, but there is no server-side enforcement preventing lower-privilege roles from adding, editing, or deleting staff members.
