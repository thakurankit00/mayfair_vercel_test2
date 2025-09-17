-- ================================================
-- MAYFAIR HOTEL MANAGEMENT - NORMALIZED SCHEMA REDESIGN
-- 3NF/BCNF Compliant Database Architecture
-- Migration: 003_normalized_schema_redesign.sql
-- ================================================

-- Drop existing foreign key constraints first
DO $$ 
BEGIN
    -- We'll recreate all constraints properly after schema redesign
    -- This allows us to restructure without dependency issues
END $$;

-- ================================================
-- 1. REFERENCE/LOOKUP TABLES (Master Data)
-- ================================================

-- User Roles Master
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL DEFAULT 0,
    is_staff BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Room Types Master (Normalized)
CREATE TABLE IF NOT EXISTS room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    max_occupancy INTEGER NOT NULL,
    standard_amenities JSONB,
    room_size_sqft INTEGER,
    bed_configuration VARCHAR(50),
    view_type VARCHAR(30),
    floor_preference VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Room Status Master
CREATE TABLE IF NOT EXISTS room_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_available_for_booking BOOLEAN DEFAULT FALSE,
    display_color VARCHAR(7) DEFAULT '#808080',
    display_order INTEGER DEFAULT 0
);

-- Booking Status Master
CREATE TABLE IF NOT EXISTS booking_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active_booking BOOLEAN DEFAULT FALSE,
    allows_cancellation BOOLEAN DEFAULT TRUE,
    display_color VARCHAR(7) DEFAULT '#808080',
    display_order INTEGER DEFAULT 0
);

-- Payment Methods Master
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    requires_gateway BOOLEAN DEFAULT FALSE,
    processing_fee_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0
);

-- Payment Gateways Master
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    api_endpoint TEXT,
    webhook_endpoint TEXT,
    configuration JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order Status Master
CREATE TABLE IF NOT EXISTS order_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_kitchen_status BOOLEAN DEFAULT FALSE,
    is_final_status BOOLEAN DEFAULT FALSE,
    next_possible_statuses TEXT[], -- array of possible next status codes
    display_color VARCHAR(7) DEFAULT '#808080',
    display_order INTEGER DEFAULT 0
);

-- Bill Status Master
CREATE TABLE IF NOT EXISTS bill_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    allows_amendments BOOLEAN DEFAULT TRUE,
    display_color VARCHAR(7) DEFAULT '#808080',
    display_order INTEGER DEFAULT 0
);

-- Item Categories Master
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES item_categories(id),
    is_alcohol BOOLEAN DEFAULT FALSE,
    tax_category VARCHAR(20),
    kitchen_type VARCHAR(20), -- 'RESTAURANT', 'BAR', 'BOTH'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tax Types Master
CREATE TABLE IF NOT EXISTS tax_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_inclusive BOOLEAN DEFAULT FALSE,
    applicable_from DATE,
    applicable_to DATE,
    applies_to_category VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE
);

-- Amendment Types Master
CREATE TABLE IF NOT EXISTS amendment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_roles TEXT[], -- array of role codes that can approve
    is_active BOOLEAN DEFAULT TRUE
);

-- ================================================
-- 2. CORE ENTITY TABLES (Properly Normalized)
-- ================================================

-- Users Table (Redesigned)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE, -- for staff
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    
    -- Role and Status
    role_id UUID NOT NULL REFERENCES user_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Preferences
    preferences JSONB,
    
    -- Security
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Restaurants/Kitchens Table (Normalized)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Location and Details
    location VARCHAR(50), -- 'INDOOR', 'OUTDOOR', 'ROOFTOP', 'POOLSIDE'
    cuisine_types TEXT[], -- array of cuisine types
    operating_hours JSONB, -- {monday: {open: '09:00', close: '22:00'}}
    
    -- Capacity and Features
    seating_capacity INTEGER,
    has_kitchen BOOLEAN DEFAULT TRUE,
    has_bar BOOLEAN DEFAULT FALSE,
    
    -- Service Types
    allows_dine_in BOOLEAN DEFAULT TRUE,
    allows_takeaway BOOLEAN DEFAULT TRUE,
    allows_room_service BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Restaurant Tables (Normalized)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Table Identity
    table_number VARCHAR(20) NOT NULL,
    table_name VARCHAR(50),
    
    -- Physical Properties
    seating_capacity INTEGER NOT NULL,
    table_shape VARCHAR(20), -- 'ROUND', 'SQUARE', 'RECTANGULAR'
    location_zone VARCHAR(50), -- 'WINDOW_SIDE', 'CENTER', 'CORNER'
    
    -- Features
    has_special_features BOOLEAN DEFAULT FALSE,
    special_features TEXT[], -- 'CHARGING_PORT', 'PRIVACY_SCREEN'
    
    -- Status
    current_status_id UUID REFERENCES room_statuses(id), -- reuse room statuses
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(restaurant_id, table_number)
);

