# API Conversion Guide: In-Memory to Supabase

## Completed Conversions ✅
- `/api/inventory/suppliers` - Uses `suppliers` table
- `/api/admin/plans` - Uses `subscription_plans` table  
- `/api/prescriptions` - Uses `prescriptions` table
- `/api/inventory` - Uses `inventory` and `medications` tables
- `/api/customers` - Uses `customers` table (needs table creation)
- `/api/pos/sale` - Uses `sales` and `sale_items` tables

## Conversion Pattern

### 1. Import Supabase Client
```typescript
import { createClient } from '../../../supabase/server' // Adjust path as needed
```

### 2. Replace In-Memory Arrays with Database Queries

**Before (In-Memory):**
```typescript
let data = [/* hardcoded array */]

export async function GET() {
  return NextResponse.json(data)
}
```

**After (Supabase):**
```typescript
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
```

### 3. Convert POST Methods

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const newItem = { id: Date.now().toString(), ...body }
  data.push(newItem)
  return NextResponse.json({ success: true, item: newItem })
}
```

**After:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: item, error } = await supabase
      .from('table_name')
      .insert(body)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, item })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
```

## Required Database Tables

### Missing Tables (Need Creation):
1. **customers** - For customer management
2. **categories** - For medication categories  
3. **branches** - For pharmacy branches
4. **staff** - For staff management
5. **notifications** - For system notifications
6. **alerts** - For stock/expiry alerts

### Create Missing Tables Migration:
```sql
-- Add to new migration file
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    email text,
    date_of_birth date,
    allergies text,
    insurance text,
    total_purchases decimal(10,2) DEFAULT 0.00,
    last_visit date,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    phone text,
    manager_id uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);
```

## APIs to Convert (Priority Order):

### High Priority:
1. `/api/auth/login` - Authentication
2. `/api/dashboard` - Dashboard data
3. `/api/pos/*` - Point of sale operations
4. `/api/sales` - Sales management
5. `/api/inventory/add` - Add inventory items

### Medium Priority:
6. `/api/categories` - Medication categories
7. `/api/staff` - Staff management  
8. `/api/branches` - Branch management
9. `/api/notifications` - System notifications
10. `/api/reports/*` - Reporting APIs

### Low Priority:
11. `/api/integrations/*` - Third-party integrations
12. `/api/exports` - Data exports
13. `/api/uploads` - File uploads

## Key Points:
- Always use `await createClient()` 
- Add proper error handling with try/catch
- Use appropriate table relationships with foreign keys
- Include `pharmacy_id` for multi-tenant data
- Maintain existing API response formats for frontend compatibility
- Add proper indexes for performance

## Next Steps:
1. Create missing database tables
2. Convert high-priority APIs first
3. Test each conversion thoroughly
4. Update frontend if response formats change