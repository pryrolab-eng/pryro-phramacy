#!/bin/bash

echo "=== Testing Inventory Isolation ==="
echo ""

# Test 1: Get inventory for pharmacy 1
echo "Test 1: Fetching inventory..."
curl -s http://localhost:3000/api/inventory | jq '.'

echo ""
echo "=== Analysis ==="
echo "Check the pharmacy_id in the response above."
echo "Each pharmacy should have different pharmacy_id values."
echo ""
echo "If all items show the same pharmacy_id (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa),"
echo "then run fix-pharmacy-associations.sql to fix the issue."
