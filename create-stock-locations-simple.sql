-- Step 1: Create the table
CREATE TABLE public.stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX idx_stock_locations_pharmacy ON public.stock_locations(pharmacy_id);
CREATE INDEX idx_stock_locations_active ON public.stock_locations(is_active);

-- Step 3: Enable RLS
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their pharmacy locations"
  ON public.stock_locations FOR SELECT
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.pharmacy_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert locations for their pharmacy"
  ON public.stock_locations FOR INSERT
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.pharmacy_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their pharmacy locations"
  ON public.stock_locations FOR UPDATE
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.pharmacy_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Step 5: Insert default locations (run this AFTER you have pharmacies)
-- Replace 'your-pharmacy-id' with your actual pharmacy ID
-- You can find it by running: SELECT id, name FROM public.pharmacies;

-- INSERT INTO public.stock_locations (pharmacy_id, name, description) VALUES
-- ('your-pharmacy-id', 'Main Store', 'Primary location'),
-- ('your-pharmacy-id', 'Branch', 'Secondary location'),
-- ('your-pharmacy-id', 'Cold Storage', 'Temperature controlled'),
-- ('your-pharmacy-id', 'Warehouse', 'Bulk storage');
