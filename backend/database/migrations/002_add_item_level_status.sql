-- Migration: Add Item-Level Status Management
-- Description: Add proper item-level status management for kitchen workflow

-- Create item status enum
CREATE TYPE item_status AS ENUM ('pending', 'accepted', 'preparing', 'ready_to_serve');

-- Add new columns to order_items for item-level tracking
ALTER TABLE order_items 
DROP COLUMN IF EXISTS status,
ADD COLUMN status item_status DEFAULT 'pending',
ADD COLUMN accepted_at TIMESTAMPTZ,
ADD COLUMN accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN started_preparing_at TIMESTAMPTZ,
ADD COLUMN ready_at TIMESTAMPTZ,
ADD COLUMN chef_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_accepted_by ON order_items(accepted_by);

-- Create function to update order status based on item statuses
CREATE OR REPLACE FUNCTION update_order_status_from_items()
RETURNS TRIGGER AS $$
DECLARE
    order_record RECORD;
    all_ready BOOLEAN;
    any_preparing BOOLEAN;
    any_accepted BOOLEAN;
    new_order_status order_status;
BEGIN
    -- Get the order
    SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
    
    -- Check item statuses for this order
    SELECT 
        BOOL_AND(status = 'ready_to_serve') as all_ready_bool,
        BOOL_OR(status = 'preparing') as any_preparing_bool,
        BOOL_OR(status = 'accepted') as any_accepted_bool
    INTO all_ready, any_preparing, any_accepted
    FROM order_items 
    WHERE order_id = NEW.order_id;
    
    -- Determine new order status
    IF all_ready THEN
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

-- Create trigger to automatically update order status
CREATE TRIGGER trigger_update_order_status_from_items
    AFTER UPDATE OF status ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_from_items();

-- Create trigger for INSERT as well (when new items are added)
CREATE TRIGGER trigger_update_order_status_from_items_insert
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_from_items();

-- Update existing order_items to have pending status
UPDATE order_items SET status = 'pending' WHERE status IS NULL;

-- Create function to get kitchen dashboard data
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
    item_status item_status,
    item_special_instructions TEXT,
    preparation_time INTEGER,
    accepted_at TIMESTAMPTZ,
    started_preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    chef_notes TEXT
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
        oi.chef_notes
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users w ON o.waiter_id = w.id
    LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
    LEFT JOIN restaurants r ON o.target_kitchen_id = r.id
    WHERE 
        o.status NOT IN ('served', 'cancelled')
        AND oi.status != 'ready_to_serve'
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
