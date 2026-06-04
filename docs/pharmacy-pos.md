# Pharmacy POS — product requirements & Pryrox status

Reference for POS polish and pharmacy-specific behavior. POS is the **main control point** for medicines, stock, expiry, batches, cashier sales, and compliance.

**Core question the POS must answer:**  
*Can we sell the right medicine, from the right batch, before expiry, at the right price, while keeping stock and sales records accurate?*

---

## 1. What pharmacy POS does

The cashier/pharmacist uses POS to:

- Sell medicines and health products
- Check stock availability
- Choose correct batch/expiry (FEFO)
- Receive payment
- Print receipt
- Reduce inventory on the correct batch
- Record sale (cashier, branch, payment, batch, expiry)
- Feed reports and audit trail

**Example sale**

| Item              | Qty | Price     |
| ----------------- | --- | --------- |
| Amoxicillin 500mg | 1   | 3,500 RWF |
| Panadol           | 2   | 1,000 RWF |

System records: sale, stock reduction, cashier, payment method, branch, date, batch, expiry.

---

## 2. Why pharmacy POS ≠ normal shop POS

| Requirement        | Why it matters                          |
| ------------------ | --------------------------------------- |
| Expiry dates       | Must not sell expired stock               |
| Batch numbers      | Traceability, recalls                     |
| Prescription rules | Controlled medicines                    |
| Dosage/form        | Same name, different strengths/forms    |
| Supplier tracking  | Source of medicine                      |
| Stock accuracy     | Patient impact                          |
| Returns control    | Not all returns are resellable          |
| Branch stock       | Quantity differs per location           |

POS must stay **deeply connected to inventory**.

---

## 3. Main sale flow

1. **Search / scan** — name, brand, generic, barcode, category, SKU  
2. **Stock & expiry check** — in stock?, which batch?, expired?, near expiry?, qty available?  
3. **FEFO** — sell nearest-expiry batch first  
4. **Cart** — name, strength, qty, unit price, batch, expiry, discount, line total  
5. **Prescription** (when required) — Rx flag, upload, doctor/patient, pharmacist approval  
6. **Payment** — cash, MoMo, card, transfer, insurance, credit, split  
7. **Complete** — save sale, deduct batch stock, receipt, cashier/branch, reports, audit log  

---

## 4. Feature areas

### A. Product catalog

Fields: name, generic, brand, strength, form, category, barcode/SKU, unit, cost/sell price, supplier, Rx required, tax.

### B. Batch & expiry

Multiple batches per medicine; POS must know which batch is sold.

### C. Inventory

Branch stock, batch stock, low/near/expired alerts, adjustments, transfers, purchases.

### D. Sales screen

Fast: search, scan, qty, auto batch (FEFO), expiry warning, discount (limited), payment, complete, receipt.

### E. Customer / patient

Basic: name, phone, history, credit.  
Advanced (later): patient profile, Rx history, allergies, insurance.

### F. Insurance (Phase 2+ unless required day one)

Provider, member number, coverage %, co-pay, claim amount.

### G. Returns / refunds

Original sale, item, qty, reason, condition, approver, restock vs damaged.

### H. Cashier shifts

Open shift, track tenders/refunds/discounts, close with expected vs actual cash.

### I. Reports

Daily sales, by cashier/branch/medicine, profit, low stock, expiry/near-expiry, movements, refunds, payment mix, insurance, credit.

**MVP reports:** sales, stock, expiry, profit.

---

## 5. Roles & rules

| Role           | Typical access                    |
| -------------- | --------------------------------- |
| Owner/Admin    | Full                              |
| Pharmacist     | Sell, Rx approval, some stock     |
| Cashier        | Sell only                         |
| Stock manager  | Purchases, transfers, adjustments |
| Branch manager | One branch                        |
| Accountant     | Payments & reports                |

**Rules**

1. Block expired batches  
2. Warn (or block with approval) near-expiry  
3. FEFO batch selection  
4. Every stock movement has a reason  
5. Audit log (who, what, when)  

---

## 8. MVP priority (product)

| Feature                         | Priority    |
| ------------------------------- | ----------- |
| Login, roles, branches          | Must-have   |
| Catalog + batch/expiry          | Must-have   |
| Stock management                | Must-have   |
| POS sales screen                | Must-have   |
| Payments + receipt              | Must-have   |
| Sales + stock/expiry reports    | Must-have   |
| Shift closing                   | Important   |
| Customers, returns, purchases   | Important   |
| Insurance                       | Phase 2     |
| Offline, accounting, loyalty    | Later       |

**Do not drop batch/expiry from MVP** — it is pharmacy-specific.

---

## Pryrox implementation status (baseline before UI polish)

Last reviewed against `src/app/(dashboard)/pos/page.tsx` and `src/app/api/pos/*`.

### Implemented (working or partial)

