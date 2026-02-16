# Subscription Expiry System Documentation

## Overview
This document explains how the subscription expiry system works for pharmacy owners and pharmacists in the Pryrox pharmacy management system.

## How It Works

### 1. Subscription Plans
- **Trial**: Free trial period (typically 14-30 days)
- **Standard**: Monthly subscription (30 days)
- **Premium**: Yearly subscription (365 days)

### 2. Expiry Timeline

#### For Pharmacy Owner (Monthly Subscription - 30 days)
```
Day 1-23:  ✅ Normal access - Green indicator showing days left
Day 24-30: ⚠️  Warning period - Yellow/Amber alert "Expiring Soon"
Day 31+:   ❌ EXPIRED - Red alert, system access BLOCKED
```

#### For Pharmacy Owner (Yearly Subscription - 365 days)
```
Day 1-358: ✅ Normal access - Green indicator showing days left
Day 359-365: ⚠️ Warning period - Yellow/Amber alert "Expiring Soon"
Day 366+:  ❌ EXPIRED - Red alert, system access BLOCKED
```

### 3. What Happens When Subscription Expires

#### Immediate Effects (Day of Expiry):
1. **Pharmacy Status Changes**: `active` → `suspended`
2. **All Access Blocked**: Owner, pharmacists, and staff cannot use the system
3. **Sidebar Alerts**: Red warning appears for all users
4. **Dashboard Access**: Redirected to subscription expired page
5. **POS Disabled**: No sales transactions can be processed
6. **Inventory Locked**: Cannot add/edit inventory
7. **Reports Unavailable**: Cannot generate or view reports

#### What Remains Safe:
- ✅ All data is preserved (sales, inventory, customers, etc.)
- ✅ Database records remain intact
- ✅ Historical data is not deleted
- ✅ User accounts remain active

### 4. User Experience

#### Pharmacy Owner Sidebar
**Normal State (7+ days remaining):**
```
┌─────────────────────────┐
│ ⚡ Standard    15d      │
│ 👑 Upgrade to Premium   │
└─────────────────────────┘
```

**Warning State (1-7 days remaining):**
```
┌─────────────────────────┐
│ ⚠️  Expiring Soon!      │
│ Standard  3 days left   │
│ 👑 Renew Subscription   │
└─────────────────────────┘
```

**Expired State (0 days):**
```
┌─────────────────────────┐
│ ⚠️  Subscription Expired│
│ Access suspended.       │
│ Renew to continue.      │
│ 👑 Renew Now           │
└─────────────────────────┘
```

#### Pharmacist Sidebar
**Normal State:**
- No subscription indicator shown
- Full access to all features

**Expired State:**
```
┌─────────────────────────┐
│ ⚠️  Access Suspended    │
│ Pharmacy subscription   │
│ expired. Contact owner  │
│ to renew.              │
└─────────────────────────┘
```

### 5. Renewal Process

#### For Pharmacy Owner:
1. Click "Renew Now" button in sidebar
2. Redirected to Settings → Subscription page
3. Choose plan (Monthly or Yearly)
4. Complete payment via KPay
5. System automatically:
   - Updates `subscription_expires_at` date
   - Changes status from `suspended` → `active`
   - Restores full access for all users

#### For Pharmacists/Staff:
- Cannot renew subscription
- Must contact pharmacy owner
- Shown message: "Contact owner to renew"

### 6. Technical Implementation

#### Database Schema
```sql
-- pharmacies table
subscription_plan: 'trial' | 'standard' | 'premium'
subscription_expires_at: timestamp with time zone
status: 'active' | 'inactive' | 'suspended' | 'trial'
```

#### Automatic Expiry Check
- **Function**: `check_expired_subscriptions()`
- **Frequency**: Runs daily (recommended via cron job)
- **Action**: Updates status to 'suspended' for expired pharmacies

#### Frontend Components
- `pharmacy-sidebar.tsx`: Shows expiry status for owners
- `pharmacist-sidebar.tsx`: Shows suspension notice for staff
- `subscription-check.ts`: Middleware to verify access

### 7. API Endpoints

#### Check Subscription Status
```
GET /api/subscriptions/status
Response: {
  status: 'active' | 'expired',
  daysRemaining: number,
  isExpiringSoon: boolean,
  expiresAt: string
}
```

#### Renew Subscription
```
POST /api/subscriptions/upgrade
Body: { planId: 'standard' | 'premium' }
```

### 8. Notifications

#### 7 Days Before Expiry:
- Email notification sent to pharmacy owner
- Sidebar shows yellow warning
- Dashboard banner appears

#### Day of Expiry:
- Email notification sent
- System access blocked
- Red alert in sidebar
- All users see suspension message

#### After Expiry:
- Daily reminder emails (for 7 days)
- Persistent red alerts
- Access remains blocked until renewal

### 9. Grace Period (Optional)
Currently: **No grace period** - Access blocked immediately on expiry day

To add grace period, modify:
```sql
-- Add 3-day grace period
WHERE subscription_expires_at <= (now() - interval '3 days')
```

### 10. Testing Scenarios

#### Test Case 1: Monthly Expiry
1. Set `subscription_expires_at` to tomorrow
2. Wait for expiry
3. Verify status changes to 'suspended'
4. Verify all users blocked

#### Test Case 2: Renewal
1. Expire a subscription
2. Process renewal payment
3. Verify status changes to 'active'
4. Verify access restored

#### Test Case 3: Warning Period
1. Set expiry to 5 days from now
2. Verify yellow warning appears
3. Verify "Expiring Soon" message

### 11. Troubleshooting

**Issue**: Subscription expired but still have access
- **Solution**: Run `check_expired_subscriptions()` function manually

**Issue**: Renewed but still blocked
- **Solution**: Check `pharmacies.status` is 'active' and `subscription_expires_at` is in future

**Issue**: Wrong days remaining count
- **Solution**: Verify timezone settings match database timezone

### 12. Future Enhancements
- [ ] Auto-renewal with saved payment methods
- [ ] SMS notifications for expiry
- [ ] Grace period configuration
- [ ] Prorated refunds for downgrades
- [ ] Multi-year discounts
- [ ] Trial extension for first-time users

## Support
For questions or issues, contact: support@pryrox.com
