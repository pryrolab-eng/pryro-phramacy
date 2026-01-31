# Subscription System Fixes

## Issues Identified

### 1. Payment Completion Not Activating Subscription
**Problem**: When payment completed via webhook or status check, the subscription remained inactive.

**Root Cause**: Missing logic to update subscription status when payment transaction status changed to 'completed'.

**Fixed In**:
- `src/app/api/kpay/webhook/route.ts` - Added subscription activation on webhook
- `src/app/api/kpay/status/route.ts` - Added subscription activation on status check

### 2. No Return URL After Payment
**Problem**: Users redirected to payment gateway had no way to return to the app after payment.

**Root Cause**: KPay payment request didn't include a return URL.

**Fixed In**:
- `src/app/api/kpay/initiate/route.ts` - Added returnUrl parameter
- `src/app/payment-success/page.tsx` - Created payment success page to handle returns

### 3. Poor Subscription Flow
**Problem**: Subscription created before payment, leading to orphaned records if payment failed.

**Root Cause**: Logic in settings page created subscription first, then initiated payment separately.

**Fixed In**:
- `src/app/api/subscriptions/upgrade/route.ts` - New dedicated endpoint for cleaner flow

## Files Modified

1. **src/app/api/kpay/webhook/route.ts**
   - Added subscription activation when statusid === '01'

2. **src/app/api/kpay/status/route.ts**
   - Added subscription activation when kpayStatus.statusid === '01'

3. **src/app/api/kpay/initiate/route.ts**
   - Added returnUrl to kpayRequest object

## Files Created

1. **src/app/api/subscriptions/upgrade/route.ts**
   - Dedicated endpoint for subscription upgrades
   - Handles plan validation, subscription creation, and payment linking
   - Deactivates old subscriptions before creating new ones

2. **src/app/payment-success/page.tsx**
   - Landing page after payment gateway redirect
   - Checks payment status and shows appropriate message
   - Provides navigation back to settings or dashboard

## How It Works Now

### Subscription Upgrade Flow:

1. User clicks "Upgrade" on settings page
2. Frontend calls `/api/subscriptions/upgrade` with planId
3. Backend creates subscription (inactive if paid plan)
4. Frontend initiates payment via `/api/kpay/initiate` with subscriptionId
5. User redirected to payment gateway (for card) or receives mobile money prompt
6. After payment, user redirected to `/payment-success?refid=XXX`
7. Payment success page checks status via `/api/kpay/status`
8. When payment completes:
   - Webhook or status check updates payment_transactions.status = 'completed'
   - Automatically updates subscriptions.is_active = true
9. User sees success message and can return to settings

### Key Improvements:

- ✅ Subscription automatically activated when payment completes
- ✅ Users can return to app after payment
- ✅ Clear success/failure feedback
- ✅ Proper error handling at each step
- ✅ No orphaned subscriptions (old ones deactivated)

## Testing Checklist

- [ ] Free plan upgrade (should activate immediately)
- [ ] Paid plan upgrade with mobile money
- [ ] Paid plan upgrade with card
- [ ] Payment success redirect works
- [ ] Payment failure handling
- [ ] Webhook activates subscription
- [ ] Status polling activates subscription
- [ ] Old subscriptions properly deactivated

## Environment Variables Required

Add to `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Database Schema Check

Ensure these tables exist:
- `subscription_plans` (id, name, price, period, features, is_active)
- `subscriptions` (id, pharmacy_id, plan_id, is_active, expires_at)
- `payment_transactions` (id, subscription_id, status, kpay_refid, kpay_tid)

## Next Steps

1. Update settings page to use new `/api/subscriptions/upgrade` endpoint
2. Add environment variable for NEXT_PUBLIC_APP_URL
3. Test complete flow end-to-end
4. Add email notifications for successful upgrades
5. Add admin dashboard to view subscription analytics
