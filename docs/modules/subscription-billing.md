# Subscription & Billing Module

## Purpose

The Subscription & Billing module manages the commercial lifecycle of every pharmacy tenant on the Pryrox platform. It covers plan selection, payment processing via the **KPay** payment gateway, subscription activation, expiry enforcement, and plan management by platform administrators.

The module has two distinct audiences:

- **Pharmacy owners** — select a plan, initiate payment (Mobile Money or card), and renew or upgrade their subscription through the Settings page.
- **Superadmins / platform admins** — create, edit, and deactivate subscription plans through the Admin Subscriptions dashboard.

When a pharmacy's subscription expires, the `SubscriptionBlocker` component intercepts all dashboard navigation and forces the owner to the Settings page to renew. Non-owner staff see a "contact your pharmacy owner" message and cannot access any features until the subscription is renewed.

---

## Key Files

### Pages

| File | Route | Description |
|---|---|---|
| `src/app/(dashboard)/settings/page.tsx` | `/settings` | Primary subscription management UI for pharmacy owners. Displays current plan, days remaining, a countdown timer, and a plan comparison grid with upgrade buttons. Hosts the KPay payment dialog. |
| `src/app/(dashboard)/admin/subscriptions/page.tsx` | `/admin/subscriptions` | Admin-only plan management dashboard. Lists all active plans with subscriber counts, and provides Create / Edit dialogs. |
| `src/app/payment-success/page.tsx` | `/payment-success` | Post-payment landing page. Automatically polls `/api/kpay/status` to confirm payment completion and displays success or failure feedback. |
| `src/app/pharmacy/page.tsx` | `/pharmacy` | Standalone (non-dashboard) pharmacy overview page. Displays the current `subscription_plan` value from the `pharmacies` table. |

### API Routes

| File | Route | Methods | Description |
|---|---|---|---|
| `src/app/api/plans/route.ts` | `/api/plans` | `GET` | Public endpoint. Returns all active plans from `subscription_plans`, ordered by price ascending. Falls back to three hardcoded plans (Free, Standard, Premium) if the database query fails. |
| `src/app/api/subscriptions/status/route.ts` | `/api/subscriptions/status` | `GET`, `POST` | `GET`: Returns the authenticated user's current subscription status, plan details, days remaining, and a time counter object. `POST`: Creates a new subscription record for a given plan name; free plans are activated immediately. |
| `src/app/api/subscriptions/upgrade/route.ts` | `/api/subscriptions/upgrade` | `POST` | Deactivates all existing subscriptions for the pharmacy, creates a new subscription record (inactive for paid plans), and optionally links a `payment_transactions` record. |
| `src/app/api/kpay/initiate/route.ts` | `/api/kpay/initiate` | `POST` | Validates phone/card input, creates a `payment_transactions` record, calls `kpayService.initiatePayment()`, logs the request/response, and returns the KPay transaction ID and checkout URL. |
| `src/app/api/kpay/webhook/route.ts` | `/api/kpay/webhook` | `POST` | Receives asynchronous payment status callbacks from KPay. Updates `payment_transactions.status` and activates the linked subscription when `statusid === '01'`. Uses the **service role key** (bypasses RLS) because the request originates from KPay, not an authenticated user. |
| `src/app/api/kpay/status/route.ts` | `/api/kpay/status` | `GET` | Polls KPay for the current status of a transaction (by `transactionId`, `refid`, or `tid`). Updates the local `payment_transactions` record and activates the subscription on completion. |
| `src/app/api/payments/route.ts` | `/api/payments` | `GET`, `POST` | `GET`: Returns a list of completed sales formatted as payment records (not subscription payments). `POST`: Legacy endpoint for direct plan assignment without KPay; handles free-plan upgrades and creates invoice records. |

### Library

