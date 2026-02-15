-- Step 1: Add superadmin to enum (run this FIRST, then wait for it to complete)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
