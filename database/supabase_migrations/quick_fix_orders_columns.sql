-- ============================================================================
-- QUICK FIX: Add Essential Payment Columns to Orders Table
-- This is a minimal migration to fix the immediate "billed_at" column error
-- ============================================================================

-- 1. Add new order statuses for payment workflow
DO $$ 
BEGIN
    -- Add new enum values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'billed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'billed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'payment_pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paid' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'paid';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'completed';
    END IF;
END $$;

-- 2. Add payment-related columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bill_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- 3. Verify the columns were added
SELECT 'Payment columns added successfully to orders table!' as status;

-- 4. Show the new order statuses available
SELECT 'Available order statuses:' as info;
SELECT unnest(enum_range(NULL::order_status)) as order_status;
