-- KPay Payment Integration Tables

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
    sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- KPay specific fields
    kpay_tid text UNIQUE,
    kpay_refid text UNIQUE NOT NULL,
    kpay_authkey text,
    kpay_checkout_url text,
    
    -- Transaction details
    amount decimal(10,2) NOT NULL,
    currency text DEFAULT 'RWF',
    payment_method text NOT NULL, -- 'momo', 'cc', 'bank', 'spenn', 'smartcash'
    bank_id text,
    bank_name text,
    
    -- Customer details
    customer_name text NOT NULL,
    customer_phone text,
    customer_email text,
    customer_number text,
    
    -- Payment status
    status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    kpay_status_id text,
    kpay_status_desc text,
    
    -- Transaction references
    mom_transaction_id text,
    pay_account text,
    
    -- Metadata
    payment_details text,
    error_message text,
    webhook_received_at timestamp with time zone,
    completed_at timestamp with time zone,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Payment logs for debugging
CREATE TABLE IF NOT EXISTS payment_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- 'request', 'response', 'webhook', 'status_check'
    payload jsonb,
    response jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pharmacy_id ON payment_transactions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sale_id ON payment_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_kpay_tid ON payment_transactions(kpay_tid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_kpay_refid ON payment_transactions(kpay_refid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle payment completion
CREATE OR REPLACE FUNCTION handle_payment_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment is completed, update related records
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = now();
        
        -- Update sale status if this is a sale payment
        IF NEW.sale_id IS NOT NULL THEN
            UPDATE sales 
            SET status = 'completed',
                payment_method = CASE 
                    WHEN NEW.payment_method = 'momo' THEN 'mobile_money'::payment_method
                    WHEN NEW.payment_method = 'cc' THEN 'card'::payment_method
                    ELSE 'cash'::payment_method
                END
            WHERE id = NEW.sale_id;
        END IF;
        
        -- Update subscription if this is a subscription payment
        IF NEW.subscription_id IS NOT NULL THEN
            UPDATE subscriptions 
            SET is_active = true,
                payment_reference = NEW.kpay_tid
            WHERE id = NEW.subscription_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment completion
CREATE TRIGGER handle_payment_completion_trigger
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION handle_payment_completion();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_logs;
