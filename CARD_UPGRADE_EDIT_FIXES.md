# Card Upgrade & Edit Fixes

## Issues Fixed

### 1. Card Upgrade Not Working ✅

**Problem:**
- Variable `planName` was undefined in `processUpgradePayment` function
- This caused errors when trying to upgrade with card payment
- Multiple references to undefined `planName` variable

**Solution:**
- Changed all `planName` references to `plan.name` in the `processUpgradePayment` function
- Fixed 3 occurrences:
  1. Line 382: Subscription creation API call
  2. Line 395: Payment details string
  3. Line 428: Success message after payment completion

**Changes Made:**
- File: `src/app/(dashboard)\settings\page.tsx`
  - Line 382: `planId: plan.id || plan.name` (was `planId: plan.id || planName`)
  - Line 395: `details: \`${plan.name} plan subscription\`` (was `${planName}`)
  - Line 428: `alert(\`...${plan.name} plan.\`)` (was `${planName}`)

### 2. Edit/Redirect Functionality ✅

**Status:**
- Edit functionality is working correctly
- The `handleSaveEdit` function properly updates pharmacy information
- Both "Edit Information" button and "Save Preferences" button call the same function
- No issues found with redirect functionality

## Testing Steps

### Test Card Upgrade:
1. Go to Settings page
2. Click "Upgrade" on Premium or Standard plan
3. Select "Card (Visa/Mastercard)" as payment method
4. Enter phone number: 0788123456
5. Enter email address
6. Click "Pay Now"
7. Should redirect to KPay checkout page without errors

### Test Mobile Money Upgrade:
1. Go to Settings page
2. Click "Upgrade" on any paid plan
3. Select "Mobile Money (MTN/Airtel)"
4. Enter phone number: 0788123456
5. Enter email address
6. Click "Pay Now"
7. Should show payment prompt message

### Test Edit Functionality:
1. Go to Settings > General tab
2. Click "Edit Information"
3. Modify pharmacy name, location, phone, or email
4. Click "Save"
5. Should update successfully and close edit mode

## Files Modified

1. `src/app/(dashboard)\settings\page.tsx` - Fixed undefined planName variable (3 locations)

## Root Cause

The `handleUpgrade` function was refactored to use a dialog, but the `processUpgradePayment` function was trying to access `planName` from the outer scope which no longer existed. The plan data is now stored in `selectedUpgradePlan` state and accessed as `plan` in the function.
