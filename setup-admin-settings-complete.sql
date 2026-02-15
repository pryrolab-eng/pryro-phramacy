-- Step 1: Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Step 2: Drop old constraints and make pharmacy_id nullable
ALTER TABLE public.system_settings 
DROP CONSTRAINT IF EXISTS system_settings_pharmacy_id_setting_key_key;

ALTER TABLE public.system_settings 
ALTER COLUMN pharmacy_id DROP NOT NULL;

-- Step 3: Create unique index for both pharmacy and global settings
DROP INDEX IF EXISTS idx_system_settings_unique;
CREATE UNIQUE INDEX idx_system_settings_unique 
ON public.system_settings (COALESCE(pharmacy_id::text, 'global'), setting_key);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_pharmacy_id ON public.system_settings(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

-- Step 5: Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop old policies
DROP POLICY IF EXISTS "Users can view their pharmacy settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can insert their pharmacy settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can update their pharmacy settings" ON public.system_settings;
DROP POLICY IF EXISTS "Superadmin can manage global settings" ON public.system_settings;

-- Step 7: Create RLS policies
CREATE POLICY "Superadmin can manage global settings"
  ON public.system_settings FOR ALL
  USING (
    pharmacy_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  )
  WITH CHECK (
    pharmacy_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Users can view their pharmacy settings"
  ON public.system_settings FOR SELECT
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their pharmacy settings"
  ON public.system_settings FOR ALL
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid()
    )
  );

-- Step 8: Insert initial admin settings
INSERT INTO public.system_settings (setting_key, setting_value, pharmacy_id) VALUES
('platformName', '"Pryrox"', NULL),
('adminEmail', '"admin@pryrox.com"', NULL),
('maxPharmacies', '100', NULL),
('enableRegistrations', 'true', NULL),
('enableNotifications', 'true', NULL),
('maintenanceMode', 'false', NULL),
('backupEnabled', 'true', NULL),
('autoUpdates', 'true', NULL),
('maxUsersPerPharmacy', '50', NULL),
('apiRateLimit', '1000', NULL),
('enableWhiteLabel', 'true', NULL),
('enableMultiBranch', 'true', NULL),
('dataRetentionDays', '2555', NULL),
('enableAuditLogs', 'true', NULL),
('ssoEnabled', 'false', NULL),
('encryptionEnabled', 'true', NULL)
ON CONFLICT (COALESCE(pharmacy_id::text, 'global'), setting_key) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_settings FROM public.system_settings WHERE pharmacy_id IS NULL;
