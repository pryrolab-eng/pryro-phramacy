-- Fix system_settings table to support global admin settings
ALTER TABLE public.system_settings 
DROP CONSTRAINT IF EXISTS system_settings_pharmacy_id_setting_key_key;

-- Allow NULL pharmacy_id for global settings
ALTER TABLE public.system_settings 
ALTER COLUMN pharmacy_id DROP NOT NULL;

-- Create new unique constraint that handles NULL pharmacy_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_unique 
ON public.system_settings (COALESCE(pharmacy_id::text, 'global'), setting_key);

-- Add superadmin policy for global settings
DROP POLICY IF EXISTS "Superadmin can manage global settings" ON public.system_settings;
CREATE POLICY "Superadmin can manage global settings"
  ON public.system_settings
  FOR ALL
  USING (
    pharmacy_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  )
  WITH CHECK (
    pharmacy_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );
