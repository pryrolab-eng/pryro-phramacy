# Test User Credentials for Pharmacy Management System

## Authentication Note
Since this is a Supabase-based application, users need to be created through Supabase Auth. The following credentials are for testing different roles and permissions in the system.

## Test User Accounts

### 🔴 Super Administrator
- **Email**: `superadmin@pyro.rw`
- **Password**: `SuperAdmin123!`
- **Role**: System Administrator
- **Permissions**: Full system access, manage all pharmacies, subscription management
- **Access**: All modules across all pharmacies

---

### 🟡 Pharmacy Owners

#### City Pharmacy Kigali Owner
- **Email**: `owner.kigali@citypharmacy.rw`
- **Password**: `Owner123!`
- **Name**: Dr. Jean Mukamana
- **Role**: Pharmacy Owner
- **Pharmacy**: City Pharmacy Kigali
- **Permissions**: Full pharmacy management, staff management, reports, settings

#### Health Plus Butare Owner
- **Email**: `owner.butare@healthplus.rw`
- **Password**: `Owner123!`
- **Name**: Dr. Paul Nkurunziza
- **Role**: Pharmacy Owner
- **Pharmacy**: Health Plus Butare
- **Permissions**: Full pharmacy management, staff management, reports, settings

#### MediCare Gisenyi Owner
- **Email**: `owner.gisenyi@medicare.rw`
- **Password**: `Owner123!`
- **Name**: Dr. Marie Uwimana
- **Role**: Pharmacy Owner
- **Pharmacy**: MediCare Gisenyi (Trial Account)
- **Permissions**: Limited trial features, basic inventory, POS

---

### 🟢 Pharmacists

#### City Pharmacy Pharmacist
- **Email**: `pharmacist1@citypharmacy.rw`
- **Password**: `Pharmacist123!`
- **Name**: Alice Uwimana
- **Role**: Pharmacist
- **Pharmacy**: City Pharmacy Kigali
- **Permissions**: Inventory management, prescription verification, sales oversight, reports

#### Health Plus Pharmacist
- **Email**: `pharmacist2@healthplus.rw`
- **Password**: `Pharmacist123!`
- **Name**: Bob Nkurunziza
- **Role**: Pharmacist
- **Pharmacy**: Health Plus Butare
- **Permissions**: Inventory management, prescription verification, sales oversight, reports

---

### 🔵 Cashiers/POS Staff

#### City Pharmacy Cashier 1
- **Email**: `cashier1@citypharmacy.rw`
- **Password**: `Cashier123!`
- **Name**: Grace Mukamana
- **Role**: Cashier
- **Pharmacy**: City Pharmacy Kigali
- **Permissions**: POS operations, sales processing, customer service, basic inventory view

#### City Pharmacy Cashier 2
- **Email**: `cashier2@citypharmacy.rw`
- **Password**: `Cashier123!`
- **Name**: Eric Habimana
- **Role**: Cashier
- **Pharmacy**: City Pharmacy Kigali
- **Permissions**: POS operations, sales processing, customer service, basic inventory view

#### Health Plus Cashier
- **Email**: `cashier1@healthplus.rw`
- **Password**: `Cashier123!`
- **Name**: Sarah Uwimana
- **Role**: Cashier
- **Pharmacy**: Health Plus Butare
- **Permissions**: POS operations, sales processing, customer service, basic inventory view

---

### 🟣 General Staff

#### MediCare Staff
- **Email**: `staff1@medicare.rw`
- **Password**: `Staff123!`
- **Name**: John Mukamana
- **Role**: Staff
- **Pharmacy**: MediCare Gisenyi
- **Permissions**: Basic operations, limited inventory access, customer assistance

---

## Role Permissions Matrix

| Feature | Super Admin | Pharmacy Owner | Pharmacist | Cashier | Staff |
|---------|-------------|----------------|------------|---------|-------|
| System Administration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-Pharmacy Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Subscription Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pharmacy Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Staff Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Full Inventory Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Prescription Verification | ✅ | ✅ | ✅ | ❌ | ❌ |
| POS Operations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Insurance Claims | ✅ | ✅ | ✅ | ❌ | ❌ |
| Basic Inventory View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customer Service | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Testing Scenarios

### 1. Super Admin Testing
- Login with `superadmin@pyro.rw`
- Access admin dashboard
- View all pharmacies
- Manage subscriptions
- View system-wide analytics

### 2. Pharmacy Owner Testing
- Login with any owner account
- Manage pharmacy settings
- Add/remove staff members
- View comprehensive reports
- Configure insurance providers

### 3. Pharmacist Testing
- Login with pharmacist account
- Manage inventory and stock
- Process prescriptions
- Handle insurance claims
- Generate pharmacy reports

### 4. Cashier Testing
- Login with cashier account
- Process sales transactions
- Handle customer payments
- Apply insurance coverage
- Print receipts

### 5. Staff Testing
- Login with staff account
- Basic POS operations
- Customer assistance
- Limited inventory viewing

---

## Setup Instructions

1. **Create Users in Supabase Auth Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Users
   - Create each user with the email and password listed above
   - Confirm each user's email

2. **Run Database Migration**:
   - The user roles and pharmacy assignments will be automatically set up
   - Users will be assigned to their respective pharmacies with appropriate roles

3. **Test Login**:
   - Use any of the credentials above to test different role permissions
   - Each role will have access to different features and data

---

## Security Notes

- These are test credentials for development/demo purposes only
- In production, use strong, unique passwords
- Implement proper password policies
- Enable MFA for admin accounts
- Regular security audits recommended

---

## Support

For issues with test accounts or role permissions, check:
1. User exists in Supabase Auth
2. User is assigned to correct pharmacy in `pharmacy_users` table
3. User role matches expected permissions
4. Pharmacy subscription is active