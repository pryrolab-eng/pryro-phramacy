# KPay Payment Integration Guide

## Overview
This integration connects your Pryrox pharmacy system with KPay payment gateway for processing payments via:
- MTN Mobile Money
- Airtel Money
- Visa/Mastercard
- Bank transfers
- Spenn
- SmartCash

## Files Created

### 1. Backend Services
- `src/lib/kpay.ts` - KPay service with API integration
- `src/app/api/kpay/initiate/route.ts` - Payment initiation endpoint
- `src/app/api/kpay/webhook/route.ts` - Webhook for payment notifications
- `src/app/api/kpay/status/route.ts` - Payment status checking

### 2. Database
- `supabase/migrations/20240325000001_kpay_integration.sql` - Payment tables

### 3. Frontend
- `src/components/payment/PaymentForm.tsx` - Payment UI component

### 4. Testing
- `test-kpay-integration.js` - Integration test script

## Setup Instructions

### Step 1: Environment Variables
Update `.env.local` with your KPay credentials:

```env
KPAY_BASE_URL=https://pay.esicia.com  # Use https://pay.esicia.rw for production
KPAY_USERNAME=your_username
KPAY_PASSWORD=your_password
KPAY_RETAILER_ID=02
KPAY_RETURN_URL=https://yourdomain.com/api/kpay/webhook
KPAY_REDIRECT_URL=https://yourdomain.com/payment/success
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 2: IP Whitelisting
Contact KPay to whitelist your server IPs where the application will run.

### Step 3: Database Migration
Run the migration to create payment tables:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase dashboard
```

### Step 4: Test the Integration

#### Test Payment Initiation
```javascript
const response = await fetch('/api/kpay/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 5000,
    paymentMethod: 'momo',
    bankId: '63510',
    customerName: 'John Doe',
    customerPhone: '250788123456',
    customerEmail: 'john@example.com',
    saleId: 'optional-sale-id',
    details: 'Pharmacy payment'
  })
})
```

#### Test Cards (Sandbox)
Use these test cards for testing:

**Mastercard:**
- 5101 1800 0000 0007
- 5555 5555 5555 4444

**Visa:**
- 4111 1111 1111 1111
- 4988 4388 4388 4305

## Usage Examples

### 1. POS Sale Payment
```tsx
import { PaymentForm } from '@/components/payment/PaymentForm'

function POSCheckout({ saleId, totalAmount }) {
  return (
    <PaymentForm
      amount={totalAmount}
      saleId={saleId}
      onSuccess={(transaction) => {
        console.log('Payment successful:', transaction)
        // Redirect to receipt page
      }}
      onError={(error) => {
        console.error('Payment failed:', error)
      }}
    />
  )
}
```

### 2. Subscription Payment
```tsx
import { PaymentForm } from '@/components/payment/PaymentForm'

function SubscriptionUpgrade({ plan, amount }) {
  return (
    <PaymentForm
      amount={amount}
      subscriptionId={plan.id}
      onSuccess={(transaction) => {
        console.log('Subscription activated:', transaction)
      }}
      onError={(error) => {
        console.error('Subscription payment failed:', error)
      }}
    />
  )
}
```

### 3. Check Payment Status
```javascript
const checkStatus = async (transactionId) => {
  const response = await fetch(`/api/kpay/status?transactionId=${transactionId}`)
  const data = await response.json()
  
  console.log('Payment status:', data.transaction.status)
  // Status: 'pending', 'processing', 'completed', 'failed'
}
```

## Payment Flow

### 1. Initiate Payment
```
User → PaymentForm → /api/kpay/initiate → KPay API
                                          ↓
                                    Create transaction record
                                          ↓
                                    Return checkout URL
```

### 2. Customer Pays
```
Customer → KPay Checkout Page → Enter payment details → Confirm
```

### 3. Webhook Notification
```
KPay → /api/kpay/webhook → Update transaction status → Update sale/subscription
```

### 4. Status Verification
```
App → /api/kpay/status → KPay API → Return current status
```

## Database Schema

### payment_transactions
- Stores all payment transactions
- Links to sales or subscriptions
- Tracks KPay transaction IDs and status

### payment_logs
- Logs all API requests/responses
- Useful for debugging and auditing

## Error Handling

The integration handles these KPay error codes:
- 401: Missing authentication
- 600: Invalid credentials
- 602: IP not whitelisted
- 603: Missing parameters
- 606: Processing error
- 607: Failed mobile money transaction
- 608: Duplicate reference ID
- 611: Transaction not found

## Security Features

1. **Authentication**: Basic Auth with username/password
2. **IP Whitelisting**: Only whitelisted IPs can access KPay API
3. **Unique Reference IDs**: Prevents duplicate transactions
4. **Webhook Validation**: Verifies transaction exists before updating
5. **Service Role Key**: Webhook uses service role for database access

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] IP addresses whitelisted with KPay
- [ ] Test payment initiation with test cards
- [ ] Verify webhook receives notifications
- [ ] Check payment status updates correctly
- [ ] Test sale payment flow
- [ ] Test subscription payment flow
- [ ] Verify error handling
- [ ] Test all payment methods (momo, card, bank)

## Production Deployment

1. Update `KPAY_BASE_URL` to production URL: `https://pay.esicia.rw`
2. Use production credentials
3. Update webhook and redirect URLs to production domain
4. Whitelist production server IPs
5. Test with small amounts first
6. Monitor payment logs table

## Support

For KPay API issues:
- Check payment_logs table for detailed error messages
- Verify IP whitelisting
- Confirm credentials are correct
- Contact KPay support with transaction IDs

## Next Steps

1. Integrate PaymentForm into your POS checkout flow
2. Add payment option to subscription upgrade page
3. Create payment history page for pharmacies
4. Add payment receipt generation
5. Implement refund functionality if needed
