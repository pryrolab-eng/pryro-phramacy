# Subscription Upgrade - Manual Testing Guide

## ✅ API Tests Passed
- All endpoints are accessible
- Authentication is properly enforced
- Payment success page is available
- Webhook endpoint is functional

## 🧪 Browser Testing Steps

### Test 1: Free Plan Upgrade
1. Open browser and navigate to `http://localhost:3000`
2. Login with your credentials
3. Go to Settings page (`/settings`)
4. Scroll to "Subscription Plans" section
5. Click "Upgrade" on the **Free** plan
6. **Expected**: Immediate upgrade without payment prompt
7. **Verify**: "Active Plan" card at top shows "Free"

### Test 2: Paid Plan Upgrade (Mobile Money)
1. On Settings page, click "Upgrade" on **Standard** plan (50,000 RWF)
2. When prompted for payment method, enter `1` (Mobile Money)
3. Enter phone number: `0788123456`
4. Enter email: `test@pryrox.com`
5. **Expected**: 
   - Alert showing "Payment initiated successfully"
   - Instructions to check phone for payment prompt
   - Transaction ID displayed
6. **Verify**: 
   - Check browser console for status polling
   - After 5 seconds, status should update
   - If payment completes, alert shows success

### Test 3: Paid Plan Upgrade (Card Payment)
1. On Settings page, click "Upgrade" on **Premium** plan (120,000 RWF)
2. When prompted for payment method, enter `2` (Card)
3. Enter phone number: `0788123456`
4. Enter email: `test@pryrox.com`
5. **Expected**: 
   - Confirmation dialog asking to redirect
   - Click "OK" to proceed
6. **Verify**:
   - Redirected to KPay payment gateway
   - After payment, redirected to `/payment-success`
   - Payment success page shows status

### Test 4: Payment Success Page
1. Manually navigate to: `http://localhost:3000/payment-success?refid=TEST123`
2. **Expected**: 
   - Page shows "Processing Payment" with spinner
   - Then shows "Payment Failed" (because TEST123 doesn't exist)
   - Buttons to "Try Again" or "Go to Dashboard"

### Test 5: Webhook Simulation
Open browser console and run:
```javascript
fetch('/api/kpay/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tid: 'YOUR_TRANSACTION_TID',
    refid: 'YOUR_TRANSACTION_REFID',
    statusid: '01',
    statusdesc: 'Transaction successful',
    momtransactionid: 'MOM123456',
    payaccount: '0788123456'
  })
}).then(r => r.json()).then(console.log)
```
Replace `YOUR_TRANSACTION_TID` and `YOUR_TRANSACTION_REFID` with actual values from a pending transaction.

## 🔍 What to Check

### In Browser DevTools (Network Tab):
- `/api/subscriptions/upgrade` - Should return subscription object
- `/api/kpay/initiate` - Should return transaction with checkoutUrl
- `/api/kpay/status` - Should poll every 5 seconds
- `/api/subscriptions/status` - Should show updated plan after payment

### In Database:
```sql
-- Check subscriptions
SELECT * FROM subscriptions WHERE pharmacy_id = 'YOUR_PHARMACY_ID' ORDER BY created_at DESC;

-- Check payment transactions
SELECT * FROM payment_transactions WHERE subscription_id IS NOT NULL ORDER BY created_at DESC;

-- Check if subscription activated after payment
SELECT s.*, pt.status as payment_status 
FROM subscriptions s 
LEFT JOIN payment_transactions pt ON pt.subscription_id = s.id 
WHERE s.pharmacy_id = 'YOUR_PHARMACY_ID' 
ORDER BY s.created_at DESC;
```

## ✅ Success Criteria

- [ ] Free plan upgrades immediately without payment
- [ ] Paid plans create inactive subscription
- [ ] Payment initiation returns transaction ID
- [ ] Mobile money shows payment instructions
- [ ] Card payment redirects to gateway
- [ ] Payment success page loads correctly
- [ ] Webhook activates subscription when payment completes
- [ ] Status polling activates subscription when payment completes
- [ ] Old subscriptions are deactivated when upgrading
- [ ] Settings page shows correct current plan

## 🐛 Common Issues

### Issue: "Pharmacy not found"
**Fix**: User not associated with pharmacy. Check `pharmacy_users` table.

### Issue: "Plan not found"
**Fix**: Plan ID incorrect or plan is inactive. Check `subscription_plans` table.

### Issue: Payment completes but subscription stays inactive
**Fix**: Check webhook is being called. Verify subscription_id is linked to payment_transaction.

### Issue: Redirect after payment doesn't work
**Fix**: Add `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `.env.local`

## 📝 Environment Setup

Add to `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart dev server after adding environment variable.

## 🎯 Quick Test Command

Run this in terminal to verify all endpoints:
```bash
node test-subscription-apis.js
```

All tests should pass before browser testing.
