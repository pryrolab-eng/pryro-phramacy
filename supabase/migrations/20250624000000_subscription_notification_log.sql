-- ============================================================
-- Subscription notification log
-- Prevents duplicate lifecycle emails (expiry warnings, usage alerts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_notification_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text NOT NULL UNIQUE,          -- dedup key e.g. "expiry_warning_7d_<sub_id>"
  pharmacy_id     uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_at      timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_notif_log_key         ON public.subscription_notification_log(key);
CREATE INDEX IF NOT EXISTS idx_sub_notif_log_pharmacy_id ON public.subscription_notification_log(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_sub_notif_log_created_at  ON public.subscription_notification_log(created_at);

ALTER TABLE public.subscription_notification_log ENABLE ROW LEVEL SECURITY;

-- Only service role / platform admins can read/write
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_notification_log'
      AND policyname = 'sub_notif_log_admin_all'
  ) THEN
    CREATE POLICY "sub_notif_log_admin_all"
      ON public.subscription_notification_log FOR ALL
      USING (public.is_superadmin());
  END IF;
END $$;

-- Auto-clean logs older than 90 days (keeps table lean)
CREATE OR REPLACE FUNCTION public.cleanup_old_notification_logs()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  DELETE FROM public.subscription_notification_log
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Add description column to subscription_plans if missing
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS description text;

-- Add yearly_price column to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS yearly_price numeric(12,2);

-- Add grace_period_days to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 3;

-- Add suspended_at to subscriptions for audit trail
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Add reactivated_at to subscriptions for audit trail
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS reactivated_at timestamp with time zone;

-- Extend subscription status to include 'suspended'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'pending', 'cancelled', 'expired', 'past_due', 'suspended', 'trialing'));
