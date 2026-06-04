# Insurance-covered medicines (no formulary table)

Pryrox does **not** use an `insurance_formulary` table.

Pharmacies mark coverage on their own **`medications`** records, per insurance provider.

## Storage

**Column:** `medications.insurance_coverage` (jsonb, default `{}`)

**Example:**

```json
{
  "550e8400-e29b-41d4-a716-446655440000": {
    "covered": true,
    "externalCode": "A02BC02003",
    "notes": "RSSB reference 2026-Q2",
    "effectiveFrom": "2026-01-01",
    "effectiveTo": null
  }
}
```

Keys are `insurance_providers.id` values. Only entries with `"covered": true` (and within effective dates, when enforced) are insurance-eligible at POS for that provider.

## Who manages what

| Role | Action |
|------|--------|
| Platform admin | Creates providers (RSSB, MMI, …), default coverage %, invoice templates |
| Pharmacy | Toggles which **own** medications are covered for each provider |
| Staff (POS) | Selects provider; system reads medication flags — no separate list import |

External insurer PDFs/Excel are **reference only** outside the system.

## POS rules

| State | Insurer pays | Patient pays |
|-------|--------------|--------------|
| Provider selected + medication covered for that provider | Provider default % of shelf line | Remainder |
| Not covered or not listed in JSON | 0% | 100% |

No live eligibility API. No per-drug coverage percentage in DB.

## Optional fields per provider key

| Field | Purpose |
|-------|---------|
| `externalCode` | Insurer drug code on month-end report |
| `notes` | Internal note |
| `effectiveFrom` / `effectiveTo` | Optional validity window |

## In-app

Pharmacy owners: **Insurance medicines** (`/pharmacy/insurance/medicines`), gated by `pos.insurance`.

See [implementation plan](./insurance-implementation-plan.md).
