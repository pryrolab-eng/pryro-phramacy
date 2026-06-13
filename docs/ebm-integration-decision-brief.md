# EBM integration — decision brief for leadership

**Product:** Pryrox (multi-branch pharmacy POS)  
**Topic:** Rwanda Revenue Authority (RRA) Electronic Billing Machine (EBM) compliance  
**Audience:** Executive / product owner (final decision)  
**Status:** Research complete — implementation not started (Pryrox has a stub only)  
**Date:** May 2026

---

## 1. Executive summary

Pharmacies in Rwanda must issue **RRA-certified fiscal invoices (EBM)** for sales. Pryrox already handles POS, inventory, insurance, and shifts, but **does not yet produce real EBM receipts**. Today `POST /api/integrations/rra-ebm` returns mock data.

**There is no unofficial API.** Every path goes through **RRA-approved** software. Ishyiga is the best-known pharmacy vendor locally, but it is **not the only option**.

**Decision required:** Choose how Pryrox will connect to EBM:

| Option | Summary | Typical timeline |
|--------|---------|------------------|
| **A** | Integrate Pryrox with a **certified VSDC partner** (e.g. Ishyiga, Stantech, Pivot Access) | 2–4 months |
| **B** | **Certify Pryrox directly** with RRA as a Certified Invoicing System (CIS) | 4–8+ months |
| **C** | **Do not integrate** — pharmacies use separate RRA EBM app alongside Pryrox | Immediate, not recommended long term |

**Recommended for Pryrox:** **Option A** (partner with a certified VSDC vendor) for speed and lower certification risk, with a parallel conversation with RRA so we understand Option B for the long term.

---

## 2. Background — what EBM means for Pryrox

- **EBM / EIS** = Rwanda’s electronic invoicing system operated by RRA.
- Each taxable sale should produce a **fiscal receipt** (EBM number, QR, VAT breakdown) sent to RRA.
- A custom POS like Pryrox is classified as a **CIS** (Certified Invoicing System).
- CIS does **not** usually talk to RRA alone; it connects through a **Sales Data Controller**:
  - **VSDC** (Virtual) — works offline, syncs when online → **best fit for pharmacies**
  - **OSDC** (Online) — internet-only → acceptable if always online

**Architecture (target state):**

```
Pryrox POS (sale) → Pryrox EBM adapter → VSDC partner → RRA back office
                              ↓
                    Fiscal receipt # stored on sale
```

---

## 3. Choices available (not only Ishyiga)

### 3.1 RRA-approved EBM methods

| Method | Description | Fit for Pryrox pharmacies? |
|--------|-------------|----------------------------|
| EBM 2.1 (Windows/Android) | Standalone RRA billing app | ❌ Separate from Pryrox; double entry |
| Online EBM | Web EBM for very low invoice volume | ❌ Pharmacies exceed limits |
| **OSDC** | Your software + online RRA link | ⚠️ Possible if always online |
| **VSDC** | Your software + middleware (offline-capable) | ✅ **Recommended** |
| Direct CIS certification | Pryrox certified by RRA | ✅ Maximum control, highest effort |

### 3.2 Certified VSDC suppliers (examples)

RRA maintains an official supplier dropdown:  
https://ebm2-portal.rra.gov.rw/VsdcSupp.do

| Supplier (RRA portal name) | Notes |
|----------------------------|--------|
| **ALGORITHM INC LTD** | Ishyiga — strong in Rwanda pharmacies, VSDC can stamp third-party systems |
| **STANTECH TECHNOLOGIES Ltd** | Certified VSDC supplier |
| **PIVOT ACCESS LTD** | Certified supplier; software/integration company (Kigali) |
| **IMPANO GLOBAL SOLUTIONS Ltd** | Certified VSDC supplier |
| **INGOGA TECH Ltd** | Certified VSDC supplier |
| **RWANDA REVENUE AUTHORITY** | RRA’s own VSDC option |
| **VSDC AS INDEPENDENT USER** | Per-taxpayer independent setup |

**Action:** Shortlist 2–3 vendors, request sandbox access, CIS integration docs, and commercial terms before signing.

### 3.3 Ishyiga (reference — not exclusive)

