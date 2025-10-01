-- Add branch support to pharmacy_users table
ALTER TABLE pharmacy_users 
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);

-- Update the sign-in action to support branch assignment
-- This allows pharmacists to be assigned to specific branches
-- while pharmacy owners can access all branches

-- Example: Assign a pharmacist to a specific branch
-- UPDATE pharmacy_users 
-- SET branch_id = 'branch-uuid-here' 
-- WHERE user_id = 'pharmacist-user-id' AND role = 'pharmacist';