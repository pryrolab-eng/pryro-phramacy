-- Check if categories table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'categories'
);

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'categories';

-- Check policies on categories table
SELECT * FROM pg_policies WHERE tablename = 'categories';

-- If table doesn't exist, create it:
-- CREATE TABLE categories (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   pharmacy_id uuid REFERENCES pharmacies(id) NOT NULL,
--   name text NOT NULL,
--   description text,
--   is_active boolean DEFAULT true,
--   created_at timestamp DEFAULT now()
-- );

-- Enable RLS and add policy:
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Pharmacy staff can manage categories" ON categories
--   FOR ALL USING (pharmacy_id = ANY(get_user_pharmacy_ids()));