- Product: https://ishyiga.net/web/VSDC.php  
- Stated capability: stamp invoices from **systems other than Ishyiga** and report to RRA  
- Rwanda contact: ishyiga.rwanda@algorithm.rw | +250 798 687 932  
- Technical (CTO): corneille.mvuyekure@ishyiga.info | +250 786 415 755  
- Video guides: https://ishyiga.net/guide/index.php (section “ISHYIGA VSDC & INTEGRATION”)

---

## 4. Option comparison (for decision)

### Option A — Partner with a VSDC vendor (recommended)

**How it works:** Pryrox sends each completed sale to the partner’s VSDC API; partner returns fiscal receipt data; Pryrox stores and prints it.

| Pros | Cons |
|------|------|
| Faster time to market | Per-vendor dependency |
| Partner already RRA-certified | Possible per-pharmacy or per-TIN fees |
| Sandbox + support from vendor | API may differ per vendor |
| Lower regulatory risk for Pryrox | Still need CIS documentation for RRA |

**Pryrox effort:** EBM adapter module, settings per pharmacy (TIN, credentials, VSDC URL), POS hook on sale complete, refund/credit note flow, Z-report alignment with shift close.

**Vendor effort:** Integration spec, test environment, certification support.

---

### Option B — Certify Pryrox directly with RRA

**How it works:** Pryrox implements RRA VSDC/CIS specifications and submits full certification package to RRA.

| Pros | Cons |
|------|------|
| No middle vendor | Longer timeline |
| Full control of roadmap | Higher legal/compliance burden |
| One integration for all pharmacies | Certificates, SLAs, manuals required |
| Strong product differentiator | Ongoing RRA audit obligations |

**Pryrox effort:** Full CIS + integration compliance, test cases, user/install manuals, support SLA, RRA test cycles.

---

### Option C — No integration (status quo+)

**How it works:** Pharmacy uses RRA EBM 2.1 app separately; Pryrox for stock/insurance only.

| Pros | Cons |
|------|------|
| No dev cost now | Double data entry |
| No certification wait | Reconciliation errors |
| | Poor UX; hard to sell to regulated pharmacies |
| | Pryrox sales records may not match fiscal receipts |

**Verdict:** Acceptable only as a **temporary** pilot, not a product strategy.

---

## 5. Procedures and requirements

### 5.1 RRA certification (all serious options)

**Contact**

| Channel | Details |
|---------|---------|
| Certification email | cis_sdc_certification@rra.gov.rw |
| E-correspondence portal | https://ecms.rra.gov.rw/home?lang=en |
| Call center | 3004 |
| EBM information | https://www.rra.gov.rw/en/about-ebm |
| MyRRA portal | https://myrra.rra.gov.rw |
| VSDC supplier list | https://ebm2-portal.rra.gov.rw/VsdcSupp.do |

**Technical documents (from RRA)**

- VSDC Technical Specification (PDF on RRA site)
- CIS4VSDC technical specification (how Pryrox talks to VSDC)
- Certification checkpoint Excel sheet (“Main” sheet)
- Test cases document
- VSDC Certification Monitoring Form

**Administrative documents (typical)**

- Business Registration Certificate (RDB)
- Valid RRA Tax Clearance Certificate
- Valid RSSB Clearance Certificate
- Programming and configuration manual
- Installation guide
- Product user manual
- Product brochure
- Product warranty statement
- Physical address
- Software Support SLA (supplier ↔ RRA and/or supplier ↔ customer)

**Indicative timelines (RRA-published)**

- Administrative review: ~5 working days  
- Certification issued: ~20 working days (after requirements met)  
- *Vendor integration and Pryrox dev are additional.*

### 5.2 Per-pharmacy requirements (each tenant)

Each pharmacy using Pryrox + EBM typically needs:

- **TIN** (Tax Identification Number)
- **VAT registration** status (affects tax classes A/B on lines)
- **Registered business name** and branch address (must match RRA)
- **EBM / VSDC device or instance** assigned to that taxpayer
- **Credentials or SSL certificates** issued for that TIN
- Staff trained on fiscal receipts and **Z-reports** (end-of-day)

Pryrox should store per-pharmacy: `rra_tin` (already in schema), VSDC endpoint, credentials, EBM serial/device id, last Z-report date.

