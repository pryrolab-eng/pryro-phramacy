# Subscription Creation Fix

## Issue
When clicking upgrade button, got error: "Failed to create subscription"

## Root Cause
1. Settings page was calling `/api/subscriptions/status` (wrong endpoint)
2. Passing `plan.id || plan.name` but plan object doesn't have `id` property
3. Upgrade route was looking up plan by `id` instead of `name`

## Solution

### Changes Made:

**1. Settings Page (`src/app/(dashboard)/settings/page.tsx`)**
- Changed endpoint from `/api/subscriptions/status` to `/api/subscriptions/upgrade`
- Changed payload from `planId: plan.id || plan.name` to `planId: plan.name`
- Fixed in 2 locations:
  - Line ~350: Paid plan upgrade
  - Line ~288: Free plan upgrade

**2. Upgrade Route (`src/app/api/subscriptions/upgrade/route.ts`)**
- Changed plan lookup from `.eq('id', planId)` to `.eq('name', planId)`
- Now correctly finds plan by name

## Test Results
✅ Uses correct endpoint: /api/subscriptions/upgrade
✅ Passes plan.name correctly
✅ No POST to wrong endpoint
✅ Looks up plan by name

## How It Works Now

1. User clicks "Upgrade" button
2. Dialog opens with payment form
3. User fills in details and clicks "Pay Now"
4. Frontend calls `/api/subscriptions/upgrade` with `planId: "Premium"` (or "Standard", "Basic")
5. Backend looks up plan in database by name
6. Creates subscription record
7. Returns subscription details
8. Frontend proceeds with payment (if paid plan)

## Files Modified
1. `src/app/(dashboard)/settings/page.tsx` - Fixed endpoint and payload (2 locations)
2. `src/app/api/subscriptions/upgrade/route.ts` - Fixed plan lookup

## Testing
Start dev server and test:
1. Click upgrade on any plan
2. Should no longer show "Failed to create subscription"
3. Should proceed to payment step (for paid plans)
4. Should activate immediately (for free plans)
