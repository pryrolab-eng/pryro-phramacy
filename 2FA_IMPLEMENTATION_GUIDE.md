# Two-Factor Authentication (2FA) Implementation

## ✅ What's Been Implemented

### 1. Database Schema
- Added `two_factor_secret`, `two_factor_enabled`, `two_factor_backup_codes` to users table
- Created `two_factor_sessions` table for login verification tracking
- RLS policies configured

### 2. API Endpoints
- `POST /api/settings/security/2fa/setup` - Generate QR code and backup codes
- `POST /api/settings/security/2fa/verify` - Verify code and enable 2FA
- `POST /api/settings/security/2fa` - Disable 2FA
- `GET /api/settings/security/2fa` - Get 2FA status
- `POST /api/auth/verify-2fa` - Verify 2FA during login

### 3. Frontend Components
- Settings page with 2FA toggle
- Setup wizard with QR code generation
- Verification step
- Backup codes display
- Login verification page at `/verify-2fa`

### 4. Authentication Flow
- Modified `signInAction` to check for 2FA
- Redirects to verification page if 2FA enabled
- Supports both TOTP codes and backup codes
- Session expires after 10 minutes

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
# Apply the migration to your Supabase database
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/add_2fa_support.sql
```

Or run it directly in Supabase SQL Editor:
```sql
-- Copy contents of supabase/migrations/add_2fa_support.sql
```

### 2. Restart Development Server
```bash
npm run dev
```

## 📱 How to Use

### For Users:
1. Go to Settings → Security tab
2. Toggle "Two-Factor Authentication" ON
3. Click "Generate QR Code"
4. Scan QR code with Google Authenticator, Authy, or similar app
5. Enter the 6-digit code to verify
6. Save the 10 backup codes shown
7. Done! Next login will require 2FA

### Login with 2FA:
1. Enter email and password as usual
2. You'll be redirected to 2FA verification page
3. Enter 6-digit code from authenticator app
4. Or use a backup code if you lost your device

### Disable 2FA:
1. Go to Settings → Security tab
2. Toggle "Two-Factor Authentication" OFF
3. Confirm the action

## 🔒 Security Features

- ✅ TOTP (Time-based One-Time Password) using industry standard
- ✅ 10 backup codes (single-use)
- ✅ QR code for easy setup
- ✅ Session timeout (10 minutes)
- ✅ Temporary logout during verification
- ✅ Secure secret storage
- ✅ Used backup codes are removed

## 📦 Dependencies Added
- `otplib` - TOTP generation and verification
- `qrcode` - QR code generation
- `@types/qrcode` - TypeScript types

## 🧪 Testing

1. Create a test account
2. Enable 2FA in settings
3. Log out
4. Log back in - should require 2FA code
5. Test with wrong code - should fail
6. Test with correct code - should succeed
7. Test backup code - should work once

## 🔧 Troubleshooting

**QR Code not showing:**
- Check browser console for errors
- Verify API endpoint is accessible

**Verification fails:**
- Ensure device time is synchronized
- TOTP codes are time-sensitive

**Can't login after enabling 2FA:**
- Use a backup code
- Contact admin to disable 2FA in database

## 📝 Notes

- Backup codes are single-use
- Each user has their own secret
- Secrets are stored encrypted in database
- Session tokens expire after 10 minutes
- Compatible with all standard authenticator apps
