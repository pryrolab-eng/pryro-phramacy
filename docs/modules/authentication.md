# Authentication Module

## Purpose

Handles sign-in, sign-up, password reset, session management, optional Google OAuth, and TOTP two-factor authentication. Built on **native JWT cookies** (not Supabase GoTrue).

After login, users are routed via `/app` → `resolveAuthenticatedHomePath()` based on platform admin status and pharmacy membership.

---

## Key Files

### Pages (`src/app/(auth)/`)

| Route | Description |
|---|---|
| `/sign-in` | Email + password; `signInAction` server action |
| `/sign-up` | Registration; `signUpAction` → SMTP confirmation email |
| `/forgot-password` | `forgotPasswordAction` → recovery email |
| `/verify-email` | Post sign-up confirmation prompt |
| `/verify-2fa` | TOTP / backup code entry after sign-in |
| `/reset-password` | New password (native token or session) |
| `smtp-message.tsx` | SMTP setup note on auth forms |

### Server actions (`src/app/actions.ts`)

| Export | Description |
|---|---|
| `signInAction` | `nativeSignInWithPassword`; optional 2FA redirect to `/verify-2fa` |
| `signUpAction` | `adminCreateAuthUser` + confirmation email |
| `signOutAction` | Clears native session cookies → `/sign-in` |
| `forgotPasswordAction` | `sendNativePasswordRecoveryEmail` |
| `resetPasswordAction` | Token or session password update |
| `signInWithGoogleAction` | Redirect to `/api/auth/google` |

### API routes (`src/app/api/auth/`)

| Route | Description |
|---|---|
| `GET /api/auth/signout` | Clears session cookies |
| `POST /api/auth/verify-2fa` | Validates TOTP / backup code for pending session |
| `POST /api/auth/complete-2fa` | Establishes native session after 2FA |
| `GET /api/auth/home` | Post-login redirect path for `/app` |
| `GET /api/auth/google` | OAuth start |
| `GET /api/auth/google/callback` | OAuth callback |
| `POST /api/auth/change-password` | Logged-in password change |
| `POST /api/auth/recovery-email` | Password reset email |
| `POST /api/auth/confirm-email` | Email confirmation token |
| `POST /api/auth/refresh` | Silent access token refresh |

### Session & middleware

| File | Role |
|---|---|
| `src/lib/auth/get-auth-user.ts` | `getAuthUser()` — read session from cookies |
| `src/lib/middleware/update-session.ts` | JWT verify, protected paths, IP whitelist |
| `middleware.ts` | Delegates to `updateSession` |

### 2FA settings (`/api/settings/security/2fa/`)

| Route | Description |
|---|---|
| `GET/POST /` | Status / disable 2FA |
| `POST /setup` | Generate secret + QR |
| `POST /verify` | Enable 2FA after TOTP check |

---

## Database Tables

### `auth.users`

Credential store (email, `encrypted_password`, metadata). Managed by `src/lib/db/auth-credentials.ts` and `admin-users.ts`.

### `public.users`

Profile mirror: `full_name`, `is_platform_admin`, `two_factor_*`, `active_pharmacy_id`, `active_branch_id`.

### `pharmacy_users`

Tenant membership and role (`pharmacy_owner`, `pharmacist`, `cashier`, `staff`).

### `two_factor_sessions`

Pending 2FA during login (`session_token`, `verified`, `expires_at`).

### `app_sessions`

Refresh token rotation / revocation (`src/lib/db/two-factor-sessions-store.ts` and native session layer).

---

## Login Flow (email + password)

```
sign-in form → signInAction
  → nativeSignInWithPassword
  → if 2FA enabled: two_factor_sessions row + redirect /verify-2fa?session=…
  → else: establishNativeSession (cookies) + redirect /app
```

## 2FA completion

```
/verify-2fa → POST /api/auth/verify-2fa (TOTP ok)
           → POST /api/auth/complete-2fa
           → native session cookies set
           → redirect home
```

## Sign-out

Client: `signOutClient()` → `POST /api/auth/signout`  
Server action: `signOutAction` clears cookies directly.

---

## Environment

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Sign session JWTs (min 32 chars) |
| `NATIVE_AUTH_ENABLED` | Must be `true` |
| `SMTP_*` | Confirmation + reset emails |
| `GOOGLE_CLIENT_ID` / `SECRET` | Optional OAuth |

See [`docs/environment-variables.md`](../environment-variables.md).

---

## Related docs

- [`docs/architecture.md`](../architecture.md) — middleware and data flow
- [`docs/pharmacy-tenant-architecture.md`](../pharmacy-tenant-architecture.md) — active pharmacy after login
