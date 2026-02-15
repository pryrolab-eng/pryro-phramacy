-- Seed initial admin settings
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
ON CONFLICT (pharmacy_id, setting_key) DO NOTHING;

-- Create admin analytics table if not exists
CREATE TABLE IF NOT EXISTS public.admin_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    active_pharmacies integer DEFAULT 0,
    total_users integer DEFAULT 0,
    total_pharmacies integer DEFAULT 0,
    new_users_30d integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert initial analytics
INSERT INTO public.admin_analytics (active_pharmacies, total_users, total_pharmacies, new_users_30d)
SELECT 
    COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_pharmacies,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as total_pharmacies,
    COUNT(DISTINCT CASE WHEN u.created_at > NOW() - INTERVAL '30 days' THEN u.id END) as new_users_30d
FROM public.pharmacies p
LEFT JOIN public.pharmacy_users pu ON p.id = pu.pharmacy_id
LEFT JOIN public.users u ON pu.user_id = u.id
ON CONFLICT (id) DO UPDATE SET
    active_pharmacies = EXCLUDED.active_pharmacies,
    total_users = EXCLUDED.total_users,
    total_pharmacies = EXCLUDED.total_pharmacies,
    new_users_30d = EXCLUDED.new_users_30d,
    updated_at = NOW();
