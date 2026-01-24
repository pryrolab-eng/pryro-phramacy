-- Add default global categories if they don't exist
INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'Antibiotics', 'Antibacterial medications', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Antibiotics' AND is_global = true);

INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'Analgesics', 'Pain relief medications', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Analgesics' AND is_global = true);

INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'Vitamins', 'Vitamin and mineral supplements', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Vitamins' AND is_global = true);

INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'OTC', 'Over-the-counter medications', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'OTC' AND is_global = true);

INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'Prescription', 'Prescription-only medications', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Prescription' AND is_global = true);

INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'Controlled', 'Controlled substances', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Controlled' AND is_global = true);

INSERT INTO categories (name, description, is_global, pharmacy_id, is_active)
SELECT 'Medical Device', 'Medical devices and equipment', true, null, true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Medical Device' AND is_global = true);

-- Verify the categories were added
SELECT id, name, description, is_global, pharmacy_id, is_active 
FROM categories 
WHERE is_global = true 
ORDER BY name;
