# 🧪 KPay Integration - Manual Testing Guide
## Step-by-Step Testing for Admin and Pharmacy Owner

---

## 🚀 Quick Start

### Prerequisites:
1. ✅ Dev server running: `npm run dev`
2. ✅ Database migration applied
3. ✅ Environment variables configured (.env.local)

### Run Automated Test:
```bash
# Windows
test-kpay-admin-pharmacy.bat

# Or directly
node test-kpay-admin-pharmacy.js
```

---

## 👨‍💼 ADMIN TESTING

### Test 1: Admin Login
**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"abdousentore@gmail.com\",\"password\":\"admin123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "email": "abdousentore@gmail.com",
    "role": "superadmin",
    "name": "Super Admin"
  },
  "token": "mock-jwt-token"
}
```

✅ **Pass Criteria:** Status 200, token received

---

### Test 2: Admin View Subscription Plans
**Endpoint:** `GET /api/admin/plans`

```bash
curl -X GET http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer mock-jwt-token"
```

**Expected Response:**
```json
[
  {
    "id": "1",
    "name": "Free",
    "price": 0,
    "period": "monthly",
    "features": ["Basic POS", "Up to 100 products"]
  },
  {
    "id": "2",
    "name": "Standard",
    "price": 50000,
    "period": "monthly",
    "features": ["Full POS", "Unlimited products", "Reports"]
  },
  ...
]
```

✅ **Pass Criteria:** Status 200, array of plans returned

---

### Test 3: Admin Create New Plan
**Endpoint:** `POST /api/admin/plans`

```bash
curl -X POST http://localhost:3000/api/admin/plans \
  -H "Authorization: Bearer mock-jwt-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Enterprise\",
    \"price\": 500000,
    \"period\": \"monthly\",
    \"features\": [
      \"Multi-branch support\",
      \"Advanced analytics\",
      \"Priority support\",
      \"Custom integrations\"
    ]
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "plan": {
    "id": "5",
    "name": "Enterprise",
    "price": 500000,
    "period": "monthly",
    "features": [...]
  }
}
```

✅ **Pass Criteria:** Status 201, plan created

---

### Test 4: Admin View All Pharmacy Subscriptions
**Endpoint:** `GET /api/admin/subscriptions`

```bash
curl -X GET http://localhost:3000/api/admin/subscriptions \
  -H "Authorization: Bearer mock-jwt-token"
```

**Expected Response:**
```json
[
  {
    "id": "1",
    "pharmacy_id": "pharmacy-1",
    "pharmacy_name": "City Pharmacy Kigali",
    "plan_id": "2",
    "plan_name": "Standard",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": "2024-02-01",
    "days_remaining": 15
  },
  ...
]
```

⚠️ **Current Status:** Endpoint returns 404 (needs to be created)

---

### Test 5: Admin View Payment Transactions
**Endpoint:** `GET /api/admin/payments`

```bash
curl -X GET http://localhost:3000/api/admin/payments \
  -H "Authorization: Bearer mock-jwt-token"
```

**Expected Response:**
```json
[
  {
    "id": "txn-1",
    "pharmacy_name": "City Pharmacy Kigali",
    "amount": 50000,
    "payment_method": "momo",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00Z"
  },
  ...
]
```

---

## 🏪 PHARMACY OWNER TESTING

### Test 1: Pharmacy Owner Login
**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"pharmacy@test.com\",\"password\":\"pharmacy123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "email": "pharmacy@test.com",
    "role": "pharmacy_owner",
    "name": "Pharmacy Owner"
  },
  "token": "mock-jwt-token"
}
```

✅ **Pass Criteria:** Status 200, token received

---

### Test 2: View Available Plans
**Endpoint:** `GET /api/plans`

```bash
curl -X GET http://localhost:3000/api/plans
```

**Expected Response:**
```json
[
  {
    "id": "1",
    "name": "Free",
    "price": 0,
    "period": "monthly",
    "features": ["Basic POS", "Up to 100 products"]
  },
  {
    "id": "2",
    "name": "Standard",
    "price": 50000,
    "period": "monthly",
    "features": ["Full POS", "Unlimited products", "Reports"]
  },
  {
    "id": "3",
    "name": "Premium",
    "price": 120000,
    "period": "monthly",
    "features": ["Everything in Standard", "Multi-branch", "Advanced analytics"]
  }
]
```

