-- Fix Inventory Isolation Issue
-- This script ensures each pharmacy only sees their own inventory

-- Step 1: Check for inventory items without pharmacy_id
SELECT COUNT(*) as items_without_pharmacy 
FROM inventory 
WHERE pharmacy_id IS NULL;

-- Step 2: Check for medications without pharmacy_id
SELECT COUNT(*) as meds_without_pharmacy 
FROM medications 
WHERE pharmacy_id IS NULL;

-- Step 3: Add NOT NULL constraint to ensure pharmacy_id is always set
ALTER TABLE inventory 
ALTER COLUMN pharmacy_id SET NOT NULL;

ALTER TABLE medications 
ALTER COLUMN pharmacy_id SET NOT NULL;

-- Step 4: Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('inventory', 'medications');

-- Step 5: Test query - should only return current pharmacy's data
-- Run this after logging in as a pharmacy user
SELECT 
  i.id,
  i.pharmacy_id,
  m.name,
  i.quantity_in_stock,
  p.name as pharmacy_name
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies p ON i.pharmacy_id = p.id
ORDER BY i.created_at DESC
LIMIT 10;
