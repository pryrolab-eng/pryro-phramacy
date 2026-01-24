@echo off
set BASE_URL=http://localhost:3000

echo Testing IP Whitelist Management...
echo.

echo 1. Get IP Whitelist
curl -X GET "%BASE_URL%/api/settings/security/ip-whitelist/manage"
echo.
echo.

echo 2. Add IP to Whitelist
curl -X POST "%BASE_URL%/api/settings/security/ip-whitelist/manage" -H "Content-Type: application/json" -d "{\"ip\":\"192.168.1.100\",\"description\":\"Office Network\"}"
echo.
echo.

echo 3. Add Another IP
curl -X POST "%BASE_URL%/api/settings/security/ip-whitelist/manage" -H "Content-Type: application/json" -d "{\"ip\":\"10.0.0.50\",\"description\":\"VPN Gateway\"}"
echo.
echo.

echo 4. Get Updated Whitelist
curl -X GET "%BASE_URL%/api/settings/security/ip-whitelist/manage"
echo.
echo.

echo 5. Delete IP (requires ID from step 2)
curl -X DELETE "%BASE_URL%/api/settings/security/ip-whitelist/manage" -H "Content-Type: application/json" -d "{\"id\":1}"
echo.