-- Rooms Table (Redesigned)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Room Identity
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_code VARCHAR(20) UNIQUE, -- for internal reference
    
    -- Room Classification
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    floor_number INTEGER NOT NULL,
    wing VARCHAR(20), -- 'NORTH', 'SOUTH', 'EAST', 'WEST'
    
    -- Room Features (beyond standard amenities)
    additional_amenities JSONB,
    special_features TEXT[], -- 'BALCONY', 'KITCHENETTE', 'JACUZZI'
    accessibility_features TEXT[], -- 'WHEELCHAIR_ACCESS', 'HEARING_AID'
    
    -- Status
    current_status_id UUID NOT NULL REFERENCES room_statuses(id),
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    
    -- Pricing (can override room type base price)
    custom_base_price DECIMAL(10,2), -- null means use room_type base_price
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Menu Categories (Normalized)
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Category Details
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_category_id UUID REFERENCES menu_categories(id),
    item_category_id UUID NOT NULL REFERENCES item_categories(id),
    
    -- Display
    display_order INTEGER DEFAULT 0,
    image_url TEXT,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    available_times JSONB, -- when this category is available
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(restaurant_id, code)
);

-- Menu Items (Normalized)
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Item Identity
    item_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Categorization
    category_id UUID NOT NULL REFERENCES menu_categories(id),
    item_category_id UUID NOT NULL REFERENCES item_categories(id),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2), -- for margin calculation
    
    -- Item Properties
    preparation_time INTEGER, -- in minutes
    spice_level INTEGER CHECK (spice_level BETWEEN 0 AND 5),
    is_vegetarian BOOLEAN DEFAULT TRUE,
    is_vegan BOOLEAN DEFAULT FALSE,
    allergens TEXT[], -- array of allergens
    
    -- Nutritional Info
    calories_per_serving INTEGER,
    nutritional_info JSONB,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    available_times JSONB,
    stock_quantity INTEGER,
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Media
    image_url TEXT,
    recipe_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 3. TRANSACTION TABLES (Bookings, Orders, Bills)
-- ================================================