| File | Description |
|---|---|
| `src/lib/kpay.ts` | `KPayService` class. Wraps all KPay API calls: `initiatePayment()`, `checkTransactionStatus()`. Reads credentials from environment variables. Provides `getErrorMessage(retcode)` and `getBankName(bankId)` helpers. A singleton `kpayService` instance is exported for use in API routes. |
| `src/lib/phone-validator.ts` | `PhoneNumberValidator` class. Validates and formats Rwandan phone numbers. Provides `getKPayBankId(phone)` to map MTN/Airtel numbers to their KPay bank IDs (`63510` / `63514`). |
| `src/lib/card-validator.ts` | `CardValidator` class. Validates card number (Luhn), expiry, CVV, and cardholder name. Provides `getKPayBankId()` returning `'000'` for Visa/Mastercard. |

### Components

| File | Description |
|---|---|
| `src/components/subscription-blocker.tsx` | Client component rendered by the dashboard layout. When `isExpired` is `true`, renders a full-screen modal overlay and redirects the user to `/settings`. Pharmacy owners see a "Renew Subscription Now" button; other roles see a "contact your pharmacy owner" message. |
| `src/components/pharmacy-sidebar.tsx` | Displays the current `subscription_plan` and days remaining in the sidebar footer for pharmacy owners. |
| `src/components/pharmacist-sidebar.tsx` | Displays the current `subscription_plan` and days remaining in the sidebar footer for pharmacists. |
| `src/components/payment/PaymentForm.tsx` | Reusable payment form component. Accepts `amount`, `saleId`, and `subscriptionId` props. Calls `/api/kpay/initiate` and surfaces success/error callbacks. |

### Database Functions (Supabase)

| File | Function | Description |
|---|---|---|
| `supabase/migrations/20250101000001_subscription_expiry_functions.sql` | `check_expired_subscriptions()` | Sets `pharmacies.status = 'suspended'` for all pharmacies where `subscription_expires_at <= now()` and status is `active` or `trial`. Intended to run as a daily cron job. |
| `supabase/migrations/20250101000001_subscription_expiry_functions.sql` | `get_subscription_status(pharmacy_uuid)` | Returns a row with `is_active`, `days_remaining`, `is_expired`, `is_expiring_soon`, `subscription_plan`, and `expires_at` for a given pharmacy. |

---

## Database Tables

### `subscription_plans`

Stores the available billing tiers. Managed by superadmins and platform admins.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Plan name (e.g., `Free`, `Standard`, `Premium`) |
| `price` | `decimal(10,2)` | Price in RWF. `0` for the free plan. |
| `period` | `text` | Billing period: `forever`, `per month`, `per year` |
| `features` | `text[]` | Array of feature strings displayed in the plan card |
| `is_active` | `boolean` | Whether the plan is visible to pharmacy owners (default `true`) |
| `is_popular` | `boolean` | Highlights the plan with a "Most Popular" badge |
| `created_by` | `uuid` | FK → `auth.users.id`; the admin who created the plan |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

**Default seed data** (from migration `20240323000001`):

| Name | Price | Period |
|---|---|---|
| Free | 0 RWF | forever |
| Standard | 50,000 RWF | per month |
| Premium | 120,000 RWF | per month |

A fourth "VIP" plan (350,000 RWF/month) appears in the integration test report but is not in the migration seed data.

**Indexes:** `idx_subscription_plans_active` on `is_active`.

**Realtime:** Enabled (`supabase_realtime` publication).

---

### `subscriptions`

Tracks each pharmacy's subscription record. A pharmacy may have multiple rows; only the row with `is_active = true` is the current subscription.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE) |
| `plan` | `subscription_plan` enum | Plan identifier (`trial`, `standard`, `premium`) — **note:** this is the original enum column from the base schema |
| `plan_id` | `uuid` | FK → `subscription_plans.id` — added by the upgrade flow; links to the `subscription_plans` table |
| `start_date` / `created_at` | `timestamptz` | Subscription start time |
| `end_date` / `expires_at` | `timestamptz` | Subscription expiry time. Added by migration `20241203000002`. |
| `is_active` | `boolean` | Whether this subscription is currently active (default `true`) |
| `amount` | `decimal(10,2)` | Amount paid in RWF |
| `currency` | `text` | Currency code (default `RWF`) |
| `payment_method` | `text` | Payment method used (e.g., `kpay`). Added by migration `20241203000002`. |
| `payment_reference` | `text` | KPay transaction ID (`kpay_tid`) set by the `handle_payment_completion` trigger |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |

