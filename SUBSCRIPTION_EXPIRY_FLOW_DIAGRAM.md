# Subscription Expiry Flow Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ New Pharmacy │
│  Registers   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  TRIAL PERIOD (14-30 days)                                       │
│  Status: 'trial'                                                 │
│  Access: ✅ Full access                                          │
│  Sidebar: Green indicator                                        │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  CHOOSE SUBSCRIPTION                                             │
│  ├─ Monthly (30 days) → 50,000 RWF                              │
│  └─ Yearly (365 days) → 500,000 RWF                             │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  ACTIVE SUBSCRIPTION                                             │
│  Status: 'active'                                                │
│  subscription_expires_at: [future date]                          │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Time passes...
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  NORMAL PERIOD (8+ days remaining)                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pharmacy Owner Sidebar:                                    │ │
│  │ ┌────────────────────────┐                                 │ │
│  │ │ ⚡ Standard    15d     │                                 │ │
│  │ │ 👑 Upgrade to Premium  │                                 │ │
│  │ └────────────────────────┘                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Pharmacist Sidebar: No subscription indicator                  │
│  Access: ✅ Full system access for all users                    │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Time passes...
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  WARNING PERIOD (1-7 days remaining)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pharmacy Owner Sidebar:                                    │ │
│  │ ┌────────────────────────┐                                 │ │
│  │ │ ⚠️  Expiring Soon!     │                                 │ │
│  │ │ Standard  3 days left  │                                 │ │
│  │ │ 👑 Renew Subscription  │                                 │ │
│  │ └────────────────────────┘                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Pharmacist Sidebar: No indicator yet                            │
│  Access: ✅ Still full access                                   │
│  Notification: ⚠️ Email sent to owner                           │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Expiry date reached!
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  EXPIRED - DAY 0                                                 │
│  Status: 'active' → 'suspended' (auto-updated)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pharmacy Owner Sidebar:                                    │ │
│  │ ┌────────────────────────┐                                 │ │
│  │ │ ⚠️  Subscription Expired│                                │ │
│  │ │ Access suspended.      │                                 │ │
│  │ │ Renew to continue.     │                                 │ │
│  │ │ 👑 Renew Now          │                                 │ │
│  │ └────────────────────────┘                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pharmacist Sidebar:                                        │ │
│  │ ┌────────────────────────┐                                 │ │
│  │ │ ⚠️  Access Suspended   │                                 │ │
│  │ │ Pharmacy subscription  │                                 │ │
│  │ │ expired. Contact owner │                                 │ │
│  │ │ to renew.             │                                 │ │
│  │ └────────────────────────┘                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Access: ❌ ALL FEATURES BLOCKED                                │
│  - POS disabled                                                  │
│  - Inventory locked                                              │
│  - Reports unavailable                                           │
│  - Sales blocked                                                 │
│  - All users cannot access system                                │
│                                                                  │
│  Data: ✅ ALL DATA PRESERVED                                    │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Owner decides...
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   ┌────────┐      ┌────────┐      ┌──────────┐
   │ Renew  │      │ Renew  │      │  Don't   │
   │Monthly │      │Yearly  │      │  Renew   │
   └───┬────┘      └───┬────┘      └────┬─────┘
       │               │                 │
       │               │                 ▼
       │               │           ┌──────────────┐
       │               │           │ Stay Suspended│
       │               │           │ Data preserved│
       │               │           │ for 90 days  │
       │               │           └──────────────┘
       │               │
       └───────┬───────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  RENEWAL PROCESS                                                 │
│  1. Click "Renew Now"                                            │
│  2. Go to Settings → Subscription                                │
│  3. Choose plan                                                  │
│  4. Complete payment (KPay)                                      │
│  5. System updates:                                              │
│     - subscription_expires_at = now + period                     │
│     - status = 'active'                                          │
│  6. Access restored immediately                                  │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  ACTIVE AGAIN                                                    │
│  Status: 'active'                                                │
│  Access: ✅ Full access restored for all users                   │
│  Sidebar: Green indicator with new expiry date                   │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Cycle repeats...
       │
       └──────────────────────────────────────────────────────────┘
```

## Daily Cron Job Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  DAILY CRON JOB (Runs at 00:00 UTC)                             │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  check_expired_subscriptions()                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SELECT * FROM pharmacies                                   │ │
│  │ WHERE subscription_expires_at <= now()                     │ │
│  │   AND status IN ('active', 'trial')                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Found expired pharmacies?                                       │
└──────────────────────────────────────────────────────────────────┘
       │
       ├─── NO ──→ Exit (nothing to do)
       │
       └─── YES ──→ Continue
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  For each expired pharmacy:                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ UPDATE pharmacies                                          │ │
│  │ SET status = 'suspended', updated_at = now()               │ │
│  │ WHERE id = pharmacy_id                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Optional: Send email notification to owner                      │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Log results                                                     │
│  - Number of pharmacies suspended                                │
│  - Pharmacy names and IDs                                        │
└──────────────────────────────────────────────────────────────────┘
```

## User Login Flow with Expiry Check

```
┌──────────────┐
│ User Logs In │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Get user's pharmacy_id from pharmacy_users                      │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Get pharmacy details                                            │
│  - status                                                        │
│  - subscription_expires_at                                       │
│  - subscription_plan                                             │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Check: Is status = 'suspended'?                                 │
└──────────────────────────────────────────────────────────────────┘
       │
       ├─── YES ──→ Block access, show expiry message
       │
       └─── NO ──→ Continue
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  Check: Is subscription_expires_at < now()?                      │
└──────────────────────────────────────────────────────────────────┘
       │
       ├─── YES ──→ Update status to 'suspended'
       │            Block access, show expiry message
       │
       └─── NO ──→ Allow access
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  Calculate days remaining                                        │
│  Show appropriate sidebar indicator                              │
│  - Green (8+ days)                                               │
│  - Yellow (1-7 days)                                             │
└──────────────────────────────────────────────────────────────────┘
```

## Legend

```
✅ = Allowed/Active
❌ = Blocked/Disabled
⚠️  = Warning
👑 = Premium/Upgrade
⚡ = Active subscription
```