-- Room Bookings (Redesigned)
CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Booking Identity
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    booking_reference VARCHAR(100), -- external reference if from OTA
    
    -- Customer and Room
    customer_id UUID NOT NULL REFERENCES users(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    
    -- Dates and Duration
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    
    -- Guest Details
    primary_guest_name VARCHAR(255) NOT NULL,
    primary_guest_phone VARCHAR(20),
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_guests INTEGER GENERATED ALWAYS AS (adults + children) STORED,
    
    -- Guest Information
    guest_details JSONB, -- additional guest info, preferences
    special_requests TEXT,
    
    -- Booking Source
    platform VARCHAR(50) DEFAULT 'DIRECT', -- 'DIRECT', 'BOOKING_COM', 'AIRBNB', etc.
    source_booking_id VARCHAR(100), -- OTA booking ID
    
    -- Financial
    room_rate DECIMAL(10,2) NOT NULL,
    total_room_amount DECIMAL(10,2) NOT NULL,
    advance_paid DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status_id UUID NOT NULL REFERENCES booking_statuses(id),
    
    -- Check-in/out details
    actual_check_in_at TIMESTAMP,
    actual_check_out_at TIMESTAMP,
    checked_in_by UUID REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    
    -- Billing
    bill_id UUID, -- will reference bills table when created
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders Table (Redesigned)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order Identity
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Order Source and Type
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('DINE_IN', 'TAKEAWAY', 'ROOM_SERVICE', 'DELIVERY')),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('RESTAURANT_TABLE', 'ROOM_BOOKING', 'WALK_IN')),
    
    -- References based on source type
    table_id UUID REFERENCES restaurant_tables(id), -- for restaurant orders
    room_booking_id UUID REFERENCES room_bookings(id), -- for room service
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Customer
    customer_id UUID NOT NULL REFERENCES users(id),
    customer_name VARCHAR(255), -- for walk-ins or room service
    customer_phone VARCHAR(20),
    
    -- Staff Assignment
    waiter_id UUID REFERENCES users(id),
    assigned_kitchen_id UUID REFERENCES restaurants(id), -- which kitchen handles this
    
    -- Order Details
    total_items INTEGER DEFAULT 0,
    gross_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Instructions
    special_instructions TEXT,
    delivery_instructions TEXT, -- for room service/delivery
    
    -- Status and Timing
    status_id UUID NOT NULL REFERENCES order_statuses(id),
    kitchen_status VARCHAR(20) DEFAULT 'PENDING',
    
    -- Important Timestamps
    placed_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    preparation_started_at TIMESTAMP,
    ready_at TIMESTAMP,
    served_at TIMESTAMP,
    
    -- Estimated Times
    estimated_preparation_time INTEGER, -- minutes
    estimated_delivery_time TIMESTAMP,
    
    -- Billing
    bill_id UUID, -- will reference bills table when created
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items (Normalized)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Item Reference
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    
    -- Item Details (captured at time of order)
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(30),
    
    -- Pricing
    quantity DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Customizations
    customizations JSONB, -- size, add-ons, modifications
    special_instructions TEXT,
    
    -- Kitchen Management
    kitchen_status VARCHAR(20) DEFAULT 'PENDING',
    assigned_to_chef UUID REFERENCES users(id),
    
    -- Timing
    started_preparation_at TIMESTAMP,
    completed_at TIMESTAMP,
    served_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 4. FINANCIAL TRANSACTION TABLES
-- ================================================

-- Bills Table (Main billing entity)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Bill Identity
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE, -- for GST invoice
    
    -- Source Reference
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('ROOM_BOOKING', 'RESTAURANT_ORDER', 'COMBINED')),
    primary_source_id UUID NOT NULL, -- booking_id or order_id
    
    -- Customer Details
    customer_id UUID NOT NULL REFERENCES users(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_address JSONB,
    customer_gst_number VARCHAR(20),
    
    -- Bill Classification
    bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('ROOM_BILL', 'RESTAURANT_BILL', 'COMBINED_BILL')),
    is_corporate_billing BOOLEAN DEFAULT FALSE,
    corporate_details JSONB,
    
    -- Financial Totals
    gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    service_charge DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) GENERATED ALWAYS AS (net_amount - paid_amount) STORED,
    
    -- Amendment Control
    amendment_deadline TIMESTAMP,
    auto_approve_amendments BOOLEAN DEFAULT TRUE,
    hide_alcohol BOOLEAN DEFAULT FALSE, -- for corporate billing
    
    -- Status
    status_id UUID NOT NULL REFERENCES bill_statuses(id),
    
    -- Important Dates
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    finalized_at TIMESTAMP,
    
    -- Staff
    created_by UUID NOT NULL REFERENCES users(id),
    finalized_by UUID REFERENCES users(id),
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bill Items (Normalized)
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    -- Source Reference
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('ORDER_ITEM', 'ROOM_CHARGE', 'SERVICE_CHARGE', 'CUSTOM')),
    source_id UUID, -- references order_items or other source
    
    -- Item Details
    item_code VARCHAR(30),
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    item_category_id UUID REFERENCES item_categories(id),
    
    -- Pricing
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Special Handling
    is_alcohol BOOLEAN DEFAULT FALSE,
    is_substituted BOOLEAN DEFAULT FALSE,
    original_item_name VARCHAR(255), -- if substituted
    substitution_reason TEXT,
    
    -- Dates
    service_date DATE DEFAULT CURRENT_DATE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Transactions (All monetary transactions)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction Identity
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Classification
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('PAYMENT', 'REFUND', 'ADJUSTMENT', 'REVERSAL', 'TRANSFER')),
    transaction_category VARCHAR(30) NOT NULL CHECK (transaction_category IN ('CUSTOMER_PAYMENT', 'VENDOR_PAYMENT', 'INTERNAL_TRANSFER', 'ADJUSTMENT', 'FEE')),
    
    -- References
    bill_id UUID REFERENCES bills(id),
    parent_transaction_id UUID REFERENCES financial_transactions(id),
    reference_number VARCHAR(100), -- external reference
    
    -- Amounts
    gross_amount DECIMAL(12,2) NOT NULL,
    fee_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    
    -- Currency
    currency_code VARCHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    
    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERSED', 'CANCELLED')),
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP,
    reconciled_by UUID REFERENCES users(id),
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments (Detailed payment information)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES financial_transactions(id) ON DELETE CASCADE,
    
    -- Payment Method
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    payment_gateway_id UUID REFERENCES payment_gateways(id),
    
    -- External References
    gateway_transaction_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    gateway_order_id VARCHAR(100),
    bank_reference_number VARCHAR(100),
    
    -- Payment Details
    requested_amount DECIMAL(12,2) NOT NULL,
    processed_amount DECIMAL(12,2),
    gateway_fee DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment Instrument Details
    instrument_details JSONB, -- card details, UPI ID, etc.
    
    -- Status and Timing
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Response Handling
    gateway_response JSONB,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Additional Data
    payment_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 5. AMENDMENT AND ADJUSTMENT TABLES
