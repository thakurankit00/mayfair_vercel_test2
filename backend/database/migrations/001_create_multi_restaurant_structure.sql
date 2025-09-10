-- Migration: Create Multi-Restaurant Structure
-- Description: Add support for multiple restaurants within the hotel with separate kitchens

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100) NOT NULL, -- 'ground_floor', 'sky_roof', etc.
    restaurant_type VARCHAR(50) NOT NULL, -- 'restaurant', 'bar', 'cafe', etc.
    is_active BOOLEAN DEFAULT true,
    has_kitchen BOOLEAN DEFAULT true,
    kitchen_name VARCHAR(100), -- 'Main Kitchen', 'Bar Kitchen', etc.
    operating_hours JSONB, -- JSON object with opening/closing times
    contact_extension VARCHAR(10), -- Internal phone extension
    max_capacity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for restaurants updated_at
CREATE OR REPLACE FUNCTION update_restaurants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurants_updated_at();

-- Create restaurant_staff table to assign staff to specific restaurants
CREATE TABLE IF NOT EXISTS restaurant_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'waiter', 'chef', 'bartender', 'manager'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, restaurant_id, role)
);

-- Create trigger for restaurant_staff updated_at
CREATE TRIGGER update_restaurant_staff_updated_at
    BEFORE UPDATE ON restaurant_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add restaurant_id to existing restaurant_tables
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Add restaurant_id to existing menu_categories
ALTER TABLE menu_categories 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Add kitchen routing fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS target_kitchen_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS kitchen_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
ADD COLUMN IF NOT EXISTS kitchen_notes TEXT,
ADD COLUMN IF NOT EXISTS kitchen_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kitchen_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kitchen_rejected_at TIMESTAMPTZ;

-- Create order_kitchen_logs table to track kitchen interactions
CREATE TABLE IF NOT EXISTS order_kitchen_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'assigned', 'accepted', 'rejected', 'transferred'
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_type ON restaurants(restaurant_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user_id ON restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id ON restaurant_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_role ON restaurant_staff(role);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant_id ON restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_target_kitchen_id ON orders(target_kitchen_id);
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status ON orders(kitchen_status);
CREATE INDEX IF NOT EXISTS idx_order_kitchen_logs_order_id ON order_kitchen_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_kitchen_logs_restaurant_id ON order_kitchen_logs(restaurant_id);

-- Insert default restaurants
INSERT INTO restaurants (id, name, description, location, restaurant_type, has_kitchen, kitchen_name, max_capacity)
VALUES 
    (uuid_generate_v4(), 'Mayfair Restaurant', 'Main dining restaurant with Indian and Continental cuisine', 'ground_floor', 'restaurant', true, 'Main Kitchen', 80),
    (uuid_generate_v4(), 'Sky Roof Bar', 'Premium rooftop bar with panoramic views and craft cocktails', 'sky_roof', 'bar', true, 'Bar Kitchen', 50);

-- Update existing restaurant_tables to assign them to appropriate restaurants
UPDATE restaurant_tables 
SET restaurant_id = (
    CASE 
        WHEN location = 'indoor' THEN (SELECT id FROM restaurants WHERE restaurant_type = 'restaurant' LIMIT 1)
        WHEN location = 'outdoor' THEN (SELECT id FROM restaurants WHERE restaurant_type = 'restaurant' LIMIT 1)
        WHEN location = 'sky_bar' THEN (SELECT id FROM restaurants WHERE restaurant_type = 'bar' LIMIT 1)
        ELSE (SELECT id FROM restaurants WHERE restaurant_type = 'restaurant' LIMIT 1)
    END
)
WHERE restaurant_id IS NULL;

-- Update existing menu_categories to assign them to appropriate restaurants
UPDATE menu_categories 
SET restaurant_id = (
    CASE 
        WHEN type = 'bar' THEN (SELECT id FROM restaurants WHERE restaurant_type = 'bar' LIMIT 1)
        ELSE (SELECT id FROM restaurants WHERE restaurant_type = 'restaurant' LIMIT 1)
    END
)
WHERE restaurant_id IS NULL;

-- Update existing orders to assign restaurant_id based on table location and order_type
UPDATE orders 
SET restaurant_id = (
    CASE 
        WHEN order_type = 'bar' THEN (SELECT id FROM restaurants WHERE restaurant_type = 'bar' LIMIT 1)
        WHEN table_id IS NOT NULL THEN (
            SELECT r.id FROM restaurants r 
            JOIN restaurant_tables rt ON rt.restaurant_id = r.id 
            WHERE rt.id = orders.table_id LIMIT 1
        )
        ELSE (SELECT id FROM restaurants WHERE restaurant_type = 'restaurant' LIMIT 1)
    END
),
target_kitchen_id = (
    CASE 
        WHEN order_type = 'bar' THEN (SELECT id FROM restaurants WHERE restaurant_type = 'bar' LIMIT 1)
        WHEN table_id IS NOT NULL THEN (
            SELECT r.id FROM restaurants r 
            JOIN restaurant_tables rt ON rt.restaurant_id = r.id 
            WHERE rt.id = orders.table_id LIMIT 1
        )
        ELSE (SELECT id FROM restaurants WHERE restaurant_type = 'restaurant' LIMIT 1)
    END
)
WHERE restaurant_id IS NULL;

-- Make restaurant_id NOT NULL for future records (but allow existing NULL values to remain)
-- We don't add NOT NULL constraint to existing columns to avoid breaking existing data
