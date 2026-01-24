-- Update subscription expiration dates for existing pharmacies
UPDATE pharmacies 
SET subscription_expires_at = CASE 
    WHEN subscription_plan = 'trial' THEN CURRENT_DATE + INTERVAL '14 days'
    WHEN subscription_plan = 'standard' THEN CURRENT_DATE + INTERVAL '30 days'
    WHEN subscription_plan = 'premium' THEN CURRENT_DATE + INTERVAL '30 days'
    ELSE CURRENT_DATE + INTERVAL '30 days'
END
WHERE subscription_expires_at IS NULL;

-- Insert payment methods for all pharmacies
INSERT INTO payment_methods (pharmacy_id, method_type, is_default)
SELECT id, 'Mobile Money', true 
FROM pharmacies 
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods WHERE payment_methods.pharmacy_id = pharmacies.id
)
ON CONFLICT DO NOTHING;

-- Create historical invoices for each pharmacy
INSERT INTO invoices (pharmacy_id, amount, status, due_date, paid_date, plan_name, created_at)
SELECT 
    id,
    CASE subscription_plan
        WHEN 'trial' THEN 0
        WHEN 'standard' THEN 50000
        WHEN 'premium' THEN 120000
        ELSE 0
    END,
    'paid',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '60 days',
    INITCAP(subscription_plan::text),
    CURRENT_DATE - INTERVAL '60 days'
FROM pharmacies
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE invoices.pharmacy_id = pharmacies.id);

-- Create second historical invoice
INSERT INTO invoices (pharmacy_id, amount, status, due_date, paid_date, plan_name, created_at)
SELECT 
    id,
    CASE subscription_plan
        WHEN 'trial' THEN 0
        WHEN 'standard' THEN 50000
        WHEN 'premium' THEN 120000
        ELSE 0
    END,
    'paid',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '30 days',
    INITCAP(subscription_plan::text),
    CURRENT_DATE - INTERVAL '30 days'
FROM pharmacies;

-- Create upcoming invoice for non-trial pharmacies
INSERT INTO invoices (pharmacy_id, amount, status, due_date, plan_name, created_at)
SELECT 
    id,
    CASE subscription_plan
        WHEN 'standard' THEN 50000
        WHEN 'premium' THEN 120000
        ELSE 0
    END,
    'pending',
    subscription_expires_at,
    INITCAP(subscription_plan::text),
    CURRENT_DATE
FROM pharmacies
WHERE subscription_plan != 'trial';

-- Verify data
SELECT 'Pharmacies with expiration dates:' as info;
SELECT id, name, subscription_plan, subscription_expires_at FROM pharmacies;

SELECT 'Payment methods:' as info;
SELECT pharmacy_id, method_type, is_default FROM payment_methods;

SELECT 'Invoices:' as info;
SELECT pharmacy_id, invoice_number, amount, status, due_date, plan_name FROM invoices ORDER BY created_at DESC;
