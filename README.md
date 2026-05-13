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

# 4. Apply database migrations to your Supabase project
# Option A: Supabase CLI (recommended)
npx supabase db push

# Option B: paste each file in supabase/migrations/ into the
# Supabase Dashboard SQL editor, in chronological order

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

A working `.env` file requires the following variables. See [`docs/environment-variables.md`](docs/environment-variables.md) for the full reference (purpose, scope, defaults).

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (**server-only, never expose**) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public application URL (used in KPay callbacks) |
| `KPAY_BASE_URL` | Yes | KPay API endpoint (default `https://pay.esicia.com`) |
| `KPAY_USERNAME` | Yes | KPay merchant username |
| `KPAY_PASSWORD` | Yes | KPay merchant password |
| `KPAY_RETAILER_ID` | Yes | KPay retailer identifier |
| `KPAY_RETURN_URL` | No | Webhook URL (defaults to `${APP_URL}/api/kpay/webhook`) |
| `KPAY_REDIRECT_URL` | No | Post-payment redirect (defaults to `${APP_URL}/payment/success`) |

> **Security:** never commit `.env`. It is already listed in `.gitignore`. Use `.env.example` as the template you commit.

---

## User Roles

Pryrox enforces five roles stored in the `pharmacy_users.role` column. Role-based UI is resolved server-side in `src/app/(dashboard)/layout.tsx` before any dashboard content renders.

| Role | Access scope |
|---|---|
| `superadmin` | Platform-wide. Manages all pharmacies, global categories, insurance providers, and subscription plans. |
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
| [`docs/cleanup-plan.md`](docs/cleanup-plan.md) | Catalogue of files identified for removal during the production audit |

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
