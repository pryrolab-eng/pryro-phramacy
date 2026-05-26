# Entitlements

Pryrox gates pharmacy capabilities by subscription plan using a database-backed feature catalog.

## Tables

- **`platform_features`** — Master catalog (`key`, `display_name`, `group`, `feature_type`, `nav_routes`, `limit_column`).
- **`plan_features`** — Which boolean features each `subscription_plans` row enables.
- **`subscription_plans`** — Numeric limits (`max_users`, `max_branches`, `monthly_tx_limit`) and marketing `features[]` (synced from catalog display names).

## Runtime

- **`resolvePharmacyEntitlements`** (`src/lib/subscription/lifecycle/entitlements.ts`) — Single resolver per pharmacy; uses the **effective** plan (scheduled downgrades keep current plan until effective date).
- **`requirePharmacyEntitlement`** (`src/lib/subscription/assert-entitlement.ts`) — API guards; returns 403 with upgrade hint.
- **`GET /api/entitlements`** — Client-safe snapshot for `usePharmacyEntitlements`.

## Feature keys (initial catalog)

| Group | Key | Notes |
|-------|-----|-------|
| Core | `app.dashboard` | Dashboard access |
| POS | `pos.access`, `pos.hold`, `pos.void`, `pos.returns`, `pos.insurance` | POS + insurance billing |
| Inventory | `inventory.access`, `inventory.analytics` | Stock management |
| CRM | `customers.access`, `patients.access`, `prescriptions.access` | |
| Sales/Reports | `sales.view`, `reports.view` | |
| Branches | `branches.access`, `branches.create` | |
| Staff | `staff.access`, `staff.invite` | Invite enforces `limit.users` |
| Settings | `settings.access` | Always allowed when subscribed |
| Billing | `billing.self_serve` | Self-serve plan changes |
| Limits | `limit.users`, `limit.branches`, `limit.transactions_per_branch` | Values from plan columns |

## Enforcement

- **API** — Fail-closed on mutating routes (POS sale, staff invite, branches, inventory writes).
- **UI** — Sidebars hide locked nav items by default (`NEXT_PUBLIC_NAV_ENTITLEMENT_MODE=hide`); set to `lock` to show items with a lock + billing CTA. `FeatureRouteGuard` redirects direct URL access to billing with `?upgrade=<key>`. Billing shows an **Unlock …** banner and opens the plans tab. In-page gates: `FeatureGate` on POS insurance, inventory analytics, staff invite.
- **`ENTITLEMENTS_ENFORCE`** — Set to `false` only for staged rollout; default is enforced when unset or `true`.

## Admin

- **`/admin/features`** — Edit catalog labels and nav routes (keys are immutable after create).
- **`/admin/subscriptions`** — Plan matrix selects `plan_features`; marketing `features[]` syncs automatically.
- **Admin UI redesign** — Phased plan for `/admin/subscriptions` and `/admin/billing` (DataTable, data integrity): see `docs/admin-ui-redesign.md`.

## Polar

Polar product descriptions use `subscription_plans.features` (catalog display names) after plan save.

## Database migrations

Apply pending SQL under `supabase/migrations/` to your linked Supabase project:

```bash
npm install
supabase link   # once per machine / project
npm run db:migrate
```

Use `npm run db:migrate:all` if the CLI reports skipped migrations. For a fresh local stack: `npm run db:reset` (destructive).
