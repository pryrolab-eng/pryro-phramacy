-- Remove duplicate auto-created branches (e.g. many "Test Pharmacy — Main" rows).
-- Keeps the oldest active branch as HQ; deletes empty duplicates; deactivates the rest.
--
-- Set v_pharmacy_id OR v_pharmacy_name, then run in Supabase SQL Editor.

DO $$
DECLARE
  v_pharmacy_id uuid := '281e70d7-b9df-49b8-8984-f8ab20ed9a0f';
  v_pharmacy_name text := NULL;
  v_keep_id uuid;
  v_dup_id uuid;
  v_deleted int := 0;
  v_deactivated int := 0;
BEGIN
  IF v_pharmacy_id IS NULL AND v_pharmacy_name IS NOT NULL THEN
    SELECT id INTO v_pharmacy_id
    FROM public.pharmacies
    WHERE name = v_pharmacy_name
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_pharmacy_id IS NULL THEN
    RAISE EXCEPTION 'Set v_pharmacy_id or v_pharmacy_name at top of script.';
  END IF;

  SELECT id INTO v_keep_id
  FROM public.branches
  WHERE pharmacy_id = v_pharmacy_id
    AND is_active = true
  ORDER BY is_headquarters DESC NULLS LAST, created_at ASC
  LIMIT 1;

  IF v_keep_id IS NULL THEN
    RAISE NOTICE 'No active branches for pharmacy %', v_pharmacy_id;
    RETURN;
  END IF;

  UPDATE public.branches
  SET is_headquarters = false
  WHERE pharmacy_id = v_pharmacy_id;

  UPDATE public.branches
  SET
    is_headquarters = true,
    name = 'Headquarters (HQ)',
    updated_at = now()
  WHERE id = v_keep_id;

  -- Point sessions at the surviving branch before deleting extras
  UPDATE public.users
  SET active_branch_id = v_keep_id, updated_at = now()
  WHERE active_branch_id IN (
    SELECT id FROM public.branches
    WHERE pharmacy_id = v_pharmacy_id AND id <> v_keep_id
  );

  FOR v_dup_id IN
    SELECT id
    FROM public.branches
    WHERE pharmacy_id = v_pharmacy_id
      AND id <> v_keep_id
      AND is_active = true
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.inventory WHERE branch_id = v_dup_id LIMIT 1)
       AND NOT EXISTS (SELECT 1 FROM public.sales WHERE branch_id = v_dup_id LIMIT 1)
       AND NOT EXISTS (
         SELECT 1 FROM public.subscriptions
         WHERE branch_id = v_dup_id AND status IN ('active', 'pending')
         LIMIT 1
       )
    THEN
      DELETE FROM public.branch_usage WHERE branch_id = v_dup_id;
      DELETE FROM public.staff_branch_assignments WHERE branch_id = v_dup_id;
      DELETE FROM public.branches WHERE id = v_dup_id;
      v_deleted := v_deleted + 1;
    ELSE
      UPDATE public.branches
      SET is_active = false, is_headquarters = false, updated_at = now()
      WHERE id = v_dup_id;
      v_deactivated := v_deactivated + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Pharmacy %: kept HQ % — deleted % duplicate(s), deactivated %.',
    v_pharmacy_id, v_keep_id, v_deleted, v_deactivated;
END $$;

-- Verify: should be 1 active branch and slot count 1/1 in the app after refresh
SELECT
  count(*) FILTER (WHERE is_active) AS active_branches,
  count(*) AS total_branch_rows
FROM public.branches
WHERE pharmacy_id = '281e70d7-b9df-49b8-8984-f8ab20ed9a0f';

SELECT id, name, is_headquarters, is_active, created_at
FROM public.branches
WHERE pharmacy_id = '281e70d7-b9df-49b8-8984-f8ab20ed9a0f'
ORDER BY created_at;
