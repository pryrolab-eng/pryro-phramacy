-- Check users with 2FA enabled
SELECT 
  u.id,
  au.email,
  u.two_factor_enabled,
  u.two_factor_secret IS NOT NULL as has_secret,
  array_length(u.two_factor_backup_codes, 1) as backup_codes_count
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.two_factor_enabled = true OR u.two_factor_secret IS NOT NULL;

-- Check 2FA sessions
SELECT 
  id,
  user_id,
  session_token,
  verified,
  expires_at,
  created_at
FROM two_factor_sessions
ORDER BY created_at DESC
LIMIT 10;
