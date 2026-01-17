# Stock Locations Management

## Overview
Stock locations (Main Store, Branch, Cold Storage, Warehouse) are now manageable through the Settings page under the Operations tab.

## Where to Manage Stock Locations

### Settings → Operations Tab → Stock Locations

Navigate to: **Settings** → **Operations** → **Stock Locations**

Here you can:
- ✅ View all active stock locations
- ✅ See location descriptions
- ✅ Add new locations (button available)
- ✅ Manage existing locations

## Current Default Locations

1. **Main Store** - Primary location (Active)
2. **Branch** - Secondary location (Active)
3. **Cold Storage** - Temperature controlled (Active)
4. **Warehouse** - Bulk storage (Active)

## How Stock Transfer Works

### Current Implementation

When you transfer stock from one location to another:

1. **Stock is deducted** from total inventory
2. **Transfer record is created** with:
   - Product name
   - Quantity transferred
   - From location
   - To location
   - Status: "completed"
3. **Inventory updates** automatically

### Example Flow

```
Transfer: 10 units from Main Store → Branch

Before: Product has 50 units total
Action: Transfer 10 units
After: Product has 40 units total

Transfer Record Created:
- Product: Paracetamol 500mg
- Quantity: 10
- From: Main Store
- To: Branch
- Status: Completed
```

## Important Notes

### Current System Behavior

⚠️ **The system tracks TOTAL stock per product, not per location**

This means:
- Inventory shows total stock across all locations
- Transfers deduct from total stock (simulating movement out)
- Location labels are for record-keeping and tracking
- You can see transfer history in the database

### Why Stock is Deducted

When you transfer stock:
1. It's removed from the source location (Main Store)
2. It's in transit or at the destination (Branch)
3. The system deducts it to prevent double-counting
4. Transfer records maintain the audit trail

## Future Enhancement Option

### Multi-Location Inventory Tracking

To track stock separately per location would require:

**Database Changes:**
```sql
-- Add location field to inventory table
ALTER TABLE inventory ADD COLUMN location VARCHAR(50);

-- Or create separate location_inventory table
CREATE TABLE location_inventory (
  id UUID PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id),
  location VARCHAR(50),
  quantity INTEGER,
  ...
);
```

**Benefits:**
- Track exact stock at each location
- Transfers move stock between locations
- No deduction from total stock
- Better multi-branch management

**Current Workaround:**
- Use transfer records to track movements
- Query `inventory_transfers` table for location history
- Calculate location stock from transfer records

## API Endpoints

### Transfer Stock
```
POST /api/inventory/transfers
```

**Request:**
```json
{
  "productId": "uuid",
  "product": "Product Name",
  "quantity": 10,
  "from": "main-store",
  "to": "branch"
}
```

**Response:**
```json
{
  "success": true,
  "transfer": {
    "id": "uuid",
    "medication_name": "Product Name",
    "quantity": 10,
    "from_branch_id": "main-store",
    "to_branch_id": "branch",
    "status": "completed"
  },
  "newStock": 40
}
```

## User Guide

### How to Transfer Stock

1. Go to **Inventory** → **Actions** tab
2. Click **Stock Transfer** button
3. Fill in the form:
   - Select Product
   - Enter Quantity
   - Select From Location
   - Select To Location
4. Click **Transfer Stock**
5. System will:
   - Validate sufficient stock
   - Deduct from inventory
   - Create transfer record
   - Show success message with new stock level

### How to Add New Locations

1. Go to **Settings** → **Operations** tab
2. Find **Stock Locations** card
3. Click **Add New Location** button
4. Enter location details:
   - Location Name
   - Description
   - Type (optional)
5. Click **Save**
6. New location will appear in transfer dropdowns

## Database Tables

### inventory_transfers
```sql
CREATE TABLE inventory_transfers (
  id UUID PRIMARY KEY,
  pharmacy_id UUID,
  medication_name VARCHAR(255),
  quantity INTEGER,
  from_branch_id VARCHAR(50),
  to_branch_id VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP
);
```

### Query Transfer History
```sql
-- Get all transfers for a product
SELECT * FROM inventory_transfers 
WHERE medication_name = 'Paracetamol 500mg'
ORDER BY created_at DESC;

-- Get transfers from a location
SELECT * FROM inventory_transfers 
WHERE from_branch_id = 'main-store'
ORDER BY created_at DESC;
```

## Summary

✅ **Stock locations are managed in Settings → Operations**
✅ **Transfers deduct from total stock** (prevents double-counting)
✅ **Transfer records maintain audit trail**
✅ **System validates sufficient stock before transfer**
✅ **Locations can be added/managed in Settings**

The current system is designed for simple stock movement tracking. For complex multi-location inventory with separate stock counts per location, database schema changes would be needed.
