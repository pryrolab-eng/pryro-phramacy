-- Fix Inventory Isolation Issue
-- This ensures each pharmacy only sees and manages their own inventory

-- STEP 1: Identify the problem
-- Check if there are NULL pharmacy_ids
DO $$
DECLARE
    null_inventory_count INTEGER;
    null_medication_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_inventory_count FROM inventory WHERE pharmacy_id IS NULL;
    SELECT COUNT(*) INTO null_medication_count FROM medications WHERE pharmacy_id IS NULL;
    
    RAISE NOTICE 'Inventory items with NULL pharmacy_id: %', null_inventory_count;
    RAISE NOTICE 'Medications with NULL pharmacy_id: %', null_medication_count;
END $$;

-- STEP 2: Fix NULL pharmacy_ids (if any exist)
-- WARNING: This assumes you want to assign orphaned records to the first pharmacy
-- Adjust this logic based on your needs

-- Update inventory items with NULL pharmacy_id
UPDATE inventory
SET pharmacy_id = (SELECT id FROM pharmacies ORDER BY created_at LIMIT 1)
WHERE pharmacy_id IS NULL;

-- Update medications with NULL pharmacy_id
UPDATE medications
SET pharmacy_id = (SELECT id FROM pharmacies ORDER BY created_at LIMIT 1)
WHERE pharmacy_id IS NULL;

-- STEP 3: Add NOT NULL constraints to prevent future issues
ALTER TABLE inventory 
ALTER COLUMN pharmacy_id SET NOT NULL;

ALTER TABLE medications 
ALTER COLUMN pharmacy_id SET NOT NULL;

-- STEP 4: Verify RLS is enabled
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- STEP 5: Drop and recreate RLS policies to ensure they're correct
-- Drop existing policies
DROP POLICY IF EXISTS "Pharmacy staff can view inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacy staff can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacy staff can view medications" ON medications;
DROP POLICY IF EXISTS "Pharmacy staff can manage medications" ON medications;

-- Recreate inventory policies with explicit checks
CREATE POLICY "Pharmacy staff can view inventory" ON inventory
    FOR SELECT USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Pharmacy staff can insert inventory" ON inventory
    FOR INSERT WITH CHECK (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Pharmacy staff can update inventory" ON inventory
    FOR UPDATE USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Pharmacy staff can delete inventory" ON inventory
    FOR DELETE USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Recreate medication policies with explicit checks
CREATE POLICY "Pharmacy staff can view medications" ON medications
    FOR SELECT USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Pharmacy staff can insert medications" ON medications
    FOR INSERT WITH CHECK (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Pharmacy staff can update medications" ON medications
    FOR UPDATE USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Pharmacy staff can delete medications" ON medications
    FOR DELETE USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM pharmacy_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- STEP 6: Create a function to validate pharmacy ownership before insert/update
CREATE OR REPLACE FUNCTION validate_pharmacy_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user belongs to the pharmacy they're trying to insert/update for
    IF NOT EXISTS (
        SELECT 1 
        FROM pharmacy_users 
        WHERE user_id = auth.uid() 
        AND pharmacy_id = NEW.pharmacy_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User does not have access to this pharmacy';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to inventory
DROP TRIGGER IF EXISTS validate_inventory_pharmacy ON inventory;
CREATE TRIGGER validate_inventory_pharmacy
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION validate_pharmacy_ownership();

-- Apply validation trigger to medications
DROP TRIGGER IF EXISTS validate_medication_pharmacy ON medications;
CREATE TRIGGER validate_medication_pharmacy
    BEFORE INSERT OR UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION validate_pharmacy_ownership();

-- STEP 7: Verify the fix
-- This should show each pharmacy with their own inventory count
SELECT 
    p.id,
    p.name as pharmacy_name,
    COUNT(DISTINCT i.id) as inventory_items,
    COUNT(DISTINCT m.id) as medications
FROM pharmacies p
LEFT JOIN inventory i ON p.id = i.pharmacy_id
LEFT JOIN medications m ON p.id = m.pharmacy_id
GROUP BY p.id, p.name
ORDER BY p.name;

-- STEP 8: Test query - Run this after logging in as a specific pharmacy user
-- This should only return inventory for the logged-in user's pharmacy
SELECT 
    i.id,
    i.pharmacy_id,
    p.name as pharmacy_name,
    m.name as medication_name,
    i.quantity_in_stock,
    i.batch_number
FROM inventory i
JOIN medications m ON i.medication_id = m.id
JOIN pharmacies p ON i.pharmacy_id = p.id
ORDER BY i.created_at DESC
LIMIT 20;