> **Schema note:** The `subscriptions` table has two overlapping column sets. The original schema (migration `20240322000001`) uses `plan` (enum), `start_date`, and `end_date`. The upgrade flow (`/api/subscriptions/upgrade`) inserts using `plan_id` (UUID FK) and `expires_at`. Migration `20241203000002` adds `expires_at` and `payment_method` as `ALTER TABLE` additions. Both column sets coexist in the live table.

**Realtime:** Enabled.

---

### `payment_transactions`

Records every KPay payment attempt, whether for a subscription or a POS sale.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacy_id` | `uuid` | FK → `pharmacies.id` (CASCADE DELETE) |
| `sale_id` | `uuid` | FK → `sales.id` (SET NULL); populated for POS payments |
| `subscription_id` | `uuid` | FK → `subscriptions.id` (SET NULL); populated for subscription payments |
| `kpay_tid` | `text` | KPay transaction ID (unique); returned by KPay on initiation |
| `kpay_refid` | `text` | Internal reference ID (`PYX-<timestamp>-<random>`); unique per transaction |
| `kpay_authkey` | `text` | KPay authentication key returned on initiation |
| `kpay_checkout_url` | `text` | KPay-hosted checkout URL for card payments |
| `amount` | `decimal(10,2)` | Transaction amount in RWF |
| `currency` | `text` | Currency code (default `RWF`) |
| `payment_method` | `text` | `momo`, `cc`, `bank`, `spenn`, or `smartcash` |
| `bank_id` | `text` | KPay bank/provider ID (e.g., `63510` for MTN MoMo) |
| `bank_name` | `text` | Human-readable bank/provider name |
| `customer_name` | `text` | Payer's name |
| `customer_phone` | `text` | Payer's phone number (formatted) |
| `customer_email` | `text` | Payer's email address |
| `status` | `text` | `pending` → `processing` → `completed` / `failed` / `cancelled` |
| `kpay_status_id` | `text` | KPay status code: `01` = success, `02` = failed, `03` = processing |
| `kpay_status_desc` | `text` | Human-readable status description from KPay |
| `mom_transaction_id` | `text` | Mobile money network transaction ID |
| `pay_account` | `text` | Account that completed the payment (from webhook) |
| `card_last_four` | `text` | Last 4 digits of card (masked; card payments only) |
| `card_brand` | `text` | Card brand (e.g., `Visa`, `Mastercard`) |
| `error_message` | `text` | Error description for failed transactions |
| `webhook_received_at` | `timestamptz` | Timestamp when the KPay webhook was received |
| `completed_at` | `timestamptz` | Set by the `handle_payment_completion` trigger on status → `completed` |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp (auto-updated by trigger) |

**Indexes:** `pharmacy_id`, `sale_id`, `kpay_tid`, `kpay_refid`, `status`, `created_at`.

**Trigger:** `handle_payment_completion_trigger` — on `status` transitioning to `completed`, sets `completed_at`, updates the linked `sales` record's payment method, and sets `subscriptions.is_active = true`.

**Realtime:** Enabled.

---

### `payment_logs`

Append-only audit log of every KPay API interaction for a transaction.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `transaction_id` | `uuid` | FK → `payment_transactions.id` (CASCADE DELETE) |
| `event_type` | `text` | `request`, `response`, `webhook`, or `status_check` |
| `payload` | `jsonb` | Outbound request body sent to KPay |
| `response` | `jsonb` | Inbound response received from KPay |
| `error_message` | `text` | Error description if the API call failed |
| `created_at` | `timestamptz` | Log entry timestamp |

---

### `pharmacies` (subscription-relevant columns)

The `pharmacies` table carries a denormalized subscription state used by the dashboard layout for fast expiry checks.

| Column | Type | Description |
|---|---|---|
| `subscription_plan` | `subscription_plan` enum | Current plan: `trial`, `standard`, `premium` |
| `subscription_expires_at` | `timestamptz` | Expiry timestamp; checked by `SubscriptionBlocker` and `check_expired_subscriptions()` |
| `status` | `text` | `active`, `trial`, or `suspended`; set to `suspended` by `check_expired_subscriptions()` |

---

## User Roles and Access

| Role | Access |
|---|---|
| `superadmin` | Not subject to subscription enforcement (bypassed in `layout.tsx`). Can view all pharmacy subscriptions via the superadmin dashboard. |
| `pharmacy_owner` | Full access: view current plan, initiate upgrades, complete KPay payments. Redirected to `/settings` when subscription is expired. |
| `pharmacist` | Read-only: sees plan name and days remaining in the sidebar. Blocked by `SubscriptionBlocker` when expired; directed to contact the pharmacy owner. |
| `cashier` | Same as `pharmacist` — blocked when expired, no self-service renewal. |
| `staff` | Same as `pharmacist`. |
| `admin` (platform) | Can create, edit, and deactivate plans via `/admin/subscriptions`. Can initiate plan changes via `POST /api/payments` (role check: `pharmacy_owner` or `admin`). |

---

## KPay Payment Flow

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `KPAY_BASE_URL` | Yes | KPay API endpoint (default: `https://pay.esicia.com`) |
| `KPAY_USERNAME` | Yes | KPay merchant username |
| `KPAY_PASSWORD` | Yes | KPay merchant password (used in HTTP Basic Auth) |
| `KPAY_RETAILER_ID` | Yes | KPay retailer identifier |
| `KPAY_RETURN_URL` | No | Webhook callback URL (defaults to `{APP_URL}/api/kpay/webhook`) |
| `KPAY_REDIRECT_URL` | No | Post-payment redirect URL (defaults to `{APP_URL}/payment/success`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL; used to construct callback URLs |

### Supported Payment Methods

| Method | `pmethod` | `bankid` | Description |
|---|---|---|---|
| MTN Mobile Money | `momo` | `63510` | User receives a PIN prompt on their phone |
| Airtel Money | `momo` | `63514` | User receives a PIN prompt on their phone |
| Visa / Mastercard | `cc` | `000` | User redirected to KPay-hosted checkout page |
| Bank transfer | `bank` | varies | Bank-specific ID |
| Spenn | `spenn` | `63502` | Digital wallet |
| SmartCash | `smartcash` | `63501` | Digital wallet |

### Mobile Money Payment Flow

```
1. Pharmacy owner opens Settings → Subscription Plans
         │
         ▼
2. Clicks "Upgrade" on a paid plan
         │
         ▼
3. Upgrade dialog opens (plan name, amount in RWF, payment method selector)
         │
         ▼
4. Owner enters phone number and email, selects Mobile Money
         │
         ▼
5. POST /api/subscriptions/upgrade
         │  Deactivates existing subscriptions
         │  Creates new subscription (is_active = false)
         │  Returns subscription.id
         ▼
6. POST /api/kpay/initiate
         │  Validates phone number (PhoneNumberValidator)
         │  Generates refid: PYX-<timestamp>-<random>
         │  Inserts payment_transactions row (status = 'pending')
         │  Logs request to payment_logs
         │  Calls kpayService.initiatePayment() → KPay API
         │  Logs response to payment_logs
         │  Updates payment_transactions (status = 'processing', kpay_tid set)
         │  Returns { transaction.id, tid, checkoutUrl }
         ▼
7. KPay sends USSD/push prompt to user's phone
         │
         ▼
8. User enters PIN on phone
         │
         ▼
9. KPay processes payment
         │
         ├─── Path A: Webhook (asynchronous)
         │         POST /api/kpay/webhook
         │         Receives { tid, refid, statusid, momtransactionid }
         │         Logs to payment_logs (event_type = 'webhook')
         │         Updates payment_transactions.status
         │         If statusid = '01': sets subscriptions.is_active = true
         │
         └─── Path B: Status polling (client-initiated)
                   GET /api/kpay/status?transactionId=<id>
                   Calls kpayService.checkTransactionStatus(tid, refid)
                   Logs to payment_logs (event_type = 'status_check')
                   Updates payment_transactions.status
                   If statusid = '01': sets subscriptions.is_active = true
         │
         ▼
10. Client polls every 5 seconds (up to ~60 seconds)
         │
         ▼
11. On completion: subscription is active, UI updates
```

### Card Payment Flow

```
1–6. Same as Mobile Money (steps 1–6 above)
         │
         ▼
7. KPay returns checkout URL (kpay_checkout_url)
         │
         ▼
8. User is redirected to KPay-hosted checkout page
         │
         ▼
9. User enters card details on KPay page
         │
         ▼
10. KPay processes payment and redirects to KPAY_REDIRECT_URL (/payment-success)
         │
         ▼
11. /payment-success page polls GET /api/kpay/status
         │
         ▼
12. KPay also sends webhook to KPAY_RETURN_URL (/api/kpay/webhook)
         │
         ▼
13. Subscription activated via webhook or status poll (whichever arrives first)
```

### KPay Status Codes

| `statusid` | `retcode` | Meaning |
|---|---|---|
| `01` | — | Payment completed successfully |
| `02` | — | Payment failed |
| `03` | — | Payment processing (pending) |
| — | `0` | No error; transaction being processed |
| — | `600` | Invalid username/password |
| — | `601` | Invalid remote user |
| — | `602` | IP not whitelisted |
| — | `603` | Missing required parameters |
| — | `604` | Unknown retailer |
| — | `607` | Failed mobile money transaction |
| — | `608` | Duplicate `refid` |
| — | `609` | Unknown payment method |
| — | `610` | Unknown or disabled financial institution |
| — | `611` | Transaction not found |

---

## Subscription Expiry Enforcement

### Dashboard Layout Check

`src/app/(dashboard)/layout.tsx` runs on every dashboard page load as a **server component**. It queries `pharmacies.status` and `pharmacies.subscription_expires_at` for the authenticated user's pharmacy:

```typescript
isSubscriptionExpired = pharmacy.status === 'suspended' ||
  (pharmacy.subscription_expires_at && new Date(pharmacy.subscription_expires_at) < new Date())
```

Superadmins are exempt from this check.

### SubscriptionBlocker Component

`src/components/subscription-blocker.tsx` receives `isExpired` and `userRole` as props from the layout. When `isExpired` is `true`:

1. A `useEffect` hook redirects the user to `/settings` if they are not already there.
2. A full-screen modal overlay (`z-50`, `backdrop-blur-sm`) is rendered over all page content.
3. Pharmacy owners see a "Renew Subscription Now" button that navigates to `/settings`.
4. All other roles see a message directing them to contact the pharmacy owner.

The blocker does **not** render when `pathname.includes('/settings')`, allowing the owner to access the renewal UI.

### Automated Expiry via Database Function

The `check_expired_subscriptions()` PostgreSQL function (migration `20250101000001`) updates `pharmacies.status = 'suspended'` for all pharmacies where `subscription_expires_at <= now()`. This function is **not automatically scheduled** — it must be invoked by an external cron job or Supabase Edge Function scheduler. Without this job running, the `status` column may remain `active` even after expiry; the layout's direct timestamp comparison (`subscription_expires_at < new Date()`) still catches expired subscriptions in that case.

### Expiry Warning

The `GET /api/subscriptions/status` response includes a `timeCounter` object:

```json
{
  "timeCounter": {
    "days": 3,
    "hours": 14,
    "minutes": 22,
    "isExpiring": true,
    "isExpired": false
  }
}
```

`isExpiring` is `true` when 7 or fewer days remain. The sidebar components display a days-remaining badge and an "Upgrade to Premium" link when the plan is not `premium`.

---

## Admin Plan Management

Platform admins access `/admin/subscriptions` to manage the plan catalog. The page calls `/api/admin/plans` (a separate route group not under `/api/plans`) for CRUD operations.

**Capabilities:**
- View all plans with subscriber counts (subscriber count is currently hardcoded to `0` — see Known Limitations)
- Create new plans (name, price in RWF, billing period, comma-separated features)
- Edit existing plans (name, price, features, popular flag)
- Plans are not deleted; they are deactivated via `is_active = false`

---

## Known Limitations

### 1. KPay credentials are not production-ready

All test reports confirm that the KPay API is reachable but returns `retcode: 600` (invalid credentials) with the current environment configuration. Real production credentials, IP whitelisting by KPay, and end-to-end payment testing have not been completed. The integration is code-complete but **not verified with live payments**.

### 2. No webhook signature verification

`POST /api/kpay/webhook` accepts any POST request that contains a valid `refid` matching a `payment_transactions` row. There is no HMAC signature or shared secret verification to confirm the request genuinely originates from KPay. A malicious actor who knows a valid `refid` could forge a webhook and activate a subscription without payment.

### 3. `check_expired_subscriptions()` has no scheduler

The database function that suspends expired pharmacies is defined but never called automatically. Without a cron job or Supabase Edge Function scheduler invoking it daily, `pharmacies.status` will not be updated to `suspended` on expiry. The dashboard layout's direct timestamp comparison still blocks access, but the `status` column will be stale.

### 4. Dual schema in `subscriptions` table

The `subscriptions` table has two overlapping column sets from different migration phases:
- Original: `plan` (enum), `start_date`, `end_date`
- Added later: `plan_id` (UUID FK to `subscription_plans`), `expires_at`, `payment_method`

The upgrade flow inserts using the newer columns (`plan_id`, `expires_at`), while the status endpoint queries using `is_active` and `expires_at`. The original `plan` enum column is not populated by the upgrade flow, creating partially-filled rows.

### 5. Subscriber count is not implemented

The admin subscriptions page displays `0` active subscribers for every plan. The `users` field is hardcoded to `0` in the `fetchPlans` function with a `// TODO: Get actual subscriber count` comment.

### 6. `POST /api/payments` uses `alert()` for errors

The settings page's `processUpgradePayment` function calls `alert(paymentData.kpayResponse?.statusdesc || 'Payment failed. Please try again.')` on payment failure. This is a development-era pattern that should be replaced with a proper toast or inline error message before production.

### 7. No auto-renewal or grace period

There is no auto-renewal mechanism. When a subscription expires, access is immediately blocked. There is no grace period, no email reminder system, and no prorated upgrade/downgrade logic.

### 8. Free plan activation is inconsistent

`POST /api/subscriptions/status` activates free plans immediately (`is_active: plan.price === 0`). `POST /api/subscriptions/upgrade` also sets `is_active = plan.price === 0`. However, `POST /api/payments` (the legacy endpoint) always sets `is_active: false` for KPay flows regardless of price, and handles free plans by directly updating `pharmacies.subscription_plan` without creating a `subscriptions` row. The two code paths are not synchronized.

### 9. `/api/admin/subscriptions` returns 404

The integration test report notes that `GET /api/admin/subscriptions` returns 404. The admin subscriptions page uses `/api/admin/plans` instead. There is no unified admin endpoint for viewing all pharmacy subscriptions system-wide.

### 10. No refund or cancellation flow

There is no API route or UI for processing refunds, cancelling a subscription mid-period, or handling chargebacks. The `payment_transactions` table has a `cancelled` status value but no code path sets it.
