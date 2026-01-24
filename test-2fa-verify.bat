@echo off
REM Test 2FA verify endpoint

echo Testing 2FA verify endpoint...
curl -X POST http://localhost:3000/api/auth/verify-2fa ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionToken\":\"test-token\",\"token\":\"123456\"}"

echo.
echo.
echo Expected: Should return error about invalid session
