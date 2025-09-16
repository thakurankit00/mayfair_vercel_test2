-- ============================================================================
-- SUPABASE MIGRATION: Add Payment System for Restaurant Orders
-- Date: 2025-09-14
-- Description: Adds payment functionality with PayU integration
-- ============================================================================

-- 1. Add new order statuses for payment workflow
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'billed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';

-- 2. Add payment-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bill_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_intent_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    gateway VARCHAR(20) NOT NULL DEFAULT 'payu',
    gateway_transaction_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    success_url TEXT,
    failure_url TEXT,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT payments_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

-- 4. Create payment_logs table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 5. Create bills table for detailed billing information
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT bills_amounts_positive CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        service_charge >= 0 AND 
        discount >= 0 AND 
        total_amount >= 0
    )
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_bills_order_id ON bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON orders(status) WHERE status IN ('billed', 'payment_pending', 'paid', 'completed');

-- 7. Create function to generate bill numbers
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TEXT AS $$
DECLARE
    bill_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    bill_num := 'BILL' || TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the count of bills created today
    SELECT COUNT(*) + 1 INTO counter
    FROM bills 
    WHERE bill_number LIKE bill_num || '%';
    
    -- Append counter with zero padding
    bill_num := bill_num || LPAD(counter::TEXT, 4, '0');
    
    RETURN bill_num;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to auto-update order status based on payment
CREATE OR REPLACE FUNCTION update_order_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- When payment is completed, update order status to 'paid'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE orders 
        SET 
            status = 'paid',
            payment_completed_at = NOW(),
            payment_method = NEW.payment_method,
            payment_reference = NEW.gateway_transaction_id
        WHERE id = NEW.order_id;
    END IF;
    
    -- When payment fails, keep order in payment_pending status
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        UPDATE orders 
        SET status = 'payment_pending'
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for automatic order status updates
DROP TRIGGER IF EXISTS trigger_update_order_on_payment ON payments;
CREATE TRIGGER trigger_update_order_on_payment
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_on_payment();

-- 10. Create function to validate order status transitions
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid transitions
    IF OLD.status IS NOT NULL THEN
        CASE OLD.status
            WHEN 'pending' THEN
                IF NEW.status NOT IN ('preparing', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'preparing' THEN
                IF NEW.status NOT IN ('ready', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'ready' THEN
                IF NEW.status NOT IN ('served', 'billed', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'served' THEN
                IF NEW.status NOT IN ('billed', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'billed' THEN
                IF NEW.status NOT IN ('payment_pending', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'payment_pending' THEN
                IF NEW.status NOT IN ('paid', 'billed', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'paid' THEN
                IF NEW.status NOT IN ('completed', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
                END IF;
            WHEN 'completed' THEN
                IF NEW.status != 'completed' THEN
                    RAISE EXCEPTION 'Cannot change status from completed to %', NEW.status;
                END IF;
            WHEN 'cancelled' THEN
                IF NEW.status != 'cancelled' THEN
                    RAISE EXCEPTION 'Cannot change status from cancelled to %', NEW.status;
                END IF;
        END CASE;
    END IF;
    
    -- Set timestamps based on status
    CASE NEW.status
        WHEN 'billed' THEN
            NEW.billed_at = COALESCE(NEW.billed_at, NOW());
        WHEN 'payment_pending' THEN
            NEW.payment_requested_at = COALESCE(NEW.payment_requested_at, NOW());
        WHEN 'paid' THEN
            NEW.payment_completed_at = COALESCE(NEW.payment_completed_at, NOW());
        WHEN 'completed' THEN
            NEW.completed_at = COALESCE(NEW.completed_at, NOW());
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for order status validation
DROP TRIGGER IF EXISTS trigger_validate_order_status ON orders;
CREATE TRIGGER trigger_validate_order_status
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_status_transition();

-- 12. Create updated_at trigger for payments table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Insert sample payment methods (optional)
INSERT INTO payment_methods (name, code, is_active, created_at) VALUES
('PayU', 'payu', true, NOW()),
('Cash', 'cash', true, NOW()),
('Card', 'card', true, NOW()),
('UPI', 'upi', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- 14. Grant necessary permissions (adjust based on your RLS policies)
-- Note: In Supabase, you'll need to set up Row Level Security (RLS) policies
-- These are example grants - adjust based on your security requirements

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bills TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
SELECT 'Payment system migration completed successfully!' as status;
