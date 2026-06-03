# Pharmacy tenant & branch context

## Hierarchy

```text
Owner user
  → pharmacy_users (membership + role)
  → Pharmacy (tenant / legal entity)
      → Headquarters (HQ) — main stocking & distribution site (always one per tenant)
      → Satellite branches (optional) — own stock; receive drugs from HQ via transfers
      → Staff, inventory, sales, reports
```

### HQ vs satellite branches (real-world model)

| Location | Role | Stock |
|----------|------|--------|
| **Headquarters (HQ)** | Main site; procurement, central warehouse | Receives purchases / imports; sends stock to branches |
| **Satellite branch** | Retail outlet (optional, plan slots) | Branch-specific `inventory.branch_id`; no automatic copy from HQ |

- A **single-site** pharmacy is just **HQ** — no extra branches required.
- **Multi-site** pharmacies add branches under **Branches**; staff transfer stock **from HQ → branch** in Inventory.
- POS and inventory always scope to the **active location** (HQ or a branch) via `BranchSwitcher`.

## Active context (implemented)

| Field | Table | Purpose |
|-------|--------|---------|
| `active_pharmacy_id` | `users` | Selected tenant for API queries |
| `active_branch_id` | `users` | Selected branch within tenant |

**Resolution:** [`src/lib/pharmacy/active-pharmacy.ts`](../src/lib/pharmacy/active-pharmacy.ts)

**APIs:**

- `GET /api/me/context` — memberships + active ids
- `POST /api/me/active-pharmacy` — switch tenant (resets branch to default)
- `POST /api/me/active-branch` — switch branch

**Client:** `ActivePharmacyProvider`, `useActivePharmacy()`, user menu + global `BranchSwitcher` in `DashboardShellBar`.

**Server:** `getRequestPharmacyId()` and `requireSessionPharmacyId()` use active pharmacy.

## Branch scope (reports & dashboard)

Query params: `branchId`, `from`, `to` via [`branch-scope.ts`](../src/lib/pharmacy/branch-scope.ts).

- **Active branch** (`BranchSwitcher`) — POS checkout, default context
- **Report scope** (`BranchScopeFilter`) — “All branches” vs one branch on dashboard/reports; does not change active branch

Scoped APIs: `/api/pharmacy/dashboard`, `/api/reports/sales`, `/api/pos` (recent), pharmacy sales charts.

## Per-branch stock (Phase 2c)

- `inventory.branch_id` in `20260527130000_inventory_branch_id.sql`
- POS product list and checkout decrement stock for the **active branch** only
- New stock (inventory add, quick-add drug) is assigned to the active branch
- Inventory list API accepts optional `branchId` query (report scope filter)

Apply migration: `npm run db:migrate`

## Roles & navigation (Phase 3)

| Role | Sidebar |
|------|---------|
| `pharmacy_owner` | Full pharmacy nav |
| `pharmacist` | Pharmacist nav |
| `cashier`, `staff` | POS-focused cashier nav |

Layout uses **active pharmacy role** from `resolveActivePharmacyContext`, not the first `pharmacy_users` row.

## Branch stock transfers

- `POST /api/inventory/transfers` with `productId`, `fromBranchId`, `toBranchId`, `quantity`
- Typical flow: **from HQ** (`is_headquarters`) **to** a satellite branch
- Deducts source branch row; merges or creates destination row (same medication + batch)

Migration: `20260529120000_branches_headquarters.sql` adds `branches.is_headquarters`. Auto-provisioned site is **Headquarters (HQ)** (`src/lib/pharmacy/branch-hq.ts`).

## Staff branch access

- Table `staff_branch_assignments` (`20260527140000_staff_branch_assignments.sql`)
- No rows for a staff member = all branches (default)
- With rows = branch switcher limited to those branches
- Owners manage via `PUT /api/staff/[pharmacyUserId]/branches` with `{ branchIds: [] }` (empty = unrestricted)

## Activity log

- `GET /api/pharmacy/activity-logs` — pharmacy-scoped `audit_logs`
- UI: `/activity` (Reports entitlement)

## Dashboard UI kit

Reusable components live under [`src/components/dashboard/`](../src/components/dashboard/). Import from `@/components/dashboard`:

| Component | Use for |
|-----------|---------|
| `DashboardPageShell` | Page background + max width |
| `DashboardPageHeader` | Title, description, toolbar (shows ⌘K hint) |
| `DashboardStatCard` | KPI metrics |
| `DashboardMetricGrid` | Stat card layout |
| `DashboardSectionCard` | Lists, widgets, panels |
| `DashboardChartCard` | Charts (wraps `ChartContainer`) |
| `DashboardButton` / `DashboardToolbar` | All actions (`outline`, `primary`, `ghost`, `destructive`) |
| `DashboardDialog*` / `DashboardDialogActions` | Modals: `Content`, `Header`, `Title`, `Description`, `Body`, `Footer` |
| `DashboardAlertDialog*` / `DashboardAlertDialogActions` | Confirmations (destructive uses `confirmTone`) |
| `DashboardTabsList` | Tab navigation |
| `DashboardCommandPalette` | Global ⌘K / Ctrl+K (mounted in dashboard layout) |
| `DashboardFilterBar` / `DashboardFilterField` | Report filters |
| `DashboardTableCard` | Tables with toolbar |
| `DashboardSearchInput` | Search fields |
| `DashboardListRow` | List items inside sections |
| `DashboardProgressTrack` | Progress bars |
| `DashboardStaffCard` | Staff/member grid cards |
| `DashboardPageLoading` / `DashboardPageError` | Full-page states |
| `DashboardFeatureLock` | Entitlement upgrade prompt (`FeatureGate` fallback) |

Shared styles: [`dashboard-tokens.ts`](../src/components/dashboard/dashboard-tokens.ts) — do not duplicate border/spacing classes on pages.

Command palette items are built from [`nav-config.ts`](../src/lib/subscription/nav-config.ts) + quick actions, filtered by entitlements.

## Dashboard sidebar (all roles)

Shared shell under [`src/components/sidebar/`](../src/components/sidebar/):

| Component | Used by |
|-----------|---------|
| `DashboardRoleSidebar` | Pharmacy, pharmacist, cashier (via thin role wrappers) |
| `DashboardAdminSidebar` | Platform admin (`SuperadminSidebar` re-export) |
| `DashboardSidebarBrand` / `DashboardSidebarUpgrade` | Header + plan upsell |
| `dashboard-sidebar-tokens.ts` | Nav active state, labels, upgrade card |

Role wrappers: `pharmacy-sidebar.tsx`, `pharmacist-sidebar.tsx`, `cashier-sidebar.tsx` — config only (nav from `nav-config.ts`, entitlements via `NavEntitlementItem`).

## Legacy / admin

- **A few routes** — admin-only paths may use platform-wide lookups

## Sales

- `sales.branch_id` in `20260527110000_sales_branch_id.sql`
- POS requires `branchId` on checkout; usage meter consumed in sale API

## Security rules

1. Authenticate user
2. Resolve `active_pharmacy_id` with membership check
3. For branch actions, verify `branches.pharmacy_id = active_pharmacy_id`
4. Filter queries with `pharmacy_id` (and `branch_id` when scoped)

See [entitlements.md](./entitlements.md) for plan-based feature gates.

## Migrations

If branch create fails with *Could not find the 'email' column of 'branches'*, apply:

`supabase/migrations/20260527120000_branches_email_column.sql`
