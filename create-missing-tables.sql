-- Create missing tables for dashboard connections

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name VARCHAR(255) NOT NULL,
  doctor_name VARCHAR(255),
  medications TEXT[],
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  insurance_provider VARCHAR(100),
  pharmacy_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create prescription_processing table
CREATE TABLE IF NOT EXISTS prescription_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id),
  processing_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create inventory_checks table
CREATE TABLE IF NOT EXISTS inventory_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID,
  check_type VARCHAR(50),
  pharmacist_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alert_actions table
CREATE TABLE IF NOT EXISTS alert_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50),
  reference_id UUID,
  action VARCHAR(50),
  pharmacist_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample prescriptions
INSERT INTO prescriptions (patient_name, doctor_name, medications, priority, status, insurance_provider, pharmacy_id)
VALUES 
  ('John Doe', 'Dr. Smith', ARRAY['Paracetamol 500mg', 'Vitamin C'], 'high', 'pending', 'RSSB', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('Jane Smith', 'Dr. Johnson', ARRAY['Amoxicillin 250mg'], 'medium', 'pending', 'MMI', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('Bob Wilson', 'Dr. Brown', ARRAY['Ibuprofen 400mg', 'Omeprazole 20mg'], 'low', 'completed', 'RSSB', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Verify tables were created
SELECT 'prescriptions' as table_name, COUNT(*) as row_count FROM prescriptions
UNION ALL
SELECT 'prescription_processing', COUNT(*) FROM prescription_processing
UNION ALL  
SELECT 'inventory_checks', COUNT(*) FROM inventory_checks
UNION ALL
SELECT 'alert_actions', COUNT(*) FROM alert_actions;