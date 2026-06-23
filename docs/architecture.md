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
7. [Data & Auth Layer](#data--auth-layer)

---

## System Overview

Pryrox is a multi-tenant SaaS platform for pharmacy management. Each tenant (pharmacy) is isolated in application code: API routes resolve the **active pharmacy** from session context and scope Prisma queries by `pharmacy_id`. The application is built on the **Next.js App Router** — pages can be React Server Components (RSC) or Client Components, and API endpoints are Next.js Route Handlers rather than a separate backend service.

Authentication uses **native JWT cookies** (`pryrox_session`, `pryrox_refresh`) signed with `AUTH_SECRET`. Role resolution happens server-side on every dashboard request via `getAuthUser()` and `resolveActivePharmacyContext()`.

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
│  middleware.ts ──► Native JWT session + route guards              │
│  src/app/api/**  ──► Route Handlers (REST-style API)            │
│  src/app/(dashboard)/** ──► Server + Client page components     │
│  src/app/(auth)/**  ──► Sign-in, Sign-up, 2FA, Forgot password  │
└──────────┬──────────────────────────────────────┬───────────────┘
           │ Prisma (DATABASE_URL)               │ fetch (server)
┌──────────▼──────────────┐           ┌────────────▼──────────────┐
│   PostgreSQL             │           │   Payment Gateway         │
│  ─ Application schema    │           │   Polar (Card/Intl)       │
│  ─ auth.users + sessions │           └───────────────────────────┘
│  ─ Legacy RLS policies*  │
└─────────────────────────┘
* RLS exists from migrations; the app uses Prisma with service credentials and enforces tenancy in route handlers.
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
| Backend / DB | PostgreSQL + Prisma; native JWT auth; local disk / Cloudinary uploads |
| Payments | Polar gateway (`src/lib/polar/`) |
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

> **Tenant isolation** is enforced in API route handlers and Prisma store modules using `requireSessionPharmacyId()` / active pharmacy context. Legacy RLS policies remain in the schema from migrations but are not relied on by the application layer.

---

## Role-Based Routing

Authentication and role resolution are split across two layers that run in sequence on every request.

### Layer 1 — `middleware.ts`

**File:** `middleware.ts` → delegates to `src/lib/middleware/update-session.ts`

The middleware runs on every request that is not a static asset (matched by the `config.matcher` pattern). Its responsibilities are:

1. **Session refresh** — Reads `pryrox_session` / `pryrox_refresh` cookies, verifies JWTs with `AUTH_SECRET`, and silently refreshes the access token when a valid refresh token is present (`trySilentNativeAccessRefresh`).

2. **Legacy cookie cleanup** — Clears stale `sb-*-auth-token` cookies from the Supabase era if present.

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

4. **Auth page redirect** — If an already-authenticated user navigates to `/sign-in`, `/sign-up`, or `/forgot-password`, the middleware redirects them to `/app`.

5. **Auth processing passthrough** — Paths like `/auth/callback`, `/auth/success`, `/verify-2fa`, and `/auth-success` are always allowed through without redirection, so the OAuth/2FA callback flow completes correctly.

> **Note:** Debug and test routes (`/debug-auth`, `/debug-supabase`, `/test-rls`, etc.) are **not** in the protected paths list and are therefore accessible to unauthenticated users. These must be removed before production. See [`docs/feature-status.md`](./feature-status.md) for the full list.

### Layer 2 — `src/app/(dashboard)/layout.tsx`

**File:** `src/app/(dashboard)/layout.tsx`

This is a **React Server Component** that wraps every page inside the `(dashboard)` route group. It runs after the middleware has already confirmed a session exists. Its responsibilities are:

1. **Re-verify the session** — Calls `getAuthUser()` again (server-side). If no user is found, it calls `redirect('/sign-in')` as a second line of defence.

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
    │  getAuthUser()           ← src/lib/auth/get-auth-user.ts
    │  requireSessionPharmacyId() / getRequestPharmacyId()
    │  prisma.* or lib/db/*-store.ts
    │    scoped by pharmacy_id from active context
    ▼
PostgreSQL (via Prisma)
    │
    ▼
Response JSON  ←  route handler returns NextResponse.json(data)
    │
    ▼
Client re-renders  ←  React state update / router.refresh()
```

**Live updates** use HTTP polling: `useRealtimeUpdates` calls `/api/realtime/updates` on an interval (not WebSocket subscriptions).

---

## Data & Auth Layer

### Auth (native JWT + 2FA)

| Piece | Location |
|---|---|
| Session cookies | `pryrox_session`, `pryrox_refresh` (`src/lib/auth/auth-mode.ts`) |
| Sign-in / sign-up | `src/app/actions.ts` → `nativeSignInWithPassword`, `adminCreateAuthUser` |
| Session verify | `getAuthUser()` in `src/lib/auth/get-auth-user.ts` |
| Middleware | `src/lib/middleware/update-session.ts` |
| 2FA | `otplib` + `/api/auth/verify-2fa`, `/api/auth/complete-2fa` |
| Password reset | SMTP + `/api/auth/recovery-email`; token verify in `resetPasswordAction` |
| Google OAuth | `/api/auth/google`, `/api/auth/google/callback` |

### PostgreSQL + Prisma

- Schema history: `supabase/migrations/` (apply with `npm run db:sql:push` or `npx supabase db reset --local`).
- Runtime access: `@prisma/client` via `src/lib/db/prisma.ts` and domain `*-store.ts` modules.
- Platform admin checks: `resolveIsAppPlatformAdmin()` + `public.users.is_platform_admin`.

### File storage

- Pharmacy logos: Cloudinary when configured, else `uploads/` served by `/api/files/...`.
- Platform reports: `uploads/platform-reports/` (admin download via API).

### Key server entry points

| Concern | Module |
|---|---|
| Who is logged in? | `getAuthUser()` |
| Which pharmacy? | `requireSessionPharmacyId()`, `resolveActivePharmacyContext()` |
| Plan features | `resolvePharmacyEntitlements()` |
| Sign out (client) | `signOutClient()` → `POST /api/auth/signout` |

---

*Last updated: generated by the project-audit-and-docs spec.*
