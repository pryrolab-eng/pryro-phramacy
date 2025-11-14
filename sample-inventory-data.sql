-- Sample Medications Data
INSERT INTO medications (id, name, generic_name, brand_name, strength, dosage_form, category, classification_code, barcode, manufacturer, requires_prescription, vat_rate) VALUES
(1, 'Paracetamol 500mg', 'Paracetamol', 'Panadol', '500mg', 'Tablet', 'Pain Relief', 'N02BE01', '1234567890123', 'PharmaCorp Ltd', false, 'A'),
(2, 'Amoxicillin 250mg', 'Amoxicillin', 'Amoxil', '250mg', 'Capsule', 'Antibiotics', 'J01CA04', '1234567890124', 'MediLab Inc', true, 'A'),
(3, 'Ibuprofen 400mg', 'Ibuprofen', 'Advil', '400mg', 'Tablet', 'Pain Relief', 'M01AE01', '1234567890125', 'HealthCare Plus', false, 'A'),
(4, 'Vitamin C 1000mg', 'Ascorbic Acid', 'VitaC', '1000mg', 'Tablet', 'Vitamins', 'A11GA01', '1234567890126', 'NutriPharm', false, 'B'),
(5, 'Aspirin 100mg', 'Acetylsalicylic Acid', 'Aspirin', '100mg', 'Tablet', 'Pain Relief', 'N02BA01', '1234567890127', 'CardioMed', false, 'A'),
(6, 'Cetirizine 10mg', 'Cetirizine', 'Zyrtec', '10mg', 'Tablet', 'Antihistamines', 'R06AE07', '1234567890128', 'AllergyFree Ltd', false, 'A'),
(7, 'Omeprazole 20mg', 'Omeprazole', 'Prilosec', '20mg', 'Capsule', 'Gastrointestinal', 'A02BC01', '1234567890129', 'GastroMed', true, 'A'),
(8, 'Metformin 500mg', 'Metformin', 'Glucophage', '500mg', 'Tablet', 'Diabetes', 'A10BA02', '1234567890130', 'DiabetesCare', true, 'A'),
(9, 'Losartan 50mg', 'Losartan', 'Cozaar', '50mg', 'Tablet', 'Cardiovascular', 'C09CA01', '1234567890131', 'HeartMed', true, 'A'),
(10, 'Simvastatin 20mg', 'Simvastatin', 'Zocor', '20mg', 'Tablet', 'Cardiovascular', 'C10AA01', '1234567890132', 'CholesterolCare', true, 'A'),
(11, 'Diclofenac 50mg', 'Diclofenac', 'Voltaren', '50mg', 'Tablet', 'Pain Relief', 'M01AB05', '1234567890133', 'PainFree Ltd', false, 'A'),
(12, 'Ciprofloxacin 500mg', 'Ciprofloxacin', 'Cipro', '500mg', 'Tablet', 'Antibiotics', 'J01MA02', '1234567890134', 'AntiBio Corp', true, 'A'),
(13, 'Multivitamin', 'Mixed Vitamins', 'MultiVit', 'Various', 'Tablet', 'Vitamins', 'A11AA03', '1234567890135', 'VitaHealth', false, 'B'),
(14, 'Loratadine 10mg', 'Loratadine', 'Claritin', '10mg', 'Tablet', 'Antihistamines', 'R06AX13', '1234567890136', 'AllerCare', false, 'A'),
(15, 'Amlodipine 5mg', 'Amlodipine', 'Norvasc', '5mg', 'Tablet', 'Cardiovascular', 'C08CA01', '1234567890137', 'CardioPlus', true, 'A');

-- Sample Inventory Data
INSERT INTO inventory (batch_number, quantity_in_stock, minimum_stock_level, maximum_stock_level, purchase_price, selling_price, expiry_date, pharmacy_id, medication_id) VALUES
('PAR001', 150, 25, 500, 80, 120, '2025-12-31', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1),
('AMX001', 8, 15, 200, 320, 450, '2025-06-30', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2),
('IBU001', 75, 20, 300, 150, 220, '2025-09-15', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3),
('VIT001', 200, 30, 600, 45, 75, '2026-03-20', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4),
('ASP001', 12, 25, 400, 60, 95, '2025-08-10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
('CET001', 45, 15, 250, 280, 380, '2025-11-25', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6),
('OME001', 35, 20, 300, 420, 580, '2025-07-18', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7),
('MET001', 90, 25, 400, 180, 260, '2025-10-12', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8),
('LOS001', 6, 18, 200, 350, 480, '2025-05-30', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 9),
('SIM001', 120, 30, 500, 95, 140, '2025-12-05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10),
('DIC001', 40, 20, 300, 120, 180, '2025-09-30', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 11),
('CIP001', 25, 15, 200, 450, 620, '2025-08-15', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 12),
('MUL001', 180, 40, 800, 35, 60, '2026-01-10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 13),
('LOR001', 65, 25, 350, 85, 125, '2025-11-08', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 14),
('AML001', 18, 20, 250, 280, 390, '2025-07-22', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 15),
('PAR002', 5, 25, 500, 80, 120, '2025-04-15', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1),
('AMX002', 3, 15, 200, 320, 450, '2025-03-20', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2),
('IBU002', 220, 20, 300, 150, 220, '2026-02-28', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3),
('VIT002', 85, 30, 600, 45, 75, '2025-08-30', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4),
('ASP002', 160, 25, 400, 60, 95, '2026-01-25', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5);

-- Sample Categories Data (if you have a categories table)
INSERT INTO categories (name, description, is_active, pharmacy_id) VALUES
('Pain Relief', 'Medications for pain management and relief', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Antibiotics', 'Antimicrobial medications for bacterial infections', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Vitamins', 'Nutritional supplements and vitamins', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Cardiovascular', 'Heart and blood pressure medications', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Diabetes', 'Blood sugar management medications', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Antihistamines', 'Allergy and antihistamine medications', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Gastrointestinal', 'Digestive system medications', true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Sample Suppliers Data (if you have a suppliers table)
INSERT INTO suppliers (name, contact_person, phone, email, address, is_active) VALUES
('PharmaCorp Ltd', 'John Smith', '+250788123456', 'john@pharmacorp.com', 'Kigali, Rwanda', true),
('MediLab Inc', 'Sarah Johnson', '+250788123457', 'sarah@medilab.com', 'Butare, Rwanda', true),
('HealthCare Plus', 'Mike Wilson', '+250788123458', 'mike@healthcare.com', 'Gisenyi, Rwanda', true),
('NutriPharm', 'Lisa Brown', '+250788123459', 'lisa@nutripharm.com', 'Ruhengeri, Rwanda', true),
('CardioMed', 'David Lee', '+250788123460', 'david@cardiomed.com', 'Kigali, Rwanda', true);