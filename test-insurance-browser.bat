@echo off
echo ========================================
echo INSURANCE API TEST INSTRUCTIONS
echo ========================================
echo.
echo Since the superadmin user needs to be logged in via browser:
echo.
echo 1. Open your browser and login to http://localhost:3000 as superadmin
echo 2. Open Developer Tools (F12)
echo 3. Go to Application tab -^> Cookies -^> http://localhost:3000
echo 4. Copy the value of 'sb-access-token' cookie
echo 5. Run this command with your token:
echo.
echo curl -X POST http://localhost:3000/api/insurance -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"name\":\"MMI Test\",\"coverage_percentage\":80,\"contact_email\":\"MMI@gmail.com\",\"contact_phone\":\"07842942\",\"policy_number\":\"POL-12345\",\"invoice_template\":\"default\"}"
echo.
echo ========================================
echo OR - Test directly from browser console:
echo ========================================
echo.
echo Open browser console (F12) and paste:
echo.
echo fetch('/api/insurance', {
echo   method: 'POST',
echo   headers: {'Content-Type': 'application/json'},
echo   body: JSON.stringify({
echo     name: 'MMI Test',
echo     coverage_percentage: 80,
echo     contact_email: 'MMI@gmail.com',
echo     contact_phone: '07842942',
echo     policy_number: 'POL-12345',
echo     invoice_template: 'default'
echo   })
echo }).then(r =^> r.json()).then(console.log)
echo.
pause
