-- Create system_settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setting_key)
);

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read settings
CREATE POLICY "Superadmins can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Only superadmins can update settings
CREATE POLICY "Superadmins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Only superadmins can insert settings
CREATE POLICY "Superadmins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
  ('platformName', '"Pryrox"', 'platform', 'Platform display name'),
  ('adminEmail', '"admin@pryrox.com"', 'platform', 'Primary admin email'),
  ('maxPharmacies', '100', 'platform', 'Maximum number of pharmacies allowed'),
  ('enableRegistrations', 'true', 'platform', 'Allow new pharmacy registrations'),
  ('enableNotifications', 'true', 'platform', 'Enable system notifications'),
  ('maintenanceMode', 'false', 'platform', 'Put system in maintenance mode'),
  ('backupEnabled', 'true', 'system', 'Enable automatic backups'),
  ('autoUpdates', 'true', 'system', 'Enable automatic updates'),
  ('maxUsersPerPharmacy', '50', 'tenant', 'Maximum users per pharmacy'),
  ('apiRateLimit', '1000', 'api', 'API rate limit per hour'),
  ('enableWhiteLabel', 'true', 'tenant', 'Enable white-label features'),
  ('enableMultiBranch', 'true', 'tenant', 'Enable multi-branch support'),
  ('dataRetentionDays', '2555', 'compliance', 'Data retention period in days'),
  ('enableAuditLogs', 'true', 'compliance', 'Enable audit logging'),
  ('ssoEnabled', 'false', 'security', 'Enable SSO integration'),
  ('encryptionEnabled', 'true', 'security', 'Enable data encryption')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_system_settings_timestamp ON system_settings;
CREATE TRIGGER update_system_settings_timestamp
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

-- Create view for analytics (if tables exist)
CREATE OR REPLACE VIEW admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM pharmacies WHERE status = 'active') as active_pharmacies,
  (SELECT COUNT(*) FROM users WHERE role IN ('pharmacist', 'staff', 'admin')) as total_users,
  (SELECT COUNT(*) FROM pharmacies) as total_pharmacies,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d;
