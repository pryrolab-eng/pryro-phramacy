-- Create prescription_processing table
CREATE TABLE IF NOT EXISTS prescription_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID,
  processing_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create inventory_checks table  
CREATE TABLE IF NOT EXISTS inventory_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID,
  check_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alert_actions table
CREATE TABLE IF NOT EXISTS alert_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50),
  reference_id UUID,
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO prescription_processing (prescription_id, processing_time_minutes, created_at)
SELECT id, 8, NOW() FROM prescriptions LIMIT 3;

-- Verify
SELECT 'prescription_processing' as table_name, COUNT(*) as rows FROM prescription_processing;