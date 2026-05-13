# Authentication Module

## Purpose

The Authentication module handles all aspects of user identity in Pryrox: sign-in, sign-up, password reset, session management, and two-factor authentication (2FA). It is built on top of **Supabase Auth** (JWT-based, cookie-stored sessions) and extended with a custom TOTP 2FA layer using `otplib` and `qrcode`.

Authentication is the entry point for every user role in the system. After a successful login, the user is routed to `/dashboard`, where the dashboard layout reads the user's role from `pharmacy_users` and renders the appropriate sidebar and content.

---

## Key Files

### Pages (`src/app/(auth)/`)

| File | Route | Description |
|---|---|---|
| `sign-in/page.tsx` | `/sign-in` | Email + password login form. Delegates to `signInAction` server action. Displays role-specific error messages for missing pharmacy access. |
| `sign-up/page.tsx` | `/sign-up` | New user registration form (full name, email, password). Delegates to `signUpAction` server action. |
| `forgot-password/page.tsx` | `/forgot-password` | Password reset request form. Delegates to `forgotPasswordAction` server action. |
| `verify-2fa/page.tsx` | `/verify-2fa` | Client-side 2FA verification page. Reads a `?session=<token>` query parameter, accepts a 6-digit TOTP code or backup code, and calls the 2FA API routes to complete login. |
| `smtp-message.tsx` | — | Shared UI component displayed on sign-up and forgot-password pages noting Supabase's email rate limit and linking to SMTP configuration docs. |

### Server Actions (`src/app/actions.ts`)

| Export | Description |
|---|---|
| `signInAction` | Calls `supabase.auth.signInWithPassword`, checks for 2FA, creates a `two_factor_sessions` record and redirects to `/verify-2fa` if 2FA is enabled, otherwise redirects to `/dashboard`. Also auto-provisions `users` and `pharmacy_users` records for `@test.com` accounts. |
| `signOutAction` | Calls `supabase.auth.signOut` and redirects to `/sign-in`. |
| `signUpAction` | **Not implemented** — imported by `sign-up/page.tsx` but absent from `actions.ts`. Sign-up is non-functional. |
| `forgotPasswordAction` | **Not implemented** — imported by `forgot-password/page.tsx` but absent from `actions.ts`. Password reset is non-functional. |

### API Routes (`src/app/api/auth/`)

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | No | **Test-only stub.** Hardcoded user list; returns a mock JWT. Not connected to Supabase. Must be removed before production. |
| `/api/auth/signout` | `GET` | Yes | Calls `supabase.auth.signOut()` and redirects to `/sign-in`. |
| `/api/auth/verify-2fa` | `POST` | No (service role) | Validates a TOTP code or backup code against the `two_factor_sessions` and `users` tables. Marks the session as `verified = true` on success. |
| `/api/auth/complete-2fa` | `POST` | No (service role) | Confirms a verified 2FA session, retrieves the user, generates a Supabase magic-link OTP, and returns the token hash so the client can call `supabase.auth.verifyOtp` to establish a real session. |

### 2FA Management API Routes (`src/app/api/settings/security/2fa/`)

| Route | Method | Auth Required | Description |
|---|---|---|---|
| `/api/settings/security/2fa` | `GET` | Yes | Returns `{ enabled: boolean }` for the current user. |
| `/api/settings/security/2fa` | `POST` | Yes | Disables 2FA by clearing `two_factor_secret`, `two_factor_enabled`, and `two_factor_backup_codes`. |
| `/api/settings/security/2fa/setup` | `POST` | Yes | Generates a new TOTP secret, produces a QR code data URL, generates 10 backup codes, and stores the secret in `users`. Does **not** enable 2FA yet. |
| `/api/settings/security/2fa/verify` | `POST` | Yes | Verifies the TOTP code against the stored secret and sets `two_factor_enabled = true`. |

### Supabase Utilities (`supabase/`)

| File | Description |
|---|---|
| `supabase/client.ts` | Browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`. Used in client components (e.g., `verify-2fa/page.tsx`). |
| `supabase/server.ts` | Server-side Supabase client using `createServerClient` with cookie-based session management. Exports `createClient()` (anon key) and `createServiceClient()` (service role key). Used in server actions and API routes. |
| `supabase/middleware.ts` | `updateSession()` function called by `middleware.ts`. Refreshes the Supabase session on every request, enforces protected-path redirects, and clears stale refresh tokens. |

### Middleware (`middleware.ts`)

The root `middleware.ts` delegates entirely to `supabase/middleware.ts#updateSession`. It runs on every request except static assets.

**Protected paths** (redirect to `/sign-in` if unauthenticated):
`/dashboard`, `/superadmin`, `/pharmacy-dashboard`, `/pharmacist-dashboard`, `/inventory`, `/pos`, `/sales`, `/customers`, `/branches`, `/staff`, `/settings`, `/prescriptions`, `/admin`

