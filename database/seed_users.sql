-- Sample users for Mayfair Hotel Management System
-- Password for all users: "password" (hashed with bcrypt)

INSERT INTO users (
  id, 
  first_name, 
  last_name, 
  email, 
  phone, 
  password_hash, 
  role, 
  is_active, 
  created_at, 
  updated_at
) VALUES
  -- Customer
  (
    uuid_generate_v4(),
    'John',
    'Doe', 
    'john.customer@example.com',
    '+91-9876543210',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm', -- password: "password"
    'customer',
    true,
    NOW(),
    NOW()
  ),
  -- Receptionist  
  (
    uuid_generate_v4(),
    'Sarah',
    'Wilson',
    'sarah.receptionist@mayfairhotel.com', 
    '+91-9876543211',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm',
    'receptionist',
    true,
    NOW(),
    NOW()
  ),
  -- Manager
  (
    uuid_generate_v4(),
    'Mike', 
    'Johnson',
    'mike.manager@mayfairhotel.com',
    '+91-9876543212',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm',
    'manager',
    true,
    NOW(),
    NOW()
  ),
  -- Chef
  (
    uuid_generate_v4(),
    'Anna',
    'Chef', 
    'anna.chef@mayfairhotel.com',
    '+91-9876543213',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm',
    'chef',
    true,
    NOW(),
    NOW()
  ),
  -- Waiter
  (
    uuid_generate_v4(),
    'Carlos',
    'Rodriguez',
    'carlos.waiter@mayfairhotel.com',
    '+91-9876543214', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm',
    'waiter',
    true,
    NOW(),
    NOW()
  ),
  -- Bartender
  (
    uuid_generate_v4(),
    'Lisa',
    'Bar',
    'lisa.bartender@mayfairhotel.com',
    '+91-9876543215',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm', 
    'bartender',
    true,
    NOW(),
    NOW()
  ),
  -- Admin
  (
    uuid_generate_v4(),
    'David',
    'Admin',
    'david.admin@mayfairhotel.com',
    '+91-9876543216',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeEHUTy5.VKU4JvOm',
    'admin', 
    true,
    NOW(),
    NOW()
  );

\echo 'Sample users created successfully!'
\echo 'All users have password: "password"'
\echo 'Test users:'
\echo '  Customer: john.customer@example.com'
\echo '  Receptionist: sarah.receptionist@mayfairhotel.com' 
\echo '  Manager: mike.manager@mayfairhotel.com'
\echo '  Chef: anna.chef@mayfairhotel.com'
\echo '  Waiter: carlos.waiter@mayfairhotel.com'
\echo '  Bartender: lisa.bartender@mayfairhotel.com'
\echo '  Admin: david.admin@mayfairhotel.com'
