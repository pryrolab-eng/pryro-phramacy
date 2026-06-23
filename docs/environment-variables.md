# Environment Variables Reference

This document describes every environment variable used by **Pryrox**. Keep this file up to date whenever a new variable is introduced.

> **Security notice:** Never commit your `.env` file to version control. Add `.env` to `.gitignore` (it is already listed there). Use `.env.example` — which contains only placeholder values — as the template that is safe to commit.

---

## Quick Reference

| Variable | Required | Group | Server-only |
|---|---|---|---|
| `DATABASE_URL` | ✅ Required | Database | **Yes** |
| `NATIVE_AUTH_ENABLED` | ✅ Required | Auth | No |
| `AUTH_SECRET` | ✅ Required | Auth | **Yes** |
| `NEXT_PUBLIC_APP_URL` | ✅ Required | Application | No |
| `NEXT_PUBLIC_BASE_URL` | ✅ Required | Application | No |
| `KPAY_BASE_URL` | ✅ Required | KPay | No |
| `KPAY_USERNAME` | ✅ Required | KPay | No |
| `KPAY_PASSWORD` | ✅ Required | KPay | No |
| `KPAY_RETAILER_ID` | ✅ Required | KPay | No |
| `KPAY_RETURN_URL` | ⚙️ Optional | KPay | No |
| `KPAY_REDIRECT_URL` | ⚙️ Optional | KPay | No |

---

## Database

### `DATABASE_URL`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | 🚫 **Never — server-only** |
| **Example** | `postgresql://pryrox:secret@localhost:5432/pryrox?sslmode=disable` |

PostgreSQL connection string used by Prisma for all application data access. On VPS deployments, point this at your local Postgres instance. URL-encode special characters in the password.

Apply schema migrations with `npm run db:sql:push` (Supabase CLI migration folder) or `npm run db:push` (Prisma).

---

## Auth

Pryrox uses native JWT session cookies (`pryrox_session` / `pryrox_refresh`). SMTP delivers sign-up confirmation and password-reset emails.

### `NATIVE_AUTH_ENABLED`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | No |
| **Default** | `true` when unset |
| **Example** | `true` |

Must be `true` for production. Set to `false` only for emergency rollback during migration.

---

### `AUTH_SECRET`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | 🚫 **Never — server-only** |
| **Example** | `openssl rand -base64 32` |

Secret used to sign and verify native session JWTs. Use at least 32 random characters.

---

## Application

These variables configure the application's own base URL, which is used when constructing absolute URLs for server-to-server requests and payment gateway callbacks.

### `NEXT_PUBLIC_APP_URL`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | Yes (`NEXT_PUBLIC_` prefix) |
| **Example** | `http://localhost:3000` (development) / `https://your-app.vercel.app` (production) |

The canonical public URL of the application. Used by KPay callback URL construction and by any server-side code that needs to build an absolute URL.

---

### `NEXT_PUBLIC_BASE_URL`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | Yes (`NEXT_PUBLIC_` prefix) |
| **Example** | `http://localhost:3000` (development) / `https://your-app.vercel.app` (production) |

An internal base URL used by some API route handlers for server-to-server `fetch` calls. In practice this serves the same purpose as `NEXT_PUBLIC_APP_URL` and should always be set to the same value.

> **Consolidation note:** `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_URL` are functionally identical. A future refactor should consolidate them into a single variable (preferably `NEXT_PUBLIC_APP_URL`) and update all references in `src/` accordingly.

---

## KPay Payment Gateway

These variables configure the KPay mobile money and card payment integration. Obtain your credentials from your KPay merchant account at [pay.esicia.com](https://pay.esicia.com).

### `KPAY_BASE_URL`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | No (used only in server-side API routes) |
| **Example** | `https://pay.esicia.com` |

The base URL of the KPay API. All payment initiation and status-check requests are sent to this host. The default value for the production KPay environment is `https://pay.esicia.com`.

---

### `KPAY_USERNAME`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | No (used only in server-side API routes) |
| **Example** | `merchant_username` |

The merchant username for authenticating with the KPay API. Provided by KPay when your merchant account is created.

---

### `KPAY_PASSWORD`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | No (used only in server-side API routes) |
| **Example** | `merchant_password` |

The merchant password for authenticating with the KPay API. Treat this as a secret — do not log it or include it in client-side bundles.

---

### `KPAY_RETAILER_ID`

| | |
|---|---|
| **Required** | ✅ Yes |
| **Exposed to browser** | No (used only in server-side API routes) |
| **Example** | `RET-00001` |

The retailer identifier assigned to your merchant account by KPay. Included in every payment initiation request to identify the merchant.

---

### `KPAY_RETURN_URL`

| | |
|---|---|
| **Required** | ⚙️ Optional |
| **Exposed to browser** | No (used only in server-side API routes) |
| **Default fallback** | `${NEXT_PUBLIC_APP_URL}/api/kpay/webhook` |
| **Example** | `https://your-app.example.com/api/kpay/webhook` |

The webhook URL that KPay calls with the payment result after a transaction completes. If this variable is not set, the application falls back to constructing the URL from `NEXT_PUBLIC_APP_URL`.

Set this explicitly in production if your app URL differs from the URL that KPay can reach (e.g. when running behind a reverse proxy or using a custom domain).

---

### `KPAY_WEBHOOK_SECRET`

| | |
|---|---|
| **Required** | ⚙️ Optional, recommended for production |
| **Exposed to browser** | No |
| **Example** | `change-me-to-a-long-random-secret` |

When set, `POST /api/kpay/webhook` requires an HMAC-SHA256 signature over the raw request body. Send the hex digest in `x-kpay-signature` or `x-pryrox-signature` (`sha256=<hex>` is also accepted).

---

### `KPAY_REDIRECT_URL`

| | |
|---|---|
| **Required** | ⚙️ Optional |
| **Exposed to browser** | No (used only in server-side API routes) |
| **Default fallback** | `${NEXT_PUBLIC_APP_URL}/payment/success` |
| **Example** | `https://your-app.example.com/payment/success` |

The URL to redirect the customer's browser to after a successful payment. If this variable is not set, the application falls back to constructing the URL from `NEXT_PUBLIC_APP_URL`.

---

## Setting Up

1. Copy `.env.example` to `.env` at the project root:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and replace every placeholder value with your real credentials.
3. Restart the development server (`npm run dev`) so Next.js picks up the new values.

For a full local setup walkthrough, see the [README](../README.md).
