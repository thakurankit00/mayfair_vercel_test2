-- Migration: Add Order Item Cancellation Support
-- Description: Add cancellation status and audit fields for individual order items

-- Add 'cancelled' status to the order_status enum (used by order_items.status)
-- First check if 'cancelled' already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE 'cancelled';
    END IF;
END $$;

-- Add cancellation audit fields to order_items table
ALTER TABLE order_items 
ADD COLUMN cancelled_at TIMESTAMPTZ,
ADD COLUMN cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN cancellation_reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_cancelled_by ON order_items(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_order_items_cancelled_at ON order_items(cancelled_at);

-- Update the kitchen dashboard function to exclude cancelled items
CREATE OR REPLACE FUNCTION get_kitchen_dashboard_orders(kitchen_restaurant_id UUID DEFAULT NULL)
RETURNS TABLE (
    order_id UUID,
    order_number VARCHAR(20),
    table_number VARCHAR(10),
    customer_name TEXT,
    waiter_name TEXT,
    order_type VARCHAR(20),
    placed_at TIMESTAMPTZ,
    special_instructions TEXT,
    item_id UUID,
    item_name VARCHAR(200),
    item_quantity INTEGER,
    item_status order_status,
    item_special_instructions TEXT,
    preparation_time INTEGER,
    accepted_at TIMESTAMPTZ,
    started_preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    chef_notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.order_number,
        rt.table_number,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        CONCAT(w.first_name, ' ', w.last_name) as waiter_name,
        o.order_type,
        o.placed_at,
        o.special_instructions,
        oi.id as item_id,
        mi.name as item_name,
        oi.quantity as item_quantity,
        oi.status as item_status,
        oi.special_instructions as item_special_instructions,
        mi.preparation_time,
        oi.accepted_at,
        oi.started_preparing_at,
        oi.ready_at,
        oi.chef_notes,
        oi.cancelled_at,
        oi.cancelled_by,
        oi.cancellation_reason
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users w ON o.waiter_id = w.id
    LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
    LEFT JOIN restaurants r ON o.target_kitchen_id = r.id
    WHERE 
        o.status NOT IN ('served', 'cancelled')
        AND oi.status NOT IN ('ready_to_serve', 'cancelled')
        AND (kitchen_restaurant_id IS NULL OR o.target_kitchen_id = kitchen_restaurant_id)
    ORDER BY 
        CASE oi.status 
            WHEN 'pending' THEN 1
            WHEN 'accepted' THEN 2
            WHEN 'preparing' THEN 3
            ELSE 4
        END,
        o.placed_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Update the order status update function to handle cancelled items
CREATE OR REPLACE FUNCTION update_order_status_from_items()
RETURNS TRIGGER AS $$
DECLARE
    order_record RECORD;
    all_ready BOOLEAN;
    any_preparing BOOLEAN;
    any_accepted BOOLEAN;
    all_cancelled BOOLEAN;
    new_order_status order_status;
BEGIN
    -- Get the order
    SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
    
    -- Check item statuses for this order (excluding cancelled items)
    SELECT 
        BOOL_AND(status IN ('ready_to_serve', 'cancelled')) as all_ready_or_cancelled,
        BOOL_OR(status = 'preparing') as any_preparing_bool,
        BOOL_OR(status = 'accepted') as any_accepted_bool,
        BOOL_AND(status = 'cancelled') as all_cancelled_bool
    INTO all_ready, any_preparing, any_accepted, all_cancelled
    FROM order_items 
    WHERE order_id = NEW.order_id;
    
    -- Determine new order status
    IF all_cancelled THEN
        new_order_status = 'cancelled';
    ELSIF all_ready THEN
        new_order_status = 'ready';
    ELSIF any_preparing THEN
        new_order_status = 'preparing';
    ELSIF any_accepted THEN
        new_order_status = 'preparing';
    ELSE
        new_order_status = 'pending';
    END IF;
    
    -- Update order status if changed
    IF order_record.status != new_order_status THEN
        UPDATE orders 
        SET status = new_order_status,
            updated_at = CURRENT_TIMESTAMP,
            started_at = CASE 
                WHEN new_order_status = 'preparing' AND started_at IS NULL 
                THEN CURRENT_TIMESTAMP 
                ELSE started_at 
            END,
            ready_at = CASE 
                WHEN new_order_status = 'ready' 
                THEN CURRENT_TIMESTAMP 
                ELSE NULL 
            END
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table for item cancellations
CREATE TABLE IF NOT EXISTS order_item_cancellation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    cancelled_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_quantity INTEGER NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    cancelled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_cancellation_logs_order_id ON order_item_cancellation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_logs_cancelled_by ON order_item_cancellation_logs(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_cancellation_logs_cancelled_at ON order_item_cancellation_logs(cancelled_at);
