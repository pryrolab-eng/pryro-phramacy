# Admin data contract

Canonical sources for platform admin UI. Do not show legacy fields alone when a joined catalog field exists.

## Tables

| Table | Role |
|-------|------|
| `subscription_plans` | Product catalog (`plan_type`: `main` \| `branch_addon`) |
| `subscriptions` | Per-pharmacy lifecycle (`status`, `plan_id`, `subscription_type`) |
| `pharmacies` | Tenant + **access** (`status`: active, suspended, inactive, trial) |
| `payment_transactions` | Cash events (KPay, Polar) |
| `plan_features` | Entitlement matrix per catalog row |

## Display rules

| UI label | Source |
|----------|--------|
| **Plan** (main) | `subscription_plans.name` via active `subscriptions.plan_id` where `subscription_type = main` and `status = active` |
| **Pending change** | Main sub with `status = pending_payment` or scheduled downgrade |
| **Branch add-ons** | Count of active `subscription_type = branch_addon` |
| **Access** | `pharmacies.status` (not plan name) |
| **Billing status** | `subscriptions.status` (not `is_active` alone) |
| **Subscriber count** (catalog) | Active subs grouped by `plan_id`, fallback `plan` name match |

## Avoid

- `pharmacies.subscription_plan` enum as the only plan label (cache / legacy)
- `subscriptions.plan` string without `plan_id` join when `plan_id` is set
- Summing RWF + USD in one KPI total

## Polar vs platform currency

| Layer | Currency |
|-------|----------|
| `subscription_plans.price` | Platform (`NEXT_PUBLIC_PLATFORM_CURRENCY`, default RWF) |
| Polar product (card) | `POLAR_CHECKOUT_CURRENCY` (default USD), converted via `POLAR_RWF_PER_USD` |
| `payment_transactions` | Always **platform currency** (catalog amount). `payment_details` notes if Polar charged USD |

Legacy rows may have `currency=USD` with an RWF numeric amount; admin APIs normalize those to RWF on read.

## Repair

- `POST /api/admin/pharmacies/repair` — reclassify branch add-ons, sync pharmacy cache
- `POST /api/admin/plans/dedupe` — duplicate catalog names
- `POST /api/admin/plans/fix-catalog` — `plan_type` correction

See `docs/entitlements.md` for feature gating.
