-- Apply these two indexes to fix the slow /api/realtime/updates endpoint
-- Run in Supabase SQL editor or via: psql "$DIRECT_URL" -f scripts/add-realtime-indexes.sql

CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy_updated_at
  ON inventory (pharmacy_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_sales_pharmacy_created_at
  ON sales (pharmacy_id, created_at);
