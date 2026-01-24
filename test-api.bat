@echo off
echo Testing Pryrox API Endpoints...
echo.

set BASE_URL=http://localhost:3000

echo 1. Testing Dashboard API...
curl -X GET "%BASE_URL%/api/dashboard"
echo.
echo.

echo 2. Testing Categories API...
curl -X GET "%BASE_URL%/api/categories"
echo.
echo.

echo 3. Testing Inventory API...
curl -X GET "%BASE_URL%/api/inventory"
echo.
echo.

echo 4. Testing Sales API...
curl -X GET "%BASE_URL%/api/sales"
echo.
echo.

echo 5. Testing Customers API...
curl -X GET "%BASE_URL%/api/customers"
echo.
echo.

echo Tests completed!
