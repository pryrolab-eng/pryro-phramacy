# Architecture

> **Repository:** [pryrolab-eng/pryro-phramacy](https://github.com/pryrolab-eng/pryro-phramacy)
> **Platform:** Pryrox — Multi-Tenant Pharmacy Management SaaS

---

## Table of Contents

1. [System Overview](#system-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [User Roles and Access Scope](#user-roles-and-access-scope)
5. [Role-Based Routing](#role-based-routing)
   - [Layer 1 — `middleware.ts`](#layer-1--middlewarets)
   - [Layer 2 — `src/app/(dashboard)/layout.tsx`](#layer-2--srcappdashboardlayouttsx)
6. [Data Flow](#data-flow)
7. [Supabase Integration](#supabase-integration)
8. [KPay Payment Integration](#kpay-payment-integration)
9. [Client Factories](#client-factories)

---

## System Overview

Pryrox is a multi-tenant SaaS platform for pharmacy management. Each tenant (pharmacy) is isolated at the database level via Supabase Row-Level Security (RLS). The application is built on **Next.js 14 App Router**, which means pages can be React Server Components (RSC) or Client Components, and API endpoints are Next.js Route Handlers rather than a separate backend service.

Authentication is handled entirely by Supabase Auth (JWT-based sessions stored in HTTP-only cookies). Role resolution happens server-side on every dashboard request, ensuring that role-specific UI is never rendered on the client before authorization is confirmed.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│  Next.js 14 App Router (React Server + Client Components)       │
│  Tailwind CSS · shadcn/ui · Recharts · Framer Motion            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    Next.js Server (Vercel / Node)                │
│                                                                  │
│  middleware.ts ──► Session refresh (Supabase SSR)               │
│  src/app/api/**  ──► Route Handlers (REST-style API)            │
│  src/app/(dashboard)/** ──► Server + Client page components     │
│  src/app/(auth)/**  ──► Sign-in, Sign-up, 2FA, Forgot password  │
└──────────┬──────────────────────────────────────┬───────────────┘
           │ supabase-js (server)                  │ fetch (server)
┌──────────▼──────────────┐           ┌────────────▼──────────────┐
│   Supabase Platform      │           │   KPay Payment Gateway    │
│  ─ PostgreSQL (RLS)      │           │   pay.esicia.com          │
│  ─ Auth (JWT + 2FA)      │           │   Mobile Money / Cards    │
│  ─ Realtime (WebSocket)  │           └───────────────────────────┘
│  ─ Storage (logos)       │
└─────────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Charts | Recharts |
| State management | Zustand (`usePharmacyStore`) |
| Forms | React Hook Form + Zod resolvers |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Payments | KPay gateway (`src/lib/kpay.ts`) |
| Export | jsPDF, jspdf-autotable, xlsx, jsbarcode |
| i18n | i18next (EN, RW, FR, SW — defined, not yet wired into UI) |
| 2FA | otplib + qrcode |
| Migrations | 36 files under `supabase/migrations/` |

---

## User Roles and Access Scope

Roles are stored in the `pharmacy_users.role` column. Every authenticated user has exactly one role per pharmacy membership.

| Role | Access Scope |
|---|---|
| `superadmin` | Platform-wide. Manages all pharmacies, subscriptions, and system settings. Not scoped to any single pharmacy. Sees the `SuperadminSidebar`. |
| `pharmacy_owner` | Full access within their own pharmacy tenant. Manages staff, settings, billing, inventory, POS, sales, customers, branches, and reports. Sees the `PharmacySidebar`. |
| `pharmacist` | Clinical access within their pharmacy. Can manage inventory, prescriptions, patients, and POS. Sees the `PharmacistSidebar`. |
| `cashier` | Operational access. Primarily POS and sales. Sees the `PharmacySidebar` (subset of actions available). |
| `staff` | General staff access. Limited to assigned modules within their pharmacy. Sees the `PharmacySidebar` (subset of actions available). |

> **Tenant isolation** is enforced at the database layer via Supabase RLS policies. Even if a user somehow bypasses the UI, their Supabase JWT only grants access to rows where `pharmacy_id` matches their own.

---

## Role-Based Routing

Authentication and role resolution are split across two layers that run in sequence on every request.

### Layer 1 — `middleware.ts`

**File:** `middleware.ts` → delegates to `supabase/middleware.ts` (`updateSession`)

The middleware runs on every request that is not a static asset (matched by the `config.matcher` pattern). Its responsibilities are:

1. **Session refresh** — Creates a Supabase SSR client using the request cookies and calls `supabase.auth.getUser()`. If the session JWT is expired but a valid refresh token exists, Supabase automatically issues a new JWT and the middleware writes the updated cookies to the response.

2. **Invalid token cleanup** — If the error message contains `refresh_token_not_found` or `Invalid Refresh Token`, the middleware calls `supabase.auth.signOut()` and deletes the stale auth cookie, preventing redirect loops.

3. **Protected path enforcement** — If the request path starts with any of the following prefixes **and** there is no authenticated user, the middleware redirects to `/sign-in`:

   | Protected Prefix | Covers |
   |---|---|
   | `/dashboard` | Main pharmacy dashboard |
   | `/superadmin` | Superadmin control panel |
   | `/pharmacy-dashboard` | Pharmacy owner dashboard |
   | `/pharmacist-dashboard` | Pharmacist dashboard |
   | `/inventory` | Inventory management |
   | `/pos` | Point of Sale |
   | `/sales` | Sales history |
   | `/customers` | Customer management |
   | `/branches` | Branch management |
   | `/staff` | Staff management |
   | `/settings` | Pharmacy and system settings |
   | `/prescriptions` | Prescription management |
   | `/admin` | Admin panel |

4. **Auth page redirect** — If an already-authenticated user navigates to `/sign-in`, `/sign-up`, or `/forgot-password`, the middleware redirects them to `/dashboard`.

5. **Auth processing passthrough** — Paths like `/auth/callback`, `/auth/success`, `/verify-2fa`, and `/auth-success` are always allowed through without redirection, so the OAuth/2FA callback flow completes correctly.

> **Note:** Debug and test routes (`/debug-auth`, `/debug-supabase`, `/test-rls`, etc.) are **not** in the protected paths list and are therefore accessible to unauthenticated users. These must be removed before production. See [`docs/feature-status.md`](./feature-status.md) for the full list.

### Layer 2 — `src/app/(dashboard)/layout.tsx`

**File:** `src/app/(dashboard)/layout.tsx`

This is a **React Server Component** that wraps every page inside the `(dashboard)` route group. It runs after the middleware has already confirmed a session exists. Its responsibilities are:

1. **Re-verify the session** — Calls `supabase.auth.getUser()` again (server-side, using the cookie store). If no user is found at this point, it calls `redirect('/sign-in')` as a second line of defence.

2. **Resolve the user role** — Queries `pharmacy_users` for the row matching `user_id = user.id` and `is_active = true`, selecting `role` and `pharmacy_id`.

3. **Check subscription status** — For non-superadmin users, queries the `pharmacies` table for `status` and `subscription_expires_at`. If the pharmacy is `suspended` or the subscription has expired, `isSubscriptionExpired` is set to `true`.

4. **Render the correct sidebar** — Based on the resolved role:

   | Role | Sidebar Component |
   |---|---|
   | `superadmin` | `<SuperadminSidebar />` |
   | `pharmacist` | `<PharmacistSidebar />` |
   | `pharmacy_owner`, `cashier`, `staff` | `<PharmacySidebar />` (default) |

5. **Render `SubscriptionBlocker`** — If `isSubscriptionExpired` is `true`, the `<SubscriptionBlocker>` component is rendered, overlaying the page content and preventing access until the subscription is renewed. Superadmin users are exempt from this check.

The layout wraps everything in `<PharmacyProvider>` (Zustand context) and `<SidebarProvider>` (shadcn/ui sidebar context).

---

## Data Flow

The following sequence describes how a user action in the browser results in a database read or write and a UI update.

```
User Action (button click, form submit)
    │
    ▼
Client Component (page.tsx or component.tsx)
    │  fetch('/api/...', { method: 'POST', body: JSON.stringify(payload) })
    ▼
API Route Handler (src/app/api/.../route.ts)
    │  createClient()          ← supabase/server.ts (cookie-based session)
    │  supabase.auth.getUser() ← verify session is still valid
    │  supabase.from('table')
    │    .select() / .insert() / .update() / .delete()
    │  RLS policies run inside PostgreSQL:
    │    - tenant isolation: pharmacy_id must match JWT claim
    │    - role checks: some tables restrict writes to owner/superadmin
    ▼
PostgreSQL (Supabase)
    │
    ▼
Response JSON  ←  route handler returns NextResponse.json(data)
    │
    ▼
Client re-renders  ←  React state update / router.refresh()
```

**Realtime updates** follow a different path: the client subscribes to a Supabase Realtime channel via WebSocket. When a row changes in PostgreSQL (e.g., a new sale is inserted), Supabase broadcasts the change event to all subscribed clients, which update their local state without a full page reload.

---

## Supabase Integration

Supabase provides four services used by Pryrox:

### Auth (JWT + 2FA)

- Sessions are stored as HTTP-only cookies managed by `@supabase/ssr`.
- The middleware refreshes the JWT on every request, so sessions stay alive without client-side polling.
- Two-factor authentication is implemented with `otplib` (TOTP) and `qrcode` for QR code generation. The 2FA verification page is at `/verify-2fa`.
- Password reset uses Supabase's built-in email flow, with the callback handled at `/auth/callback`.

### PostgreSQL (RLS)

- All application data lives in a single Supabase PostgreSQL project.
- Row-Level Security policies are defined in `supabase/migrations/` and enforce that users can only read and write rows belonging to their own `pharmacy_id`.
- The server-side Supabase client (`supabase/server.ts → createClient()`) uses the user's JWT (anon key + session), so RLS applies automatically.
- Admin operations that must bypass RLS (e.g., superadmin managing all pharmacies) use `createServiceClient()`, which authenticates with `SUPABASE_SERVICE_ROLE_KEY`. This client is **never** exposed to the browser.

### Realtime (WebSocket)

- Supabase Realtime is used to push live updates to dashboard pages (e.g., new sales, inventory changes).
- Clients subscribe to table-level change events using `supabase.channel()`.
- RLS applies to Realtime subscriptions as well — users only receive events for rows they are authorized to read.

### Storage (Logos)

- Pharmacy logos and branding assets are stored in Supabase Storage buckets.
- Upload and retrieval are handled through the Supabase client; public URLs are stored in the `pharmacies` table.

### Client Factories

| File | Export | Used In | Auth Method |
|---|---|---|---|
| `supabase/client.ts` | `createClient()` | Browser (Client Components) | Anon key + session cookie |
| `supabase/server.ts` | `createClient()` | Server Components, Route Handlers | Anon key + session cookie (via `next/headers`) |
| `supabase/server.ts` | `createServiceClient()` | Privileged Route Handlers only | Service role key (bypasses RLS) |
| `supabase/middleware.ts` | `updateSession()` | `middleware.ts` | Anon key + request cookies |

---

## KPay Payment Integration

KPay (`pay.esicia.com`) is the payment gateway used for pharmacy subscription billing. The integration lives in `src/lib/kpay.ts` and is consumed by API route handlers — it is never called directly from Client Components.

### Supported Payment Methods

| Method Code | Description |
|---|---|
| `momo` | Mobile Money (MTN, Airtel) |
| `cc` | Visa / Mastercard |
| `bank` | Bank transfer |
| `spenn` | Spenn |
| `smartcash` | Smartcash |

### Payment Initiation Flow

```
1. Client Component submits subscription/payment form
       │
       ▼
2. POST /api/kpay/initiate  (Route Handler)
       │  Constructs KPayPaymentRequest:
       │    msisdn, email, amount, currency (RWF),
       │    refid (unique per transaction),
       │    retailerid  ← KPAY_RETAILER_ID
       │    returl      ← KPAY_RETURN_URL  (webhook callback)
       │    redirecturl ← KPAY_REDIRECT_URL (post-payment redirect)
       │
       ▼
3. KPayService.initiatePayment()
       │  POST https://pay.esicia.com
       │  Authorization: Basic base64(username:password)
       │  Content-Type: application/json
       │
       ▼
4. KPay returns KPayPaymentResponse
       │    reply, url, success, authkey, tid, refid, retcode
       │
       ▼
5. Route Handler returns { url } to client
       │
       ▼
6. Client redirects user to KPay-hosted payment page (url)
```

### Webhook Callback

When the payment completes (or fails), KPay sends a `POST` request to `KPAY_RETURN_URL` (defaults to `{APP_URL}/api/kpay/webhook`). The webhook handler:

1. Parses the `KPayWebhookPayload` (`tid`, `refid`, `statusid`, `statusdesc`).
2. Looks up the subscription record by `refid`.
3. Updates the subscription status in the `subscriptions` table.
4. Returns a `200 OK` to acknowledge receipt.

### Post-Payment Redirect

After the user completes payment on the KPay-hosted page, KPay redirects the browser to `KPAY_REDIRECT_URL` (defaults to `{APP_URL}/payment/success`). This page reads the transaction result from query parameters or session state and displays a confirmation to the user.

### Error Codes

The `KPayService.getErrorMessage(retcode)` method maps KPay numeric return codes to human-readable messages:

| Code | Meaning |
|---|---|
| `0` | No error — transaction being processed |
| `401` | Missing authentication header |
| `600` | Invalid username / password |
| `602` | IP not whitelisted |
| `603` | Missing required parameters |
| `607` | Failed mobile money transaction |
| `608` | Duplicate `refid` |
| `611` | Transaction not found |

### Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `KPAY_BASE_URL` | Yes | `https://pay.esicia.com` | KPay API endpoint |
| `KPAY_USERNAME` | Yes | — | Merchant username |
| `KPAY_PASSWORD` | Yes | — | Merchant password |
| `KPAY_RETAILER_ID` | Yes | `02` | Retailer identifier |
| `KPAY_RETURN_URL` | No | `{APP_URL}/api/kpay/webhook` | Webhook callback URL |
| `KPAY_REDIRECT_URL` | No | `{APP_URL}/payment/success` | Post-payment redirect URL |

---

*Last updated: generated by the project-audit-and-docs spec.*
