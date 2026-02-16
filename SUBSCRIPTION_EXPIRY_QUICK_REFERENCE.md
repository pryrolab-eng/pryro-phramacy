# Subscription Expiry - Quick Reference

## What Happens When Subscription Expires?

### For Pharmacy Owner (Monthly - 30 days)
- **Days 1-23**: ✅ Normal access, green indicator
- **Days 24-30**: ⚠️ Yellow warning "Expiring Soon!"
- **Day 31+**: ❌ RED ALERT - System BLOCKED

### For Pharmacy Owner (Yearly - 365 days)
- **Days 1-358**: ✅ Normal access, green indicator
- **Days 359-365**: ⚠️ Yellow warning "Expiring Soon!"
- **Day 366+**: ❌ RED ALERT - System BLOCKED

### For Pharmacists & Staff
- **Before expiry**: No subscription indicator, full access
- **After expiry**: Red alert "Access Suspended - Contact owner to renew"

## What Gets Blocked?
When subscription expires, ALL users lose access to:
- ❌ POS (Point of Sale)
- ❌ Inventory management
- ❌ Sales transactions
- ❌ Reports
- ❌ Customer management
- ❌ All dashboard features

## What Stays Safe?
- ✅ All data preserved (sales, inventory, customers)
- ✅ Database records intact
- ✅ User accounts remain active
- ✅ Data restored immediately upon renewal

## How to Renew?

### Pharmacy Owner:
1. Click "Renew Now" button in sidebar
2. Go to Settings → Subscription
3. Choose plan (Monthly or Yearly)
4. Complete payment
5. Access restored automatically

### Pharmacists/Staff:
- Cannot renew
- Must contact pharmacy owner

## Files Modified

### Frontend Components:
- `src/components/pharmacy-sidebar.tsx` - Owner subscription display
- `src/components/pharmacist-sidebar.tsx` - Staff suspension notice

### Backend:
- `src/lib/subscription-check.ts` - Access verification middleware
- `supabase/migrations/20250101000001_subscription_expiry_functions.sql` - Database functions

### Documentation:
- `SUBSCRIPTION_EXPIRY_GUIDE.md` - Full documentation
- `test-subscription-expiry.js` - Testing script

## Database Functions

### check_expired_subscriptions()
- Runs daily (via cron)
- Updates expired pharmacies to 'suspended'

### get_subscription_status(pharmacy_id)
- Returns subscription details
- Shows days remaining, expiry status

## Testing

Run the test script:
```bash
node test-subscription-expiry.js
```

This will:
1. Check current pharmacies
2. Simulate warning period (5 days)
3. Simulate expiry
4. Test suspension
5. Test monthly renewal
6. Test yearly renewal

## Support
Questions? Contact: support@pryrox.com
