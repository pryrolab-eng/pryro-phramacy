# Global Categories Implementation

## Changes Made:

### 1. Database Migration (`add-global-categories.sql`)
- Added `is_global` column to categories table
- Made `pharmacy_id` nullable for global categories
- Created index for performance

### 2. Admin API Endpoints
**New endpoints for admin to manage global categories:**

- `GET /api/admin/categories` - Fetch all global categories
- `POST /api/admin/categories` - Create global category (is_global=true, pharmacy_id=null)
- `PUT /api/admin/categories/[id]` - Update global category
- `DELETE /api/admin/categories/[id]` - Delete global category

### 3. Pharmacy API Endpoint Updated
**`GET /api/categories`** - Now returns:
- Global categories (is_global=true) 
- Pharmacy-specific categories (pharmacy_id=user's pharmacy)

### 4. Admin Categories Page Updated
- Now uses `/api/admin/categories` endpoints
- Creates global categories visible to all pharmacies

## How It Works:

### Admin:
1. Admin adds category via `/admin/categories`
2. Category saved with `is_global=true` and `pharmacy_id=null`
3. Category visible to ALL pharmacies

### Pharmacy:
1. Pharmacy adds category via their interface
2. Category saved with `is_global=false` and their `pharmacy_id`
3. Category visible ONLY to that pharmacy
4. Can also see all global categories from admin

## Next Steps:

Run the SQL migration:
```sql
-- Execute add-global-categories.sql in Supabase SQL Editor
```

## Test:
```bash
# Test admin creating global category
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Antibiotics","description":"Global antibiotic category"}'

# Test pharmacy seeing global + their categories
curl -X GET http://localhost:3000/api/categories
```
