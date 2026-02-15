# Admin Settings Dashboard - Issues Fixed

## Problems Identified

### 1. **API Route Using UPDATE Instead of UPSERT**
- **Issue**: The PUT endpoint in `/api/admin/system-settings/route.ts` was using `.update()` which only modifies existing rows
- **Impact**: When toggling settings that don't exist in the database yet, nothing happens
- **Fix**: Changed to `.upsert()` which creates new rows if they don't exist, or updates existing ones

### 2. **Missing RLS Policies for Global Settings**
- **Issue**: Row Level Security policies only allowed users to access settings where `pharmacy_id` matched their pharmacy
- **Impact**: Admin users couldn't access or modify global system settings (where `pharmacy_id IS NULL`)
- **Fix**: Updated RLS policies to allow admin/superadmin users to access global settings

## Changes Made

### File: `src/app/api/admin/system-settings/route.ts`
- Changed from `.update()` to `.upsert()` in the PUT endpoint
- Added proper conflict resolution with `onConflict: 'pharmacy_id,setting_key'`
- Now creates settings if they don't exist, or updates them if they do

### File: `supabase/migrations/20241205000001_fix_system_settings_admin_access.sql`
- Updated SELECT policy to allow admins to view global settings
- Updated INSERT policy to allow admins to create global settings
- Updated UPDATE policy to allow admins to modify global settings
- All policies check for `role IN ('admin', 'superadmin')`

## How to Apply the Fix

Run the migration script:
```powershell
.\apply-settings-fix.ps1
```

Or manually apply the migration:
```powershell
npx supabase db push
```

## Testing

After applying the fix, test the following:
1. Toggle any switch in the Admin Settings page
2. Click "Save Settings"
3. Refresh the page - settings should persist
4. Check that all toggles work correctly

## Settings That Should Now Work

All toggle switches in the dashboard:
- Enable Multi-Branch
- White-label Features
- Enable New Registrations
- SSO Integration
- Data Encryption
- Audit Logging
- Maintenance Mode
- Enable Notifications
- Automatic Backups
- Automatic Updates
