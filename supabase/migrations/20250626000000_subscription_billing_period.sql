-- ============================================================
-- Add billing_period to subscriptions table
-- Tracks whether a pharmacy subscribed monthly or yearly
-- so invoices can use the correct prorated amount.
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly'
    CHECK (billing_period IN ('monthly', 'yearly', 'free'));

COMMENT ON COLUMN public.subscriptions.billing_period IS
  'The billing cycle the pharmacy chose when subscribing: monthly | yearly | free';

-- Back-fill existing rows: infer from period length
-- If current_period_end is ~12 months after start → yearly, else monthly
UPDATE public.subscriptions
SET billing_period = CASE
  WHEN current_period_end IS NOT NULL
    AND current_period_start IS NOT NULL
    AND (current_period_end - current_period_start) > interval '300 days'
    THEN 'yearly'
  WHEN plan_id IN (
    SELECT id FROM public.subscription_plans WHERE billing_period = 'free'
  ) THEN 'free'
  ELSE 'monthly'
END
WHERE billing_period = 'monthly'; -- only touch rows that still have the default
