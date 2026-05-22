-- ============================================================
-- Catch-up migration: ensure all subscription columns exist
-- Safe to run multiple times (all use IF NOT EXISTS / DO blocks)
-- Run this in Supabase SQL Editor if the admin subscriptions
-- page returns a 500 error.
-- ============================================================

-- ── subscription_plans columns ────────────────────────────

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'main'
    CHECK (plan_type IN ('main', 'branch_addon'));

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly'
    CHECK (billing_period IN ('monthly', 'yearly', 'free'));

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_branches integer NOT NULL DEFAULT 1;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_users integer NOT NULL DEFAULT 5;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_tx_limit integer NOT NULL DEFAULT 500;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS yearly_discount_pct integer NOT NULL DEFAULT 17
    CHECK (yearly_discount_pct >= 0 AND yearly_discount_pct <= 100);

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 3;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS yearly_price numeric(12,2);

-- Back-fill yearly_price for existing rows
UPDATE public.subscription_plans
SET yearly_price = CASE
  WHEN price > 0 AND billing_period != 'free'
    THEN ROUND(price * 12 * (1 - COALESCE(yearly_discount_pct, 17) / 100.0), 2)
  ELSE 0
END
WHERE yearly_price IS NULL;

-- ── subscriptions columns ─────────────────────────────────

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.subscription_plans(id);

ALTER TABLE public.subscriptions
  ALTER COLUMN plan DROP NOT NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS branch_id uuid;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS subscription_type text NOT NULL DEFAULT 'main'
    CHECK (subscription_type IN ('main', 'branch_addon'));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start timestamp with time zone DEFAULT now();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly'
    CHECK (billing_period IN ('monthly', 'yearly', 'free'));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS reactivated_at timestamp with time zone;

-- Extend status constraint to include suspended + trialing
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'pending', 'cancelled', 'expired', 'past_due', 'suspended', 'trialing'));
