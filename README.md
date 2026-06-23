# Pryrox

> Multi-tenant pharmacy management SaaS built with Next.js, PostgreSQL, and Redis.

Pryrox is a SaaS platform that lets independent pharmacies and pharmacy chains manage inventory, point-of-sale transactions, customer records, prescriptions, insurance claims, staff, and subscription billing from a single tenant-isolated workspace. Each pharmacy is isolated in application logic (active pharmacy context, Prisma queries scoped by `pharmacy_id`), and access inside a pharmacy is gated by a five-tier role system.

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
9. [Critical Warnings](#critical-warnings)
10. [Documentation](#documentation)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons |
| Charts | Recharts |
| State management | Zustand |
| Data fetching | React Query (`@tanstack/react-query`) — no raw `fetch` in `useEffect` |
| Forms | React Hook Form + Zod |
| Backend / Database | PostgreSQL via Prisma (Supabase-hosted, used as database only) |
| Auth | Native JWT (bcryptjs, custom `/api/auth/*` routes — **no** `@supabase` SDK imports) |
| Payments | KPay (Mobile Money + Card) + Polar (card/international) |
| Job queue | Redis + BullMQ (email notifications, maintenance alerts) |
| Export | jsPDF, jspdf-autotable, xlsx, jsbarcode |
| 2FA | otplib + qrcode |

See [`docs/architecture.md`](docs/architecture.md) for the full architectural breakdown.

---

## Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9
- **PostgreSQL** 14+ (hosted Supabase or local)
- **Redis** (for email job queue / maintenance notifications)
- **SMTP** for sign-up confirmation and password-reset emails
- A **KPay merchant account** for mobile money payments (optional)
- A **Polar account** for card/international subscription payments (optional)

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

# 4a — Local Postgres + migrations (Supabase CLI reads supabase/migrations/)
npx supabase db reset --local   # Docker; runs seed.sql

# 4b — Existing database: push migrations only
# npm run db:sql:push

# 4c — Sync Prisma client after schema changes
# npm run db:generate

# 5. Start Redis (required for email job queue)
docker run -d --name pryrox-redis -p 6379:6379 redis:7-alpine
# Then set REDIS_HOST=127.0.0.1 in your .env

# 6. Start the development server + worker
npm run dev:all
```

The app will be available at `http://localhost:3000`. The worker processes email jobs in the background.

> **Note:** `npm run dev:all` uses `concurrently` to run both the Next.js dev server and the BullMQ worker. If you only need the UI without email sending, use `npm run dev`.

---

## Seed Users

After `npx supabase db reset --local`, Supabase runs `supabase/seed.sql`. Currently only the platform admin user exists:

| Email | Password | Role |
|---|---|---|
| `abdousentore@gmail.com` | `seedpass123` | Platform superadmin (`is_platform_admin = true`, no pharmacy) |

> **Note:** Previous test users (pharmacy@test.com, pharmacist@test.com, etc.) have been removed. The database is clean with only the admin account.

> **Security:** these accounts exist only for local development. Do not run `seed.sql` against production, and do not reuse `seedpass123` anywhere public.

---

## Environment Variables

A working `.env` file requires the following variables. See [`docs/environment-variables.md`](docs/environment-variables.md) for the full reference.

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `NATIVE_AUTH_ENABLED` | Set to `true` (native JWT cookies + SMTP auth) |
| `AUTH_SECRET` | Secret for signing session JWTs (min 32 characters) |
| `NEXT_PUBLIC_APP_URL` | Public application URL (used in KPay/Polar callbacks and auth emails) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port (usually 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender email address |

### Payment Gateways

| Variable | Purpose |
|---|---|
| `KPAY_BASE_URL` | KPay API endpoint (default `https://pay.esicia.com`) |
| `KPAY_USERNAME` | KPay merchant username |
| `KPAY_PASSWORD` | KPay merchant password |
| `KPAY_RETAILER_ID` | KPay retailer identifier |
| `POLAR_ACCESS_TOKEN` | Polar organization access token (`polar_pat_...`) |
| `POLAR_WEBHOOK_SECRET` | Polar webhook secret (`whsec_...`) |
| `POLAR_SERVER` | `sandbox` (dev) or `production` |

### Redis (for email job queue)

| Variable | Purpose |
|---|---|
| `REDIS_HOST` | Redis host (default `127.0.0.1` for local Docker) |
| `REDIS_PORT` | Redis port (default `6379`) |
| `REDIS_PASSWORD` | Redis password (optional for local) |

### Optional

| Variable | Purpose |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary CDN for pharmacy logos |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CRON_SECRET` | Vercel cron auth token |
| `POLAR_CHECKOUT_CURRENCY` | Checkout currency (default `usd`) |
| `POLAR_RWF_PER_USD` | RWF/USD rate for price conversion (default `1300`) |

> **Security:** never commit `.env`. It is already listed in `.gitignore`. Use `.env.example` as the template you commit.

---

## User Roles

### Database Model

There is **no** `roles` table. Application access is modeled as follows:

| Concept | PostgreSQL object | Notes |
|---|---|---|
| Allowed role labels | Enum type **`public.user_role`** | Values: `admin`, `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |
| Tenant membership | **`public.pharmacy_users`** column **`role`** | One active row per user per pharmacy |
| Platform operator | **`public.users`** column **`is_platform_admin`** | Superadmin UI; not stored in `pharmacy_users` |
| Reporting (read-only) | **`public.user_roles_view`** | Denormalized view, not a table |

### Behavior

| Role | Access scope |
|---|---|
| `superadmin` (UI) | Platform-wide. Manages all pharmacies, categories, insurance providers, and subscription plans. |
| `pharmacy_owner` | Tenant admin for a single pharmacy. Manages staff, branches, settings, subscription, branding, API keys. |
| `pharmacist` | Clinical access. Operates prescription queue, inventory, POS, and customer records. |
| `cashier` | POS-only access. Can run sales but not modify inventory, staff, or settings. |
| `staff` | Limited read access. General employees who need visibility without write permissions. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│  Next.js 14 App Router (React Server + Client Components)       │
│  Tailwind CSS · shadcn/ui · Recharts · Framer Motion            │
│  React Query for all data fetching                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    Next.js Server (Vercel / Node)               │
│                                                                 │
│  middleware.ts            ──► Native JWT session + route guards │
│  src/app/api/**           ──► Route Handlers (REST-style API)   │
│  src/app/(dashboard)/**   ──► Server + Client page components   │
│  src/app/(auth)/**        ──► Sign-in, Sign-up, 2FA, Reset      │
└──────────┬──────────────────────────────────────┬───────────────┘
           │ Prisma (DATABASE_URL)                │ fetch (server)
┌──────────▼──────────────┐           ┌───────────▼───────────────┐
│   PostgreSQL            │           │   Payment Gateways        │
│  · Application tables   │           │   KPay (Mobile Money)     │
│  · Native auth tables   │           │   Polar (Card/Intl)       │
│  · app_sessions         │           └───────────────────────────┘
└─────────────────────────┘
┌─────────────────────────┐
│   Redis + BullMQ        │
│  · Email job queue      │
│  · Maintenance alerts   │
│  · Background worker    │
└─────────────────────────┘
```

**Request flow:** A client component calls `fetch('/api/...')` → a Route Handler verifies the session with `getAuthUser()` → it reads/writes via Prisma scoped to the active pharmacy → JSON is returned and the client re-renders.

**Email flow:** API enqueues job → BullMQ worker picks up → sends via SMTP (rate-limited, 50 concurrent).

Full details in [`docs/architecture.md`](docs/architecture.md).

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server on `http://localhost:3000` |
| `npm run dev:all` | Start dev server + BullMQ worker concurrently |
| `npm run worker` | Start the BullMQ email worker standalone |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run `next lint` |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:sql:push` | Push Supabase SQL migrations |
| `npm run db:sql:reset` | Reset local Supabase database |

---

## Project Structure

```
pryrox/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Sign-in, sign-up, forgot password, verify email, 2FA
│   │   ├── (dashboard)/         # Role-based dashboards (superadmin, pharmacy-owner, etc.)
│   │   ├── api/                 # REST-style Route Handlers
│   │   │   ├── admin/           # Admin settings, maintenance, API keys
│   │   │   ├── auth/            # Native JWT auth (sign-in, sign-up, 2FA, OAuth)
│   │   │   ├── billing/         # KPay payment processing
│   │   │   ├── entitlements/    # Feature access / plan enforcement
│   │   │   ├── kpay/            # KPay webhooks and callbacks
│   │   │   ├── me/              # Current user context, profile
│   │   │   ├── polar/           # Polar checkout, webhooks, status polling
│   │   │   ├── saas/            # Subscription CRUD, invoices, plans
│   │   │   ├── staff/           # Staff management, invites
│   │   │   └── subscriptions/   # Plan changes, upgrades, downgrades
│   │   └── page.tsx             # Public landing page
│   ├── components/
│   │   ├── admin/               # Admin settings panels, dialogs
│   │   ├── auth/                # Auth forms (sign-in, sign-up, forgot-password)
│   │   ├── billing/             # Billing status badge, invoice rows
│   │   ├── dashboard/           # Dashboard shells, cards, grids, tables
│   │   ├── subscription/        # Plan cards, checkout dialogs, upgrade banners
│   │   └── ui/                  # shadcn/ui components
│   ├── hooks/                   # Custom React hooks (React Query wrappers)
│   ├── lib/
│   │   ├── auth/                # JWT, API key hashing, session management
│   │   ├── billing/             # Format billing, limit display
│   │   ├── db/                  # Prisma store functions (subscriptions, payments)
│   │   ├── email/               # Email templates (maintenance, staff invites)
│   │   ├── kpay.ts              # KPay client
│   │   ├── platform-settings.ts # Platform settings helpers
│   │   ├── polar/               # Polar client, fulfillment, checkout errors
│   │   ├── queue/               # Redis connection, BullMQ queue, worker
│   │   └── subscription/        # Orchestrator, access blocks, lifecycle, match plans
│   ├── store/                   # Zustand stores
│   └── types/                   # Shared TypeScript types
├── prisma/
│   └── schema.prisma            # Database schema
├── supabase/
│   └── migrations/              # SQL migration history
├── docs/                        # Project documentation
├── middleware.ts                 # Session refresh + protected-path enforcement
├── tailwind.config.ts
└── tsconfig.json
```

---

## Critical Warnings

### Do NOT use `prisma db push --accept-data-loss`

This command **destroyed all data** in the database. Never use it. Use `npm run db:sql:push` (Supabase SQL migrations) or `prisma db push` without `--accept-data-loss`.

### Supabase is PostgreSQL only

Supabase is used **only** as a hosted PostgreSQL database. There are **zero** `@supabase` SDK imports anywhere in the codebase. Auth is fully native (bcryptjs, custom JWT). Do not add Supabase SDK dependencies.

### `hashApiKeySecret` is now async

Uses Web Crypto API (`crypto.subtle.digest`) instead of Node.js `createHash`. All callers must `await` it.

### `require()` in ESM context

`tailwind.config.ts` uses ESM imports. Do not use `require()` — it will crash with `ReferenceError: require is not defined`.

### Pending subscriptions

A `pending_payment` subscription is **not** an active plan. It should:
- Block dashboard access (via `accessBlockReason`)
- Show a "Pay now" banner on the billing page
- **Never** show as "Current plan" with a disabled button
- **Never** block the user from selecting a different plan

### Redis is required for email

Without Redis running, the BullMQ worker cannot process email jobs (maintenance notifications, staff invites). Set `REDIS_HOST=127.0.0.1` in `.env` and run `docker run -d --name pryrox-redis -p 6379:6379 redis:7-alpine`.

---

## Documentation

All project documentation lives under [`docs/`](docs/) and renders directly on GitHub.

### Core references

| Document | What it covers |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System architecture, data flow, role-based routing |
| [`docs/database.md`](docs/database.md) | All tables, columns, foreign keys, RLS policies |
| [`docs/api.md`](docs/api.md) | All API route groups, HTTP methods, auth requirements |
| [`docs/environment-variables.md`](docs/environment-variables.md) | Complete env var reference |
| [`docs/feature-status.md`](docs/feature-status.md) | Working / partial / broken status for every feature |
| [`docs/entitlements.md`](docs/entitlements.md) | Feature gating and plan enforcement |
| [`docs/subscription-lifecycle.md`](docs/subscription-lifecycle.md) | Subscription states, transitions, access blocks |

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
- [Subscription & Billing](docs/modules/subscription-billing.md)
- [Settings](docs/modules/settings.md)
- [Reports](docs/modules/reports.md)
- [Branches](docs/modules/branches.md)
- [Realtime Updates](docs/modules/realtime-updates.md)
- [Internationalization](docs/modules/internationalization.md)

---

## License

Pryro. All rights reserved.