✅ **Pass Criteria:** Status 200, public access (no auth required)

---

### Test 3: View Current Subscription Status
**Endpoint:** `GET /api/subscriptions/status`

**With Supabase Auth:**
```bash
curl -X GET http://localhost:3000/api/subscriptions/status \
  -H "Authorization: Bearer <SUPABASE_TOKEN>"
```

**Expected Response:**
```json
{
  "subscription": {
    "id": "sub-1",
    "plan_id": "2",
    "plan_name": "Standard",
    "status": "active",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "days_remaining": 15,
    "hours_remaining": 360,
    "minutes_remaining": 21600
  }
}
```

⚠️ **Current Status:** Requires Supabase authentication token

---

### Test 4: Initiate Mobile Money Payment
**Endpoint:** `POST /api/kpay/initiate`

**With Supabase Auth:**
```bash
curl -X POST http://localhost:3000/api/kpay/initiate \
  -H "Authorization: Bearer <SUPABASE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 50000,
    \"paymentMethod\": \"momo\",
    \"bankId\": \"63510\",
    \"customerName\": \"John Doe\",
    \"customerPhone\": \"250788123456\",
    \"customerEmail\": \"john@example.com\",
    \"details\": \"Standard Plan Subscription\"
  }"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "transaction": {
    "id": "txn-123",
    "refid": "PYX-1234567890-abc123",
    "tid": "E6974831594723691",
    "status": "processing",
    "checkoutUrl": null
  },
  "kpayResponse": {
    "reply": "PENDING",
    "success": 1,
    "tid": "E6974831594723691",
    "refid": "PYX-1234567890-abc123",
    "retcode": 0
  }
}
```

**Expected Response (With Real KPay Credentials):**
```json
{
  "success": true,
  "transaction": {
    "id": "txn-123",
    "refid": "PYX-1234567890-abc123",
    "tid": "E6974831594723691",
    "status": "processing"
  },
  "message": "Payment prompt sent to 250788123456. Please enter your PIN to complete payment."
}
```

⚠️ **Current Status:** Requires Supabase authentication token

---

### Test 5: Initiate Card Payment
**Endpoint:** `POST /api/kpay/initiate`

**With Supabase Auth:**
```bash
curl -X POST http://localhost:3000/api/kpay/initiate \
  -H "Authorization: Bearer <SUPABASE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 120000,
    \"paymentMethod\": \"cc\",
    \"bankId\": \"000\",
    \"customerName\": \"John Doe\",
    \"customerPhone\": \"250788123456\",
    \"customerEmail\": \"john@example.com\",
    \"cardNumber\": \"4111111111111111\",
    \"expiryMonth\": \"12\",
    \"expiryYear\": \"2025\",
    \"cvv\": \"123\",
    \"details\": \"Premium Plan Subscription\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "txn-124",
    "refid": "PYX-1234567891-def456",
    "tid": "E6974831594723692",
    "status": "processing",
    "checkoutUrl": "https://pay.esicia.com/checkout/A12343983489"
  },
  "kpayResponse": {
    "reply": "PENDING",
    "url": "https://pay.esicia.com/checkout/A12343983489",
    "success": 1,
    "tid": "E6974831594723692",
    "refid": "PYX-1234567891-def456",
    "retcode": 0
  },
  "message": "Redirecting to payment page..."
}
```

⚠️ **Current Status:** Requires Supabase authentication token

---

### Test 6: Check Payment Status
**Endpoint:** `GET /api/kpay/status?transactionId=txn-123`

**With Supabase Auth:**
```bash
curl -X GET "http://localhost:3000/api/kpay/status?transactionId=txn-123" \
  -H "Authorization: Bearer <SUPABASE_TOKEN>"
```

**Expected Response:**
```json
{
  "transaction": {
    "id": "txn-123",
    "kpay_refid": "PYX-1234567890-abc123",
    "kpay_tid": "E6974831594723691",
    "amount": 50000,
    "currency": "RWF",
    "payment_method": "momo",
    "status": "completed",
    "kpay_status_id": "01",
    "kpay_status_desc": "Successfully processed transaction",
    "mom_transaction_id": "616730887",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:31:00Z"
  }
}
```

