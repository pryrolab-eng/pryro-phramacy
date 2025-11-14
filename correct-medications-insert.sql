-- CORRECT medications insert using actual columns
INSERT INTO medications (id, name, category, requires_prescription, is_active, pharmacy_id)
SELECT 
  gen_random_uuid(), 
  name, 
  category::medication_category, 
  requires_prescription, 
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM (VALUES 
  ('Paracetamol 500mg', 'pain_relief', false),
  ('Amoxicillin 250mg', 'antibiotics', true),
  ('Vitamin C Tablets', 'vitamins', false),
  ('Ibuprofen 400mg', 'pain_relief', false)
) AS meds(name, category, requires_prescription)
WHERE NOT EXISTS (SELECT 1 FROM medications WHERE name = meds.name);