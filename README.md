# Pryrox

> Multi-tenant pharmacy management SaaS built with Next.js 14 and Supabase.

Pryrox is a SaaS platform that lets independent pharmacies and pharmacy chains manage inventory, point-of-sale transactions, customer records, prescriptions, insurance claims, staff, and subscription billing from a single tenant-isolated workspace. Each pharmacy is fully isolated at the database level via Supabase Row-Level Security (RLS), and access inside a pharmacy is gated by a five-tier role system.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Environment Variables](#environment-variables)
5. [User Roles](#user-roles)
6. [Architecture Overview](#architecture-overview)
7. [Available Scripts](#available-scripts)
8. [Project Structure](#project-structure)
9. [Documentation](#documentation)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons |
| Charts | Recharts |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| Backend / Database | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Payments | KPay (Mobile Money + Card) via `src/lib/kpay.ts` |
| Export | jsPDF, jspdf-autotable, xlsx, jsbarcode |
| 2FA | otplib + qrcode |

See [`docs/architecture.md`](docs/architecture.md) for the full architectural breakdown.

---

## Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9 (or pnpm / yarn — examples below use npm)
- A **Supabase project** (free tier works for development) — [create one here](https://supabase.com)
- A **KPay merchant account** if you need to test live payment flows (optional for development; only required for subscription/POS payment testing)

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/pryrolab-eng/pryro-phramacy.git
cd pryro-phramacy

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Then open .env and fill in the values (see "Environment Variables" below)

# 4. Apply the schema (pick ONE path)

# 4a — Local Supabase (Docker): wipes DB, runs all migrations, then `supabase/seed.sql`
npx supabase db reset --local

# 4b — Hosted Supabase: push migrations from this repo (no automatic seed; create users in the dashboard)
# npx supabase db push

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Local seed users

After `npx supabase db reset --local`, Supabase runs `supabase/seed.sql`. That creates **five** email/password accounts (same password for all). Use them at [http://localhost:3000/sign-in](http://localhost:3000/sign-in).

| Email | Password | Role in UI | Stored in PostgreSQL as |
|---|---|---|---|
| `abdousentore@gmail.com` | `seedpass123` | Platform superadmin (`SuperadminSidebar`) | `public.users.is_platform_admin = true` (no `pharmacy_users` row) |
| `pharmacy@test.com` | `seedpass123` | Pharmacy owner (`PharmacySidebar`) | `pharmacy_users.role = pharmacy_owner` (enum `user_role`) |
| `pharmacist@test.com` | `seedpass123` | Pharmacist (`PharmacistSidebar`) | `pharmacy_users.role = pharmacist` |
| `cashier@test.com` | `seedpass123` | Cashier (`PharmacySidebar`) | `pharmacy_users.role = cashier` |
| `staff@seed.pryrox` | `seedpass123` | Staff (`PharmacySidebar`) | `pharmacy_users.role = staff` |

Pharmacy-scoped users are attached to the sample tenant `11111111-1111-1111-1111-111111111111` (City Pharmacy Kigali from migrations). The platform seed user is **not** in `pharmacy_users`; access is `public.users.is_platform_admin` (see migration `20250614000000_platform_admin_profile.sql`).

> **Security:** these accounts exist only for local development. Do not run `seed.sql` against production, and do not reuse `seedpass123` anywhere public.

---

## Environment Variables

A working `.env` file requires the following variables. See [`docs/environment-variables.md`](docs/environment-variables.md) for the full reference (purpose, scope, defaults).

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes* | New publishable key (`sb_publishable_…`) from Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Legacy anon JWT (only if publishable is not set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role secret (**server-only, never expose**) — same project as URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Public application URL (used in KPay callbacks) |
| `KPAY_BASE_URL` | Yes | KPay API endpoint (default `https://pay.esicia.com`) |
| `KPAY_USERNAME` | Yes | KPay merchant username |
| `KPAY_PASSWORD` | Yes | KPay merchant password |
| `KPAY_RETAILER_ID` | Yes | KPay retailer identifier |
| `KPAY_RETURN_URL` | No | Webhook URL (defaults to `${APP_URL}/api/kpay/webhook`) |
| `KPAY_REDIRECT_URL` | No | Post-payment redirect (defaults to `${APP_URL}/payment/success`) |

\* Use **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** *or* **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (at least one).

> **Security:** never commit `.env`. It is already listed in `.gitignore`. Use `.env.example` as the template you commit.

---

## User roles (where they live in the database)

There is **no** `roles` table. Application access is modeled as follows:

| Concept | PostgreSQL object | Notes |
|---|---|---|
| Allowed role *labels* | Enum type **`public.user_role`** | Values: `admin`, `pharmacy_owner`, `pharmacist`, `cashier`, `staff`. Inspect in SQL: `SELECT enum_range(NULL::public.user_role);` |
| Tenant membership | **`public.pharmacy_users`** column **`role`** | One active row per user per pharmacy (which pharmacy + which `user_role`). |
| Platform operator | **`public.users`** column **`is_platform_admin`** | Superadmin UI; **not** stored in `pharmacy_users` for the seeded platform user. |
| Auth identity only | **`auth.users`** | JWT / sign-in. Column **`role`** here is Supabase’s auth role (e.g. `authenticated`), **not** the pharmacy app role. |
| Reporting (read-only) | **`public.user_roles_view`** | **View**, not a table: denormalized join of `users` + `pharmacy_users` + `pharmacies` for browsing in SQL or Studio. It does not store data; do not treat it as RBAC source of truth. |

If `user_role` or `pharmacy_users` is missing, migrations have not been applied to that database. From the repo root run **`npx supabase db push`** (linked project) or **`npx supabase db reset --local`** (Docker, includes `seed.sql`).

---

## User Roles (behavior)

Pryrox resolves the dashboard from **`pharmacy_users`** (when present) plus **`public.users.is_platform_admin`**, server-side in `src/app/(dashboard)/layout.tsx` and `src/app/dashboard/page.tsx`.

| Role | Access scope |
|---|---|
| `superadmin` (UI) | Platform-wide. Manages all pharmacies, global categories, insurance providers, and subscription plans. **Source of truth:** `public.users.is_platform_admin`. Legacy installs may still have `pharmacy_users.role = admin` on a synthetic tenant; RLS `is_admin()` accepts either. |
| `pharmacy_owner` | Tenant admin for a single pharmacy. Manages staff, branches, settings, subscription, branding, API keys, and IP whitelist. |
| `pharmacist` | Clinical access within a pharmacy. Operates the prescription queue, inventory, POS, and customer records. |
| `cashier` | POS-only access. Can run sales but not modify inventory, staff, or settings. |
| `staff` | Limited read access. Used for general employees who need visibility without write permissions. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│  Next.js 14 App Router (React Server + Client Components)       │
│  Tailwind CSS · shadcn/ui · Recharts · Framer Motion            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    Next.js Server (Vercel / Node)               │
│                                                                 │
│  middleware.ts            ──► Session refresh (Supabase SSR)    │
│  src/app/api/**           ──► Route Handlers (REST-style API)   │
│  src/app/(dashboard)/**   ──► Server + Client page components   │
│  src/app/(auth)/**        ──► Sign-in, Sign-up, 2FA, Reset      │
└──────────┬──────────────────────────────────────┬───────────────┘
           │ supabase-js (server)                 │ fetch (server)
┌──────────▼──────────────┐           ┌───────────▼───────────────┐
│   Supabase Platform     │           │   KPay Payment Gateway    │
│  · PostgreSQL (RLS)     │           │   pay.esicia.com          │
│  · Auth (JWT + 2FA)     │           │   Mobile Money / Cards    │
│  · Realtime (polling)   │           └───────────────────────────┘
│  · Storage (logos)      │
└─────────────────────────┘
```

**Request flow:** A client component calls `fetch('/api/...')` → a Next.js Route Handler in `src/app/api/` verifies the session with `supabase.auth.getUser()` → it queries Supabase, which enforces tenant isolation through RLS policies → JSON is returned and the client re-renders.

Full details (role resolution layers, RLS strategy, KPay flow, client factories) live in [`docs/architecture.md`](docs/architecture.md).

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server on `http://localhost:3000` |
| `npm run build` | Create a production build |
| `npm start` | Start the production server (after `npm run build`) |
| `npm run lint` | Run `next lint` |

---

## Project Structure

```
pryrox/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Sign-in, sign-up, forgot password, 2FA
│   │   ├── (dashboard)/     # Role-based dashboards (superadmin, admin,
│   │   │                    # pharmacy-owner, pharmacist, etc.)
│   │   ├── api/             # REST-style Route Handlers
│   │   ├── actions.ts       # Server actions (sign-in, sign-out)
│   │   └── page.tsx         # Public landing page
│   ├── components/          # Reusable React components + shadcn/ui
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Supabase clients, KPay client, validators, utilities
│   ├── store/               # Zustand stores
│   └── types/               # Shared TypeScript types
├── supabase/
│   └── migrations/          # Official schema history (apply in order)
├── public/                  # Static assets
├── docs/                    # Project documentation (see below)
├── middleware.ts            # Session refresh + protected-path enforcement
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Documentation

All project documentation lives under [`docs/`](docs/) and renders directly on GitHub.

### Core references

| Document | What it covers |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System architecture, data flow, role-based routing, Supabase + KPay integration |
| [`docs/database.md`](docs/database.md) | All tables (grouped by domain), columns, foreign keys, RLS policies |
| [`docs/api.md`](docs/api.md) | All API route groups under `src/app/api/`, HTTP methods, auth requirements |
| [`docs/environment-variables.md`](docs/environment-variables.md) | Complete env var reference with required/optional flags and defaults |
| [`docs/feature-status.md`](docs/feature-status.md) | Working / partial / broken status for every feature area, plus security findings |

### Module documentation

Each major feature module has its own document under [`docs/modules/`](docs/modules/):

- [Authentication & 2FA](docs/modules/authentication.md)
- [Superadmin Dashboard](docs/modules/superadmin-dashboard.md)
- [Admin Dashboard](docs/modules/admin-dashboard.md)
- [Pharmacy Owner Dashboard](docs/modules/pharmacy-owner-dashboard.md)
- [Pharmacist Dashboard](docs/modules/pharmacist-dashboard.md)
- [Inventory Management](docs/modules/inventory.md)
- [Point of Sale (POS)](docs/modules/pos.md)
- [Sales History](docs/modules/sales.md)
- [Customer Management](docs/modules/customers.md)
- [Patients & Prescriptions](docs/modules/patients-prescriptions.md)
- [Insurance Management](docs/modules/insurance.md)
- [Staff Management](docs/modules/staff-management.md)
- [Subscription & Billing (KPay)](docs/modules/subscription-billing.md)
- [Settings (Branding, API Keys, Security, Stock Locations)](docs/modules/settings.md)
- [Reports](docs/modules/reports.md)
- [Branches](docs/modules/branches.md)
- [Realtime Updates](docs/modules/realtime-updates.md)
- [Internationalization](docs/modules/internationalization.md)

---

## License

Pryro. All rights reserved.
