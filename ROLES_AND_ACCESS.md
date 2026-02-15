# Roles and Superadmin Access

## Available Roles

The system has **5 roles** defined in the `user_role` enum:

1. **admin** - Full platform access (superadmin)
2. **pharmacy_owner** - Owns and manages a pharmacy
3. **pharmacist** - Pharmacy staff with prescription access
4. **cashier** - Handles sales transactions
5. **staff** - General pharmacy staff

## Superadmin Access

**Who can access the superadmin dashboard:**
- Users with `role = 'admin'` in the `pharmacy_users` table
- Special hardcoded email: `abdousentore@gmail.com` (test account)

**Note:** There is NO 'superadmin' role in the database enum. The term "superadmin" is just used in the UI/routes, but the actual role is 'admin'.

## Admin Settings Access

After the fix, only users with `role = 'admin'` can:
- View global system settings (pharmacy_id IS NULL)
- Create global system settings
- Update global system settings

All other users can only access their own pharmacy's settings.

## Test Credentials

From the superadmin dashboard:
- **Super Admin**: abdousentore@gmail.com / admin123
- **Pharmacy Owner**: pharmacy@test.com / pharmacy123
- **Pharmacist**: pharmacist@test.com / pharmacist123
- **Cashier**: cashier@test.com / cashier123
