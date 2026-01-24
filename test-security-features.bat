@echo off
set BASE_URL=http://localhost:3000

echo Testing Security Features...
echo.

echo 1. Enable 2FA
curl -X POST "%BASE_URL%/api/settings/security/2fa" -H "Content-Type: application/json" -d "{\"enabled\":true}"
echo.
echo.

echo 2. Disable 2FA
curl -X POST "%BASE_URL%/api/settings/security/2fa" -H "Content-Type: application/json" -d "{\"enabled\":false}"
echo.
echo.

echo 3. Enable SSO
curl -X POST "%BASE_URL%/api/settings/security/sso" -H "Content-Type: application/json" -d "{\"enabled\":true}"
echo.
echo.

echo 4. Disable SSO
curl -X POST "%BASE_URL%/api/settings/security/sso" -H "Content-Type: application/json" -d "{\"enabled\":false}"
echo.
echo.

echo 5. Enable IP Whitelist
curl -X POST "%BASE_URL%/api/settings/security/ip-whitelist" -H "Content-Type: application/json" -d "{\"enabled\":true}"
echo.
echo.

echo 6. Disable IP Whitelist
curl -X POST "%BASE_URL%/api/settings/security/ip-whitelist" -H "Content-Type: application/json" -d "{\"enabled\":false}"
echo.
echo.

echo 7. Get All Security Settings
curl -X GET "%BASE_URL%/api/settings/security"
echo.