### 5.3 Technical scope in Pryrox (when approved)

| Area | Work |
|------|------|
| Sale completion | Send receipt payload after POS sale |
| Refunds | Credit note / refund receipt to VSDC |
| Products | Item registration sync (if required by vendor) |
| Inventory | Optional stock sync (vendor-dependent) |
| Shifts | Align cashier shift close with Z-report |
| Storage | `sales.rra_invoice_number`, QR payload, EBM status |
| Settings | Integrations UI (replace current API-key stub) |
| Failure handling | Queue/retry when offline (VSDC path) |

---

## 6. Suggested decision process

### Step 1 — Vendor discovery (2–3 weeks)

Contact **at least three** suppliers from the RRA portal plus Ishyiga:

1. ALGORITHM INC LTD (Ishyiga)  
2. STANTECH TECHNOLOGIES Ltd  
3. PIVOT ACCESS LTD (info@pivotaccess.com)

**Ask each:**

- CIS integration documentation (API or file-based)
- Sandbox URL and test TIN
- Pricing model (per pharmacy / per month / one-time)
- Pharmacy references in Rwanda
- Certification support: who files with RRA — vendor, Pryrox, or pharmacy?
- Refund, Z-report, and offline behavior

### Step 2 — Parallel RRA inquiry (1 week)

Email **cis_sdc_certification@rra.gov.rw**:

- Confirm certification path for **SaaS pharmacy POS (Pryrox)** integrating via certified VSDC
- Request current CIS4VSDC spec and checkpoint spreadsheet
- Clarify whether **Pryrox (software vendor)** or **each pharmacy** must hold certification

### Step 3 — Leadership decision

Choose **A, B, or C** based on:

- Time to market  
- Budget (vendor fees vs full certification cost)  
- Strategic control  
- Sales promise to pharmacy customers (“EBM included” vs “bring your VSDC”)

### Step 4 — Implementation (after decision)

- Phase 1: Adapter + sandbox + one pilot pharmacy  
- Phase 2: Production + certification sign-off  
- Phase 3: Rollout to all Pryrox tenants

---

## 7. Risks and dependencies

| Risk | Mitigation |
|------|------------|
| Vendor lock-in | Abstract EBM behind `lib/ebm/` interface; evaluate 2+ vendors first |
| Certification delay | Start RRA paperwork early; pilot with one friendly pharmacy |
| Offline sales | Prefer VSDC over OSDC |
| VAT / item codes wrong | Map Pryrox categories to RRA item classes in adapter |
| Insurance split payments | Clarify with vendor how copay + insurer lines appear on fiscal receipt |

---

## 8. Current Pryrox state

- Stub route: `src/app/api/integrations/rra-ebm/route.ts` (mock response)
- Settings docs reference `RRA EBM API` key in `api_keys` — not production-ready
- `sales.rra_invoice_number` column exists but is not populated by POS today
- Listed in roadmap: `docs/future-features.md` — “Live RRA EBM API integration”

**No EBM work should be coded against a real API until a vendor or RRA sandbox is chosen.**

---

## 9. Decision checklist (for boss)

Please confirm:

- [ ] **Preferred option:** A (VSDC partner) / B (direct RRA cert) / C (defer)  
- [ ] **Budget** for vendor fees and certification legal/admin costs  
- [ ] **Target date** for first pilot pharmacy with live EBM  
- [ ] **Approved vendors** to evaluate (Ishyiga + others)  
- [ ] **Who owns RRA relationship** — Pryrox company vs per-pharmacy  
- [ ] **Sales positioning** — “EBM-ready” vs “EBM included at launch”

---

## 10. References

- RRA About EBM: https://www.rra.gov.rw/en/about-ebm  
- RRA VSDC page: https://www.rra.gov.rw/en/ebm-electronic-billing-machine/content-under-ebm/virtual-sales-data-controller-vsdc  
- VSDC supplier portal: https://ebm2-portal.rra.gov.rw/VsdcSupp.do  
- VSDC-style API reference (baseline): https://vsdc.io/docs  
- Ishyiga VSDC: https://ishyiga.net/web/VSDC.php  

---

*Prepared for internal decision. Update this doc after vendor calls or RRA responses.*
