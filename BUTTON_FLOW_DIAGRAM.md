# Inventory Buttons Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INVENTORY PAGE HEADER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Export ↓]  [Import ↑]  [+ Add Product]                               │
│      │           │              │                                        │
│      │           │              └──→ Dialog → handleAddProduct()        │
│      │           │                      │                               │
│      │           │                      └──→ POST /api/inventory/add    │
│      │           │                                                       │
│      │           └──→ Dialog → handleExcelImport()                      │
│      │                   │                                               │
│      │                   └──→ validateAndPreview()                      │
│      │                           │                                       │
│      │                           └──→ confirmImport()                    │
│      │                                                                   │
│      └──→ exportToExcel() → Download Excel File                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          ACTIONS TAB                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────┐ │
│  │  Stock Management    │  │  Data Management     │  │ Barcode Tools │ │
│  ├──────────────────────┤  ├──────────────────────┤  ├───────────────┤ │
│  │                      │  │                      │  │               │ │
│  │ [Stock Adjustment]   │  │ [Export to Excel ↓]  │  │ [Single       │ │
│  │        │             │  │        │             │  │  Barcode]     │ │
│  │        └──→ Dialog   │  │        └──→ Export   │  │     │         │ │
│  │             │        │  │                      │  │     └──→ Dialog│ │
│  │             └──→ handleAdjustment()            │  │          │     │ │
│  │                  │   │  │ [Import from Excel ↑]│  │          └──→ generateBarcode()
│  │                  │   │  │        │             │  │               │ │
│  │                  │   │  │        └──→ Dialog   │  │ [Bulk         │ │
│  │                  │   │  │                      │  │  Generate]    │ │
│  │                  │   │  │ [Download Sample]    │  │     │         │ │
│  │                  │   │  │        │             │  │     └──→ Dialog│ │
│  │                  │   │  │        └──→ Download │  │          │     │ │
│  │                  │   │  │                      │  │          └──→ printBulkBarcodes()
│  │                  │   │  │                      │  │               │ │
│  │ [Purchase Stock] │   │  │                      │  │               │ │
│  │        │         │   │  │                      │  │               │ │
│  │        └──→ Dialog   │  │                      │  │               │ │
│  │             │    │   │  │                      │  │               │ │
│  │             └──→ handlePurchase()              │  │               │ │
│  │                  │   │  │                      │  │               │ │
│  │                  │   │  │                      │  │               │ │
│  │ [Stock Transfer] │   │  │                      │  │               │ │
│  │        │         │   │  │                      │  │               │ │
│  │        └──→ Dialog   │  │                      │  │               │ │
│  │             │    │   │  │                      │  │               │ │
│  │             └──→ handleTransfer()              │  │               │ │
│  │                  │   │  │                      │  │               │ │
│  └──────────────────┘   │  └──────────────────────┘  └───────────────┘ │
│                         │                                               │
│                         ↓                                               │
│                    API CALLS                                            │
│                         │                                               │
└─────────────────────────┼───────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POST /api/inventory/adjustment                                         │
│    ├─→ Authenticate user                                                │
│    ├─→ Get current stock from Supabase                                  │
│    ├─→ Calculate new stock (increase/decrease)                          │
│    ├─→ Update inventory.quantity_in_stock                               │
│    └─→ Return { success: true, newStock }                               │
│                                                                          │
│  POST /api/inventory/purchase                                           │
│    ├─→ Authenticate user                                                │
│    ├─→ Get current stock from Supabase                                  │
│    ├─→ Add purchased quantity                                           │
│    ├─→ Update inventory.quantity_in_stock & unit_cost                   │
│    └─→ Return { success: true, newStock }                               │
│                                                                          │
│  POST /api/inventory/transfers                                          │
│    ├─→ Authenticate user                                                │
│    ├─→ Create transfer record in inventory_transfers                    │
│    ├─→ Set status to 'pending'                                          │
│    └─→ Return { success: true, transfer }                               │
│                                                                          │
│  POST /api/inventory/add                                                │
│    ├─→ Authenticate user                                                │
│    ├─→ Get pharmacy_id                                                  │
│    ├─→ Create/find medication                                           │
│    ├─→ Create inventory record                                          │
│    └─→ Return { success: true, inventory }                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐        │
│  │   inventory     │  │ medications  │  │ inventory_transfers│        │
│  ├─────────────────┤  ├──────────────┤  ├────────────────────┤        │
│  │ • id            │  │ • id         │  │ • id               │        │
│  │ • pharmacy_id   │  │ • name       │  │ • pharmacy_id      │        │
│  │ • medication_id │  │ • category   │  │ • medication_name  │        │
│  │ • batch_number  │  │ • pharmacy_id│  │ • quantity         │        │
│  │ • quantity_in_  │  │              │  │ • from_branch_id   │        │
│  │   stock ✅      │  │              │  │ • to_branch_id     │        │
│  │ • unit_cost ✅  │  │              │  │ • status           │        │
│  │ • selling_price │  │              │  │                    │        │
│  │ • minimum_stock │  │              │  │                    │        │
│  │ • expiry_date   │  │              │  │                    │        │
│  └─────────────────┘  └──────────────┘  └────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      USER FEEDBACK                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ Success Toast: "Stock adjusted successfully"                        │
│  ✅ Success Toast: "Stock purchased successfully"                       │
│  ✅ Success Toast: "Stock transfer initiated successfully"              │
│  ❌ Error Toast: "Failed to adjust stock"                               │
│  ❌ Error Toast: "Unauthorized"                                         │
│                                                                          │
│  🔄 Auto-refresh inventory table after operations                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

LEGEND:
  [Button]     - Clickable button
  Dialog       - Modal dialog/popup
  →            - Data flow
  ✅           - Updated field
  API          - Backend endpoint
  Supabase     - Database
```

## Button Status Summary

| # | Button Name | Location | Handler | API | Database | Status |
|---|-------------|----------|---------|-----|----------|--------|
| 1 | Export | Header | exportToExcel() | - | - | ✅ |
| 2 | Import | Header | handleExcelImport() | - | - | ✅ |
| 3 | Add Product | Header | handleAddProduct() | POST /add | ✅ | ✅ |
| 4 | Stock Adjustment | Actions | handleAdjustment() | POST /adjustment | ✅ | ✅ |
| 5 | Purchase Stock | Actions | handlePurchase() | POST /purchase | ✅ | ✅ |
| 6 | Stock Transfer | Actions | handleTransfer() | POST /transfers | ✅ | ✅ |
| 7 | Export to Excel | Actions | exportToExcel() | - | - | ✅ |
| 8 | Import from Excel | Actions | handleExcelImport() | - | - | ✅ |
| 9 | Download Sample | Actions | downloadSample() | - | - | ✅ |
| 10 | Single Barcode | Actions | generateBarcode() | - | - | ✅ |
| 11 | Bulk Generate | Actions | printBulkBarcodes() | - | - | ✅ |

**Total: 11/11 Buttons Working ✅**
