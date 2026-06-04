-- Seed insurance + POS test data for one pharmacy (idempotent).
--
-- Pharmacy: 281e70d7-b9df-49b8-8984-f8ab20ed9a0f
-- Creates ~28 medications (with insurance_coverage), inventory, 10 insurance sales,
-- 10 claims, and ~20 claim lines dated in the current calendar month.
--
-- Run in Supabase Dashboard → SQL Editor (service role / postgres).
-- Re-run safe: removes prior rows tagged with batch prefix SEED-281e70d7-.
--
-- Requires: pharmacy row exists; at least one active branch; global insurers
-- (RSSB, MMI, SONARWA, Radiant Insurance) from migrations.

-- Prereqs (no-op if migrations already applied)
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS insurance_coverage jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.insurance_claim_lines
  ADD COLUMN IF NOT EXISTS external_code text;

DO $$
DECLARE
  v_pharmacy_id uuid := '281e70d7-b9df-49b8-8984-f8ab20ed9a0f';
  v_branch_id uuid;
  v_rssb uuid;
  v_mmi uuid;
  v_sonarwa uuid;
  v_radiant uuid;
  v_pharmacy_ok boolean;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_sale_id uuid;
  v_claim_id uuid;
  v_inv_id uuid;
  v_med_id uuid;
  v_provider uuid;
  v_subtotal numeric;
  v_insurer numeric;
  v_patient numeric;
  v_i int;
  v_day int;
  v_created timestamptz;
  -- Fixed UUIDs: 8-4-4-4-12 hex (last segment must be exactly 12 chars)
  med_ids uuid[] := ARRAY[
    '281e7001-b9df-49b8-8984-000000000001'::uuid,
    '281e7002-b9df-49b8-8984-000000000002'::uuid,
    '281e7003-b9df-49b8-8984-000000000003'::uuid,
    '281e7004-b9df-49b8-8984-000000000004'::uuid,
    '281e7005-b9df-49b8-8984-000000000005'::uuid,
    '281e7006-b9df-49b8-8984-000000000006'::uuid,
    '281e7007-b9df-49b8-8984-000000000007'::uuid,
    '281e7008-b9df-49b8-8984-000000000008'::uuid,
    '281e7009-b9df-49b8-8984-000000000009'::uuid,
    '281e700a-b9df-49b8-8984-00000000000a'::uuid,
    '281e700b-b9df-49b8-8984-00000000000b'::uuid,
    '281e700c-b9df-49b8-8984-00000000000c'::uuid,
    '281e700d-b9df-49b8-8984-00000000000d'::uuid,
    '281e700e-b9df-49b8-8984-00000000000e'::uuid,
    '281e700f-b9df-49b8-8984-00000000000f'::uuid,
    '281e7010-b9df-49b8-8984-000000000010'::uuid,
    '281e7011-b9df-49b8-8984-000000000011'::uuid,
    '281e7012-b9df-49b8-8984-000000000012'::uuid,
    '281e7013-b9df-49b8-8984-000000000013'::uuid,
    '281e7014-b9df-49b8-8984-000000000014'::uuid,
    '281e7015-b9df-49b8-8984-000000000015'::uuid,
    '281e7016-b9df-49b8-8984-000000000016'::uuid,
    '281e7017-b9df-49b8-8984-000000000017'::uuid,
    '281e7018-b9df-49b8-8984-000000000018'::uuid,
    '281e7019-b9df-49b8-8984-000000000019'::uuid,
    '281e701a-b9df-49b8-8984-00000000001a'::uuid,
    '281e701b-b9df-49b8-8984-00000000001b'::uuid,
    '281e701c-b9df-49b8-8984-00000000001c'::uuid
  ];
  inv_ids uuid[] := ARRAY[
    '281e7101-b9df-49b8-8984-000000000001'::uuid,
    '281e7102-b9df-49b8-8984-000000000002'::uuid,
    '281e7103-b9df-49b8-8984-000000000003'::uuid,
    '281e7104-b9df-49b8-8984-000000000004'::uuid,
    '281e7105-b9df-49b8-8984-000000000005'::uuid,
    '281e7106-b9df-49b8-8984-000000000006'::uuid,
    '281e7107-b9df-49b8-8984-000000000007'::uuid,
    '281e7108-b9df-49b8-8984-000000000008'::uuid,
    '281e7109-b9df-49b8-8984-000000000009'::uuid,
    '281e710a-b9df-49b8-8984-00000000000a'::uuid,
    '281e710b-b9df-49b8-8984-00000000000b'::uuid,
    '281e710c-b9df-49b8-8984-00000000000c'::uuid,
    '281e710d-b9df-49b8-8984-00000000000d'::uuid,
    '281e710e-b9df-49b8-8984-00000000000e'::uuid,
    '281e710f-b9df-49b8-8984-00000000000f'::uuid,
    '281e7110-b9df-49b8-8984-000000000010'::uuid,
    '281e7111-b9df-49b8-8984-000000000011'::uuid,
    '281e7112-b9df-49b8-8984-000000000012'::uuid,
    '281e7113-b9df-49b8-8984-000000000013'::uuid,
    '281e7114-b9df-49b8-8984-000000000014'::uuid,
    '281e7115-b9df-49b8-8984-000000000015'::uuid,
    '281e7116-b9df-49b8-8984-000000000016'::uuid,
    '281e7117-b9df-49b8-8984-000000000017'::uuid,
    '281e7118-b9df-49b8-8984-000000000018'::uuid,
    '281e7119-b9df-49b8-8984-000000000019'::uuid,
    '281e711a-b9df-49b8-8984-00000000001a'::uuid,
    '281e711b-b9df-49b8-8984-00000000001b'::uuid,
    '281e711c-b9df-49b8-8984-00000000001c'::uuid
  ];
  sale_ids uuid[] := ARRAY[
    '281e7201-b9df-49b8-8984-000000000001'::uuid,
    '281e7202-b9df-49b8-8984-000000000002'::uuid,
    '281e7203-b9df-49b8-8984-000000000003'::uuid,
    '281e7204-b9df-49b8-8984-000000000004'::uuid,
    '281e7205-b9df-49b8-8984-000000000005'::uuid,
    '281e7206-b9df-49b8-8984-000000000006'::uuid,
    '281e7207-b9df-49b8-8984-000000000007'::uuid,
    '281e7208-b9df-49b8-8984-000000000008'::uuid,
    '281e7209-b9df-49b8-8984-000000000009'::uuid,
    '281e720a-b9df-49b8-8984-00000000000a'::uuid
  ];
  claim_ids uuid[] := ARRAY[
    '281e7301-b9df-49b8-8984-000000000001'::uuid,
    '281e7302-b9df-49b8-8984-000000000002'::uuid,
    '281e7303-b9df-49b8-8984-000000000003'::uuid,
    '281e7304-b9df-49b8-8984-000000000004'::uuid,
    '281e7305-b9df-49b8-8984-000000000005'::uuid,
    '281e7306-b9df-49b8-8984-000000000006'::uuid,
    '281e7307-b9df-49b8-8984-000000000007'::uuid,
    '281e7308-b9df-49b8-8984-000000000008'::uuid,
    '281e7309-b9df-49b8-8984-000000000009'::uuid,
    '281e730a-b9df-49b8-8984-00000000000a'::uuid
  ];
  patient_names text[] := ARRAY[
    'Jean Uwimana', 'Marie Mukamana', 'Paul Nkurunziza', 'Grace Uwase',
    'Eric Habimana', 'Chantal Nyirahabimana', 'David Niyonsaba', 'Alice Uwera',
    'Patrick Mugisha', 'Sandrine Ishimwe'
  ];
  patient_ids text[] := ARRAY[
    '1198012345678901', '1198023456789012', '1198034567890123', '1198045678901234',
    '1198056789012345', '1198067890123456', '1198078901234567', '1198089012345678',
    '1198090123456789', '1198101234567890'
  ];
  provider_cycle uuid[];
  coverage_pct numeric;
  line_qty int;
  line_price numeric;
  line_total numeric;
  line_insurer numeric;
  line_patient numeric;
  is_cov boolean;
  ext_code text;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.pharmacies WHERE id = v_pharmacy_id) INTO v_pharmacy_ok;
  IF NOT v_pharmacy_ok THEN
    RAISE EXCEPTION 'Pharmacy % not found. Create the pharmacy before running this seed.', v_pharmacy_id;
  END IF;

  SELECT id INTO v_branch_id
  FROM public.branches
  WHERE pharmacy_id = v_pharmacy_id AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'No active branch for pharmacy %. Add a branch first.', v_pharmacy_id;
  END IF;

  SELECT id INTO v_rssb FROM public.insurance_providers
  WHERE pharmacy_id IS NULL AND is_active AND lower(name) LIKE '%rssb%' LIMIT 1;
  SELECT id INTO v_mmi FROM public.insurance_providers
  WHERE pharmacy_id IS NULL AND is_active AND lower(name) LIKE '%mmi%' LIMIT 1;
  SELECT id INTO v_sonarwa FROM public.insurance_providers
  WHERE pharmacy_id IS NULL AND is_active AND lower(name) LIKE '%sonarwa%' LIMIT 1;
  SELECT id INTO v_radiant FROM public.insurance_providers
  WHERE pharmacy_id IS NULL AND is_active AND lower(name) LIKE '%radiant%' LIMIT 1;

  IF v_rssb IS NULL OR v_mmi IS NULL THEN
    RAISE EXCEPTION 'Global insurers RSSB/MMI missing. Run insurance_providers migration seed.';
  END IF;

  provider_cycle := ARRAY[v_rssb, v_mmi, COALESCE(v_sonarwa, v_rssb), COALESCE(v_radiant, v_mmi)];

  v_month_start := date_trunc('month', now());
  v_month_end := v_month_start + interval '1 month' - interval '1 second';

  -- Cleanup previous seed (fixed UUIDs + batch prefix)
  DELETE FROM public.insurance_claim_lines cl
  USING public.insurance_claims c
  WHERE cl.claim_id = c.id AND c.pharmacy_id = v_pharmacy_id
    AND (c.id = ANY(claim_ids) OR c.sale_id = ANY(sale_ids));

  DELETE FROM public.insurance_claims
  WHERE pharmacy_id = v_pharmacy_id AND (id = ANY(claim_ids) OR sale_id = ANY(sale_ids));

  DELETE FROM public.sale_items si
  USING public.sales s
  WHERE si.sale_id = s.id AND s.pharmacy_id = v_pharmacy_id
    AND (s.id = ANY(sale_ids) OR si.inventory_id = ANY(inv_ids));

  DELETE FROM public.sales
  WHERE pharmacy_id = v_pharmacy_id AND id = ANY(sale_ids);

  DELETE FROM public.inventory
  WHERE pharmacy_id = v_pharmacy_id AND (id = ANY(inv_ids) OR batch_number LIKE 'SEED-281e70d7-%');

  DELETE FROM public.medications
  WHERE pharmacy_id = v_pharmacy_id AND id = ANY(med_ids);

  -- 28 medications
  INSERT INTO public.medications (
    id, pharmacy_id, name, generic_name, brand_name, category,
    dosage_form, strength, manufacturer, barcode, requires_prescription, is_active
  ) VALUES
    (med_ids[1], v_pharmacy_id, 'Paracetamol 500mg', 'Paracetamol', 'Panadol', 'otc', 'Tablet', '500mg', 'GSK', 'SEED281-PARA01', false, true),
    (med_ids[2], v_pharmacy_id, 'Amoxicillin 250mg', 'Amoxicillin', 'Amoxil', 'prescription', 'Capsule', '250mg', 'Pfizer', 'SEED281-AMOX01', true, true),
    (med_ids[3], v_pharmacy_id, 'Metformin 500mg', 'Metformin', 'Glucophage', 'prescription', 'Tablet', '500mg', 'Merck', 'SEED281-MET01', true, true),
    (med_ids[4], v_pharmacy_id, 'Amlodipine 5mg', 'Amlodipine', 'Norvasc', 'prescription', 'Tablet', '5mg', 'Pfizer', 'SEED281-AML01', true, true),
    (med_ids[5], v_pharmacy_id, 'Artemether-Lumefantrine', 'Artemether/Lumefantrine', 'Coartem', 'prescription', 'Tablet', '20/120mg', 'Novartis', 'SEED281-ALU01', true, true),
    (med_ids[6], v_pharmacy_id, 'ORS Sachets', 'Oral Rehydration Salts', 'ORS', 'otc', 'Sachet', '20.5g', 'Local', 'SEED281-ORS01', false, true),
    (med_ids[7], v_pharmacy_id, 'Zinc Sulphate 20mg', 'Zinc Sulphate', 'Zincol', 'otc', 'Tablet', '20mg', 'Local', 'SEED281-ZINC01', false, true),
    (med_ids[8], v_pharmacy_id, 'Ciprofloxacin 500mg', 'Ciprofloxacin', 'Cipro', 'prescription', 'Tablet', '500mg', 'Bayer', 'SEED281-CIP01', true, true),
    (med_ids[9], v_pharmacy_id, 'Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 'otc', 'Tablet', '400mg', 'Abbott', 'SEED281-IBU01', false, true),
    (med_ids[10], v_pharmacy_id, 'Omeprazole 20mg', 'Omeprazole', 'Losec', 'prescription', 'Capsule', '20mg', 'AstraZeneca', 'SEED281-OME01', true, true),
    (med_ids[11], v_pharmacy_id, 'Losartan 50mg', 'Losartan', 'Cozaar', 'prescription', 'Tablet', '50mg', 'MSD', 'SEED281-LOS01', true, true),
    (med_ids[12], v_pharmacy_id, 'Atorvastatin 20mg', 'Atorvastatin', 'Lipitor', 'prescription', 'Tablet', '20mg', 'Pfizer', 'SEED281-ATO01', true, true),
    (med_ids[13], v_pharmacy_id, 'Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 'otc', 'Tablet', '10mg', 'UCB', 'SEED281-CET01', false, true),
    (med_ids[14], v_pharmacy_id, 'Azithromycin 500mg', 'Azithromycin', 'Zithromax', 'prescription', 'Tablet', '500mg', 'Pfizer', 'SEED281-AZI01', true, true),
    (med_ids[15], v_pharmacy_id, 'Ferrous Sulphate 200mg', 'Ferrous Sulphate', 'Fefol', 'supplement', 'Tablet', '200mg', 'Local', 'SEED281-FER01', false, true),
    (med_ids[16], v_pharmacy_id, 'Folic Acid 5mg', 'Folic Acid', 'Folvite', 'supplement', 'Tablet', '5mg', 'Local', 'SEED281-FOL01', false, true),
    (med_ids[17], v_pharmacy_id, 'Salbutamol Inhaler', 'Salbutamol', 'Ventolin', 'prescription', 'Inhaler', '100mcg', 'GSK', 'SEED281-SAL01', true, true),
    (med_ids[18], v_pharmacy_id, 'Multivitamin Tablets', 'Multivitamin', 'Centrum', 'supplement', 'Tablet', 'Daily', 'Pfizer', 'SEED281-MV01', false, true),
    (med_ids[19], v_pharmacy_id, 'Hydrocortisone Cream 1%', 'Hydrocortisone', 'HC Cream', 'otc', 'Cream', '1%', 'Local', 'SEED281-HC01', false, true),
    (med_ids[20], v_pharmacy_id, 'Gentamicin Eye Drops', 'Gentamicin', 'Genticin', 'prescription', 'Drops', '0.3%', 'Local', 'SEED281-GEN01', true, true),
    (med_ids[21], v_pharmacy_id, 'Albendazole 400mg', 'Albendazole', 'Zentel', 'otc', 'Tablet', '400mg', 'GSK', 'SEED281-ALB01', false, true),
    (med_ids[22], v_pharmacy_id, 'Diclofenac 50mg', 'Diclofenac', 'Voltaren', 'otc', 'Tablet', '50mg', 'Novartis', 'SEED281-DIC01', false, true),
    (med_ids[23], v_pharmacy_id, 'Ceftriaxone 1g Injection', 'Ceftriaxone', 'Rocephin', 'prescription', 'Injection', '1g', 'Roche', 'SEED281-CEF01', true, true),
    (med_ids[24], v_pharmacy_id, 'Insulin Glargine', 'Insulin Glargine', 'Lantus', 'prescription', 'Vial', '100IU/ml', 'Sanofi', 'SEED281-INS01', true, true),
    (med_ids[25], v_pharmacy_id, 'Tramadol 50mg', 'Tramadol', 'Tramal', 'prescription', 'Capsule', '50mg', 'Grünenthal', 'SEED281-TRA01', true, true),
    (med_ids[26], v_pharmacy_id, 'Glucose Test Strips', 'Glucose Strips', 'Accu-Chek', 'medical_device', 'Strips', '50 pack', 'Roche', 'SEED281-GLU01', false, true),
    (med_ids[27], v_pharmacy_id, 'Cough Syrup 100ml', 'Dextromethorphan', 'Benylin', 'otc', 'Syrup', '100ml', 'J&J', 'SEED281-COU01', false, true),
    (med_ids[28], v_pharmacy_id, 'Vitamin C 1000mg', 'Ascorbic Acid', 'Redoxon', 'supplement', 'Tablet', '1000mg', 'Bayer', 'SEED281-VIT01', false, true);

  -- Insurance coverage flags (provider default % applies at POS; no per-drug %)
  FOR v_i IN 1..22 LOOP
    UPDATE public.medications SET insurance_coverage =
      jsonb_build_object(
        v_rssb::text, jsonb_build_object('covered', true, 'externalCode', 'RSSB-' || lpad(v_i::text, 3, '0')),
        v_mmi::text, jsonb_build_object('covered', true, 'externalCode', 'MMI-' || lpad(v_i::text, 3, '0'))
      )
    WHERE id = med_ids[v_i];
  END LOOP;

  -- Partial: RSSB only
  FOR v_i IN 23..25 LOOP
    UPDATE public.medications SET insurance_coverage =
      jsonb_build_object(v_rssb::text, jsonb_build_object('covered', true, 'externalCode', 'RSSB-' || lpad(v_i::text, 3, '0')))
    WHERE id = med_ids[v_i];
  END LOOP;

  -- Not covered (empty / patient pays 100%)
  UPDATE public.medications SET insurance_coverage = '{}'::jsonb
  WHERE id = ANY(ARRAY[med_ids[24], med_ids[26]]);

  UPDATE public.medications SET insurance_coverage =
    jsonb_build_object(v_mmi::text, jsonb_build_object('covered', true, 'externalCode', 'MMI-027'))
  WHERE id = med_ids[27];

  UPDATE public.medications SET insurance_coverage =
    jsonb_build_object(v_sonarwa::text, jsonb_build_object('covered', true, 'externalCode', 'SON-028'))
  WHERE id = med_ids[28] AND v_sonarwa IS NOT NULL;

  -- Inventory (28 batches, high stock for sale_item trigger)
  FOR v_i IN 1..28 LOOP
    INSERT INTO public.inventory (
      id, pharmacy_id, branch_id, medication_id, batch_number,
      quantity_in_stock, unit_cost, selling_price, minimum_stock_level,
      expiry_date, manufacturing_date
    ) VALUES (
      inv_ids[v_i], v_pharmacy_id, v_branch_id, med_ids[v_i],
      'SEED-281e70d7-' || lpad(v_i::text, 3, '0'),
      500, 200 + (v_i * 50), 400 + (v_i * 80), 20,
      (CURRENT_DATE + interval '18 months')::date,
      (CURRENT_DATE - interval '3 months')::date
    );
  END LOOP;

  -- 10 insurance sales + claims in current month
  FOR v_i IN 1..10 LOOP
    v_provider := provider_cycle[1 + ((v_i - 1) % array_length(provider_cycle, 1))];
    v_day := 1 + ((v_i - 1) * 2);
    v_created := v_month_start + make_interval(days => v_day, hours => 10 + v_i);

    SELECT COALESCE(default_coverage_percent, coverage_percentage, 80) / 100.0
    INTO coverage_pct
    FROM public.insurance_providers WHERE id = v_provider;

    v_med_id := med_ids[1 + ((v_i - 1) % 22)];
    v_inv_id := inv_ids[1 + ((v_i - 1) % 22)];
    SELECT selling_price INTO line_price FROM public.inventory WHERE id = v_inv_id;
    line_qty := 1 + (v_i % 3);
    line_total := line_price * line_qty;
    is_cov := EXISTS (
      SELECT 1 FROM public.medications m
      WHERE m.id = v_med_id
        AND (m.insurance_coverage -> v_provider::text ->> 'covered')::boolean IS TRUE
    );
    IF is_cov THEN
      line_insurer := round(line_total * coverage_pct, 2);
      line_patient := line_total - line_insurer;
    ELSE
      line_insurer := 0;
      line_patient := line_total;
    END IF;

    v_subtotal := line_total;
    v_insurer := line_insurer;
    v_patient := line_patient;

    -- Second line (alternate med)
    v_med_id := med_ids[1 + ((v_i + 5) % 22)];
    v_inv_id := inv_ids[1 + ((v_i + 5) % 22)];
    SELECT selling_price INTO line_price FROM public.inventory WHERE id = v_inv_id;
    line_qty := 1;
    line_total := line_price * line_qty;
    is_cov := EXISTS (
      SELECT 1 FROM public.medications m
      WHERE m.id = v_med_id
        AND (m.insurance_coverage -> v_provider::text ->> 'covered')::boolean IS TRUE
    );
    IF is_cov THEN
      line_insurer := round(line_total * coverage_pct, 2);
      line_patient := line_total - line_insurer;
    ELSE
      line_insurer := 0;
      line_patient := line_total;
    END IF;

    v_subtotal := v_subtotal + line_total;
    v_insurer := v_insurer + line_insurer;
    v_patient := v_patient + line_patient;

    INSERT INTO public.sales (
      id, pharmacy_id, branch_id, customer_name, customer_phone,
      insurance_provider_id, subtotal, insurance_amount, customer_amount,
      total_amount, payment_method, status, receipt_number, created_at
    ) VALUES (
      sale_ids[v_i], v_pharmacy_id, v_branch_id,
      patient_names[v_i], '+250788' || lpad((100000 + v_i)::text, 6, '0'),
      v_provider, v_subtotal, v_insurer, v_patient, v_subtotal, 'mixed', 'completed',
      'SEED-RCP-281e70d7-' || lpad(v_i::text, 3, '0'), v_created
    );

    -- Line 1
    v_med_id := med_ids[1 + ((v_i - 1) % 22)];
    v_inv_id := inv_ids[1 + ((v_i - 1) % 22)];
    SELECT i.selling_price, m.name INTO line_price, ext_code
    FROM public.inventory i JOIN public.medications m ON m.id = i.medication_id
    WHERE i.id = v_inv_id;
    line_qty := 1 + (v_i % 3);
    line_total := line_price * line_qty;
    is_cov := (SELECT (insurance_coverage -> v_provider::text ->> 'covered')::boolean FROM medications WHERE id = v_med_id);
    IF COALESCE(is_cov, false) THEN
      line_insurer := round(line_total * coverage_pct, 2);
      line_patient := line_total - line_insurer;
    ELSE
      line_insurer := 0; line_patient := line_total;
    END IF;

    INSERT INTO public.sale_items (sale_id, inventory_id, medication_name, quantity, unit_price, total_price, batch_number)
    VALUES (sale_ids[v_i], v_inv_id, ext_code, line_qty, line_price, line_total,
      'SEED-281e70d7-' || lpad((1 + ((v_i - 1) % 22))::text, 3, '0'));

    -- Line 2
    v_med_id := med_ids[1 + ((v_i + 5) % 22)];
    v_inv_id := inv_ids[1 + ((v_i + 5) % 22)];
    SELECT i.selling_price, m.name INTO line_price, ext_code
    FROM public.inventory i JOIN public.medications m ON m.id = i.medication_id WHERE i.id = v_inv_id;
    line_qty := 1;
    line_total := line_price;
    is_cov := (SELECT (insurance_coverage -> v_provider::text ->> 'covered')::boolean FROM medications WHERE id = v_med_id);
    IF COALESCE(is_cov, false) THEN
      line_insurer := round(line_total * coverage_pct, 2);
      line_patient := line_total - line_insurer;
    ELSE
      line_insurer := 0; line_patient := line_total;
    END IF;
    ext_code := (SELECT insurance_coverage -> v_provider::text ->> 'externalCode' FROM medications WHERE id = v_med_id);

    INSERT INTO public.sale_items (sale_id, inventory_id, medication_name, quantity, unit_price, total_price, batch_number)
    VALUES (sale_ids[v_i], v_inv_id,
      (SELECT name FROM medications WHERE id = v_med_id),
      line_qty, line_price, line_total,
      'SEED-281e70d7-' || lpad((1 + ((v_i + 5) % 22))::text, 3, '0'));

    INSERT INTO public.insurance_claims (
      id, pharmacy_id, sale_id, insurance_provider_id,
      patient_name, patient_id_number, claim_amount, covered_amount, patient_copay,
      status, created_at, metadata
    ) VALUES (
      claim_ids[v_i], v_pharmacy_id, sale_ids[v_i], v_provider,
      patient_names[v_i], patient_ids[v_i], v_insurer, v_insurer, v_patient,
      CASE WHEN v_i % 4 = 0 THEN 'pending'::insurance_claim_status
           WHEN v_i % 4 = 1 THEN 'approved'::insurance_claim_status
           WHEN v_i % 4 = 2 THEN 'processing'::insurance_claim_status
           ELSE 'approved'::insurance_claim_status END,
      v_created,
      jsonb_build_object('seed', '281e70d7', 'source', 'scripts/seed-pharmacy-insurance-test-data.sql')
    );

    -- Claim lines from sale_items
    INSERT INTO public.insurance_claim_lines (
      claim_id, sale_item_id, medication_id, medication_name, quantity,
      is_covered, shelf_unit_price, insured_unit_price, insurer_amount, patient_amount, external_code
    )
    SELECT
      claim_ids[v_i],
      si.id,
      i.medication_id,
      si.medication_name,
      si.quantity,
      COALESCE((m.insurance_coverage -> v_provider::text ->> 'covered')::boolean, false),
      si.unit_price,
      si.unit_price,
      CASE WHEN COALESCE((m.insurance_coverage -> v_provider::text ->> 'covered')::boolean, false)
        THEN round(si.total_price * coverage_pct, 2) ELSE 0 END,
      CASE WHEN COALESCE((m.insurance_coverage -> v_provider::text ->> 'covered')::boolean, false)
        THEN si.total_price - round(si.total_price * coverage_pct, 2) ELSE si.total_price END,
      m.insurance_coverage -> v_provider::text ->> 'externalCode'
    FROM public.sale_items si
    JOIN public.inventory i ON i.id = si.inventory_id
    JOIN public.medications m ON m.id = i.medication_id
    WHERE si.sale_id = sale_ids[v_i];
  END LOOP;

  RAISE NOTICE 'Seed complete for pharmacy %: 28 medications, 28 inventory, 10 sales/claims (month %).',
    v_pharmacy_id, to_char(v_month_start, 'YYYY-MM');
END $$;

-- Quick verification
SELECT 'medications' AS entity, count(*)::int AS n
FROM public.medications WHERE pharmacy_id = '281e70d7-b9df-49b8-8984-f8ab20ed9a0f' AND id::text LIKE '281e700%'
UNION ALL
SELECT 'inventory', count(*)::int FROM public.inventory
WHERE pharmacy_id = '281e70d7-b9df-49b8-8984-f8ab20ed9a0f' AND batch_number LIKE 'SEED-281e70d7-%'
UNION ALL
SELECT 'insurance_claims (seed sales)', count(*)::int FROM public.insurance_claims
WHERE pharmacy_id = '281e70d7-b9df-49b8-8984-f8ab20ed9a0f' AND sale_id::text LIKE '281e720%';
