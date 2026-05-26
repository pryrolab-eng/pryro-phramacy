# React Query migration checklist

**Rule:** Pages and components must not call `fetch()` directly. Use `lib/http` + hooks.

```
lib/http/<domain>.ts  →  fetchJson, query keys, API functions
hooks/use<Domain>.ts  →  useQuery / useMutation
UI                    →  hooks only
```

**Allowed `fetch` outside UI layer:** `lib/http/client.ts`, server `app/api/**`, external gateways (`lib/kpay.ts`).

---

## Phase status

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Conventions + this checklist | Done |
| **1** | POS (`pos/page.tsx`, `quick-pos.tsx`) | Done |
| **2** | Inventory (`inventory/page.tsx`) | Done |
| **3** | Settings (`settings/page.tsx`) | Done |
| **4** | Pharmacist dashboard | Done |
| **5** | Onboarding + subscription plan UI | Done |
| **6** | Sales, reports, prescriptions, customers, patients | Done |
| **7** | Chart widgets + small components | Done |
| **8** | `checkout-client.ts` + `useSaasSubscription.ts` | Done |

---

## Completed HTTP modules

- [x] `lib/http/client.ts` — low-level client
- [x] `lib/http/admin/*` — platform admin
- [x] `lib/http/staff.ts` — staff CRUD
- [x] `lib/http/pharmacist.ts` — create pharmacist / invite
- [x] `lib/http/pharmacy-dashboard.ts` — pharmacy owner dashboard
- [x] `lib/http/insurance.ts` — providers (partial)
- [x] `lib/http/catalog.ts` — categories catalog
- [x] `lib/http/settings-locations.ts` — stock locations

---

## Phase 1 — POS (detail)

**Files to migrate**

- [x] `src/app/(dashboard)/pos/page.tsx`
- [x] `src/components/quick-pos.tsx`
- [x] `src/components/payment/POSPaymentDialog.tsx` (status poll)

**Create**

- [x] `lib/http/pos.ts` + `posKeys`
- [x] `lib/http/customers.ts`, `lib/http/saas-branches.ts`, `lib/http/kpay.ts`
- [x] `hooks/usePos.ts`, `hooks/useKpay.ts`
- [x] Insurance POS helpers in `lib/http/insurance.ts`

**Endpoints**

- `GET /api/pos/products`
- `GET /api/pos/products?fastMoving=true`
- `GET /api/categories`
- `GET /api/customers?q=`
- `GET /api/insurance/pricing`
- `GET /api/saas/branches`
- `GET /api/saas/usage/check`
- `POST /api/saas/usage/increment`
- `POST /api/pos/sale`
- `POST /api/pos/hold-sale`
- `GET /api/pos/customer-lookup`
- `GET /api/pos/price-check`
- `POST /api/pos/void-sale`
- `POST /api/insurance/lookup` + `process`
- `POST /api/pos/quick-add-patient`
- `POST /api/pos/returns`
- `POST /api/ai-safety`

---

## Phase 2 — Inventory (detail)

- [x] `src/app/(dashboard)/inventory/page.tsx` (13 fetch calls removed)
- [x] `lib/http/inventory.ts`
- [x] `hooks/useInventory.ts`
- [x] `createPharmacyCategory` in `lib/http/catalog.ts`

---

## Phase 3 — Settings (detail)

- [x] `src/app/(dashboard)/settings/page.tsx` (20 fetch calls removed)
- [x] `lib/http/pharmacy-settings.ts`, `pharmacy-branding.ts`, `billing.ts`
- [x] `lib/http/settings-security.ts`, `settings-api-keys.ts`
- [x] `hooks/usePharmacySettingsPage.ts` (reuses `settings-locations.ts`)

---

## Phase 4 — Pharmacist dashboard

- [x] `src/app/(dashboard)/pharmacist-dashboard/page.tsx` (7 fetch calls removed)
- [x] `lib/http/pharmacist-dashboard.ts` + `hooks/usePharmacistDashboard.ts`
- [x] Reuses `getStockAlerts` from `pharmacy-dashboard.ts`

---

## Phase 5 — Onboarding + subscription UI

- [x] `onboarding-form.tsx` (6 fetch calls removed)
- [x] `subscription-plan-management.tsx` (7)
- [x] `payment-success-content.tsx` (2)
- [x] `lib/subscription/checkout-client.ts` → delegates to `lib/http/subscription.ts` + `kpay`
- [x] `branch-addon-checkout-dialog.tsx` (polar config)

---

## Phase 6 — Secondary pages

- [x] `sales/page.tsx` — `useSalesList`, `useSalesAnalytics`
- [x] `reports/page.tsx` — `useReportsSales`, `useReportsInventory`, `useInvalidateReports`
- [x] `prescriptions/page.tsx` — `usePrescriptions`, create/update mutations
- [x] `customers/page.tsx` — `useCustomers`, `useCreateCustomerMutation`
- [x] `patients/page.tsx` — `useCustomers` (shared list key)

**HTTP / hooks**

- [x] `lib/http/sales.ts`, `reports.ts`, `prescriptions.ts`
- [x] `lib/http/customers.ts` — list + create + `customersKeys.list`
- [x] `hooks/useSales.ts`, `useReports.ts`, `usePrescriptions.ts`, `useCustomers.ts`

---

## Phase 7 — Components

- [x] `pharmacy-bar-chart.tsx`, `pharmacy-radial-chart.tsx`, `pharmacy-inventory-chart.tsx` — chart hooks on `pharmacy-dashboard`
- [x] `polar-pricing.tsx` — `usePublicMainPlans`
- [x] `insurance-selector.tsx`, `insurance-price-manager.tsx` — `useInsuranceProviders`, `useUploadInsurancePricingMutation`
- [x] `invoice-editor.tsx` — `useInvoiceTemplate`, `useUpdateInvoiceTemplateMutation`
- [x] `forgot-password-form.tsx`, `verify-2fa-form.tsx` — `useSendRecoveryEmailMutation`, `useVerify2FAMutation`
- [x] `PaymentForm.tsx` — `useInitiateKpayPaymentMutation`
- [x] `branch-addon-checkout-dialog.tsx` — already migrated (Phase 5)
- [x] `hooks/useBranding.ts`, `hooks/useRealtimeUpdates.ts` — React Query polling

**HTTP / hooks added**

- [x] Chart getters on `lib/http/pharmacy-dashboard.ts`
- [x] `lib/http/platform-branding.ts`, `invoice-template.ts`, `auth.ts`, `realtime.ts`
- [x] `initiateKpayPayment`, `uploadInsurancePricing` extensions
- [x] `hooks/useInvoiceTemplate.ts`, `useAuth.ts`, `usePlans.ts`; chart hooks on `usePharmacyDashboard`

---

## Phase 8 — Lib consolidation

- [x] `lib/subscription/checkout-client.ts` — re-exports `lib/http/subscription.ts` + `pollKpay` via `lib/http/kpay`
- [x] `lib/http/saas.ts` — SaaS plans, subscription, invoices, admin subscriptions
- [x] `lib/http/saas-branches.ts` — `createSaasBranch` added
- [x] `hooks/useSaasSubscription.ts` — all queries/mutations use HTTP layer
- [x] `admin/subscriptions/page.tsx` — `updateAdminPlan` (returns `plan` + `polarSync`)
- [x] `pharmacy-dashboard/billing/page.tsx` — `useGenerateSaasInvoiceMutation`