---

## 🧪 Test Cards (Sandbox)

### Mastercard Test Cards:
```
5101 1800 0000 0007  (Commercial Credit)
5555 5555 5555 4444  (Corporate)
5103 2219 1119 9245  (Prepaid)
```

### Visa Test Cards:
```
4111 1111 1111 1111  (Consumer)
4988 4388 4388 4305  (Classic)
4000 0200 0000 0000  (Credit)
```

### Test Details:
- **Expiry:** Any future date (e.g., 12/2025)
- **CVV:** Any 3 digits (e.g., 123)
- **Name:** Any name

---

## 📱 Test Phone Numbers

### MTN Mobile Money:
```
250788123456  (Test number)
250788XXXXXX  (Format: 2507XX...)
```

### Airtel Money:
```
250738123456  (Test number)
250738XXXXXX  (Format: 2507XX...)
```

---

## 🔍 Verification Checklist

### Admin Role:
- [ ] Can login successfully
- [ ] Can view all subscription plans
- [ ] Can create new plans
- [ ] Can edit existing plans
- [ ] Can delete plans
- [ ] Can view all pharmacy subscriptions
- [ ] Can view all payment transactions
- [ ] Can access payment logs
- [ ] Can see system-wide analytics

### Pharmacy Owner Role:
- [ ] Can login successfully
- [ ] Can view available plans
- [ ] Can see current subscription status
- [ ] Can see days/hours remaining
- [ ] Can initiate mobile money payment
- [ ] Can initiate card payment
- [ ] Can check payment status
- [ ] Can view payment history
- [ ] Receives payment confirmation
- [ ] Subscription activates after payment

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Cause:** Using mock token instead of Supabase token
**Solution:** Use Supabase authentication to get real token

### Issue: "Invalid phone number"
**Cause:** Phone number format incorrect
**Solution:** Use format: 250788123456 (no + or spaces)

### Issue: "Invalid card details"
**Cause:** Card validation failed
**Solution:** Use test cards from list above

### Issue: KPay returns error 600
**Cause:** Invalid KPay credentials
**Solution:** Verify credentials in .env.local

### Issue: KPay returns error 602
**Cause:** IP not whitelisted
**Solution:** Contact KPay to whitelist your IP

---

## 📊 Expected Test Results

### With Mock Authentication:
```
✅ Public endpoints work (plans)
✅ Admin login works
✅ Pharmacy owner login works
⚠️  Protected endpoints require Supabase auth
```

### With Supabase Authentication:
```
✅ All endpoints accessible
✅ Payment initiation works
✅ Status checking works
✅ Webhook handling works
✅ Subscription activation works
```

### With Production KPay Credentials:
```
✅ Real payments processed
✅ Mobile money prompts sent
✅ Card payments redirect to KPay
✅ Webhooks received
✅ Subscriptions activated automatically
```

---

## 🎯 Success Criteria

### Admin Testing Complete When:
1. ✅ Can login and get token
2. ✅ Can view/create/edit/delete plans
3. ✅ Can view all subscriptions
4. ✅ Can monitor payments
5. ✅ Can access logs

### Pharmacy Owner Testing Complete When:
1. ✅ Can login and get token
2. ✅ Can view subscription status
3. ✅ Can initiate mobile money payment
4. ✅ Can initiate card payment
5. ✅ Can check payment status
6. ✅ Subscription activates after payment
7. ✅ Time counter shows correct remaining time

---

## 📞 Support

### For Testing Issues:
- Check dev server is running: `npm run dev`
- Verify database migration applied
- Check .env.local configuration
- Review test output for specific errors

### For KPay Issues:
- Email: support@esicia.com
- Provide: Transaction ID, Error code, Timestamp

### Documentation:
- Full Report: `KPAY_INTEGRATION_TEST_REPORT.md`
- Quick Summary: `KPAY_TEST_SUMMARY.md`
- API Docs: `kpay.md`

---

**Last Updated:** 2024
**Test Suite Version:** 1.0
