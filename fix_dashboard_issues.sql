-- Create tables for tracking actual dashboard metrics

-- Table for tracking prescription processing times
CREATE TABLE IF NOT EXISTS prescription_processing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID REFERENCES prescriptions(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
      ELSE NULL 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking inventory checks
CREATE TABLE IF NOT EXISTS inventory_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacist_id UUID,
  inventory_id UUID REFERENCES inventory(id),
  check_type VARCHAR(50) DEFAULT 'routine', -- 'routine', 'stock_alert', 'expiry_check'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking alert handling
CREATE TABLE IF NOT EXISTS alert_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type VARCHAR(50), -- 'stock_low', 'stock_out', 'expiring', 'expired'
  alert_reference_id UUID, -- inventory_id or other reference
  action_taken VARCHAR(100), -- 'restocked', 'removed', 'noted', 'ordered'
  pharmacist_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescription_processing_date ON prescription_processing(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_inventory_checks_date ON inventory_checks(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_alert_actions_date ON alert_actions(DATE(created_at));