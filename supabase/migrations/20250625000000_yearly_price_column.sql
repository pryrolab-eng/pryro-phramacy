-- ============================================================
-- Add yearly_price column to subscription_plans
-- Auto-calculated from price * 12 * (1 - yearly_discount_pct / 100)
-- A trigger keeps it in sync whenever price or discount changes
-- ============================================================

-- 1. Ensure yearly_discount_pct exists first (may already be added by
--    20250624000000_subscription_notification_log.sql — IF NOT EXISTS is safe)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS yearly_discount_pct integer NOT NULL DEFAULT 17
    CHECK (yearly_discount_pct >= 0 AND yearly_discount_pct <= 100);

-- 2. Add yearly_price column (nullable so existing rows don't break)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS yearly_price numeric(12,2);

-- 3. Back-fill existing rows using the stored discount %
UPDATE public.subscription_plans
SET yearly_price = CASE
  WHEN price > 0 AND billing_period != 'free'
    THEN ROUND(price * 12 * (1 - COALESCE(yearly_discount_pct, 17) / 100.0), 2)
  ELSE 0
END
WHERE yearly_price IS NULL;

-- 3. Trigger function: recalculate yearly_price on every INSERT / UPDATE
CREATE OR REPLACE FUNCTION public.sync_yearly_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.billing_period = 'free' OR NEW.price = 0 THEN
    NEW.yearly_price := 0;
  ELSE
    NEW.yearly_price := ROUND(
      NEW.price * 12 * (1 - COALESCE(NEW.yearly_discount_pct, 17) / 100.0),
      2
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach trigger (drop first so re-running migration is safe)
DROP TRIGGER IF EXISTS trg_sync_yearly_price ON public.subscription_plans;

CREATE TRIGGER trg_sync_yearly_price
  BEFORE INSERT OR UPDATE OF price, yearly_discount_pct, billing_period
  ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_yearly_price();

-- 5. Add a comment for clarity
COMMENT ON COLUMN public.subscription_plans.yearly_price IS
  'Auto-calculated: price * 12 * (1 - yearly_discount_pct / 100). Updated by trigger on price/discount/period change.';
