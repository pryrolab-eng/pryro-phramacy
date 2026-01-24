-- Add is_global column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Make pharmacy_id nullable for global categories
ALTER TABLE categories ALTER COLUMN pharmacy_id DROP NOT NULL;

-- Update existing categories to be pharmacy-specific
UPDATE categories SET is_global = false WHERE pharmacy_id IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_global ON categories(is_global) WHERE is_global = true;