-- ================================================

-- Bill Amendments (Amendment tracking)
CREATE TABLE IF NOT EXISTS bill_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    -- Amendment Identity
    amendment_number INTEGER NOT NULL, -- sequential per bill
    amendment_type_id UUID NOT NULL REFERENCES amendment_types(id),
    
    -- Amendment Details
    description TEXT NOT NULL,
    reason TEXT NOT NULL,
    business_justification TEXT,
    
    -- Financial Impact
    amount_change DECIMAL(12,2) NOT NULL DEFAULT 0,
    previous_total DECIMAL(12,2) NOT NULL,
    new_total DECIMAL(12,2) NOT NULL,
    
    -- Approval Workflow
    requires_approval BOOLEAN NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED')),
    approval_deadline TIMESTAMP,
    
    -- Approvals
    admin_approval_required BOOLEAN DEFAULT FALSE,
    accountant_approval_required BOOLEAN DEFAULT FALSE,
    admin_approved_by UUID REFERENCES users(id),
    accountant_approved_by UUID REFERENCES users(id),
    admin_approved_at TIMESTAMP,
    accountant_approved_at TIMESTAMP,
    
    -- Rejection
    rejection_reason TEXT,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP,
    
    -- Application
    applied_at TIMESTAMP,
    applied_by UUID REFERENCES users(id),
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(bill_id, amendment_number)
);

-- Amendment Items (What changed in each amendment)
CREATE TABLE IF NOT EXISTS amendment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amendment_id UUID NOT NULL REFERENCES bill_amendments(id) ON DELETE CASCADE,
    
    -- Target Item
    bill_item_id UUID REFERENCES bill_items(id),
    
    -- Change Details
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('ADD', 'REMOVE', 'MODIFY', 'SUBSTITUTE')),
    field_name VARCHAR(50), -- which field was changed
    
    -- Before and After Values
    old_value TEXT,
    new_value TEXT,
    old_amount DECIMAL(12,2),
    new_amount DECIMAL(12,2),
    
    -- Additional Context
    change_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Adjustments (Payment-specific modifications)
CREATE TABLE IF NOT EXISTS payment_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    original_transaction_id UUID NOT NULL REFERENCES financial_transactions(id),
    adjustment_transaction_id UUID NOT NULL REFERENCES financial_transactions(id),
    bill_amendment_id UUID REFERENCES bill_amendments(id),
    
    -- Adjustment Classification
    adjustment_type VARCHAR(30) NOT NULL CHECK (adjustment_type IN ('METHOD_CHANGE', 'AMOUNT_CHANGE', 'SPLIT_PAYMENT', 'CONSOLIDATE_PAYMENT', 'REFUND_ADJUSTMENT')),
    
    -- Details
    reason TEXT NOT NULL,
    business_justification TEXT,
    
    -- Payment Method Changes
    original_payment_method_id UUID REFERENCES payment_methods(id),
    new_payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Amount Changes
    original_amount DECIMAL(12,2) NOT NULL,
    adjustment_amount DECIMAL(12,2) NOT NULL,
    final_amount DECIMAL(12,2) NOT NULL,
    
    -- Approval (can inherit from bill amendment or be independent)
    requires_separate_approval BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Audit
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 6. AUDIT AND LOGGING TABLES
-- ================================================