**Auth paths** (redirect to `/dashboard` if already authenticated):
`/sign-in`, `/sign-up`, `/forgot-password`

**Unprotected paths** (no redirect applied):
`/verify-2fa`, `/auth/success`, `/auth/callback`, `/auth-success`, and all debug/test routes (see Known Limitations).

---

## Database Tables

### `auth.users` (Supabase-managed)

The canonical identity store managed by Supabase Auth. Contains email, hashed password, email confirmation status, and JWT metadata. Not directly modified by application code except through the Supabase Auth Admin API.

### `users` (application table)

Extends `auth.users` with application-level profile data and 2FA state.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key; matches `auth.users.id` |
| `email` | `text` | User's email address |
| `role` | `text` | Platform-level role (used for superadmin detection) |
| `two_factor_secret` | `text` | Base32-encoded TOTP secret (nullable; set during 2FA setup) |
| `two_factor_enabled` | `boolean` | Whether 2FA is active for this user (default `false`) |
| `two_factor_backup_codes` | `text[]` | Array of 10 single-use backup codes (nullable) |

### `pharmacy_users`

Maps Supabase auth users to pharmacies with a specific role. This is the primary table for role-based access control within a tenant.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | Foreign key → `pharmacies.id` |
| `user_id` | `uuid` | Foreign key → `auth.users.id` |
| `role` | `user_role` enum | `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |
| `is_active` | `boolean` | Whether the user's access is active |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

Unique constraint: `(pharmacy_id, user_id)` — a user can only have one role per pharmacy.

### `two_factor_sessions`

Tracks pending 2FA verifications during the login flow. Created by `signInAction` when a user with 2FA enabled logs in, and consumed by the `/api/auth/verify-2fa` and `/api/auth/complete-2fa` routes.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Foreign key → `auth.users.id` (CASCADE DELETE) |
| `session_token` | `text` | Unique random UUID used as the `?session=` query parameter |
| `verified` | `boolean` | Set to `true` after successful TOTP/backup-code verification |
| `expires_at` | `timestamptz` | 10 minutes after creation; enforced in `verify-2fa` route |
| `created_at` | `timestamptz` | Record creation timestamp |

**RLS policies:** Users can `SELECT`, `INSERT`, and `DELETE` their own rows (`auth.uid() = user_id`). The `verify-2fa` and `complete-2fa` API routes bypass RLS using the service role key.

**Indexes:** `idx_2fa_sessions_token` on `session_token`, `idx_2fa_sessions_user` on `user_id`.

---

## User Roles That Interact with Auth

All five roles go through the same sign-in flow. Role resolution happens **after** authentication:

| Role | How Role Is Determined | Post-Login Destination |
|---|---|---|
| `superadmin` | `pharmacy_users.role = 'superadmin'` or `users.role = 'superadmin'` | `/dashboard` → Superadmin sidebar |
| `pharmacy_owner` | `pharmacy_users.role = 'pharmacy_owner'` | `/dashboard` → Pharmacy sidebar |
| `pharmacist` | `pharmacy_users.role = 'pharmacist'` | `/dashboard` → Pharmacist sidebar |
| `cashier` | `pharmacy_users.role = 'cashier'` | `/dashboard` → Pharmacy sidebar |
| `staff` | `pharmacy_users.role = 'staff'` | `/dashboard` → Pharmacy sidebar |

The dashboard layout (`src/app/(dashboard)/layout.tsx`) reads `pharmacy_users.role` from the database and renders the appropriate sidebar. If no `pharmacy_users` record exists for the authenticated user, the sign-in action redirects to `/sign-in?error=no-pharmacy`.

---

## Authentication Flows

### Standard Sign-In Flow

```
User submits /sign-in form
        │
        ▼
signInAction (server action)
        │
        ├─ supabase.auth.signInWithPassword(email, password)
        │         │
        │         ├─ Error → redirect /sign-in?error=<message>
        │         └─ Success → session cookie set
        │
        ├─ Check users.two_factor_enabled
        │         │
        │         ├─ false → redirect /dashboard
        │         └─ true  → insert two_factor_sessions record
        │                     supabase.auth.signOut() (temporary)
        │                     redirect /verify-2fa?session=<token>
        │
        └─ (for @test.com accounts) auto-provision users + pharmacy_users records
```

### 2FA Setup Flow (Settings → Security)

```
User navigates to Settings → Security tab
        │
        ▼
POST /api/settings/security/2fa/setup
        │
        ├─ authenticator.generateSecret() (otplib)
        ├─ authenticator.keyuri(email, 'Pryrox Pharmacy', secret)
        ├─ QRCode.toDataURL(otpauthUrl) (qrcode)
        ├─ Generate 10 backup codes (crypto.randomBytes)
        └─ Store secret + backup codes in users table (two_factor_enabled still false)
        │
        ▼
User scans QR code with authenticator app
        │
        ▼
