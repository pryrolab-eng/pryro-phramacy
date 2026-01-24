# Drug Category Issue - Fix Summary

## Problem Identified

When trying to add a new drug in the inventory, there was an issue with categories:

1. **Hardcoded Categories**: The inventory form had hardcoded categories in the component state
2. **Not Fetching from Database**: Categories weren't being loaded from the database
3. **Category Mismatch**: The API had a hardcoded mapping that didn't match the actual categories

## Where Categories Come From

Categories are stored in the `categories` table with two types:

### Global Categories (System-wide)
- `is_global = true`
- `pharmacy_id = null`
- Visible to all pharmacies
- Examples: Antibiotics, Analgesics, Vitamins, OTC, Prescription, Controlled, Medical Device

### Pharmacy-Specific Categories
- `is_global = false`
- `pharmacy_id = specific pharmacy ID`
- Only visible to that pharmacy
- Custom categories created by individual pharmacies

## Solution Applied

### 1. Updated Inventory Page (`src/app/(dashboard)/inventory/page.tsx`)

**Changes Made:**
- Changed categories state from hardcoded array to empty array that will be populated from API
- Added `fetchCategories()` function to load categories from `/api/categories`
- Updated category dropdown to display fetched categories dynamically
- Fixed "Add Category" button to save new categories to database via API
- Updated category filter dropdown to use fetched categories

### 2. Created Default Categories SQL Script (`add-default-categories.sql`)

This script adds 7 default global categories:
- Antibiotics
- Analgesics
- Vitamins
- OTC (Over-the-counter)
- Prescription
- Controlled
- Medical Device

## How to Fix Your Database

Run this SQL script in your Supabase SQL Editor:

```sql
-- Run the add-default-categories.sql script
```

Or use the Supabase dashboard to execute the SQL file.

## API Endpoints Used

### GET `/api/categories`
- Fetches both global and pharmacy-specific categories
- Returns categories where `is_global = true` OR `pharmacy_id = user's pharmacy`

### POST `/api/categories`
- Creates a new pharmacy-specific category
- Sets `is_global = false` and `pharmacy_id = user's pharmacy`

### GET `/api/admin/categories`
- Admin-only endpoint for global categories
- Only returns categories where `is_global = true`

### POST `/api/admin/categories`
- Admin-only endpoint to create global categories
- Sets `is_global = true` and `pharmacy_id = null`

## Testing the Fix

1. **Run the SQL script** to add default categories
2. **Restart your Next.js dev server** (if running)
3. **Navigate to Inventory page**
4. **Click "Add Product"**
5. **Check the Category dropdown** - should show categories from database
6. **Try adding a new category** using the "+" button
7. **Verify the new category appears** in the dropdown

## Future Improvements

1. Add category icons/colors for better visual identification
2. Add category management page for admins
3. Add ability to edit/delete categories
4. Add category usage statistics
5. Add category-based reporting

## Files Modified

- `src/app/(dashboard)/inventory/page.tsx` - Updated to fetch and use dynamic categories
- `src/app/(dashboard)/pos/page.tsx` - Updated Quick Add Drug form to use dynamic categories
- `add-default-categories.sql` - New SQL script to populate default categories

## Files Referenced (No Changes)

- `src/app/api/categories/route.ts` - Already working correctly
- `src/app/api/admin/categories/route.ts` - Already working correctly
- `src/app/api/inventory/add/route.ts` - Has category mapping logic
