-- Mayfair Hotel Management System Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin');

-- Booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');

-- Room status enum
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Integration platforms enum
CREATE TYPE integration_platform AS ENUM ('makemytrip', 'airbnb', 'booking_com', 'yatra', 'easemytrip', 'trivago', 'google_maps');

-- Users table (customers and staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room types table
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    max_occupancy INTEGER NOT NULL,
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(10) UNIQUE NOT NULL,
    room_type_id UUID REFERENCES room_types(id) ON DELETE RESTRICT,
    floor INTEGER NOT NULL,
    status room_status DEFAULT 'available',
    last_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room bookings table
CREATE TABLE room_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status booking_status DEFAULT 'pending',
    special_requests TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    platform integration_platform,
    platform_booking_id VARCHAR(100),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant tables
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(10) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(50), -- 'indoor', 'outdoor', 'sky_bar'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu categories table
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'restaurant', 'bar'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    image_url TEXT,
    ingredients JSONB DEFAULT '[]',
    allergens JSONB DEFAULT '[]',
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER, -- in minutes
    calories INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table reservations
CREATE TABLE table_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 120,
    special_requests TEXT,
    status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'seated', 'completed', 'cancelled'
    seated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (restaurant and bar orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    table_reservation_id UUID REFERENCES table_reservations(id) ON DELETE SET NULL,
    order_type VARCHAR(20) NOT NULL, -- 'restaurant', 'bar', 'room_service'
    room_booking_id UUID REFERENCES room_bookings(id) ON DELETE SET NULL, -- for room service
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    status order_status DEFAULT 'pending',
    special_instructions TEXT,
    estimated_preparation_time INTEGER, -- in minutes
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status order_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES room_bookings(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50), -- 'card', 'upi', 'net_banking', 'wallet', 'cash'
    payment_gateway VARCHAR(50), -- 'stripe', 'razorpay', etc.
    gateway_transaction_id VARCHAR(100),
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hotel offers/promotions
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20), -- 'percentage', 'fixed'
    discount_value DECIMAL(8,2),
    min_amount DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    applicable_to VARCHAR(20), -- 'rooms', 'restaurant', 'bar', 'all'
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    terms_conditions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform integrations configuration
CREATE TABLE platform_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform integration_platform NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    api_credentials JSONB, -- encrypted credentials
    sync_settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'never_synced',
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform pricing sync
CREATE TABLE platform_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform integration_platform NOT NULL,
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    availability INTEGER DEFAULT 0,
    restrictions JSONB DEFAULT '{}',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, room_type_id, date)
);

-- Reports cache table
CREATE TABLE report_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    generated_by UUID REFERENCES users(id)
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_room_number ON rooms(room_number);

CREATE INDEX idx_bookings_user_id ON room_bookings(user_id);
CREATE INDEX idx_bookings_room_id ON room_bookings(room_id);
CREATE INDEX idx_bookings_dates ON room_bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON room_bookings(status);
CREATE INDEX idx_bookings_platform ON room_bookings(platform);

CREATE INDEX idx_reservations_user_id ON table_reservations(user_id);
CREATE INDEX idx_reservations_table_id ON table_reservations(table_id);
CREATE INDEX idx_reservations_date ON table_reservations(reservation_date);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_platform_pricing_platform ON platform_pricing(platform);
CREATE INDEX idx_platform_pricing_room_type ON platform_pricing(room_type_id);
CREATE INDEX idx_platform_pricing_date ON platform_pricing(date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON room_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON table_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON platform_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for commonly used queries
CREATE VIEW available_rooms AS
SELECT 
    r.id,
    r.room_number,
    rt.name as room_type,
    rt.base_price,
    rt.max_occupancy,
    r.status
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.id
WHERE r.status = 'available' AND rt.is_active = true;

CREATE VIEW current_bookings AS
SELECT 
    rb.*,
    u.first_name,
    u.last_name,
    u.email,
    r.room_number,
    rt.name as room_type
FROM room_bookings rb
JOIN users u ON rb.user_id = u.id
JOIN rooms r ON rb.room_id = r.id
JOIN room_types rt ON r.room_type_id = rt.id
WHERE rb.status IN ('confirmed', 'checked_in')
AND rb.check_out_date >= CURRENT_DATE;

CREATE VIEW active_orders AS
SELECT 
    o.*,
    u.first_name as customer_first_name,
    u.last_name as customer_last_name,
    w.first_name as waiter_first_name,
    w.last_name as waiter_last_name,
    rt.table_number
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN users w ON o.waiter_id = w.id
LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
WHERE o.status NOT IN ('served', 'cancelled');

-- Function to check room availability
CREATE OR REPLACE FUNCTION is_room_available(
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM room_bookings
        WHERE room_id = p_room_id
        AND status NOT IN ('cancelled')
        AND (
            (check_in_date <= p_check_in AND check_out_date > p_check_in)
            OR (check_in_date < p_check_out AND check_out_date >= p_check_out)
            OR (check_in_date >= p_check_in AND check_out_date <= p_check_out)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get room availability count by type
CREATE OR REPLACE FUNCTION get_available_rooms_count(
    p_room_type_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM rooms r
        WHERE r.room_type_id = p_room_type_id
        AND r.status = 'available'
        AND is_room_available(r.id, p_check_in, p_check_out)
    );
END;
$$ LANGUAGE plpgsql;
