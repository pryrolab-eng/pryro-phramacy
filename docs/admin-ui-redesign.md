# Admin UI redesign — Reports, Subscriptions & Billing

Phased rollout for `/admin/reports`, `/admin/subscriptions`, and `/admin/billing`, aligned with `/admin/stores` patterns and data integrity rules in `docs/entitlements.md`.

## UI standard: `DataTable`

All list views use `@/components/ui/data-table` (TanStack Table). Optional props (use as needed per page):

| Prop | Purpose |
|------|---------|
| `toolbar` | Filters, search, actions above the table |
| `globalFilter` / `onGlobalFilterChange` | Client-side search |
| `manualPagination` / `pageCount` / `paginationState` | Server-side paging |
| `isLoading` / `loadingMessage` | Loading overlay |
| `error` | Inline error banner |
| `onRowClick` | Open detail drawer / navigate |
| `stickyHeader` | Long scroll lists |
| `initialSorting` / `sortingState` | Default or controlled sort |
| `getRowClassName` | Highlight pending / failed rows |
| `emptyMessage` | Zero-state copy |

Do not duplicate raw `<Table>` markup on admin list pages.

## Charts: `PlatformAnalyticsChart`

Reuse `@/components/admin/platform-analytics-chart` (same component as the platform dashboard).

| Prop | Purpose |
|------|---------|
| `data` | From `usePlatformChartData()` → `buildPlatformChartSeries()` |
| `hasPaymentHistory` | Tooltip / description copy |
| `variant` | `"area"` (dashboard default) or `"line"` (reports page) |

Data hook: `usePlatformChartData({ months: 6 \| 12 })` — combines `useAdminReportsSummary` + `useAdminPharmacies`.

---

## Phase 0 — Data audit (1–2 days)

- Document canonical sources: `subscription_plans`, `subscriptions`, `payment_transactions`, `pharmacies.status`.
- SQL checks: branch add-on typed as main, duplicate catalog names, orphan `plan_id`, pending vs active main.
- Repair endpoints mirror `/admin/stores` (reuse `repair-pharmacy-subscription-data`).

**Exit:** Written contract + repair runbook.

---

## Phase 1 — Shared APIs — **done (baseline)**

- `GET /api/admin/billing` — `buildAdminBillingPayload()` (payments, pharmacy billing rows, reconciliation).
- `GET /api/admin/reports-summary` — flat route + shared `buildAdminReportsSummary()`.
- Plan subscriber counts by `plan_id` in `GET /api/admin/plans`.
- `docs/admin-data-contract.md` — canonical display rules.

**Exit:** Typed HTTP modules; admin pages consume DTOs only.

---

## Phase 2 — `/admin/reports` (2–3 days) — **done (baseline)**

**Layout**

- `AdminPageHeader` + KPI cards (cash, MRR, pharmacies, users).
- `PlatformAnalyticsChart` with `variant="line"` (revenue / pharmacies toggles, 6–12 month range).
- `DataTable`: plan breakdown + stored exports.
- Upload form for `platform_admin_reports`.

**Integrity**

- Chart uses payment-backed `revenueData` + pharmacy `created_at` (same as dashboard).
- Plan breakdown still from active subscriptions × catalog price (Phase 1 will join `plan_id`).

---

## Phase 3 — `/admin/subscriptions` — **done (baseline)**

**Layout**

- `AdminPageHeader` + stats row (main plans / branch add-ons / active subs).
- Tabs: **Main plans** | **Branch add-ons** | **Maintenance** (dedupe, Polar, fix catalog).
- Each tab: `DataTable` + edit drawer with `PlanFeatureMatrix`.

**Integrity**

- Subscriber count by `plan_id`.
- Block deactivate when subscribers > 0.
- `plan_type` enforced on save; invalidate plans + pharmacies queries.

---

## Phase 4 — `/admin/billing` — **done (baseline)**

**Layout**

- `AdminPageHeader` + KPI cards (per currency).
- Tabs: **Payments** | **Pharmacy subscriptions** | **Reconciliation**.
- All tabs: `DataTable` with filters in `toolbar`.

**Integrity**

- Payments: `payment_transactions` only.
- Subscriptions: effective main plan, pending change, branch add-on count.
- Row action → store detail (`/admin/stores` modal/API).

---

## Phase 5 — Cross-links — **partial**

- Billing → store detail dialog (row click).
- Subscriptions → link to `/admin/stores`.
- Query invalidation: plan saves invalidate billing + reports.

## Phase 5b — Cross-links (remaining)

- Subscriptions → pharmacies on plan.
- Billing → store detail.
- Shared query invalidation graph (plans, pharmacies, billing).

---

## Phase 6 — Hardening (2–3 days)

- Migrations/backfills for `plan_id`.
- API tests + smoke checklist.
- Remove legacy enum-only plan labels from admin UI.

---

## API fixes (done)

| Issue | Fix |
|-------|-----|
| `GET /api/admin/reports/summary` 404 in dev | Primary: `GET /api/admin/reports-summary`; legacy path retained |
| `GET /api/settings/locations` 404 for platform admin | Return default template locations when no `pharmacy_users` row |
