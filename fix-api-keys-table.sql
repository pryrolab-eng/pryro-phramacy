-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS api_keys CASCADE;

-- Create api_keys table with correct structure
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_api_keys_pharmacy_id ON api_keys(pharmacy_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their pharmacy's API keys"
  ON api_keys FOR SELECT
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert API keys for their pharmacy"
  ON api_keys FOR INSERT
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their pharmacy's API keys"
  ON api_keys FOR UPDATE
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM pharmacy_users WHERE user_id = auth.uid()
    )
  );