| Area | Status | Notes |
| ---- | ------ | ----- |
| Branch-scoped sales | ✅ | `activeBranchId` required; sale API validates `branch_id` |
| Product list from inventory | ✅ | `/api/pos/products` — inventory rows with batch, expiry, `daysToExpiry` |
| Search by name/barcode | ✅ | Client filter on POS page |
| Category filter | ✅ | |
| Cart + qty limits | ✅ | Capped by `product.stock` |
| Batch/expiry on line | ✅ | Shown in product list & saved on `sale_items` |
| Near-expiry UI hint | ✅ | Badge when `daysToExpiry <= 30` |
| Payments | ✅ | Cash, card, MoMo, insurance paths in UI |
| Complete sale + stock deduct | ✅ | `/api/pos/sale` — branch-scoped inventory update |
| Receipt / print | ✅ | Invoice HTML + print |
| Insurance billing | ✅ | Gated `pos.insurance`; claims table |
| Returns | ✅ | `/api/pos/returns` + dialog (entitlement `pos.returns`) |
| Void sale | ✅ | `pos.void` |
| Hold sale | ✅ | `pos.hold` |
| Customer lookup | ✅ | Phone search |
| Entitlements | ✅ | `pos.access`, sub-features in feature catalog |
| Transaction limits | ✅ | `checkPosTransactionAllowed` per branch |
| Activity / multi-tenant | ✅ | Uses pharmacy + branch context (see tenant architecture doc) |

### Pharmacy logic (implemented)

| Area | Status | Notes |
| ---- | ------ | ----- |
| **FEFO** | ✅ | `lib/pos/pos-cart.ts` — cart allocates nearest-expiry batches; UI groups by medication |
| **Block expired sale** | ✅ | Products API excludes expired rows; sale API rejects expired batches |
| **Prescription gate** | ✅ | Rx badge + confirmation dialog; server validates `requires_prescription` |
| **Near-expiry warning** | ✅ | UI prompt on add + checkout; server requires `nearExpiryAcknowledged` |
| **Strength/form grouping** | ✅ | Search groups by `medicationId` with strength/form label |
| **Split payment** | ✅ | UI split + `mixed` payment method + amounts in sale notes |
| **Daily close** | ✅ | `/api/pos/daily-close` aggregates today’s branch sales by tender |
| **Stock movements** | ✅ | Sale writes `stock_movements` (`out` / `sale`) per line |

### Returns, shifts, barcode (implemented)

| Area | Status | Notes |
| ---- | ------ | ----- |
| **Returns + disposition** | ✅ | Lookup by receipt → line qty → `restock` / `damaged` / `destroy`; expired/defective block restock |
| **Cashier shifts** | ✅ | `cashier_shifts` — open float, live sales, close with variance; **required** before sale/return; owners see **On duty** list |
| **Barcode** | ✅ | USB wedge via search field; Enter / Scan adds exact barcode or single match |

Key paths: `src/app/api/pos/returns`, `src/app/api/pos/sales/lookup`, `src/app/api/pos/shifts`, `src/components/pos/pos-returns-dialog.tsx`, `src/lib/pos/return-disposition.ts`.

Migration: `supabase/migrations/20260527150000_pos_returns_shifts.sql` (run locally).

### Gaps vs dashboard polish (UI — planned next)

| Area | Status | Notes |
| ---- | ------ | ----- |
| Dashboard kit | ❌ | POS uses raw `Card`/`Button`; only `DashboardPageHeader` today |
| Dialogs | ❌ | Raw `@/components/ui/dialog` |
| Layout | ⚠️ | Large monolithic page (~1.6k lines); 3-column desktop layout |
| Feature lock UI | ⚠️ | Uses `FeatureGate` where applicable |

### Key files

| Path | Purpose |
| ---- | ------- |
| `src/app/(dashboard)/pos/page.tsx` | Main POS UI |
| `src/app/api/pos/sale/route.ts` | Sale + stock deduction |
| `src/app/api/pos/products/route.ts` | Sellable inventory for branch |
| `src/lib/http/pos.ts` / `src/hooks/usePos.ts` | Client API |
| `src/lib/subscription/feature-catalog.ts` | `pos.*` entitlements |

Legacy/demo components (not primary route): `enhanced-pos.tsx`, `quick-pos.tsx`, `pos-dashboard.tsx`.

---

## POS polish scope (recommended order)

When polishing UI, **do not change pharmacy rules in the same pass** unless explicitly requested. Suggested phases:

1. **Shell** — `DashboardPageShell`, toolbar, `DashboardButton`, branch context chip  
2. **Panels** — `DashboardSectionCard` for search, cart, payment; `DashboardSearchInput`  
3. **Cart lines** — `DashboardListRow` with batch, expiry, near-expiry badge  
4. **Dialogs** — `DashboardDialog*` for quick-add, returns, insurance  
5. **Empty/loading** — `DashboardPanelEmpty`, `DashboardPageLoading`  
6. **Then logic** — FEFO, expired block, Rx step (separate PRs)

---

## Client-facing summary

> A pharmacy POS is a sales and inventory system built for pharmacies. Staff sell medicines, take payment, print receipts, and stock updates automatically. Unlike a normal shop POS, it tracks batches, expiry dates, prescriptions, suppliers, branch stock, and pharmacy reports — so owners avoid selling expired stock, reduce losses, and monitor the business from anywhere.
