-- CREATE MISSING ADMIN TABLES

-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period VARCHAR(50) DEFAULT 'monthly',
  features TEXT[],
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create categories table if missing
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Insert sample subscription plans
INSERT INTO subscription_plans (name, price, features, is_popular, is_active)
VALUES 
  ('Free', 0, ARRAY['Basic inventory', 'Up to 100 products', 'Email support'], false, true),
  ('Standard', 50000, ARRAY['Advanced inventory', 'Up to 1000 products', 'Phone support', 'Reports'], true, true),
  ('Premium', 120000, ARRAY['Unlimited products', 'Multi-branch', 'Priority support', 'Advanced analytics'], false, true);

-- 4. Insert sample categories
INSERT INTO categories (name, description, is_active)
VALUES 
  ('Pain Relief', 'Medications for pain management', true),
  ('Antibiotics', 'Antimicrobial medications', true),
  ('Vitamins', 'Nutritional supplements', true),
  ('Cardiovascular', 'Heart and blood pressure medications', true),
  ('Diabetes', 'Blood sugar management', true),
  ('Respiratory', 'Breathing and lung medications', true),
  ('Gastric', 'Stomach and digestive medications', true),
  ('Dermatology', 'Skin care medications', true),
  ('Pediatric', 'Children medications', true),
  ('Emergency', 'Emergency and first aid', true),
  ('Mental Health', 'Psychiatric medications', true),
  ('Women Health', 'Gynecological medications', true);

-- 5. Verify tables created
SELECT 'subscription_plans' as table_name, COUNT(*) as count FROM subscription_plans
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'pharmacies', COUNT(*) FROM pharmacies;