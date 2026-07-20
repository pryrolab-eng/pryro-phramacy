# Pryrox

Multi-tenant pharmacy management SaaS: inventory, POS, customers, prescriptions, insurance, staff, branches, reports, and subscription billing — each pharmacy isolated by `pharmacy_id` with role-based access.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Local setup](#local-setup)
5. [Environment variables](#environment-variables)
6. [User roles](#user-roles)
7. [Architecture](#architecture)
8. [Scripts](#scripts)
9. [Project structure](#project-structure)
10. [Critical warnings](#critical-warnings)
11. [Documentation](#documentation)

---

## Tech stack

| Layer | Technology |
|---|---|
| App | **Next.js 16** (App Router), **React 19**, TypeScript |
| UI | Tailwind CSS, shadcn/ui (Radix), Lucide, Recharts |
| Client data | TanStack React Query, Zustand |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL via **Prisma** (host may be Supabase Postgres — **no** Supabase Auth/SDK) |
| Auth | Native JWT cookies (`NATIVE_AUTH_ENABLED`, `app_sessions`) |
| Cache / jobs | Redis (`ioredis`) + BullMQ worker |
| Analytics | Optional **ClickHouse** (dashboard / sales / reports charts) |
| Payments | Polar (card / international subscriptions) |
| Edge gating | `src/proxy.ts` (session + protected routes) |

---

## Features

- **Multi-tenant pharmacies** with branches, HQ, and staff assignments
- **POS** — catalog, cart, payment methods, cashier shifts, hold/void/returns, full-window mode
- **Inventory** — stock, purchases, transfers, expiry/low-stock alerts, import
- **Insurance** — providers, formulary / covered meds, claims integrated into checkout
- **Patients & prescriptions** — clinical queue alongside retail customers
- **Sales & reports** — history, analytics; Postgres OLTP + optional ClickHouse OLAP
- **SaaS billing** — plans, entitlements, Polar checkout/webhooks, usage limits
- **Platform admin** — pharmacies, plans, features, branding, maintenance
- **Notifications** — in-app list + SSE stream; email via BullMQ + SMTP
- **Integrations** — Polar, optional RRA/EBM fiscal paths, Cloudinary or local uploads

---

## Prerequisites

- Node.js ≥ 18.17, npm ≥ 9
- PostgreSQL 14+ (local Supabase stack or hosted)
- Redis (email / cache / rate limits when enabled)
- SMTP for auth and invite emails
- Docker (optional) for local ClickHouse via `docker-compose.yml`
- Polar account (optional) for paid subscriptions

---

## Local setup

```bash
git clone https://github.com/pryrolab-eng/pryro-phramacy.git
cd pryro-phramacy

npm install
cp .env.example .env
# Fill DATABASE_URL, AUTH_SECRET, SMTP_*, NEXT_PUBLIC_APP_URL, etc.

# Schema — pick one path:
npx supabase db reset --local   # Docker local DB + seed.sql
# or: npm run db:sql:push       # push migrations to existing DB
npm run db:generate

# Redis (email worker / cache)
docker run -d --name pryrox-redis -p 6379:6379 redis:7-alpine

# Optional analytics
npm run clickhouse:up
npm run clickhouse:migrate
npm run clickhouse:sync

# App + BullMQ worker
npm run dev:all
```

App: [http://localhost:3000](http://localhost:3000). UI-only (no worker): `npm run dev`.

### Seed user (local)

After `npx supabase db reset --local`, `supabase/seed.sql` creates:

| Email | Password | Role |
|---|---|---|
| `abdousentore@gmail.com` | `seedpass123` | Platform admin (`is_platform_admin`) |

Local only — do not seed production or reuse this password publicly.

---

## Environment variables

See [`.env.example`](.env.example) and [`docs/environment-variables.md`](docs/environment-variables.md).

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres (Prisma; pooler OK on serverless) |
| `NATIVE_AUTH_ENABLED` | `true` — native JWT auth |
| `AUTH_SECRET` | JWT signing secret (≥ 32 chars) |
| `NEXT_PUBLIC_APP_URL` | Public URL (auth emails, Polar returns) |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` / `FROM` | Transactional email |

### Common optional

| Variable | Purpose |
|---|---|
| `REDIS_URL` or `REDIS_HOST` / `PORT` | Cache, queue, rate limits |
| `POLAR_*` | Subscription checkout + webhooks |
| `CRON_SECRET` | Auth for `/api/cron/*` (e.g. ClickHouse sync) |
| `CLICKHOUSE_*` | Analytics reads; unset → Postgres-only charts |
| `CLOUDINARY_*` / `UPLOAD_DIR` | Logos & uploads |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth |
| `NVIDIA_*` | Optional AI drug-safety features |
| `ENTITLEMENTS_ENFORCE` | Plan feature gates (default on) |

Never commit `.env`.

---

## User roles

No separate `roles` table. Access is:

| Concept | Where |
|---|---|
| Role enum | `public.user_role` — `admin`, `pharmacy_owner`, `pharmacist`, `cashier`, `staff` |
| Membership | `pharmacy_users.role` per pharmacy |
| Platform operator | `users.is_platform_admin` |

| Role | Scope |
|---|---|
| Platform admin | All pharmacies, plans, platform settings |
| `pharmacy_owner` | Tenant admin: staff, branches, billing, branding |
| `pharmacist` | Clinical + inventory + POS |
| `cashier` | POS-focused (shifts, sales) |
| `staff` | Limited visibility |

---

## Architecture

```
Browser (React Query → /api/*)
        │
        ▼
Next.js 16 (Node / Vercel)
  src/proxy.ts          session + route guards
  src/app/api/**        Route Handlers (~200 REST-style endpoints)
  src/lib/db/*          Prisma stores (preferred data layer)
  src/lib/queue         BullMQ jobs
        │
        ├── PostgreSQL (Prisma / SQL migrations under supabase/migrations)
        ├── Redis (cache, queues, optional rate limits)
        ├── ClickHouse (optional analytics)
        └── Polar / SMTP / Cloudinary
```

**Data path:** Client hook → `src/lib/http/*` → Route Handler → `getAuthUser()` → pharmacy-scoped Prisma store → JSON.

**Prisma-first:** New and touched server code uses `@/lib/db/prisma` and store modules. Do not add `@supabase/*` SDK usage; Supabase (if used) is Postgres hosting + SQL migrations only.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev (webpack) |
| `npm run dev:turbo` | Next.js with Turbopack |
| `npm run dev:all` | Dev server + BullMQ worker |
| `npm run worker` | Worker only |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma client |
| `npm run db:sql:push` | Apply Supabase SQL migrations |
| `npm run db:sql:reset` | Reset local Supabase DB |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed:demo` | Demo pharmacy seed script |
| `npm run clickhouse:up` / `down` | Local ClickHouse Docker |
| `npm run clickhouse:migrate` / `sync` / `ping` | CH schema + backfill |

---

## Project structure

```
pryrox/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Sign-in, sign-up, 2FA, password reset
│   │   ├── (dashboard)/       # Pharmacy + admin dashboards (POS, inventory, …)
│   │   ├── (admin)/           # Platform admin surfaces
│   │   ├── api/               # Route Handlers (auth, pos, inventory, saas, …)
│   │   ├── onboarding/        # Tenant onboarding
│   │   └── payment/           # Checkout success / return
│   ├── components/            # UI (pos, dashboard, subscription, ui, …)
│   ├── hooks/                 # React Query hooks
│   ├── lib/
│   │   ├── auth/              # JWT sessions, bootstrap
│   │   ├── db/                # Prisma + domain stores
│   │   ├── http/              # Browser API clients
│   │   ├── queue/             # BullMQ worker
│   │   ├── cache/             # Redis cache helpers
│   │   ├── clickhouse/        # Optional analytics client
│   │   └── subscription/      # Entitlements & lifecycle
│   ├── store/                 # Zustand
│   └── proxy.ts               # Edge session / route protection
├── prisma/schema.prisma
├── supabase/migrations/       # Canonical SQL history
├── clickhouse/                # Local CH init
├── scripts/                   # Ops / seed / ClickHouse helpers
├── docs/                      # Architecture & module docs
├── docker-compose.yml         # ClickHouse
└── .env.example
```

---

## Critical warnings

### Do not use `prisma db push --accept-data-loss`

It can wipe production data. Prefer `npm run db:sql:push` (SQL migrations) or careful `prisma db push` without data-loss flags.

### Supabase = Postgres only

Zero `@supabase` SDK imports. Auth is native JWT. Migrations live under `supabase/migrations/`; keep `prisma/schema.prisma` in sync.

### Redis for email / worker

Without Redis, the BullMQ worker cannot send maintenance / invite mail. Set `REDIS_HOST=127.0.0.1` (or `REDIS_URL`) when using `npm run worker` / `dev:all`.

### Pending subscriptions

A `pending_payment` plan is not active: block dashboard via access reasons, show pay CTA, and never treat it as the current paid plan.

### ClickHouse is optional

If `CLICKHOUSE_URL` is unset, analytics fall back to Postgres. Local: `npm run clickhouse:up` then migrate/sync.

---

## Documentation

| Doc | Topic |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System design |
| [`docs/database.md`](docs/database.md) | Schema overview |
| [`docs/api.md`](docs/api.md) | API route groups |
| [`docs/environment-variables.md`](docs/environment-variables.md) | Full env reference |
| [`docs/feature-status.md`](docs/feature-status.md) | Feature readiness |
| [`docs/entitlements.md`](docs/entitlements.md) | Plan gating |
| [`docs/subscription-lifecycle.md`](docs/subscription-lifecycle.md) | Billing states |
| [`docs/modules/`](docs/modules/) | Per-feature modules (POS, inventory, insurance, …) |

---

## License

Pryro. All rights reserved.
