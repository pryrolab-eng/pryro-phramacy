# Upgrade Button & KPay Integration Fixes

## Issues Fixed

### 1. Upgrade Button Opening Alert Instead of Modal ✅

**Problem:**
- When clicking the upgrade button, the system was using `alert()` and `prompt()` dialogs
- This provided a poor user experience and looked unprofessional

**Solution:**
- Created a proper Dialog component for the upgrade flow
- Added state management for upgrade dialog:
  - `isUpgradeDialogOpen` - controls dialog visibility
  - `selectedUpgradePlan` - stores the plan being upgraded to
  - `upgradePaymentData` - stores payment form data (payment method, phone, email)
- Refactored `handleUpgrade()` function to open the dialog instead of using alerts
- Created `processUpgradePayment()` function to handle the actual payment processing

**Changes Made:**
- File: `src/app/(dashboard)/settings/page.tsx`
  - Added new state variables for upgrade dialog
  - Refactored `handleUpgrade()` to open dialog for paid plans
  - Created new `processUpgradePayment()` function
  - Added upgrade payment dialog UI with:
    - Plan details display
    - Payment method selector (Mobile Money / Card)
    - Phone number input
    - Email input
    - Cancel and Pay Now buttons

### 2. KPay Integration Parameter Mismatch ✅

**Problem:**
- The KPay initiate route was passing `returnUrl` parameter
- The KPayService class expects `returl` and `redirecturl` (handled internally)
- This mismatch could cause issues with payment processing

**Solution:**
- Removed the `returnUrl` parameter from the kpay request object
- The KPayService class already handles `returl` and `redirecturl` in its constructor
- Added `logourl` parameter instead for better branding

**Changes Made:**
- File: `src/app/api/kpay/initiate/route.ts`
  - Removed `returnUrl` from kpayRequest object
  - Added `logourl` parameter pointing to app logo

## Testing Recommendations

### Test Upgrade Flow:
1. Navigate to Settings page
2. Click "Upgrade" button on any paid plan
3. Verify dialog opens (not alert)
4. Fill in payment details:
   - Select payment method
   - Enter phone number (e.g., 0788123456)
   - Enter email
5. Click "Pay Now"
6. Verify payment is initiated correctly

### Test KPay Integration:
1. Initiate a payment through the upgrade flow
2. Check browser console for any errors
3. Verify payment transaction is created in database
4. For Mobile Money: Check phone receives payment prompt
5. For Card: Verify redirect to KPay checkout page

## Files Modified

1. `src/app/(dashboard)/settings/page.tsx` - Upgrade dialog implementation
2. `src/app/api/kpay/initiate/route.ts` - KPay parameter fix

## Additional Notes

- The upgrade dialog now provides a much better UX
- All payment validation is still in place
- Phone number validation uses PhoneNumberValidator
- Card validation uses CardValidator
- Payment status polling still works for mobile money payments
- Free plan upgrades still work without payment dialog
