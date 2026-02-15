# Admin Settings Page - Role Access Analysis

## Current Implementation

### Access Control in API Route
Location: `src/app/api/admin/system-settings/route.ts`

**Current Role Check:**
```typescript
const { data: userData, error: userError } = await supabase
  .from('pharmacy_users')
  .select('role')
  .eq('user_id', user.id)
  .single()

if (userError || userData?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
}
```

**Current Access:** Only users with role = 'admin' can save/read settings

## Problem Identified

❌ **ISSUE:** The API checks for role = 'admin', but this role doesn't exist in your system!

Your system has these roles:
- `pharmacy_owner`
- `pharmacist`
- `cashier`
- (No 'admin' role exists)

The super admin (abdousentore@gmail.com) has role = `pharmacy_owner`, NOT `admin`.

## What Settings Page Controls

The admin settings page manages critical platform-wide configurations:

1. **Platform Configuration**
   - Platform name, admin email
   - Maximum pharmacies allowed

2. **Multi-Tenant Settings**
   - Max users per pharmacy
   - Multi-branch enablement
   - White-label features

3. **Security & Access**
   - New registrations toggle
   - SSO integration
   - Data encryption

4. **API & Integration**
   - API rate limits
   - Payment gateway status
   - Insurance API integrations

5. **Compliance & Audit**
   - Data retention policies
   - Audit logging

6. **System Operations**
   - Maintenance mode
   - Notifications
   - Automatic backups

7. **Stock Locations**
   - Warehouse/branch locations

## Recommended Solutions

### Option 1: Use Super Admin Email Check (Quick Fix)
**Best for:** Immediate fix, single super admin

```typescript
// In route.ts
const isSuperAdmin = user.email === 'abdousentore@gmail.com'

if (!isSuperAdmin) {
  return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
}
```

**Pros:**
- Quick to implement
- Matches current superadmin dashboard logic
- No database changes needed

**Cons:**
- Hardcoded email
- Not scalable for multiple super admins
- Not database-driven

---

### Option 2: Add 'superadmin' Role (Recommended)
**Best for:** Proper role-based access control

**Step 1:** Update database
```sql
-- Update the super admin user's role
UPDATE pharmacy_users 
SET role = 'superadmin' 
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
```

**Step 2:** Update API route
```typescript
const { data: userData } = await supabase
  .from('pharmacy_users')
  .select('role')
  .eq('user_id', user.id)
  .single()

if (userData?.role !== 'superadmin') {
  return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
}
```

**Step 3:** Update layout.tsx
```typescript
const getSidebar = () => {
  if (userProfile?.role === 'superadmin') {
    return <SuperadminSidebar />
  }
  // ... rest of the code
}
```

**Pros:**
- Database-driven
- Scalable for multiple super admins
- Follows proper RBAC pattern
- Easy to audit

**Cons:**
- Requires database migration
- Need to update multiple files

---

### Option 3: Add 'is_superadmin' Flag
**Best for:** Keeping existing roles intact

**Step 1:** Add column to database
```sql
ALTER TABLE pharmacy_users 
ADD COLUMN is_superadmin BOOLEAN DEFAULT FALSE;

UPDATE pharmacy_users 
SET is_superadmin = TRUE 
WHERE user_id = '06fed0d6-ad6a-4989-97ec-bcc3bba93d5c';
```

**Step 2:** Update API route
```typescript
const { data: userData } = await supabase
  .from('pharmacy_users')
  .select('is_superadmin')
  .eq('user_id', user.id)
  .single()

if (!userData?.is_superadmin) {
  return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
}
```

**Pros:**
- Doesn't change existing role structure
- Can have super admin + another role
- Database-driven

**Cons:**
- Adds extra column
- More complex logic

---

### Option 4: Allow 'pharmacy_owner' with Special Pharmacy ID
**Best for:** Minimal changes

The super admin already has:
- role = `pharmacy_owner`
- pharmacy_id = `00000000-0000-0000-0000-000000000000` (special UUID)

```typescript
const { data: userData } = await supabase
  .from('pharmacy_users')
  .select('role, pharmacy_id')
  .eq('user_id', user.id)
  .single()

const isSuperAdmin = userData?.pharmacy_id === '00000000-0000-0000-0000-000000000000'

if (!isSuperAdmin) {
  return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
}
```

**Pros:**
- No database changes
- Uses existing data structure
- Works immediately

**Cons:**
- Less intuitive
- Relies on special UUID convention

---

## My Recommendation

**Use Option 2: Add 'superadmin' Role**

This is the cleanest, most maintainable solution because:

1. ✅ Clear and explicit role-based access control
2. ✅ Easy to understand and audit
3. ✅ Scalable for multiple super admins
4. ✅ Follows industry best practices
5. ✅ Makes the codebase more consistent

## Who Should Access Admin Settings?

Based on what the page controls, **ONLY Super Admin** should have access because:

- ❌ **Pharmacy Owner** - Should NOT access (manages single pharmacy, not platform)
- ❌ **Pharmacist** - Should NOT access (staff role, no admin privileges)
- ❌ **Cashier** - Should NOT access (staff role, no admin privileges)
- ✅ **Super Admin** - Should access (manages entire platform)

The settings are **platform-wide** and affect ALL pharmacies, so only the super admin should control them.

## Implementation Priority

1. **Immediate:** Fix the role check (use Option 1 or 4 for quick fix)
2. **Short-term:** Implement Option 2 (proper role-based access)
3. **Long-term:** Add audit logging for all settings changes
