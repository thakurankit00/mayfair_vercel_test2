-- Migration: Add payment-related order statuses
-- Date: 2025-09-14
-- Description: Add new order statuses for billing and payment workflow

-- Add new values to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'billed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';

-- Add billing-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment-related queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(status) WHERE status IN ('billed', 'payment_pending', 'paid', 'completed');
CREATE INDEX IF NOT EXISTS idx_orders_billed_at ON orders(billed_at) WHERE billed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_completed_at ON orders(payment_completed_at) WHERE payment_completed_at IS NOT NULL;

-- Update existing 'served' orders to 'completed' if they don't have payments
UPDATE orders 
SET status = 'completed', completed_at = COALESCE(ready_at, updated_at)
WHERE status = 'served' 
AND id NOT IN (SELECT DISTINCT order_id FROM payments WHERE order_id IS NOT NULL);

-- Add comments for documentation
COMMENT ON COLUMN orders.billed_at IS 'Timestamp when bill was generated for the order';
COMMENT ON COLUMN orders.payment_requested_at IS 'Timestamp when payment was requested from customer';
COMMENT ON COLUMN orders.payment_completed_at IS 'Timestamp when payment was successfully completed';
COMMENT ON COLUMN orders.completed_at IS 'Timestamp when order was fully completed (served and paid)';

-- Create a function to automatically update order status based on payment
CREATE OR REPLACE FUNCTION update_order_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- When payment is completed, update order status to 'paid'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE orders 
        SET status = 'paid', 
            payment_completed_at = NEW.paid_at,
            updated_at = NOW()
        WHERE id = NEW.order_id;
    END IF;
    
    -- When payment fails, revert order status to 'billed'
    IF NEW.status = 'failed' AND OLD.status = 'pending' THEN
        UPDATE orders 
        SET status = 'billed',
            updated_at = NOW()
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic order status updates
DROP TRIGGER IF EXISTS trigger_update_order_on_payment ON payments;
CREATE TRIGGER trigger_update_order_on_payment
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_on_payment();

-- Add constraint to ensure valid order status transitions
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid status transitions
    IF OLD.status IS NOT NULL AND NEW.status != OLD.status THEN
        -- pending -> preparing, cancelled
        IF OLD.status = 'pending' AND NEW.status NOT IN ('preparing', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- preparing -> ready, cancelled
        IF OLD.status = 'preparing' AND NEW.status NOT IN ('ready', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- ready -> served, billed, cancelled
        IF OLD.status = 'ready' AND NEW.status NOT IN ('served', 'billed', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- served -> billed, completed
        IF OLD.status = 'served' AND NEW.status NOT IN ('billed', 'completed') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- billed -> payment_pending, completed
        IF OLD.status = 'billed' AND NEW.status NOT IN ('payment_pending', 'completed') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- payment_pending -> paid, billed (on failure)
        IF OLD.status = 'payment_pending' AND NEW.status NOT IN ('paid', 'billed') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- paid -> completed
        IF OLD.status = 'paid' AND NEW.status NOT IN ('completed') THEN
            RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
        END IF;
        
        -- completed is final (no transitions allowed)
        IF OLD.status = 'completed' THEN
            RAISE EXCEPTION 'Cannot change status from completed to %', NEW.status;
        END IF;
        
        -- cancelled is final (no transitions allowed)
        IF OLD.status = 'cancelled' THEN
            RAISE EXCEPTION 'Cannot change status from cancelled to %', NEW.status;
        END IF;
    END IF;
    
    -- Update timestamp fields based on status
    IF NEW.status = 'billed' AND OLD.status != 'billed' THEN
        NEW.billed_at = NOW();
    END IF;
    
    IF NEW.status = 'payment_pending' AND OLD.status != 'payment_pending' THEN
        NEW.payment_requested_at = NOW();
    END IF;
    
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        NEW.payment_completed_at = NOW();
    END IF;
    
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status validation
DROP TRIGGER IF EXISTS trigger_validate_order_status ON orders;
CREATE TRIGGER trigger_validate_order_status
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_status_transition();

-- Insert sample data for testing (optional)
-- This can be removed in production
/*
INSERT INTO orders (id, order_number, user_id, table_id, order_type, total_amount, status, placed_at)
VALUES 
    (uuid_generate_v4(), 'TEST001', (SELECT id FROM users WHERE role = 'customer' LIMIT 1), 
     (SELECT id FROM restaurant_tables LIMIT 1), 'restaurant', 100.00, 'ready', NOW())
ON CONFLICT DO NOTHING;
*/