POST /api/settings/security/2fa/verify  { token: "123456" }
        │
        ├─ authenticator.verify({ token, secret }) (otplib)
        ├─ Valid → UPDATE users SET two_factor_enabled = true
        └─ Invalid → 400 "Invalid code"
```

### 2FA Login Verification Flow

```
User arrives at /verify-2fa?session=<token>
        │
        ▼
User enters 6-digit TOTP code (or backup code)
        │
        ▼
POST /api/auth/verify-2fa  { sessionToken, token }
        │
        ├─ Lookup two_factor_sessions WHERE session_token = ? AND verified = false
        ├─ Check expires_at > now()
        ├─ Lookup users.two_factor_secret + two_factor_backup_codes
        ├─ If backup code: remove used code from array
        ├─ If TOTP: authenticator.verify({ token, secret })
        ├─ Invalid → 400 "Invalid code"
        └─ Valid → UPDATE two_factor_sessions SET verified = true
        │
        ▼
POST /api/auth/complete-2fa  { sessionToken }
        │
        ├─ Confirm two_factor_sessions.verified = true
        ├─ supabase.auth.admin.getUserById(user_id)
        ├─ supabase.auth.admin.generateLink({ type: 'magiclink', email })
        └─ Return { token, type } from magic-link URL
        │
        ▼
Client: supabase.auth.verifyOtp({ token_hash, type })
        │
        └─ Session established → window.location.href = '/dashboard'
```

### Password Reset Flow

```
User submits /forgot-password form
        │
        ▼
forgotPasswordAction (server action)
        │
        └─ ⚠️ NOT IMPLEMENTED — action is imported but not exported from actions.ts
           The form submits but nothing happens.
```

### Sign-Out Flow

```
User triggers sign-out (sidebar button or /api/auth/signout)
        │
        ├─ Via server action: signOutAction → supabase.auth.signOut() → redirect /sign-in
        └─ Via API route: GET /api/auth/signout → supabase.auth.signOut() → redirect /sign-in
```

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/ssr` | — | Server-side Supabase client with cookie-based session management |
| `@supabase/supabase-js` | — | Supabase JS client (browser) |
| `otplib` | — | TOTP secret generation and code verification (RFC 6238) |
| `qrcode` | — | QR code image generation for 2FA setup |
| `@types/qrcode` | — | TypeScript types for qrcode |
| `crypto` | Node built-in | UUID generation for session tokens; backup code generation |

---

## Known Limitations

### 1. `signUpAction` and `forgotPasswordAction` are not implemented

Both actions are imported in their respective page components but are **not exported** from `src/app/actions.ts`. The sign-up and password reset forms are non-functional. Users cannot self-register or reset their passwords through the UI.

### 2. `/api/auth/login` is a hardcoded test stub

`src/app/api/auth/login/route.ts` contains a hardcoded array of test credentials (including the superadmin account `abdousentore@gmail.com` / `admin123`) and returns a mock JWT token. This route is not connected to Supabase and must be **removed before production deployment**.

### 3. Debug and test routes are unprotected

The middleware does not protect the following routes, which are accessible to unauthenticated users:
`/debug-auth`, `/debug-supabase`, `/debug-rate-limit`, `/quick-test`, `/test-auth`, `/test-create`, `/test-rls`, `/test-roles`, `/test-supabase`. These must be removed before production.

### 4. `two_factor_sessions` RLS gap

The `verify-2fa` and `complete-2fa` API routes use the **service role key** to bypass RLS when reading `two_factor_sessions`. This is necessary because the user is signed out during the 2FA verification window. However, it means these routes must be carefully guarded against session token enumeration attacks. The 10-minute expiry and UUID token format provide some protection, but there is no rate limiting on these endpoints.

### 5. No rate limiting on authentication endpoints

Neither the sign-in form nor the 2FA verification endpoints implement rate limiting. A brute-force attack against the 6-digit TOTP window (1,000,000 combinations) or backup codes is not mitigated at the application layer. Supabase's built-in auth rate limiting applies only to `signInWithPassword`, not to the custom 2FA routes.

### 6. `@test.com` auto-provisioning in production code

`signInAction` contains logic that auto-creates `users` and `pharmacy_users` records for any email containing `@test.com`, assigning them to a hardcoded pharmacy UUID (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`). This test scaffolding is present in production code and should be removed.

### 7. 2FA session cleanup

Expired `two_factor_sessions` records are never cleaned up. There is no scheduled job or trigger to delete rows where `expires_at < now()`. Over time this table will accumulate stale records.

### 8. Magic-link session restoration is fragile

The `complete-2fa` flow generates a Supabase magic-link OTP and extracts the token from the `action_link` URL. This relies on the internal structure of Supabase's `generateLink` response and may break across Supabase SDK versions. A more robust approach would use Supabase's native MFA API (`supabase.auth.mfa.*`).