-- Audit Trail (Complete change log for all entities)
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity Information
    entity_type VARCHAR(50) NOT NULL, -- table name
    entity_id UUID NOT NULL,
    
    -- Operation Details
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    change_reason TEXT,
    business_context VARCHAR(100),
    
    -- User and Session
    changed_by UUID REFERENCES users(id),
    user_session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Timing
    changed_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_audit_entity_type (entity_type),
    INDEX idx_audit_entity_id (entity_id),
    INDEX idx_audit_changed_by (changed_by),
    INDEX idx_audit_changed_at (changed_at)
);

-- System Settings (Application configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Setting Identity
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    
    -- Value and Type
    setting_value TEXT,
    value_type VARCHAR(20) DEFAULT 'STRING', -- 'STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON'
    
    -- Metadata
    display_name VARCHAR(200),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- can be accessed by frontend
    
    -- Validation
    validation_rules JSONB,
    default_value TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(category, setting_key)
);

-- ================================================
-- 7. INDEXES FOR PERFORMANCE
-- ================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- Rooms indexes
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(current_status_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor_number);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON room_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON room_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON room_bookings(status_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON room_bookings(created_at);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_room_booking ON orders(room_booking_id);
CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_placed ON orders(placed_at);

-- Bills indexes
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_source ON bills(source_type, primary_source_id);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_bill ON financial_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON financial_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_parent ON financial_transactions(parent_transaction_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(payment_gateway_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_txn_id ON payments(gateway_transaction_id);

-- Amendments indexes
CREATE INDEX IF NOT EXISTS idx_amendments_bill ON bill_amendments(bill_id);
CREATE INDEX IF NOT EXISTS idx_amendments_status ON bill_amendments(approval_status);
CREATE INDEX IF NOT EXISTS idx_amendments_created ON bill_amendments(created_at);
CREATE INDEX IF NOT EXISTS idx_amendments_type ON bill_amendments(amendment_type_id);

-- ================================================
-- 8. CONSTRAINTS AND BUSINESS RULES
-- ================================================

-- Financial constraints
ALTER TABLE bills ADD CONSTRAINT chk_bills_amounts 
    CHECK (gross_amount >= 0 AND net_amount >= 0 AND paid_amount >= 0);

ALTER TABLE bill_items ADD CONSTRAINT chk_bill_items_amounts 
    CHECK (quantity > 0 AND unit_price >= 0 AND net_amount >= 0);

ALTER TABLE financial_transactions ADD CONSTRAINT chk_transaction_amounts 
    CHECK (gross_amount >= 0 AND net_amount >= 0);

ALTER TABLE payments ADD CONSTRAINT chk_payment_amounts 
    CHECK (requested_amount >= 0 AND COALESCE(processed_amount, 0) >= 0);

-- Business logic constraints
ALTER TABLE room_bookings ADD CONSTRAINT chk_booking_dates 
    CHECK (check_out_date > check_in_date);

ALTER TABLE room_bookings ADD CONSTRAINT chk_guest_count 
    CHECK (adults > 0 AND children >= 0);

ALTER TABLE orders ADD CONSTRAINT chk_order_amounts 
    CHECK (gross_amount >= 0 AND net_amount >= 0);

ALTER TABLE order_items ADD CONSTRAINT chk_order_item_amounts 
    CHECK (quantity > 0 AND unit_price >= 0 AND total_price >= 0);

-- Referential integrity for polymorphic relationships
ALTER TABLE bills ADD CONSTRAINT chk_bills_source_consistency
    CHECK (
        (source_type = 'ROOM_BOOKING' AND primary_source_id IN (SELECT id FROM room_bookings)) OR
        (source_type = 'RESTAURANT_ORDER' AND primary_source_id IN (SELECT id FROM orders)) OR
        (source_type = 'COMBINED')
    );

-- Amendment business rules
ALTER TABLE bill_amendments ADD CONSTRAINT chk_amendment_totals
    CHECK (new_total = previous_total + amount_change);

ALTER TABLE payment_adjustments ADD CONSTRAINT chk_adjustment_amounts
    CHECK (final_amount = original_amount + adjustment_amount);

-- ================================================
-- 9. INITIAL MASTER DATA
-- ================================================

-- Insert default user roles
INSERT INTO user_roles (code, name, description, hierarchy_level, is_staff) VALUES
('CUSTOMER', 'Customer', 'Hotel guests and restaurant customers', 0, FALSE),
('WAITER', 'Waiter', 'Restaurant service staff', 1, TRUE),
('CHEF', 'Chef', 'Kitchen staff for food preparation', 2, TRUE),
('BARTENDER', 'Bartender', 'Bar service staff', 2, TRUE),
('RECEPTIONIST', 'Receptionist', 'Front desk and booking management', 3, TRUE),
('ACCOUNTANT', 'Accountant', 'Financial management and bill approvals', 4, TRUE),
('MANAGER', 'Manager', 'Department management', 5, TRUE),
('ADMIN', 'Administrator', 'System administration', 6, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert room statuses
INSERT INTO room_statuses (code, name, description, is_available_for_booking, display_color) VALUES
('AVAILABLE', 'Available', 'Room is clean and ready for booking', TRUE, '#10B981'),
('OCCUPIED', 'Occupied', 'Room is currently occupied by guests', FALSE, '#EF4444'),
('DIRTY', 'Dirty', 'Room needs housekeeping', FALSE, '#F59E0B'),
('MAINTENANCE', 'Under Maintenance', 'Room is being serviced or repaired', FALSE, '#8B5CF6'),
('OUT_OF_ORDER', 'Out of Order', 'Room is not available due to issues', FALSE, '#6B7280')
ON CONFLICT (code) DO NOTHING;

-- Insert booking statuses
INSERT INTO booking_statuses (code, name, description, is_active_booking, allows_cancellation) VALUES
('PENDING', 'Pending Confirmation', 'Booking awaiting confirmation', TRUE, TRUE),
('CONFIRMED', 'Confirmed', 'Booking is confirmed', TRUE, TRUE),
('CHECKED_IN', 'Checked In', 'Guest has checked in', TRUE, FALSE),
('CHECKED_OUT', 'Checked Out', 'Guest has checked out', FALSE, FALSE),
('CANCELLED', 'Cancelled', 'Booking was cancelled', FALSE, FALSE),
('NO_SHOW', 'No Show', 'Guest did not arrive', FALSE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- Insert payment methods
INSERT INTO payment_methods (code, name, description, is_online, requires_gateway, processing_fee_percentage) VALUES
('CASH', 'Cash', 'Cash payment', FALSE, FALSE, 0.00),
('CARD', 'Credit/Debit Card', 'Card payment via POS or online', TRUE, TRUE, 2.50),
('UPI', 'UPI Payment', 'UPI payment via apps', TRUE, TRUE, 0.50),
('NET_BANKING', 'Net Banking', 'Online banking transfer', TRUE, TRUE, 1.00),
('WALLET', 'Digital Wallet', 'Paytm, PhonePe, etc.', TRUE, TRUE, 1.50),
('BANK_TRANSFER', 'Bank Transfer', 'Direct bank transfer', FALSE, FALSE, 0.00),
('CHEQUE', 'Cheque', 'Cheque payment', FALSE, FALSE, 0.00)
ON CONFLICT (code) DO NOTHING;

-- Insert order statuses
INSERT INTO order_statuses (code, name, description, is_kitchen_status, is_final_status, display_color) VALUES
('PENDING', 'Pending', 'Order placed, awaiting kitchen acceptance', TRUE, FALSE, '#F59E0B'),
('ACCEPTED', 'Accepted', 'Kitchen has accepted the order', TRUE, FALSE, '#3B82F6'),
('PREPARING', 'Preparing', 'Order is being prepared', TRUE, FALSE, '#8B5CF6'),
('READY', 'Ready to Serve', 'Order is ready for serving', TRUE, FALSE, '#10B981'),
('SERVED', 'Served', 'Order has been served to customer', FALSE, TRUE, '#6B7280'),
('CANCELLED', 'Cancelled', 'Order was cancelled', FALSE, TRUE, '#EF4444')
ON CONFLICT (code) DO NOTHING;

-- Insert bill statuses
INSERT INTO bill_statuses (code, name, description, is_final, allows_amendments, display_color) VALUES
('DRAFT', 'Draft', 'Bill is being prepared', FALSE, TRUE, '#F59E0B'),
('PENDING', 'Pending Payment', 'Bill is ready for payment', FALSE, TRUE, '#3B82F6'),
('FINALIZED', 'Finalized', 'Bill is finalized', FALSE, TRUE, '#8B5CF6'),
('PAID', 'Paid', 'Bill has been paid', TRUE, FALSE, '#10B981'),
('CANCELLED', 'Cancelled', 'Bill was cancelled', TRUE, FALSE, '#EF4444'),
('REFUNDED', 'Refunded', 'Bill amount was refunded', TRUE, FALSE, '#6B7280')
ON CONFLICT (code) DO NOTHING;

-- Insert item categories
INSERT INTO item_categories (code, name, description, is_alcohol, tax_category, kitchen_type) VALUES
('FOOD', 'Food Items', 'All food items', FALSE, 'FOOD', 'RESTAURANT'),
('BEVERAGE', 'Non-Alcoholic Beverages', 'Soft drinks, juices, etc.', FALSE, 'BEVERAGE', 'BOTH'),
('ALCOHOL', 'Alcoholic Beverages', 'Beer, wine, spirits', TRUE, 'ALCOHOL', 'BAR'),
('ACCOMMODATION', 'Room Charges', 'Room rent and related charges', FALSE, 'ACCOMMODATION', NULL),
('SERVICE', 'Service Charges', 'Additional service charges', FALSE, 'SERVICE', NULL)
ON CONFLICT (code) DO NOTHING;

-- Insert amendment types
INSERT INTO amendment_types (code, name, description, requires_approval) VALUES
('ITEM_ADD', 'Add Item', 'Add new item to bill', FALSE),
('ITEM_REMOVE', 'Remove Item', 'Remove item from bill', TRUE),
('ITEM_MODIFY', 'Modify Item', 'Change item details or price', TRUE),
('DISCOUNT_APPLY', 'Apply Discount', 'Apply discount to bill', TRUE),
('TAX_ADJUST', 'Tax Adjustment', 'Adjust tax calculation', TRUE),
('SUBSTITUTE_ITEM', 'Substitute Item', 'Replace item with another', TRUE),
('PAYMENT_ADJUST', 'Payment Adjustment', 'Adjust payment method or amount', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (category, setting_key, setting_value, value_type, display_name, description) VALUES
('BILLING', 'AUTO_APPROVE_DEADLINE_HOURS', '14', 'INTEGER', 'Auto Approve Deadline', 'Hours after bill creation when amendments need approval'),
('BILLING', 'HIDE_ALCOHOL_FOR_CORPORATE', 'true', 'BOOLEAN', 'Hide Alcohol for Corporate', 'Automatically hide alcohol items in corporate bills'),
('BILLING', 'DEFAULT_SERVICE_CHARGE_PERCENT', '10', 'DECIMAL', 'Default Service Charge', 'Default service charge percentage'),
('PAYMENT', 'GATEWAY_TIMEOUT_SECONDS', '300', 'INTEGER', 'Gateway Timeout', 'Payment gateway timeout in seconds'),
('SYSTEM', 'CURRENCY_CODE', 'INR', 'STRING', 'Default Currency', 'Default currency for all transactions')
ON CONFLICT (category, setting_key) DO NOTHING;

COMMENT ON TABLE users IS 'Normalized user table supporting all roles with proper role hierarchy';
COMMENT ON TABLE bills IS 'Main billing entity supporting room bookings, restaurant orders, and combined bills';
COMMENT ON TABLE financial_transactions IS 'Complete transaction log for all monetary movements';
COMMENT ON TABLE bill_amendments IS 'Amendment tracking with approval workflow support';
COMMENT ON TABLE payment_adjustments IS 'Payment-specific adjustments with audit trail';

-- ================================================
-- END OF MIGRATION SCRIPT
-- ================================================