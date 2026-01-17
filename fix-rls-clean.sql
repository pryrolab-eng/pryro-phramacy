-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Pharmacy staff can view inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacy staff can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacy staff can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacy staff can update inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacy staff can delete inventory" ON inventory;

DROP POLICY IF EXISTS "Pharmacy staff can view medications" ON medications;
DROP POLICY IF EXISTS "Pharmacy staff can manage medications" ON medications;
DROP POLICY IF EXISTS "Pharmacy staff can insert medications" ON medications;
DROP POLICY IF EXISTS "Pharmacy staff can update medications" ON medications;
DROP POLICY IF EXISTS "Pharmacy staff can delete medications" ON medications;

-- Drop validation triggers
DROP TRIGGER IF EXISTS validate_inventory_pharmacy ON inventory;
DROP TRIGGER IF EXISTS validate_medication_pharmacy ON medications;
DROP FUNCTION IF EXISTS validate_pharmacy_ownership();

-- Recreate policies
CREATE POLICY "Pharmacy staff can view inventory" ON inventory
    FOR SELECT USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can insert inventory" ON inventory
    FOR INSERT WITH CHECK (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can update inventory" ON inventory
    FOR UPDATE USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can delete inventory" ON inventory
    FOR DELETE USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can view medications" ON medications
    FOR SELECT USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can insert medications" ON medications
    FOR INSERT WITH CHECK (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can update medications" ON medications
    FOR UPDATE USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );

CREATE POLICY "Pharmacy staff can delete medications" ON medications
    FOR DELETE USING (
        pharmacy_id IN (SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid() AND is_active = true)
    );
